"use client";

import { useState, useCallback, useEffect } from "react";
import type { Problem, Solution, UserProfile, Idea, UpvotedItem, Business, Deal } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { getProblemsByUser, getSolutionsByUser, getIdeasByUser, getUpvotedItems, upvoteProblem, upvoteSolution, upvoteIdea, getBusinessesByUser, upvoteBusiness, getDealsForUser } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Gem, Trophy, Mail, BrainCircuit, Lightbulb, LogOut, Sparkles, History, Briefcase, Handshake, MessageSquare } from "lucide-react";
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
import { cn, getDateFromTimestamp } from "@/lib/utils";
import BusinessCard from "./business-card";
import { SubmitBusinessDialog } from "./submit-business-dialog";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "./ui/badge";

interface UserProfileClientProps {
    userProfile: UserProfile;
    initialProblems: Problem[];
    initialSolutions: Solution[];
    initialIdeas: Idea[];
    initialBusinesses: Business[];
    initialUpvotedItems: UpvotedItem[];
    initialDeals: Deal[];
}

export default function UserProfileClient({ 
    userProfile, 
    initialProblems, 
    initialSolutions, 
    initialIdeas, 
    initialBusinesses,
    initialUpvotedItems,
    initialDeals,
}: UserProfileClientProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [problems, setProblems] = useState<Problem[]>(initialProblems);
    const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);
    const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
    const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
    const [upvotedItems, setUpvotedItems] = useState<UpvotedItem[]>(initialUpvotedItems);
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    
    const isOwnProfile = user?.uid === userProfile.uid;

    const fetchData = useCallback(async () => {
        const [problemsData, solutionsData, ideasData, businessesData, upvotedData, dealsData] = await Promise.all([
            getProblemsByUser(userProfile.uid),
            getSolutionsByUser(userProfile.uid),
            getIdeasByUser(userProfile.uid),
            getBusinessesByUser(userProfile.uid),
            isOwnProfile ? getUpvotedItems(userProfile.uid) : Promise.resolve([]),
            isOwnProfile ? getDealsForUser(userProfile.uid) : Promise.resolve([])
        ]);
        setProblems(problemsData);
        setSolutions(solutionsData);
        setIdeas(ideasData);
        setBusinesses(businessesData);
        setUpvotedItems(upvotedData as UpvotedItem[]);
        setDeals(dealsData);
    }, [userProfile.uid, isOwnProfile]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const handleBusinessUpvote = async (businessId: string) => {
        if (!user) return;
        try {
            await upvoteBusiness(businessId, user.uid);
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
                    <TabsList className={cn("grid w-full", isOwnProfile ? "grid-cols-6" : "grid-cols-4")}>
                        <TabsTrigger value="problems">
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            Problems ({problems.length})
                        </TabsTrigger>
                        <TabsTrigger value="solutions">
                            <Lightbulb className="mr-2 h-4 w-4" />
                            Solutions ({solutions.length})
                        </TabsTrigger>
                        <TabsTrigger value="businesses">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Businesses ({businesses.length})
                        </TabsTrigger>
                        <TabsTrigger value="ideas">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Ideas ({ideas.length})
                        </TabsTrigger>
                        {isOwnProfile && (
                             <TabsTrigger value="deals">
                                <Handshake className="mr-2 h-4 w-4" />
                                My Deals ({deals.length})
                            </TabsTrigger>
                        )}
                        {isOwnProfile && (
                            <TabsTrigger value="upvoted-history">
                                <History className="mr-2 h-4 w-4" />
                                Upvoted ({upvotedItems.length})
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
                     <TabsContent value="businesses" className="mt-4">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Businesses Submitted</CardTitle>
                                {isOwnProfile && (userProfile?.role === 'User' || userProfile.role === 'Admin') && (
                                    <SubmitBusinessDialog onBusinessCreated={fetchData} />
                                )}
                            </CardHeader>
                            <CardContent>
                                {businesses.length > 0 ? (
                                    <div className="space-y-4">
                                        {businesses.map(business => (
                                            <BusinessCard key={business.id} business={business} onUpvote={handleBusinessUpvote} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">This user hasn't submitted any businesses yet.</p>
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
                        <TabsContent value="deals" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>My Deals</CardTitle>
                                    <CardDescription>All deals you are participating in.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {deals.length > 0 ? (
                                        <div className="space-y-4">
                                            {deals.map(deal => (
                                                <Link href={`/deals/${deal.id}`} key={deal.id} className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-semibold">{deal.title}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Created on {format(getDateFromTimestamp(deal.createdAt), 'PPP')}
                                                            </p>
                                                        </div>
                                                        <Button variant="outline" size="sm">
                                                            <MessageSquare className="mr-2 h-4 w-4" />
                                                            Open Chat
                                                        </Button>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">You are not part of any deals yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                    {isOwnProfile && (
                        <TabsContent value="upvoted-history" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Upvoted History</CardTitle>
                                    <CardDescription>A list of all content you have upvoted.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     {upvotedItems.length > 0 ? (
                                        <div className="space-y-4">
                                            {upvotedItems.map(item => (
                                                <Link href={`/${item.type}s/${item.id}`} key={`${item.type}-${item.id}`} className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold">
                                                                {item.type === 'solution' ? `Solution for: ${item.problemTitle}` : item.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">by {item.creator.name}</p>
                                                        </div>
                                                        <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">You haven't upvoted anything yet.</p>
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
