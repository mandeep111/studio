"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedIdeas, upvoteIdea } from "@/lib/firestore";
import type { Idea } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import IdeaCard from "./idea-card";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubmitIdeaDialog } from "./submit-idea-dialog";
import { Lightbulb, Loader2, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import { Button } from "./ui/button";

export default function RandomIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'upvotes'>('createdAt');
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const fetchIdeas = useCallback(async (reset: boolean = false) => {
    if (reset) {
        setLoading(true);
    } else {
        setLoadingMore(true);
    }

    try {
        const { data, lastVisible: newLastVisible } = await getPaginatedIdeas({
            sortBy,
            lastVisible: reset ? null : lastVisible,
        });

        setIdeas(prev => reset ? data : [...prev, ...data]);
        setLastVisible(newLastVisible);
        setHasMore(!!newLastVisible);
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch ideas." });
    } finally {
        setLoading(false);
        setLoadingMore(false);
    }
  }, [sortBy, lastVisible, toast]);

  useEffect(() => {
    fetchIdeas(true);
  }, [sortBy]);

  const handleUpvote = async (ideaId: string) => {
    if (!user) return;
    try {
        await upvoteIdea(ideaId, user.uid);
        fetchIdeas(true);
        toast({ title: "Success", description: "Your upvote has been recorded." });
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
    }
  };

  const onIdeaCreated = () => {
    fetchIdeas(true);
  };
  
  const canCreateIdea = userProfile?.isPremium || userProfile?.role === 'Admin';

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Random Ideas</CardTitle>
          <CardDescription>
            A space for brilliant thoughts not tied to a specific problem.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={sortBy} onValueChange={(value: 'createdAt' | 'upvotes') => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="createdAt">Most Recent</SelectItem>
                    <SelectItem value="upvotes">Most Upvoted</SelectItem>
                </SelectContent>
            </Select>
            {canCreateIdea && <SubmitIdeaDialog onIdeaCreated={onIdeaCreated} />}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
             {[...Array(3)].map((_, i) => <IdeaCardSkeleton key={i} />)}
           </div>
        ) : ideas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onUpvote={handleUpvote} />
              ))}
            </div>
            {hasMore && (
                <div className="mt-8 text-center">
                    <Button onClick={() => fetchIdeas(false)} disabled={loadingMore}>
                        {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No Ideas Yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">Be the first to share a random spark of genius.</p>
            {canCreateIdea && (
                <SubmitIdeaDialog onIdeaCreated={onIdeaCreated}>
                     <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Submit an Idea
                    </Button>
                </SubmitIdeaDialog>
            )}
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
