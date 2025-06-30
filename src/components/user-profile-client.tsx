
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Problem, Solution, UserProfile, Idea, UpvotedItem, Business, Deal } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { getProblemsByUser, getSolutionsByUser, getIdeasByUser, getUpvotedItems, upvoteProblem, upvoteSolution, upvoteIdea, getBusinessesByUser, upvoteBusiness, getDealsForUser, getContentByCreators, upvoteInvestor } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Gem, Trophy, Mail, BrainCircuit, Lightbulb, LogOut, Sparkles, History, Briefcase, Handshake, MessageSquare, Users, ThumbsUp, Loader2, Edit, CheckCircle, XCircle } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

interface UserProfileClientProps {
    userProfile: UserProfile;
    initialProblems: Problem[];
    initialSolutions: Solution[];
    initialIdeas: Idea[];
    initialBusinesses: Business[];
    initialUpvotedItems: UpvotedItem[];
    initialDeals: Deal[];
}

const DealListItem = ({ deal }: { deal: Deal }) => (
    <Link href={`/deals/${deal.id}`} key={deal.id} className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors">
        <div className="flex justify-between items-center">
            <div>
                <p className="font-semibold">{deal.title}</p>
                <p className="text-sm text-muted-foreground">
                    Created on {format(getDateFromTimestamp(deal.createdAt), 'PPP')}
                </p>
            </div>
            {deal.status === 'active' && (
                <Button variant="outline" size="sm" asChild>
                    <span>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Open Chat
                    </span>
                </Button>
            )}
            {deal.status === 'completed' && (
                <Badge variant="secondary">Completed</Badge>
            )}
             {deal.status === 'cancelled' && (
                <Badge variant="destructive">Cancelled</Badge>
            )}
        </div>
    </Link>
);

export default function UserProfileClient({ 
    userProfile, 
    initialProblems, 
    initialSolutions, 
    initialIdeas, 
    initialBusinesses,
    initialUpvotedItems,
    initialDeals,
}: UserProfileClientProps) {
    const { user, userProfile: currentUserProfile } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile>(userProfile);
    const [problems, setProblems] = useState<Problem[]>(initialProblems);
    const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);
    const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
    const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
    const [upvotedItems, setUpvotedItems] = useState<UpvotedItem[]>(initialUpvotedItems);
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    const [workedWithContent, setWorkedWithContent] = useState<(Problem | Solution)[]>([]);
    const [isUpvoting, setIsUpvoting] = useState(false);

    
    const isOwnProfile = user?.uid === profile.uid;

    const fetchData = useCallback(async () => {
        const [problemsData, solutionsData, ideasData, businessesData, upvotedData, dealsData] = await Promise.all([
            getProblemsByUser(profile.uid),
            getSolutionsByUser(profile.uid),
            getIdeasByUser(profile.uid),
            getBusinessesByUser(profile.uid),
            isOwnProfile ? getUpvotedItems(profile.uid) : Promise.resolve([]),
            getDealsForUser(profile.uid),
        ]);
        setProblems(problemsData);
        setSolutions(solutionsData);
        setIdeas(ideasData);
        setBusinesses(businessesData);
        setUpvotedItems(upvotedData as UpvotedItem[]);
        setDeals(dealsData);

        if (profile.role === 'Investor') {
            const creatorIds = new Set<string>();
            dealsData.forEach(deal => {
                creatorIds.add(deal.primaryCreator.userId);
                if (deal.solutionCreator) {
                    creatorIds.add(deal.solutionCreator.userId);
                }
            });
            creatorIds.delete(profile.uid);

            if (creatorIds.size > 0) {
                const content = await getContentByCreators(Array.from(creatorIds));
                setWorkedWithContent(content);
            }
        }

    }, [profile.uid, isOwnProfile, profile.role]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

     const handleInvestorUpvote = async () => {
        if (!user || isOwnProfile || profile.role !== 'Investor' || isUpvoting) return;
        setIsUpvoting(true);

        const currentUpvotes = profile.upvotes || 0;
        const isUpvoted = (profile.upvotedBy || []).includes(user.uid);
        
        // Optimistic update
        setProfile(prev => ({
            ...prev,
            upvotes: isUpvoted ? currentUpvotes - 1 : currentUpvotes + 1,
            upvotedBy: isUpvoted 
                ? (prev.upvotedBy || []).filter(id => id !== user.uid)
                : [...(prev.upvotedBy || []), user.uid]
        }));

        try {
            await upvoteInvestor(profile.uid, user.uid);
        } catch(e) {
            setProfile(profile); // Revert on error
            toast({variant: "destructive", title: "Error", description: (e as Error).message});
        } finally {
            setIsUpvoting(false);
        }
    }

    const handleProblemUpvote = async (problemId: string) => {
        if (!user) return;
        setProblems(prev => prev.map(p => {
            if (p.id === problemId && p.creator.userId !== user.uid) {
                const isUpvoted = p.upvotedBy.includes(user.uid);
                return { ...p, upvotes: isUpvoted ? p.upvotes - 1 : p.upvotes + 1, upvotedBy: isUpvoted ? p.upvotedBy.filter(uid => uid !== user.uid) : [...p.upvotedBy, user.uid] };
            }
            return p;
        }));
        try {
            await upvoteProblem(problemId, user.uid);
        } catch (e) {
            fetchData();
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    const handleSolutionUpvote = async (solutionId: string) => {
        if (!user) return;
        setSolutions(prev => prev.map(s => {
            if (s.id === solutionId && s.creator.userId !== user.uid) {
                const isUpvoted = s.upvotedBy.includes(user.uid);
                return { ...s, upvotes: isUpvoted ? s.upvotes - 1 : s.upvotes + 1, upvotedBy: isUpvoted ? s.upvotedBy.filter(uid => uid !== user.uid) : [...s.upvotedBy, user.uid] };
            }
            return s;
        }));
        try {
            await upvoteSolution(solutionId, user.uid);
        } catch (e) {
            fetchData();
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    const handleIdeaUpvote = async (ideaId: string) => {
        if (!user) return;
        setIdeas(prev => prev.map(i => {
            if (i.id === ideaId && i.creator.userId !== user.uid) {
                const isUpvoted = i.upvotedBy.includes(user.uid);
                return { ...i, upvotes: isUpvoted ? i.upvotes - 1 : i.upvotes + 1, upvotedBy: isUpvoted ? i.upvotedBy.filter(uid => uid !== user.uid) : [...i.upvotedBy, user.uid] };
            }
            return i;
        }));
        try {
            await upvoteIdea(ideaId, user.uid);
        } catch (e) {
            fetchData();
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    const handleBusinessUpvote = async (businessId: string) => {
        if (!user) return;
        setBusinesses(prev => prev.map(b => {
            if (b.id === businessId && b.creator.userId !== user.uid) {
                const isUpvoted = b.upvotedBy.includes(user.uid);
                return { ...b, upvotes: isUpvoted ? b.upvotes - 1 : b.upvotes + 1, upvotedBy: isUpvoted ? b.upvotedBy.filter(uid => uid !== user.uid) : [...b.upvotedBy, user.uid] };
            }
            return b;
        }));
        try {
            await upvoteBusiness(businessId, user.uid);
        } catch (e) {
            fetchData();
            toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };
    
    const activeDeals = useMemo(() => deals.filter(d => d.status === 'active'), [deals]);
    const archivedDeals = useMemo(() => deals.filter(d => d.status === 'completed' || d.status === 'cancelled'), [deals]);

    const tabList = (
        <TabsList>
            <TabsTrigger value="problems">
                <BrainCircuit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Problems</span>
            </TabsTrigger>
            <TabsTrigger value="solutions">
                <Lightbulb className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Solutions</span>
            </TabsTrigger>
            <TabsTrigger value="businesses">
                <Briefcase className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Businesses</span>
            </TabsTrigger>
            <TabsTrigger value="ideas">
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ideas</span>
            </TabsTrigger>
            {profile.role === 'Investor' && (
                <TabsTrigger value="worked-with">
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Network</span>
                </TabsTrigger>
            )}
            {(isOwnProfile || profile.role === 'Investor') && (
                <TabsTrigger value="deals">
                    <Handshake className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Deals</span>
                </TabsTrigger>
            )}
            {isOwnProfile && (
                <TabsTrigger value="upvoted-history">
                    <History className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Upvoted</span>
                </TabsTrigger>
            )}
        </TabsList>
    );


    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader className="items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                            <AvatarFallback className="text-3xl">{profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl">{profile.name}</CardTitle>
                        <CardDescription>{profile.expertise}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-5 w-5" /> <span>{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Trophy className="h-5 w-5 text-primary" /> <span>Role: {profile.role}</span>
                        </div>
                         {profile.role === 'Investor' ? (
                            <>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Handshake className="h-5 w-5 text-primary" /> <span>{profile.dealsCount || 0} Deals Initiated</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle className="h-5 w-5 text-green-500" /> <span>{profile.dealsCompletedCount || 0} Deals Completed</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <XCircle className="h-5 w-5 text-red-500" /> <span>{profile.dealsCancelledCount || 0} Deals Cancelled</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ThumbsUp className="h-5 w-5 text-primary" /> <span>{(profile.upvotes || 0).toLocaleString()} Upvotes</span>
                                </div>
                            </>
                         ) : profile.role === 'User' ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Gem className="h-5 w-5 text-yellow-500" /> <span>{profile.points.toLocaleString()} Points</span>
                            </div>
                         ) : null}
                    </CardContent>
                    
                    <CardFooter className="flex-col gap-2 items-stretch">
                        {isOwnProfile ? (
                            <>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/users/${profile.uid}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Profile
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log Out
                                </Button>
                            </>
                        ) : profile.role === 'Investor' && user ? (
                            <Button variant="outline" className="w-full" onClick={handleInvestorUpvote} disabled={isUpvoting}>
                                {isUpvoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                                {(profile.upvotedBy || []).includes(user.uid) ? 'Upvoted' : 'Upvote Investor'}
                            </Button>
                        ) : null}
                    </CardFooter>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Tabs defaultValue="problems">
                    <ScrollArea className="w-full whitespace-nowrap">
                        {tabList}
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    
                    <TabsContent value="problems" className="mt-4">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Problems Submitted</CardTitle>
                                {isOwnProfile && (currentUserProfile?.role === 'User' || currentUserProfile?.role === 'Admin') && (
                                    <SubmitProblemDialog onProblemCreated={fetchData} />
                                )}
                            </CardHeader>
                            <CardContent>
                                {problems.length > 0 ? (
                                    <div className="space-y-4">
                                        {problems.map(problem => (
                                            <ProblemCard key={problem.id} problem={problem} onUpvote={handleProblemUpvote} isUpvoting={false} />
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
                                            <SolutionCard key={solution.id} solution={solution} onUpvote={handleSolutionUpvote} isUpvoting={false} />
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
                                {isOwnProfile && (currentUserProfile?.role === 'User' || currentUserProfile?.role === 'Admin') && (
                                    <SubmitBusinessDialog onBusinessCreated={fetchData} />
                                )}
                            </CardHeader>
                            <CardContent>
                                {businesses.length > 0 ? (
                                    <div className="space-y-4">
                                        {businesses.map(business => (
                                            <BusinessCard key={business.id} business={business} onUpvote={handleBusinessUpvote} isUpvoting={false} />
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
                                {isOwnProfile && (currentUserProfile?.role === 'User' || currentUserProfile?.role === 'Admin') && (
                                    <SubmitIdeaDialog onIdeaCreated={fetchData} />
                                )}
                            </CardHeader>
                            <CardContent>
                                {ideas.length > 0 ? (
                                    <div className="space-y-4">
                                        {ideas.map(idea => (
                                            <IdeaCard key={idea.id} idea={idea} onUpvote={handleIdeaUpvote} isUpvoting={false} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">This user hasn't submitted any ideas yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    {profile.role === 'Investor' && (
                        <TabsContent value="worked-with" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Network Content</CardTitle>
                                    <CardDescription>Content from creators this investor has worked with.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {workedWithContent.length > 0 ? (
                                        <div className="space-y-4">
                                            {workedWithContent.map(item => {
                                                if ('solutionsCount' in item) { // It's a Problem
                                                    return <ProblemCard key={item.id} problem={item} onUpvote={() => {}} isUpvoting={false} />;
                                                }
                                                if ('problemId' in item) { // It's a Solution
                                                    return <SolutionCard key={item.id} solution={item} onUpvote={() => {}} isUpvoting={false} />;
                                                }
                                                return null;
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No content from this investor's network yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                    {(isOwnProfile || profile.role === 'Investor') && (
                        <TabsContent value="deals" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Deals</CardTitle>
                                    <CardDescription>All deals this user is participating in.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full" defaultValue="ongoing">
                                        <AccordionItem value="ongoing">
                                            <AccordionTrigger>Ongoing Deals ({activeDeals.length})</AccordionTrigger>
                                            <AccordionContent className="pt-2">
                                                {activeDeals.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {activeDeals.map(deal => <DealListItem key={deal.id} deal={deal} />)}
                                                    </div>
                                                ) : (
                                                    <p className="text-muted-foreground text-center py-4">No ongoing deals.</p>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="archived">
                                            <AccordionTrigger>Archived Deals ({archivedDeals.length})</AccordionTrigger>
                                            <AccordionContent className="pt-2">
                                                 {archivedDeals.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {archivedDeals.map(deal => <DealListItem key={deal.id} deal={deal} />)}
                                                    </div>
                                                ) : (
                                                    <p className="text-muted-foreground text-center py-4">No archived deals.</p>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
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
