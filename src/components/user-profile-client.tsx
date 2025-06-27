"use client";

import { useState, useCallback } from "react";
import type { Problem, Solution, UserProfile } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { upvoteProblem, upvoteSolution } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Gem, Trophy, Mail, BrainCircuit, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProblemCard from "./problem-card";
import SolutionCard from "./solution-card";
import { getProblemsByUser, getSolutionsByUser } from "@/lib/firestore";

interface UserProfileClientProps {
    userProfile: UserProfile;
    initialProblems: Problem[];
    initialSolutions: Solution[];
}

export default function UserProfileClient({ userProfile, initialProblems, initialSolutions }: UserProfileClientProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [problems, setProblems] = useState<Problem[]>(initialProblems);
    const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);

    const fetchData = useCallback(async () => {
        const [problemsData, solutionsData] = await Promise.all([
            getProblemsByUser(userProfile.uid),
            getSolutionsByUser(userProfile.uid),
        ]);
        setProblems(problemsData);
        setSolutions(solutionsData);
    }, [userProfile.uid]);

    const handleProblemUpvote = async (problemId: string) => {
        if (!user) return;
        try {
            await upvoteProblem(problemId, user.uid);
            fetchData(); // Refetch to update counts
            toast({title: "Success", description: "Your upvote has been recorded."});
        } catch (e) {
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    const handleSolutionUpvote = async (solutionId: string) => {
        if (!user) return;
        try {
            await upvoteSolution(solutionId, user.uid);
            fetchData(); // Refetch to update counts
            toast({title: "Success", description: "Your upvote has been recorded."});
        } catch (e) {
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };
    
    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader className="items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
                            <AvatarFallback className="text-3xl">{userProfile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
                        <CardDescription>{userProfile.expertise}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-5 w-5" /> <span>{userProfile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Trophy className="h-5 w-5 text-primary" /> <span>Role: {userProfile.role}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Gem className="h-5 w-5 text-yellow-500" /> <span>{userProfile.points.toLocaleString()} Points</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Tabs defaultValue="problems">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="problems">
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            Problems ({problems.length})
                        </TabsTrigger>
                        <TabsTrigger value="solutions">
                            <Lightbulb className="mr-2 h-4 w-4" />
                            Solutions ({solutions.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="problems" className="mt-4">
                        <Card>
                             <CardHeader>
                                <CardTitle>Problems Submitted</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {problems.length > 0 ? (
                                    <div className="space-y-4">
                                        {problems.map(problem => (
                                            <ProblemCard key={problem.id} problem={problem} onUpvote={handleProblemUpvote} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">This user hasn't submitted any problems yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="solutions" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Solutions Proposed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {solutions.length > 0 ? (
                                    <div className="space-y-4">
                                        {solutions.map(solution => (
                                            <SolutionCard key={solution.id} solution={solution} onUpvote={handleSolutionUpvote} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">This user hasn't proposed any solutions yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
