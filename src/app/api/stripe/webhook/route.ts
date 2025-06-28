import Stripe from 'stripe';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createDeal, logPayment, updateUserMembership, getUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/lib/types';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;

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
    const { userId, userName, userAvatarUrl, plan, paymentFrequency, amount } = metadata;
    
    if (!userId || !plan || !paymentFrequency || !amount || !userName || !userAvatarUrl) {
        throw new Error('Incomplete metadata for membership purchase.');
    }

    await updateUserMembership(userId, plan as 'creator' | 'investor');
    await logPayment({
        userId,
        userName,
        userAvatarUrl,
        type: 'membership',
        amount: Number(amount),
        plan: plan as 'creator' | 'investor',
        paymentFrequency: paymentFrequency as 'monthly' | 'lifetime',
    });
}

async function handleDealCreation(metadata: Stripe.Metadata) {
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

    const investorProfile = await getUserProfile(investorId);
    if (!investorProfile) {
        throw new Error(`Investor profile not found for ID: ${investorId}`);
    }

    await createDeal(
        investorProfile,
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
