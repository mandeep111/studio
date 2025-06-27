"use server";

import { revalidatePath } from "next/cache";
import { suggestPairings } from "@/ai/flows/suggest-pairings";
import { problemCreators, solutionCreators } from "@/lib/mock-data";
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

// Schemas for new forms
const CreateProblemSchema = z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters." }),
    description: z.string().min(20, { message: "Description must be at least 20 characters." }),
    tags: z.string().min(3, { message: "Please add at least one tag." }),
});

const CreateSolutionSchema = z.object({
    description: z.string().min(20, { message: "Solution description must be at least 20 characters." }),
    problemId: z.string(),
});

const CreateIdeaSchema = z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters." }),
    description: z.string().min(20, { message: "Description must be at least 20 characters." }),
    tags: z.string().min(3, { message: "Please add at least one tag." }),
});


export type FormState = {
    message: string;
    error?: boolean;
    resetKey?: string;
};

export async function createProblem(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    const validatedFields = CreateProblemSchema.safeParse({
        title: formData.get("title"),
        description: formData.get("description"),
        tags: formData.get("tags"),
    });

    if (!validatedFields.success) {
        return {
            message: Object.values(validatedFields.error.flatten().fieldErrors).flat().join(" "),
            error: true,
        };
    }
    
    console.log("New Problem Submitted:", validatedFields.data);
    // Here you would typically save to a database.
    // We'll revalidate the path to simulate the data being added.
    revalidatePath("/");

    return { message: "Problem submitted successfully!", resetKey: Date.now().toString() };
}

export async function createSolution(
    prevState: FormState,
    formData: FormData
  ): Promise<FormState> {
    const validatedFields = CreateSolutionSchema.safeParse({
      description: formData.get("description"),
      problemId: formData.get("problemId"),
    });
  
    if (!validatedFields.success) {
      return {
        message: validatedFields.error.flatten().fieldErrors.description?.[0] || "Invalid input.",
        error: true,
      };
    }
  
    console.log("New Solution Submitted:", validatedFields.data);
    // Here you would typically save to a database.
    // We'll revalidate the path to simulate the data being added.
    revalidatePath(`/problems/${validatedFields.data.problemId}`);
  
    return { message: "Solution posted successfully!", resetKey: Date.now().toString() };
}

export async function createIdea(
    prevState: FormState,
    formData: FormData
  ): Promise<FormState> {
    const validatedFields = CreateIdeaSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      tags: formData.get("tags"),
    });
  
    if (!validatedFields.success) {
      return {
        message: Object.values(validatedFields.error.flatten().fieldErrors).flat().join(" "),
        error: true,
      };
    }
  
    console.log("New Idea Submitted:", validatedFields.data);
    // Here you would typically save to a database.
    // We'll revalidate the path to simulate the data being added.
    revalidatePath("/");
  
    return { message: "Idea submitted successfully!", resetKey: Date.now().toString() };
}
