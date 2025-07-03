
"use server";

import { suggestPairings } from "@/ai/flows/suggest-pairings";
import { 
    getAllUsers, 
    getBusinesses, 
    getProblems, 
    findDealByUserAndItem, 
    getPaymentSettings,
    getDeal, 
    getUserProfile, 
    createNotification, 
    getIdeas, 
    addTagsToDb,
    uploadAttachment
} from "@/lib/firestore";
import type { UserProfile, PaymentSettings, Deal, CreatorReference, Solution } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { stripe } from "@/lib/stripe";

const SuggestPairingsSchema = z.object({
  investorProfile: z.string().min(10, { message: "Investor profile must be at least 10 characters long." }),
});

export type AiPairingsFormState = {
  message: string;
  pairings?: {
    problemId: string;
    problemTitle: string;
    problemCreatorId: string;
    solutionCreatorId: string;
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

    const [allUsers, businesses, problems, ideas] = await Promise.all([
      getAllUsers(),
      getBusinesses(),
      getProblems(),
      getIdeas(),
    ]);
    
    const problemCreators = allUsers
        .filter(u => u.role === 'User' || u.role === 'Admin')
        .map(u => ({
            creatorId: u.uid,
            reputationScore: u.points, 
            expertise: u.expertise
    }));
    
    const solutionCreators = allUsers
        .filter(u => u.role === 'User' || u.role === 'Admin' || u.isPremium)
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
    
    const simplifiedIdeas = ideas.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        creatorId: i.creator.userId,
    }));

    const pairingsResult = await suggestPairings({
      investorProfile,
      problems: simplifiedProblems,
      problemCreators,
      solutionCreators
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
    plan: 'investor',
    paymentFrequency: 'lifetime',
    price: number,
    userProfile: UserProfile
) {
    if (!userProfile) {
        return { success: false, message: 'User not authenticated.' };
    }
    
    const { adminDb } = await import("@/lib/firebase/admin");

    const { isEnabled } = await getPaymentSettings();

    if (!isEnabled) {
        try {
            const userRef = adminDb.collection("users").doc(userProfile.uid);
            await userRef.update({ isPremium: true, role: 'Investor' });
            
            await adminDb.collection("payments").add({
                userId: userProfile.uid,
                userName: userProfile.name,
                userAvatarUrl: userProfile.avatarUrl,
                type: 'membership',
                amount: 0,
                plan,
                paymentFrequency,
                details: 'Free upgrade (payments disabled)',
                createdAt: new Date(),
            });

            revalidatePath('/membership');
            revalidatePath('/investors');
            revalidatePath(`/users/${userProfile.uid}`);
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
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Investor Membership (Lifetime)`,
                },
                unit_amount: price * 100, // Amount in cents
            },
            quantity: 1,
        }];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
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
    amount: number,
    solutionCreatorId?: string
) {
    if (investorProfile.role !== 'Investor') {
        return { success: false, message: "Only investors can start deals." };
    }
    
    const { adminDb } = await import('@/lib/firebase/admin');

    const { isEnabled } = await getPaymentSettings();
    
    try {
        // Free deal creation path
        if (!isEnabled) {
             const { createDealInDb } = await import('@/lib/deal-utils.server');
            const dealId = await createDealInDb(investorProfile, primaryCreatorId, itemId, itemTitle, itemType, 0, solutionCreatorId);
            revalidatePath(`/${itemType}s/${itemId}`);
            return { success: true, dealId };
        }

        // Paid deal creation path
        if (isNaN(amount) || amount < 10) {
            return { success: false, message: "Invalid contribution amount. Minimum is $10." };
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_BASE_URL is not set.');
        }

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
        console.error("Error creating deal:", error);
        return { success: false, message: (error as Error).message || "Could not start the deal. Please try again."};
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
    const { adminDb } = await import("@/lib/firebase/admin");
    const { FieldValue } = await import("firebase-admin/firestore");

    const dealId = formData.get('dealId') as string;
    const message = formData.get('message') as string;
    const sender = JSON.parse(formData.get('sender') as string) as UserProfile;
    
    if (!message.trim()) return;

    try {
        const messagesCol = adminDb.collection(`deals/${dealId}/messages`);
        const messageData = {
            dealId,
            text: message,
            sender: {
                userId: sender.uid,
                name: sender.name,
                avatarUrl: sender.avatarUrl,
                expertise: sender.expertise
            },
            createdAt: FieldValue.serverTimestamp(),
        };
        await messagesCol.add(messageData);

        const dealRef = adminDb.collection('deals').doc(dealId);
        const dealSnap = await dealRef.get();
        if (!dealSnap.exists) return;
        const deal = dealSnap.data() as Deal;

        const batch = adminDb.batch();
        deal.participantIds.forEach(participantId => {
            if (participantId !== sender.uid) {
                const userRef = adminDb.collection('users').doc(participantId);
                const fieldPath = `unreadDealMessages.${dealId}`;
                batch.update(userRef, { [fieldPath]: FieldValue.increment(1) });
            }
        });
        await batch.commit();

        revalidatePath(`/deals/${dealId}`);
    } catch (error) {
        console.error("Failed to send message:", error);
    }
}

export async function updateDealStatusAction(formData: FormData) {
    const { adminDb } = await import("@/lib/firebase/admin");
    const { FieldValue } = await import("firebase-admin/firestore");

    const dealId = formData.get('dealId') as string;
    const status = formData.get('status') as 'completed' | 'cancelled';
    const investorId = formData.get('investorId') as string;
    
    if (!dealId || !status || !investorId) {
        return { success: false, message: 'Missing required fields.' };
    }

    if (status !== 'completed' && status !== 'cancelled') {
        return { success: false, message: 'Invalid status provided.' };
    }
  
    try {
        const dealRef = adminDb.collection('deals').doc(dealId);
        const deal = (await dealRef.get()).data() as Deal;
        const itemRef = adminDb.collection(`${deal.type}s`).doc(deal.relatedItemId);

        await adminDb.runTransaction(async (transaction) => {
            transaction.update(dealRef, { status: status });
            transaction.update(itemRef, { isClosed: true });

            const investorRef = adminDb.collection('users').doc(investorId);
            if (status === 'completed') {
                transaction.update(investorRef, { dealsCompletedCount: FieldValue.increment(1) });
            } else {
                 transaction.update(investorRef, { dealsCancelledCount: FieldValue.increment(1) });
            }
        });

        revalidatePath(`/deals/${dealId}`);
        
        const investor = await getUserProfile(investorId);
        if (deal && investor) {
            const dealLink = `/deals/${deal.id}`;
            const message = `${investor.name} has ${status} the deal: "${deal.title}"`;
            for (const participantId of deal.participantIds) {
                if (participantId !== investorId) {
                    await createNotification(participantId, message, dealLink);
                }
            }
        }
        
        return { success: true, message: `Deal marked as ${status}.` };
    } catch (error) {
        console.error("Failed to update deal status:", error);
        return { success: false, message: 'An unexpected error occurred while updating the deal.' };
    }
}


export async function approveItemAction(formData: FormData) {
    const { adminDb } = await import("@/lib/firebase/admin");
    const type = formData.get('type') as 'problem' | 'solution' | 'business' | 'idea';
    const id = formData.get('id') as string;

    try {
        const itemRef = adminDb.collection(`${type}s`).doc(id);
        await itemRef.update({ priceApproved: true });
        revalidatePath('/admin');
        return { success: true, message: 'Item approved!' };
    } catch (error) {
        console.error("Failed to approve item:", error);
        return { success: false, message: 'Failed to approve item.' };
    }
}

export async function deleteItemAction(formData: FormData) {
    const { adminDb } = await import("@/lib/firebase/admin");
    const type = formData.get('type') as 'problem' | 'solution' | 'idea' | 'user' | 'business' | 'ad';
    const id = formData.get('id') as string;

    try {
        const collectionName = type === 'user' ? 'users' : `${type}s`;
        await adminDb.collection(collectionName).doc(id).delete();
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Item deleted successfully!' };
    } catch (error) {
        console.error("Failed to delete item:", error);
        return { success: false, message: 'Failed to delete item.' };
    }
}


export async function createAdAction(formData: FormData) {
    const { adminDb } = await import("@/lib/firebase/admin");
    try {
        const adData: Omit<Ad, 'id' | 'createdAt'> = {
            title: formData.get('title') as string,
            imageUrl: formData.get('imageUrl') as string,
            linkUrl: formData.get('linkUrl') as string,
            placement: formData.get('placement') as Ad['placement'],
            isActive: true,
        };
        
        if (!adData.title || !adData.imageUrl || !adData.linkUrl || !adData.placement) {
            return { success: false, message: "All fields are required." };
        }

        await adminDb.collection('ads').add({ ...adData, createdAt: new Date() });
        revalidatePath('/admin');
        return { success: true, message: 'Ad created successfully!' };
    } catch (error) {
        console.error("Failed to create ad:", error);
        return { success: false, message: 'Failed to create the ad.' };
    }
}

export async function toggleAdStatusAction(formData: FormData) {
    const { adminDb } = await import("@/lib/firebase/admin");
    try {
        const id = formData.get('id') as string;
        const isActive = formData.get('isActive') === 'true';

        if (!id) {
            return { success: false, message: "Ad ID is missing." };
        }

        await adminDb.collection('ads').doc(id).update({ isActive });
        revalidatePath('/admin');
        return { success: true, message: `Ad status updated.` };
    } catch (error) {
        console.error("Failed to toggle ad status:", error);
        return { success: false, message: 'Failed to update ad status.' };
    }
}

export async function updatePaymentSettingsAction(formData: FormData) {
    const { adminDb } = await import("@/lib/firebase/admin");
    try {
        const isEnabled = formData.get('isEnabled') === 'true';
        await adminDb.collection('settings').doc('payment').set({ isEnabled });
        revalidatePath('/admin');
        return { success: true, message: 'Payment settings updated.' };
    } catch (error) {
        console.error("Failed to update payment settings:", error);
        return { success: false, message: 'Failed to update settings.' };
    }
}

export async function updateUserProfileAction(formData: FormData): Promise<{success: boolean; message: string;}> {
    const { adminDb } = await import("@/lib/firebase/admin");
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;
    const expertise = formData.get('expertise') as string;
    const avatarFile = formData.get('avatar') as File | null;

    if (!userId) {
        return { success: false, message: "User ID is missing." };
    }

    try {
        const updateData: { name: string; expertise: string; avatarUrl?: string } = { name, expertise };

        if (avatarFile && avatarFile.size > 0) {
            const { url: avatarUrl } = await uploadAttachment(avatarFile);
            updateData.avatarUrl = avatarUrl;
        }

        await adminDb.collection('users').doc(userId).update(updateData);
        
        revalidatePath(`/users/${userId}`);
        revalidatePath(`/`); // For header
        return { success: true, message: "Profile updated successfully." };
    } catch (error) {
        console.error("Failed to update profile:", error);
        if (error instanceof Error && (error as any).code?.startsWith('storage/')) {
             return { success: false, message: "Could not upload image. This might be due to Firebase Storage security rules. Please ensure authenticated users are allowed to write to the 'avatars/' path." };
        }
        return { success: false, message: (error as Error).message || "An unexpected error occurred." };
    }
}


async function createItemAction(
    type: 'problem' | 'idea' | 'business',
    formData: FormData,
    points: number
) {
    const { adminDb } = await import("@/lib/firebase/admin");
    const { FieldValue } = await import("firebase-admin/firestore");

    const userId = formData.get('userId') as string;
    if (!userId) return { success: false, message: "User not authenticated." };
    
    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) return { success: false, message: "User profile not found." };
    const creator = userSnap.data() as UserProfile;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const tags = formData.getAll('tags') as string[];
    const attachment = formData.get('attachment') as File | null;
    
    const price = priceStr ? parseFloat(priceStr) : null;
    const priceApproved = price ? price <= 1000 : true;

    try {
        const itemRef = adminDb.collection(`${type}s`).doc();
        const userRef = adminDb.collection('users').doc(creator.uid);
        
        const creatorRef: CreatorReference = {
            userId: creator.uid,
            name: creator.name,
            avatarUrl: creator.avatarUrl,
            expertise: creator.expertise,
        };

        const itemData: any = {
            title,
            description,
            tags,
            creator: creatorRef,
            upvotes: 0,
            upvotedBy: [],
            solutionsCount: 0,
            createdAt: FieldValue.serverTimestamp(),
            price: price || null,
            priceApproved,
            interestedInvestorsCount: 0,
            isClosed: false,
        };

        if (type === 'business') {
            itemData.stage = formData.get('stage') as string;
        }

        if (attachment && attachment.size > 0) {
            const { url, name } = await uploadAttachment(attachment);
            itemData.attachmentUrl = url;
            itemData.attachmentFileName = name;
        }

        await adminDb.runTransaction(async (transaction) => {
            transaction.set(itemRef, itemData);
            transaction.update(userRef, { points: FieldValue.increment(points) });
        });
        
        await addTagsToDb(tags);

        if (!priceApproved) {
            await createNotification("admins", `${creator.name} submitted a ${type} "${title}" with a price of $${price}, which requires approval.`, `/${type}s/${itemRef.id}`);
        }
        
        revalidatePath('/marketplace');
        revalidatePath(`/users/${creator.uid}`);
        return { success: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} submitted successfully!` };

    } catch (error) {
        console.error(`Error creating ${type}:`, error);
        return { success: false, message: `Failed to create ${type}.` };
    }
}

export async function createProblemAction(formData: FormData) {
    return createItemAction('problem', formData, 50);
}

export async function createIdeaAction(formData: FormData) {
    return createItemAction('idea', formData, 10);
}

export async function createBusinessAction(formData: FormData) {
    return createItemAction('business', formData, 30);
}


export async function createSolutionAction(formData: FormData) {
    const { adminDb } = await import("@/lib/firebase/admin");
    const { FieldValue } = await import("firebase-admin/firestore");

    const userId = formData.get('userId') as string;
    if (!userId) return { success: false, message: "User not authenticated." };
    
    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) return { success: false, message: "User profile not found." };
    const creator = userSnap.data() as UserProfile;

    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const attachment = formData.get('attachment') as File | null;
    const problemId = formData.get('problemId') as string;
    const problemTitle = formData.get('problemTitle') as string;

    const price = priceStr ? parseFloat(priceStr) : null;
    const priceApproved = price ? price <= 1000 : true;
    
    try {
        const solutionRef = adminDb.collection('solutions').doc();
        const problemRef = adminDb.collection('problems').doc(problemId);
        
        const problemDoc = await problemRef.get();
        if (!problemDoc.exists) throw new Error("Problem not found.");
        const problemCreatorId = problemDoc.data()!.creator.userId;

        const creatorRef: CreatorReference = {
            userId: creator.uid,
            name: creator.name,
            avatarUrl: creator.avatarUrl,
            expertise: creator.expertise,
        };

        const solutionData: Omit<Solution, 'id'> = {
            problemId,
            problemTitle,
            description,
            creator: creatorRef,
            upvotes: 0,
            upvotedBy: [],
            createdAt: FieldValue.serverTimestamp() as any,
            price,
            priceApproved,
            attachmentUrl: null,
            attachmentFileName: null,
            interestedInvestorsCount: 0,
            isClosed: false,
        };

        if (attachment && attachment.size > 0) {
            const { url, name } = await uploadAttachment(attachment);
            solutionData.attachmentUrl = url;
            solutionData.attachmentFileName = name;
        }

        await adminDb.runTransaction(async (transaction) => {
            transaction.set(solutionRef, solutionData);
            transaction.update(problemRef, { solutionsCount: FieldValue.increment(1) });
        });

        if (problemCreatorId && problemCreatorId !== creator.uid) {
            await createNotification(problemCreatorId, `${creator.name} proposed a new solution for your problem: "${problemTitle}"`, `/problems/${problemId}`);
        }
        if (!priceApproved) {
            await createNotification("admins", `${creator.name} submitted a solution for "${problemTitle}" with a price of $${price}, which requires approval.`, `/solutions/${solutionRef.id}`);
        }

        revalidatePath(`/problems/${problemId}`);
        return { success: true, message: "Solution submitted successfully!" };
    } catch (error) {
        console.error("Error creating solution:", error);
        return { success: false, message: "Failed to create solution." };
    }
}


export async function upvoteItemAction(
    userId: string,
    itemId: string,
    itemType: 'problem' | 'solution' | 'idea' | 'business' | 'investor'
) {
    if (!userId) return { success: false, message: "You must be logged in." };
    
    const { adminDb } = await import("@/lib/firebase/admin");
    const { FieldValue } = await import("firebase-admin/firestore");

    try {
        const collectionName = itemType === 'investor' ? 'users' : `${itemType}s`;
        const itemRef = adminDb.collection(collectionName).doc(itemId);
        
        await adminDb.runTransaction(async (transaction) => {
            const itemDoc = await transaction.get(itemRef);
            if (!itemDoc.exists) throw new Error("Item not found.");
            
            const data = itemDoc.data()!;
            const upvotedBy = (data.upvotedBy || []) as string[];
            const isUpvoted = upvotedBy.includes(userId);
            
            const creatorId = itemType === 'investor' ? itemId : data.creator.userId;
            if (creatorId === userId) throw new Error("You cannot upvote your own content.");

            const pointValues: Record<string, number> = { 'problem': 20, 'solution': 20, 'idea': 10, 'business': 10 };
            const pointChange = itemType !== 'investor' ? (pointValues[itemType] * (isUpvoted ? -1 : 1)) : 0;
            
            // Update item
            transaction.update(itemRef, {
                upvotes: FieldValue.increment(isUpvoted ? -1 : 1),
                upvotedBy: isUpvoted ? FieldValue.arrayRemove(userId) : FieldValue.arrayUnion(userId)
            });

            // Update creator points
            if (pointChange !== 0) {
                const creatorRef = adminDb.collection('users').doc(creatorId);
                transaction.update(creatorRef, { points: FieldValue.increment(pointChange) });
            }

            if (!isUpvoted) {
                 const upvoterSnap = await adminDb.collection('users').doc(userId).get();
                 const upvoterName = upvoterSnap.data()?.name || "Someone";
                 const itemTitle = data.title || data.problemTitle || 'your content';
                 const message = `${upvoterName} upvoted your ${itemType}: "${itemTitle}"`;
                 await createNotification(creatorId, message, `/${collectionName}/${itemId}`);
            }
        });
        
        revalidatePath('/marketplace');
        revalidatePath(`/${collectionName}/${itemId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Upvote error:", error);
        return { success: false, message: error.message };
    }
}


async function handleContentUpdate(
    id: string,
    type: 'problem' | 'solution' | 'idea' | 'business',
    formData: FormData
) {
    const { adminDb } = await import("@/lib/firebase/admin");
    const data: any = {};
    if (formData.has('title')) data.title = formData.get('title');
    if (formData.has('description')) data.description = formData.get('description');
    if (formData.has('tags')) data.tags = formData.getAll('tags');
    if (type === 'business' && formData.has('stage')) {
        data.stage = formData.get('stage') as string;
    }
    
    const attachment = formData.get('attachment') as File | null;
    if (attachment && attachment.size > 0) {
        const { url, name } = await uploadAttachment(attachment);
        data.attachmentUrl = url;
        data.attachmentFileName = name;
    }

    try {
        await adminDb.collection(`${type}s`).doc(id).update(data);
        if (data.tags) {
            await addTagsToDb(data.tags);
        }

        revalidatePath(`/${type}s/${id}`);
        revalidatePath(`/${type}s/${id}/edit`);
        return { success: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully.` };
    } catch (error) {
        console.error(`Failed to update ${type}:`, error);
        return { success: false, message: `Failed to update ${type}.` };
    }
}

export async function updateProblemAction(formData: FormData) {
    const id = formData.get('id') as string;
    return handleContentUpdate(id, 'problem', formData);
}

export async function updateSolutionAction(formData: FormData) {
    const id = formData.get('id') as string;
    return handleContentUpdate(id, 'solution', formData);
}

export async function updateIdeaAction(formData: FormData) {
    const id = formData.get('id') as string;
    return handleContentUpdate(id, 'idea', formData);
}

export async function updateBusinessAction(formData: FormData) {
    const id = formData.get('id') as string;
    return handleContentUpdate(id, 'business', formData);
}

export async function verifyRecaptcha(token: string, action: string): Promise<{ success: boolean; message: string }> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!siteKey || !projectId || !apiKey) {
    return { success: true, message: "reCAPTCHA not configured, skipping." };
  }

  const verificationUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
  
  try {
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        event: {
          token: token,
          siteKey: siteKey,
          expectedAction: action,
        },
      }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("reCAPTCHA API error:", errorBody);
        return { success: false, message: "Could not communicate with reCAPTCHA service." };
    }

    const data = await response.json();
    
    if (data.tokenProperties?.valid && data.riskAnalysis?.score >= 0.5) {
      return { success: true, message: "reCAPTCHA verification successful." };
    } else {
      console.warn("reCAPTCHA verification failed:", data.tokenProperties, data.riskAnalysis);
      return { success: false, message: "reCAPTCHA verification failed. Please try again." };
    }
  } catch (error) {
    console.error("Error during reCAPTCHA verification:", error);
    return { success: false, message: "An unexpected error occurred during reCAPTCHA verification." };
  }
}
