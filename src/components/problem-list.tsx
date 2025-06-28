"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedProblems, upvoteProblem } from "@/lib/firestore";
import type { Problem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubmitProblemDialog } from "./submit-problem-dialog";
import { Button } from "./ui/button";
import { BrainCircuit, Loader2, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import ProblemCard from "./problem-card";

export default function ProblemList() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<'createdAt' | 'upvotes'>('upvotes');
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { user, userProfile } = useAuth();
    const { toast } = useToast();

    const fetchProblems = useCallback(async (reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setProblems([]);
            setLastVisible(null); 
        } else {
            setLoadingMore(true);
        }

        try {
            const { data, lastVisible: newLastVisible } = await getPaginatedProblems({
                sortBy,
                lastVisible: reset ? null : lastVisible,
            });
            setProblems(prev => reset ? data : [...prev, ...data]);
            setLastVisible(newLastVisible);
            setHasMore(!!newLastVisible);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch problems." });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sortBy, lastVisible, toast]);

    useEffect(() => {
        fetchProblems(true);
    }, [sortBy]);

    const handleUpvote = async (problemId: string) => {
        if (!user) return;
        try {
            await upvoteProblem(problemId, user.uid);
            fetchProblems(true); 
            toast({title: "Success", description: "Your upvote has been recorded."});
        } catch (e) {
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    const canCreateProblem = userProfile?.isPremium || userProfile?.role === 'Admin';

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Problems</CardTitle>
                    <CardDescription>Browse problems that need solving.</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                     <Select value={sortBy} onValueChange={(value: 'createdAt' | 'upvotes') => setSortBy(value)}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="upvotes">Most Upvoted</SelectItem>
                            <SelectItem value="createdAt">Most Recent</SelectItem>
                        </SelectContent>
                    </Select>
                    {canCreateProblem && (
                        <SubmitProblemDialog onProblemCreated={() => fetchProblems(true)} />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                           <div key={i} className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <div className="flex justify-between items-center pt-2">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-8 w-28" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : problems.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {problems.map((problem) => (
                                <ProblemCard key={problem.id} problem={problem} onUpvote={handleUpvote} />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="mt-8 text-center">
                                <Button onClick={() => fetchProblems(false)} disabled={loadingMore}>
                                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16">
                         <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mt-4">No Problems Yet</h3>
                        <p className="text-muted-foreground mt-2 mb-6">Be the first to post a problem and challenge the community.</p>
                        {canCreateProblem && (
                            <SubmitProblemDialog onProblemCreated={() => fetchProblems(true)}>
                                <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Problem
                                </Button>
                            </SubmitProblemDialog>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
