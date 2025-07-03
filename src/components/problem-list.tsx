
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedProblems, getActiveAdForPlacement, getPaymentSettings } from "@/lib/firestore";
import { upvoteItemAction } from "@/app/actions";
import type { Problem, Ad, PaymentSettings } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubmitProblemDialog } from "./submit-problem-dialog";
import { Button } from "./ui/button";
import { Loader2, PlusCircle, Search, BrainCircuit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import ProblemCard from "./problem-card";
import { Input } from "./ui/input";
import AdCard from "./ad-card";
import { ScrollArea } from "./ui/scroll-area";

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};


export default function ProblemList() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<'createdAt' | 'upvotes' | 'solutionsCount' | 'interestedInvestorsCount'>('upvotes');
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [upvotingId, setUpvotingId] = useState<string | null>(null);
    const [ad, setAd] = useState<Ad | null>(null);
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ isEnabled: true });

    useEffect(() => {
        getActiveAdForPlacement('problem-list').then(setAd);
        getPaymentSettings().then(setPaymentSettings);
    }, []);

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

    const handleUpvote = async (problemId: string, creatorId: string) => {
        if (!user || upvotingId) return;

        setUpvotingId(problemId);
        
        // Optimistic update
        setProblems(prevProblems =>
            prevProblems.map(p => {
                if (p.id === problemId) {
                    if (p.creator.userId === user.uid) return p;
                    const isAlreadyUpvoted = p.upvotedBy.includes(user.uid);
                    return {
                        ...p,
                        upvotes: isAlreadyUpvoted ? p.upvotes - 1 : p.upvotes + 1,
                        upvotedBy: isAlreadyUpvoted
                            ? p.upvotedBy.filter(uid => uid !== user.uid)
                            : [...p.upvotedBy, user.uid],
                    };
                }
                return p;
            })
        );

        const result = await upvoteItemAction(problemId, 'problem');
        
        if (!result.success) {
            toast({ variant: "destructive", title: "Error", description: result.message });
            fetchProblems(true); // Revert on error
        }
        
        setUpvotingId(null);
    };

    const canCreateProblem = userProfile?.role === 'User';

    const filteredProblems = useMemo(() => {
        return problems.filter(problem => {
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return problem.title.toLowerCase().includes(searchLower) ||
                       problem.description.toLowerCase().includes(searchLower) ||
                       problem.tags.some(tag => tag.toLowerCase().includes(searchLower));
            }
            return true;
        });
    }, [problems, searchTerm]);


    const itemsToRender = useMemo(() => {
        const cardItems: React.ReactNode[] = filteredProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} onUpvote={handleUpvote} isUpvoting={upvotingId === problem.id} />
        ));

        if (ad && !userProfile?.isPremium && cardItems.length > 2) {
          cardItems.splice(3, 0, <AdCard key="ad-card" ad={ad} />);
        }
        return cardItems;
    }, [filteredProblems, ad, userProfile, handleUpvote, upvotingId]);

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Problems</CardTitle>
                    <CardDescription>Browse problems that need solving.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search problems..." 
                            className="pl-8 w-full sm:w-auto"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Select value={sortBy} onValueChange={(value: 'createdAt' | 'upvotes' | 'solutionsCount' | 'interestedInvestorsCount') => setSortBy(value)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="upvotes">Most Upvoted</SelectItem>
                            <SelectItem value="solutionsCount">Most Solutions</SelectItem>
                            <SelectItem value="interestedInvestorsCount">Most Investors</SelectItem>
                            <SelectItem value="createdAt">Most Recent</SelectItem>
                        </SelectContent>
                    </Select>
                    {canCreateProblem && (
                        <SubmitProblemDialog onProblemCreated={() => fetchProblems(true)} isPaymentEnabled={paymentSettings.isEnabled} />
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
                ) : filteredProblems.length > 0 ? (
                    <ScrollArea className="h-[600px] w-full pr-4">
                        <motion.div 
                            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                           {itemsToRender.map((item) => (
                               <motion.div key={item.key} variants={itemVariants} whileHover={{ scale: 1.02 }}>
                                   {item}
                               </motion.div>
                           ))}
                        </motion.div>
                        {hasMore && !searchTerm && (
                            <div className="mt-8 text-center">
                                <Button onClick={() => fetchProblems(false)} disabled={loadingMore}>
                                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                ) : (
                    <div className="text-center py-16">
                         <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mt-4">No Problems Found</h3>
                        <p className="text-muted-foreground mt-2 mb-6">
                            {searchTerm ? "Try a different search term." : "Be the first to post a problem and challenge the community."}
                        </p>
                        {canCreateProblem && !searchTerm && (
                            <SubmitProblemDialog onProblemCreated={() => fetchProblems(true)} isPaymentEnabled={paymentSettings.isEnabled}>
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
