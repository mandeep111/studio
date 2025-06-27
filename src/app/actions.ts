"use server";

import { suggestPairings } from "@/ai/flows/suggest-pairings";
import { getUsers } from "@/lib/firestore";
import type { UserProfile } from "@/lib/types";
import { z } from "zod";

const SuggestPairingsSchema = z.object({
  investorProfile: z.string().min(10, { message: "Investor profile must be at least 10 characters long." }),
});

export type AiPairingsFormState = {
  message: string;
  pairings?: {
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

    // Fetch real user data from Firestore
    const allUsers = await getUsers();
    const problemCreators = allUsers.filter(u => u.role === 'User').map(u => ({
        creatorId: u.uid,
        // Using a mock reputation score for now. This could be calculated in the future.
        reputationScore: Math.round((Math.random() * 0.8 + 4.2) * 10)/10, 
        expertise: u.expertise
    }));
    const solutionCreators = problemCreators; // For this app, users can be both.

    const pairingsResult = await suggestPairings({
      investorProfile,
      problemCreators: problemCreators.map(({ creatorId, reputationScore, expertise }) => ({
        creatorId,
        reputationScore,
        expertise,
      })),
      solutionCreators: solutionCreators.map(({ creatorId, reputationScore, expertise }) => ({
        creatorId,
        reputationScore,
        expertise,
      })),
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
