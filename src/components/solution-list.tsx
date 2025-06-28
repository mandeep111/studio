"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedSolutions, upvoteSolution } from "@/lib/firestore";
import type { Solution } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Lightbulb, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import SolutionCard from "./solution-card";

export default function SolutionList() {
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<'createdAt' | 'upvotes'>('upvotes');
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchSolutions = useCallback(async (reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setSolutions([]);
            setLastVisible(null); 
        } else {
            setLoadingMore(true);
        }

        try {
            const { data, lastVisible: newLastVisible } = await getPaginatedSolutions({
                sortBy,
                lastVisible: reset ? null : lastVisible,
            });
            setSolutions(prev => reset ? data : [...prev, ...data]);
            setLastVisible(newLastVisible);
            setHasMore(!!newLastVisible);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch solutions." });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sortBy, lastVisible, toast]);

    useEffect(() => {
        fetchSolutions(true);
    }, [sortBy]);

    const handleUpvote = async (solutionId: string) => {
        if (!user) return;
        try {
            await upvoteSolution(solutionId, user.uid);
            fetchSolutions(true);
            toast({title: "Success", description: "Your upvote has been recorded."});
        } catch (e) {
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Solutions</CardTitle>
                    <CardDescription>Browse the latest and most popular solutions.</CardDescription>
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
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-4 rounded-lg border p-4">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/3" />
                                <div className="flex items-start gap-4 pt-2">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-8 w-28" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : solutions.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {solutions.map((solution) => (
                                <SolutionCard key={solution.id} solution={solution} onUpvote={handleUpvote} />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="mt-8 text-center">
                                <Button onClick={() => fetchSolutions(false)} disabled={loadingMore}>
                                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16">
                         <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mt-4">No Solutions Yet</h3>
                        <p className="text-muted-foreground mt-2 mb-6">No solutions have been submitted yet. Find a problem and be the first to solve it!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
