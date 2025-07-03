
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedSolutions, getActiveAdForPlacement } from "@/lib/firestore";
import { upvoteItemAction } from "@/app/actions";
import type { Solution, Ad } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Lightbulb, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import SolutionCard from "./solution-card";
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

export default function SolutionList() {
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<'createdAt' | 'upvotes'>('upvotes');
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [upvotingId, setUpvotingId] = useState<string | null>(null);
    const [ad, setAd] = useState<Ad | null>(null);

     useEffect(() => {
        getActiveAdForPlacement('solution-list').then(setAd);
    }, []);

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
        if (!user || upvotingId) return;

        setUpvotingId(solutionId);

        setSolutions(prevSolutions =>
            prevSolutions.map(s => {
                if (s.id === solutionId) {
                    if (s.creator.userId === user.uid) return s;
                    const isAlreadyUpvoted = s.upvotedBy.includes(user.uid);
                    return {
                        ...s,
                        upvotes: isAlreadyUpvoted ? s.upvotes - 1 : s.upvotes + 1,
                        upvotedBy: isAlreadyUpvoted
                            ? s.upvotedBy.filter(uid => uid !== user.uid)
                            : [...s.upvotedBy, user.uid],
                    };
                }
                return s;
            })
        );

        const result = await upvoteItemAction(user.uid, solutionId, 'solution');

        if (!result.success) {
            toast({ variant: "destructive", title: "Error", description: result.message });
            fetchSolutions(true);
        }

        setUpvotingId(null);
    };
    
    const filteredSolutions = useMemo(() => {
        return solutions.filter(solution => {
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return solution.problemTitle.toLowerCase().includes(searchLower) ||
                       solution.description.toLowerCase().includes(searchLower);
            }
            return true;
        });
    }, [solutions, searchTerm]);

    const itemsToRender = useMemo(() => {
        const cardItems: React.ReactNode[] = filteredSolutions.map((solution) => (
           <SolutionCard key={solution.id} solution={solution} onUpvote={handleUpvote} isUpvoting={upvotingId === solution.id} />
        ));
    
        if (ad && !userProfile?.isPremium && cardItems.length > 2) {
          cardItems.splice(3, 0, <AdCard key="ad-card" ad={ad} />);
        }
        return cardItems;
    }, [filteredSolutions, ad, userProfile, handleUpvote, upvotingId]);


    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Solutions</CardTitle>
                    <CardDescription>Browse the latest and most popular solutions.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                     <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search solutions..." 
                            className="pl-8 w-full sm:w-auto"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Select value={sortBy} onValueChange={(value: 'createdAt' | 'upvotes') => setSortBy(value)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
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
                ) : filteredSolutions.length > 0 ? (
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
                                <Button onClick={() => fetchSolutions(false)} disabled={loadingMore}>
                                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                ) : (
                    <div className="text-center py-16">
                         <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mt-4">No Solutions Found</h3>
                        <p className="text-muted-foreground mt-2 mb-6">
                            {searchTerm ? "Try a different search term." : "No solutions have been submitted yet. Find a problem and be the first to solve it!"}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
