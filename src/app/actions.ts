"use server";

import { suggestPairings } from "@/ai/flows/suggest-pairings";
import { becomeInvestor, createDeal, getAllUsers, sendMessage, approveItem as approveItemInDb, deleteItem, getBusinesses } from "@/lib/firestore";
import type { UserProfile } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SuggestPairingsSchema = z.object({
  investorProfile: z.string().min(10, { message: "Investor profile must be at least 10 characters long." }),
});

export type AiPairingsFormState = {
  message: string;
  pairings?: {
    problemCreatorId: string;
    solutionCreatorId: string;
    problemId: string;
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

    const allUsers = await getAllUsers();
    const businesses = await getBusinesses();
    
    const businessCreatorIds = new Set(businesses.map(b => b.creator.userId));

    // Problem creators are users, including those who created businesses
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

    const pairingsResult = await suggestPairings({
      investorProfile,
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
    console.error(e);
    return { message: "An unexpected error occurred. Please try again.", error: true };
  }
}

export async function becomeInvestorAction(userId: string) {
    try {
        await becomeInvestor(userId);
        revalidatePath('/');
        return { success: true, message: "Welcome! You are now an Investor." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to update your role." };
    }
}

export async function startDealAction(formData: FormData) {
    const investorProfile = JSON.parse(formData.get('investorProfile') as string) as UserProfile;
    const problemCreatorId = formData.get('problemCreatorId') as string;
    const problemId = formData.get('problemId') as string;
    const solutionCreatorId = formData.get('solutionCreatorId') as string | undefined;

    try {
        const dealId = await createDeal(investorProfile, problemCreatorId, problemId, solutionCreatorId);
        return { success: true, dealId };
    } catch (error) {
        console.error("Failed to start deal:", error);
        return { success: false, message: "Could not start the deal. Please try again."};
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
    const type = formData.get('type') as 'problem' | 'solution' | 'idea' | 'user' | 'business';
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
