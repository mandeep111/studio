
// This is a server-only file to encapsulate deal creation logic.
// It can be imported by server actions and API routes.
"use server";

import type { UserProfile, Deal } from "./types";
import { createNotification } from "./firestore";

async function addSystemMessage(dealId: string, text: string) {
    const { adminDb } = await import('./firebase/admin');
    const { FieldValue } = await import('firebase-admin/firestore');

    const messagesCol = adminDb.collection(`deals/${dealId}/messages`);
    await messagesCol.add({
        dealId,
        text,
        sender: {
            userId: 'system',
            name: 'System',
            avatarUrl: '',
            expertise: 'System Message'
        },
        createdAt: FieldValue.serverTimestamp(),
    });
}

export async function createDealInDb(
    investorProfile: UserProfile,
    primaryCreatorId: string,
    itemId: string,
    itemTitle: string,
    itemType: 'problem' | 'idea' | 'business',
    amount: number,
    solutionCreatorId?: string
): Promise<string> {
    const { adminDb } = await import('./firebase/admin');
    const { FieldValue } = await import('firebase-admin/firestore');

    const itemRef = adminDb.collection(`${itemType}s`).doc(itemId);
    const investorRef = adminDb.collection('users').doc(investorProfile.uid);
    const primaryCreatorRef = adminDb.collection('users').doc(primaryCreatorId);
    
    const primaryCreatorSnap = await primaryCreatorRef.get();
    if (!primaryCreatorSnap.exists) {
        throw new Error(`Primary creator with ID ${primaryCreatorId} not found.`);
    }
    const primaryCreator = primaryCreatorSnap.data() as UserProfile;

    let solutionCreator: UserProfile | null = null;
    if (solutionCreatorId) {
        const solutionCreatorRef = adminDb.collection('users').doc(solutionCreatorId);
        const solutionCreatorSnap = await solutionCreatorRef.get();
        if (solutionCreatorSnap.exists) {
            solutionCreator = solutionCreatorSnap.data() as UserProfile;
        }
    }
    
    const participantIds = [investorProfile.uid, primaryCreatorId];
    if (solutionCreatorId && solutionCreatorId !== primaryCreatorId) {
        participantIds.push(solutionCreatorId);
    }
    
    const dealRef = adminDb.collection('deals').doc();

    const dealData: Omit<Deal, 'id'> = {
        investor: {
            userId: investorProfile.uid,
            name: investorProfile.name,
            avatarUrl: investorProfile.avatarUrl,
            expertise: investorProfile.expertise,
        },
        primaryCreator: {
            userId: primaryCreator.uid,
            name: primaryCreator.name,
            avatarUrl: primaryCreator.avatarUrl,
            expertise: primaryCreator.expertise,
        },
        relatedItemId: itemId,
        title: itemTitle,
        type: itemType,
        createdAt: FieldValue.serverTimestamp() as any,
        participantIds,
        status: 'active',
    };

    if (solutionCreator) {
        dealData.solutionCreator = {
            userId: solutionCreator.uid,
            name: solutionCreator.name,
            avatarUrl: solutionCreator.avatarUrl,
            expertise: solutionCreator.expertise,
        };
    }

    const paymentRef = adminDb.collection('payments').doc();

    await adminDb.runTransaction(async (transaction) => {
        // Create the deal
        transaction.set(dealRef, dealData);
        // Update item interested count
        transaction.update(itemRef, { interestedInvestorsCount: FieldValue.increment(1) });
        // Update user deal counts
        transaction.update(investorRef, { dealsCount: FieldValue.increment(1) });
        transaction.update(primaryCreatorRef, { dealsCount: FieldValue.increment(1) });
        if (solutionCreatorId && solutionCreatorId !== primaryCreatorId) {
            transaction.update(adminDb.collection('users').doc(solutionCreatorId), { dealsCount: FieldValue.increment(1) });
        }
        
        // Log payment record (even for free deals, with amount 0)
        transaction.set(paymentRef, {
            userId: investorProfile.uid,
            userName: investorProfile.name,
            userAvatarUrl: investorProfile.avatarUrl,
            type: 'deal_creation',
            amount: amount,
            createdAt: FieldValue.serverTimestamp(),
            relatedDealId: dealRef.id,
            relatedDealTitle: itemTitle,
        });
    });

    // Send notifications and initial message outside the transaction
    const dealLink = `/deals/${dealRef.id}`;
    const notificationMessage = `${investorProfile.name} has started a deal for your ${itemType}: "${itemTitle}"`;
    await createNotification(primaryCreatorId, notificationMessage, dealLink);
    if (solutionCreatorId && solutionCreatorId !== primaryCreatorId) {
        await createNotification(solutionCreatorId, notificationMessage, dealLink);
    }

    await addSystemMessage(dealRef.id, 'Deal started! You can now chat securely.');

    // Update unread message counts for participants (except the investor who started it)
    const batch = adminDb.batch();
    const unreadUpdate = { [`unreadDealMessages.${dealRef.id}`]: 1 };
    batch.update(primaryCreatorRef, unreadUpdate);
    if (solutionCreatorId && solutionCreatorId !== primaryCreatorId) {
        batch.update(adminDb.collection('users').doc(solutionCreatorId), unreadUpdate);
    }
    await batch.commit();

    return dealRef.id;
}
