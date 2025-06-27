"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getIdeas, upvoteIdea } from "@/lib/firestore";
import type { Idea } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import IdeaCard from "./idea-card";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubmitIdeaDialog } from "./submit-idea-dialog";
import { Lightbulb } from "lucide-react";

export default function RandomIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const fetchIdeas = useCallback(async () => {
    // Don't set loading to true here to avoid flicker on re-fetch
    const data = await getIdeas();
    setIdeas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchIdeas();
  }, [fetchIdeas]);

  const handleUpvote = async (ideaId: string) => {
    if (!user) return;
    
    const originalIdeas = ideas;
    const ideaToUpdate = ideas.find(i => i.id === ideaId);
    if (!ideaToUpdate) return;
    
    const upvoted = ideaToUpdate.upvotedBy.includes(user.uid);

    // Optimistic update
    setIdeas(prevIdeas => prevIdeas.map(idea => {
        if (idea.id !== ideaId) return idea;
        return {
            ...idea,
            upvotes: upvoted ? idea.upvotes - 1 : idea.upvotes + 1,
            upvotedBy: upvoted ? idea.upvotedBy.filter(id => id !== user.uid) : [...idea.upvotedBy, user.uid]
        }
    }));

    try {
        await upvoteIdea(ideaId, user.uid);
    } catch(e) {
        setIdeas(originalIdeas);
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
    }
  };

  const onIdeaCreated = () => {
    fetchIdeas();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Random Ideas</CardTitle>
          <CardDescription>
            A space for brilliant thoughts not tied to a specific problem.
          </CardDescription>
        </div>
        <SubmitIdeaDialog onIdeaCreated={onIdeaCreated} />
      </CardHeader>
      <CardContent>
        {loading ? (
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
             {[...Array(3)].map((_, i) => <IdeaCardSkeleton key={i} />)}
           </div>
        ) : ideas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onUpvote={handleUpvote} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No Ideas Yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">Be the first to share a random spark of genius.</p>
            <SubmitIdeaDialog onIdeaCreated={onIdeaCreated} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const IdeaCardSkeleton = () => (
    <div className="flex flex-col overflow-hidden transition-all border rounded-lg">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="pt-2 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4">
            <Skeleton className="h-8 w-24" />
        </CardFooter>
    </div>
);
