
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createDealInDb } from '@/lib/deal-utils.server';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('Stripe-Signature') as string;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('Stripe webhook secret is not set.');
        return new Response('Webhook secret not configured', { status: 500 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;

        if (!metadata) {
            console.error('Webhook received without metadata.');
            return new Response('Missing metadata', { status: 400 });
        }

        try {
            // Handle Membership Upgrade
            if (metadata.type === 'membership') {
                await handleMembership(metadata);
            } 
            // Handle Deal Creation
            else if (metadata.type === 'deal_creation') {
                await handleDealCreation(metadata);
            }
        } catch (error) {
            console.error('Error handling webhook event:', error);
            return new Response('Internal server error', { status: 500 });
        }
    }

    return new Response(null, { status: 200 });
}

async function handleMembership(metadata: Stripe.Metadata) {
    const { adminDb } = await import('@/lib/firebase/admin');
    const { userId, userName, userAvatarUrl, plan, paymentFrequency, amount } = metadata;
    
    if (!userId || !plan || !paymentFrequency || !amount || !userName || !userAvatarUrl) {
        throw new Error('Incomplete metadata for membership purchase.');
    }

    const userRef = adminDb.collection("users").doc(userId);
    await userRef.update({ isPremium: true, role: 'Investor' });

    await adminDb.collection("payments").add({
        userId,
        userName,
        userAvatarUrl,
        type: 'membership',
        amount: Number(amount),
        plan: plan as 'investor',
        paymentFrequency: paymentFrequency as 'lifetime',
        createdAt: new Date(),
    });
}

async function handleDealCreation(metadata: Stripe.Metadata) {
    const { adminDb } = await import('@/lib/firebase/admin');
    const { 
        primaryCreatorId, 
        itemId, 
        itemTitle, 
        itemType, 
        amount, 
        solutionCreatorId,
        investorId,
    } = metadata;

     if (!primaryCreatorId || !itemId || !itemTitle || !itemType || !amount || !investorId) {
        throw new Error('Incomplete metadata for deal creation.');
    }

    const investorSnap = await adminDb.collection('users').doc(investorId).get();
    if (!investorSnap.exists) {
        throw new Error(`Investor profile not found for ID: ${investorId}`);
    }
    const investorProfile = investorSnap.data();

    await createDealInDb(
        investorProfile as any,
        primaryCreatorId,
        itemId,
        itemTitle,
        itemType as 'problem' | 'idea' | 'business',
        Number(amount),
        solutionCreatorId || undefined
    );

    // The success_url on the checkout session handles the client-side redirect.
    // The webhook's job is just to create the deal in the DB.
}

    
