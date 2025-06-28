"use server";

import { suggestPairings } from "@/ai/flows/suggest-pairings";
import { createDeal, getAllUsers, approveItem as approveItemInDb, deleteItem, getBusinesses, getProblems, sendMessage, updateUserMembership, logPayment, findDealByUserAndItem, createAd, toggleAdStatus, getAds, getPaymentSettings, updatePaymentSettings } from "@/lib/firestore";
import type { UserProfile, Ad, PaymentSettings } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { auth } from "./lib/firebase/config";

const SuggestPairingsSchema = z.object({
  investorProfile: z.string().min(10, { message: "Investor profile must be at least 10 characters long." }),
});

export type AiPairingsFormState = {
  message: string;
  pairings?: {
    problemCreatorId: string;
    solutionCreatorId: string;
    problemId: string;
    problemTitle: string;
    matchReason: string;
  }[];
  error?: boolean;
};

export async function getAiPairings(
  prevState: AiPairingsFormState,
  formData: FormData
): Promise<AiPairingsFormState> {
  try {
    const validatedFields = SuggestPairingsSchema.safeParse({
      investorProfile: formData.get("investorProfile"),
    });

    if (!validatedFields.success) {
      return {
        message: validatedFields.error.flatten().fieldErrors.investorProfile?.[0] || "Invalid input.",
        error: true,
      };
    }
    
    const { investorProfile } = validatedFields.data;

    const [allUsers, businesses, problems] = await Promise.all([
      getAllUsers(),
      getBusinesses(),
      getProblems(),
    ]);
    
    const businessCreatorIds = new Set(businesses.map(b => b.creator.userId));

    const problemCreators = allUsers
        .filter(u => u.role === 'User' || u.role === 'Admin' || businessCreatorIds.has(u.uid))
        .map(u => ({
            creatorId: u.uid,
            reputationScore: u.points, 
            expertise: u.expertise
    }));
    
    const solutionCreators = allUsers
        .filter(u => u.role === 'User' || u.role === 'Admin')
        .map(u => ({
            creatorId: u.uid,
            reputationScore: u.points,
            expertise: u.expertise
        }));

    const simplifiedProblems = problems.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        creatorId: p.creator.userId,
    }));

    const pairingsResult = await suggestPairings({
      investorProfile,
      problems: simplifiedProblems,
      problemCreators,
      solutionCreators,
    });
    
    if (
      !pairingsResult.suggestedPairings ||
      pairingsResult.suggestedPairings.length === 0
    ) {
      return { message: "No suitable pairings found. Try refining your profile." };
    }

    return {
      message: "Successfully generated pairings!",
      pairings: pairingsResult.suggestedPairings,
    };
  } catch (e) {
    console.error("AI Pairing Error:", (e as Error).message);
    return { message: "An unexpected error occurred with the AI. Please try again.", error: true };
  }
}

export async function upgradeMembershipAction(
    plan: 'creator' | 'investor',
    paymentFrequency: 'monthly' | 'lifetime',
    price: number,
    userProfile: UserProfile
) {
    if (!userProfile) {
        return { success: false, message: 'User not authenticated.' };
    }

    const { isEnabled } = await getPaymentSettings();

    if (!isEnabled) {
        try {
            await updateUserMembership(userProfile.uid, plan as 'creator' | 'investor');
            await logPayment({
                userId: userProfile.uid,
                userName: userProfile.name,
                userAvatarUrl: userProfile.avatarUrl,
                type: 'membership',
                amount: 0,
                plan: plan as 'creator' | 'investor',
                paymentFrequency,
                details: 'Free upgrade (payments disabled)'
            });
            revalidatePath('/membership');
            return { success: true, instant: true };
        } catch (error) {
            console.error("Error during free membership upgrade:", error);
            return { success: false, message: "Could not upgrade membership." };
        }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_BASE_URL is not set.');
    }

    try {
        const mode = paymentFrequency === 'monthly' ? 'subscription' : 'payment';
        
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${plan} Membership (${paymentFrequency})`,
                },
                unit_amount: price * 100, // Amount in cents
                recurring: mode === 'subscription' ? { interval: 'month' } : undefined,
            },
            quantity: 1,
        }];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode,
            success_url: `${baseUrl}/membership?payment=success`,
            cancel_url: `${baseUrl}/membership?payment=cancelled`,
            metadata: {
                type: 'membership',
                userId: userProfile.uid,
                userName: userProfile.name,
                userAvatarUrl: userProfile.avatarUrl,
                plan,
                paymentFrequency,
                amount: price,
            },
        });

        if (!session.url) {
            return { success: false, message: "Could not create Stripe session." };
        }

        return { success: true, url: session.url };
    } catch (error) {
        console.error("Stripe Error (Membership):", (error as Error).message);
        return { success: false, message: "Could not connect to payment provider. Please try again."};
    }
}


export async function startDealAction(
    investorProfile: UserProfile,
    primaryCreatorId: string,
    itemId: string,
    itemTitle: string,
    itemType: 'problem' | 'idea' | 'business',
    amount: number, // Can be 0 if payments are disabled
    solutionCreatorId?: string
) {
    const { isEnabled } = await getPaymentSettings();
    
    if (!isEnabled) {
        try {
            const dealId = await createDeal(investorProfile, primaryCreatorId, itemId, itemTitle, itemType, 0, solutionCreatorId);
            revalidatePath(`/${itemType}s/${itemId}`);
            return { success: true, dealId };
        } catch (error) {
            console.error("Error creating free deal:", error);
            return { success: false, message: "Could not start the deal. Please try again."};
        }
    }
    
    if (isNaN(amount) || amount < 5) {
        return { success: false, message: "Invalid contribution amount." };
    }

     const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_BASE_URL is not set.');
    }

    try {
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Facilitate Deal: ${itemTitle}`,
                    description: 'A small contribution to start the conversation with the creator(s).'
                },
                unit_amount: amount * 100, // Amount in cents
            },
            quantity: 1,
        }];

        const metadata: Stripe.Metadata = {
            type: 'deal_creation',
            investorId: investorProfile.uid,
            primaryCreatorId,
            itemId,
            itemTitle,
            itemType,
            amount: String(amount),
        };
        if (solutionCreatorId) {
            metadata.solutionCreatorId = solutionCreatorId;
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${baseUrl}/${itemType}s/${itemId}?deal=pending`,
            cancel_url: `${baseUrl}/${itemType}s/${itemId}`,
            metadata,
        });

        if (!session.url) {
            return { success: false, message: "Could not create Stripe session." };
        }

        return { success: true, url: session.url };
    } catch (error) {
        console.error("Stripe Error (Start Deal):", (error as Error).message);
        return { success: false, message: "Could not start the deal. Please try again."};
    }
}

export async function findExistingDealAction(itemId: string, investorId: string) {
    try {
        const deal = await findDealByUserAndItem(itemId, investorId);
        if (deal) {
            return { dealId: deal.id };
        }
        return { dealId: null };
    } catch (error) {
        console.error("Failed to find existing deal:", error);
        return { dealId: null, error: "An error occurred while checking for existing deals." };
    }
}


export async function postMessageAction(formData: FormData) {
    const dealId = formData.get('dealId') as string;
    const message = formData.get('message') as string;
    const sender = JSON.parse(formData.get('sender') as string) as UserProfile;
    
    if (!message.trim()) return;

    try {
        await sendMessage(dealId, message, sender);
        revalidatePath(`/deals/${dealId}`);
    } catch (error) {
        console.error("Failed to send message:", error);
    }
}

export async function approveItemAction(formData: FormData) {
    const type = formData.get('type') as 'problem' | 'solution' | 'business';
    const id = formData.get('id') as string;

    try {
        await approveItemInDb(type, id);
        revalidatePath('/admin');
        return { success: true, message: 'Item approved!' };
    } catch (error) {
        console.error("Failed to approve item:", error);
        return { success: false, message: 'Failed to approve item.' };
    }
}

export async function deleteItemAction(formData: FormData) {
    const type = formData.get('type') as 'problem' | 'solution' | 'idea' | 'user' | 'business' | 'ad';
    const id = formData.get('id') as string;

    try {
        await deleteItem(type, id);
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Item deleted successfully!' };
    } catch (error) {
        console.error("Failed to delete item:", error);
        return { success: false, message: 'Failed to delete item.' };
    }
}


export async function createAdAction(formData: FormData) {
    try {
        const adData = {
            title: formData.get('title') as string,
            imageUrl: formData.get('imageUrl') as string,
            linkUrl: formData.get('linkUrl') as string,
            placement: formData.get('placement') as Ad['placement'],
        };
        
        // Basic server-side validation
        if (!adData.title || !adData.imageUrl || !adData.linkUrl || !adData.placement) {
            return { success: false, message: "All fields are required." };
        }

        await createAd(adData);
        revalidatePath('/admin');
        return { success: true, message: 'Ad created successfully!' };
    } catch (error) {
        console.error("Failed to create ad:", error);
        return { success: false, message: 'Failed to create the ad.' };
    }
}

export async function toggleAdStatusAction(formData: FormData) {
    try {
        const id = formData.get('id') as string;
        const isActive = formData.get('isActive') === 'true';

        if (!id) {
            return { success: false, message: "Ad ID is missing." };
        }

        await toggleAdStatus(id, isActive);
        revalidatePath('/admin');
        return { success: true, message: `Ad status updated.` };
    } catch (error) {
        console.error("Failed to toggle ad status:", error);
        return { success: false, message: 'Failed to update ad status.' };
    }
}

export async function updatePaymentSettingsAction(formData: FormData) {
    try {
        const isEnabled = formData.get('isEnabled') === 'true';
        await updatePaymentSettings(isEnabled);
        revalidatePath('/admin');
        return { success: true, message: 'Payment settings updated.' };
    } catch (error) {
        console.error("Failed to update payment settings:", error);
        return { success: false, message: 'Failed to update settings.' };
    }
}
