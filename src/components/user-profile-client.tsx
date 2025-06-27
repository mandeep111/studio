"use client";

import { useState, useCallback, useEffect } from "react";
import type { Problem, Solution, UserProfile, Idea, UpvotedItem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { getProblemsByUser, getSolutionsByUser, getIdeasByUser, getUpvotedItems, upvoteProblem, upvoteSolution, upvoteIdea } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Gem, Trophy, Mail, BrainCircuit, Lightbulb, LogOut, Sparkles, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProblemCard from "./problem-card";
import SolutionCard from "./solution-card";
import IdeaCard from "./idea-card";
import { Button } from "./ui/button";
import { SubmitProblemDialog } from "./submit-problem-dialog";
import { SubmitIdeaDialog } from "./submit-idea-dialog";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UserProfileClientProps {
    userProfile: UserProfile;
    initialProblems: Problem[];
    initialSolutions: Solution[];
    initialIdeas: Idea[];
    initialUpvotedItems: UpvotedItem[];
}

export default function UserProfileClient({ userProfile, initialProblems, initialSolutions, initialIdeas, initialUpvotedItems }: UserProfileClientProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [problems, setProblems] = useState<Problem[]>(initialProblems);
    const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);
    const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
    const [upvotedItems, setUpvotedItems] = useState<UpvotedItem[]>(initialUpvotedItems);
    
    const isOwnProfile = user?.uid === userProfile.uid;

    const fetchData = useCallback(async () => {
        const [problemsData, solutionsData, ideasData, upvotedData] = await Promise.all([
            getProblemsByUser(userProfile.uid),
            getSolutionsByUser(userProfile.uid),
            getIdeasByUser(userProfile.uid),
            isOwnProfile ? getUpvotedItems(userProfile.uid) : Promise.resolve([]),
        ]);
        setProblems(problemsData);
        setSolutions(solutionsData);
        setIdeas(ideasData);
        setUpvotedItems(upvotedData as UpvotedItem[]);
    }, [userProfile.uid, isOwnProfile]);

    useEffect(() => {
        // This is to ensure state is in sync if initial props change for any reason
        setProblems(initialProblems);
        setSolutions(initialSolutions);
        setIdeas(initialIdeas);
        setUpvotedItems(initialUpvotedItems);
    }, [initialProblems, initialSolutions, initialIdeas, initialUpvotedItems]);

    const handleProblemUpvote = async (problemId: string) => {
        if (!user) return;
        try {
            await upvoteProblem(problemId, user.uid);
            fetchData();
            toast({title: "Success", description: "Your upvote has been recorded."});
        } catch (e) {
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    const handleSolutionUpvote = async (solutionId: string) => {
        if (!user) return;
        try {
            await upvoteSolution(solutionId, user.uid);
            fetchData();
            toast({title: "Success", description: "Your upvote has been recorded."});
        } catch (e) {
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    const handleIdeaUpvote = async (ideaId: string) => {
        if (!user) return;
        try {
            await upvoteIdea(ideaId, user.uid);
            fetchData();
            toast({ title: "Success", description: "Your upvote has been recorded." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Could not record upvote." });
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
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
                    {isOwnProfile && (
                        <CardFooter>
                            <Button variant="outline" className="w-full" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Log Out
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Tabs defaultValue="problems">
                    <TabsList className={cn("grid w-full", isOwnProfile ? "grid-cols-4" : "grid-cols-3")}>
                        <TabsTrigger value="problems">
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            Problems ({problems.length})
                        </TabsTrigger>
                        <TabsTrigger value="solutions">
                            <Lightbulb className="mr-2 h-4 w-4" />
                            Solutions ({solutions.length})
                        </TabsTrigger>
                        <TabsTrigger value="ideas">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Ideas ({ideas.length})
                        </TabsTrigger>
                        {isOwnProfile && (
                            <TabsTrigger value="history">
                                <History className="mr-2 h-4 w-4" />
                                Upvote History
                            </TabsTrigger>
                        )}
                    </TabsList>
                    <TabsContent value="problems" className="mt-4">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Problems Submitted</CardTitle>
                                {isOwnProfile && (userProfile?.role === 'User' || userProfile.role === 'Admin') && (
                                    <SubmitProblemDialog onProblemCreated={fetchData} />
                                )}
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
                    <TabsContent value="ideas" className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Ideas Submitted</CardTitle>
                                {isOwnProfile && (userProfile?.role === 'User' || userProfile.role === 'Admin') && (
                                    <SubmitIdeaDialog onIdeaCreated={fetchData} />
                                )}
                            </CardHeader>
                            <CardContent>
                                {ideas.length > 0 ? (
                                    <div className="space-y-4">
                                        {ideas.map(idea => (
                                            <IdeaCard key={idea.id} idea={idea} onUpvote={handleIdeaUpvote} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">This user hasn't submitted any ideas yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    {isOwnProfile && (
                        <TabsContent value="history" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Upvotes</CardTitle>
                                    <CardDescription>A list of items you've recently upvoted.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {upvotedItems.length > 0 ? (
                                        <div className="space-y-4">
                                            {upvotedItems.map(item => {
                                                if (item.type === 'problem') return <ProblemCard key={item.id} problem={item} onUpvote={() => handleProblemUpvote(item.id)} />;
                                                if (item.type === 'solution') return <SolutionCard key={item.id} solution={item} onUpvote={() => handleSolutionUpvote(item.id)} />;
                                                if (item.type === 'idea') return <IdeaCard key={item.id} idea={item} onUpvote={() => handleIdeaUpvote(item.id)} />;
                                                return null;
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">You haven't upvoted anything recently.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
}
