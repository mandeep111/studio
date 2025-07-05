
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedIdeas, getActiveAdForPlacement, getPaymentSettings } from "@/lib/firestore";
import { upvoteItemAction } from "@/app/actions";
import type { Idea, Ad, PaymentSettings } from "@/lib/types";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import IdeaCard from "./idea-card";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubmitIdeaDialog } from "./submit-idea-dialog";
import { Lightbulb, Loader2, PlusCircle, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import { Button } from "./ui/button";
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

export default function RandomIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'upvotes'>('createdAt');
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [upvotingId, setUpvotingId] = useState<string | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ isEnabled: true });

  useEffect(() => {
    getActiveAdForPlacement('idea-list').then(setAd);
    getPaymentSettings().then(setPaymentSettings);
  }, []);

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
    if (!user || upvotingId) return;

    setUpvotingId(ideaId);

    setIdeas(prevIdeas =>
        prevIdeas.map(i => {
            if (i.id === ideaId) {
                if (i.creator.userId === user.uid) return i;
                const isAlreadyUpvoted = i.upvotedBy.includes(user.uid);
                return {
                    ...i,
                    upvotes: isAlreadyUpvoted ? i.upvotes - 1 : i.upvotes + 1,
                    upvotedBy: isAlreadyUpvoted
                        ? i.upvotedBy.filter(uid => uid !== user.uid)
                        : [...i.upvotedBy, user.uid],
                };
            }
            return i;
        })
    );
    
    const result = await upvoteItemAction(user.uid, ideaId, 'idea');
    
    if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.message });
        fetchIdeas(true);
    }

    setUpvotingId(null);
  };

  const onIdeaCreated = () => {
    fetchIdeas(true);
  };
  
  const canCreateIdea = userProfile?.role === 'User';

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return idea.title.toLowerCase().includes(searchLower) ||
                   idea.description.toLowerCase().includes(searchLower) ||
                   idea.tags.some(tag => tag.toLowerCase().includes(searchLower));
        }
        return true;
    });
  }, [ideas, searchTerm]);


  const itemsToRender = useMemo(() => {
    const items: (Idea | { type: 'ad'; ad: Ad })[] = [...filteredIdeas];

    if (ad && !userProfile?.isPremium && items.length > 2) {
      items.splice(3, 0, { type: 'ad', ad });
    }
    return items;
  }, [filteredIdeas, ad, userProfile]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Random Ideas</CardTitle>
          <CardDescription>
            A space for brilliant thoughts not tied to a specific problem.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search ideas..." 
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
                    <SelectItem value="createdAt">Most Recent</SelectItem>
                    <SelectItem value="upvotes">Most Upvoted</SelectItem>
                </SelectContent>
            </Select>
            {canCreateIdea && <SubmitIdeaDialog onIdeaCreated={onIdeaCreated} isPaymentEnabled={paymentSettings.isEnabled} />}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
             {[...Array(3)].map((_, i) => <IdeaCardSkeleton key={i} />)}
           </div>
        ) : filteredIdeas.length > 0 ? (
          <ScrollArea className="h-[600px] w-full pr-4">
            <motion.div
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
              {itemsToRender.map((item) => (
                <motion.div key={'type' in item ? item.ad.id : item.id} variants={itemVariants} whileHover={{ scale: 1.02 }}>
                    {'type' in item ? (
                        <AdCard ad={item.ad} />
                    ) : (
                        <IdeaCard idea={item} onUpvote={handleUpvote} isUpvoting={upvotingId === item.id} />
                    )}
                </motion.div>
              ))}
            </motion.div>
            {hasMore && !searchTerm && (
                <div className="mt-8 text-center">
                    <Button onClick={() => fetchIdeas(false)} disabled={loadingMore}>
                        {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}
          </ScrollArea>
        ) : (
          <div className="text-center py-16">
            <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No Ideas Found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
                {searchTerm ? "Try a different search term." : "Be the first to share a random spark of genius."}
            </p>
            {canCreateIdea && !searchTerm && (
                <SubmitIdeaDialog onIdeaCreated={onIdeaCreated} isPaymentEnabled={paymentSettings.isEnabled}>
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
