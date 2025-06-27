"use server";

import { suggestPairings } from "@/ai/flows/suggest-pairings";
import { problemCreators, solutionCreators } from "@/lib/mock-data";
import { z } from "zod";

const SuggestPairingsSchema = z.object({
  investorProfile: z.string().min(10, { message: "Investor profile must be at least 10 characters long." }),
});

export type FormState = {
  message: string;
  pairings?: {
    problemCreatorId: string;
    solutionCreatorId: string;
    matchReason: string;
  }[];
  error?: boolean;
};

export async function getAiPairings(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
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

    const pairingsResult = await suggestPairings({
      investorProfile,
      problemCreators: problemCreators.map(({ id, reputationScore, expertise }) => ({
        creatorId: id,
        reputationScore,
        expertise,
      })),
      solutionCreators: solutionCreators.map(({ id, reputationScore, expertise }) => ({
        creatorId: id,
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
