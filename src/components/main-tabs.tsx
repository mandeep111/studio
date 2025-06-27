"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedProblems, getPaginatedSolutions, upvoteProblem, upvoteSolution } from "@/lib/firestore";
import type { Problem, Solution, UserProfile } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import ProblemCard from "@/components/problem-card";
import SolutionCard from "@/components/solution-card";
import AiMatchmaking from "@/components/ai-matchmaking";
import RandomIdeas from "./random-ideas";
import { useToast } from "@/hooks/use-toast";
import { SubmitProblemDialog } from "./submit-problem-dialog";
import { Button } from "./ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";

interface MainTabsProps {
    userProfile: UserProfile | null;
}

export default function MainTabs({ userProfile }: MainTabsProps) {
  const [activeTab, setActiveTab] = useState("problems");

  return (
    <Tabs defaultValue="problems" className="w-full" onValueChange={setActiveTab} value={activeTab}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:w-auto">
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="random-ideas">Random Ideas</TabsTrigger>
          <TabsTrigger value="ai-matchmaking">AI Matchmaking</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="problems" className="mt-6">
        <ProblemList userProfile={userProfile} />
      </TabsContent>
      <TabsContent value="solutions" className="mt-6">
        <SolutionList />
      </TabsContent>
       <TabsContent value="random-ideas" className="mt-6">
        <RandomIdeas />
      </TabsContent>
      <TabsContent value="ai-matchmaking" className="mt-6">
        <AiMatchmaking />
      </TabsContent>
    </Tabs>
  );
}

function ProblemList({ userProfile }: { userProfile: UserProfile | null }) {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<'createdAt' | 'upvotes'>('createdAt');
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchProblems = useCallback(async (reset: boolean = false) => {
        if (reset) {
            setLoading(true);
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

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Open Problems</CardTitle>
                    <CardDescription>Browse challenges awaiting innovative solutions.</CardDescription>
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
                    <SubmitProblemDialog onProblemCreated={() => fetchProblems(true)} />
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
                        <h3 className="text-xl font-semibold">No Problems Yet</h3>
                        <p className="text-muted-foreground mt-2 mb-6">Be the first to submit a problem and get the ball rolling.</p>
                        <SubmitProblemDialog onProblemCreated={() => fetchProblems(true)}>
                            <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Submit a Problem
                            </Button>
                        </SubmitProblemDialog>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SolutionList() {
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<'createdAt' | 'upvotes'>('upvotes');
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();
    
    const fetchSolutions = useCallback(async (reset: boolean = false) => {
        if(reset) {
            setLoading(true);
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
        } catch(e) {
            console.error(e);
            toast({variant: "destructive", title: "Error", description: "Could not fetch solutions."});
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
                    <CardTitle>Proposed Solutions</CardTitle>
                    <CardDescription>Explore creative solutions submitted by our community.</CardDescription>
                </div>
                <Select value={sortBy} onValueChange={(value: 'createdAt' | 'upvotes') => setSortBy(value)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="upvotes">Most Upvoted</SelectItem>
                        <SelectItem value="createdAt">Most Recent</SelectItem>
                    </SelectContent>
                </Select>
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
                        <h3 className="text-xl font-semibold">No Solutions Proposed</h3>
                        <p className="text-muted-foreground mt-2">No solutions have been proposed yet. Find a problem and share your idea!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
