"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getIdeas, upvoteIdea } from "@/lib/firestore";
import type { Idea } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import IdeaCard from "./idea-card";
import { Skeleton } from "./ui/skeleton";

export default function RandomIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    const data = await getIdeas();
    setIdeas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleUpvote = async (ideaId: string) => {
    if (!user) return;
    await upvoteIdea(ideaId, user.uid);
    // Optimistic update
    setIdeas(prevIdeas => prevIdeas.map(idea => {
        if (idea.id !== ideaId) return idea;
        const upvoted = idea.upvotedBy.includes(user.uid);
        return {
            ...idea,
            upvotes: upvoted ? idea.upvotes - 1 : idea.upvotes + 1,
            upvotedBy: upvoted ? idea.upvotedBy.filter(id => id !== user.uid) : [...idea.upvotedBy, user.uid]
        }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Random Ideas</CardTitle>
        <CardDescription>
          A space for brilliant thoughts not tied to a specific problem.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
           [...Array(3)].map((_, i) => <IdeaCardSkeleton key={i} />)
        ) : (
          ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onUpvote={handleUpvote} />
          ))
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
