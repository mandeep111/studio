
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedBusinesses, upvoteBusiness, getActiveAdForPlacement } from "@/lib/firestore";
import type { Business, Ad } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubmitBusinessDialog } from "./submit-business-dialog";
import { Button } from "./ui/button";
import { Briefcase, Loader2, PlusCircle, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import BusinessCard from "./business-card";
import { Input } from "./ui/input";
import AdCard from "./ad-card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export default function BusinessList() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
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
        getActiveAdForPlacement('business-list').then(setAd);
    }, []);

    const fetchBusinesses = useCallback(async (reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setLastVisible(null); 
        } else {
            setLoadingMore(true);
        }

        try {
            const { data, lastVisible: newLastVisible } = await getPaginatedBusinesses({
                sortBy,
                lastVisible: reset ? null : lastVisible,
            });
            setBusinesses(prev => reset ? data : [...prev, ...data]);
            setLastVisible(newLastVisible);
            setHasMore(!!newLastVisible);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch businesses." });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sortBy, lastVisible, toast]);

    useEffect(() => {
        fetchBusinesses(true);
    }, [sortBy]);

    const handleUpvote = async (businessId: string) => {
        if (!user || upvotingId) return;
        
        setUpvotingId(businessId);

        setBusinesses(prevBusinesses =>
            prevBusinesses.map(b => {
                if (b.id === businessId) {
                    if (b.creator.userId === user.uid) return b;
                    const isAlreadyUpvoted = b.upvotedBy.includes(user.uid);
                    return {
                        ...b,
                        upvotes: isAlreadyUpvoted ? b.upvotes - 1 : b.upvotes + 1,
                        upvotedBy: isAlreadyUpvoted
                            ? b.upvotedBy.filter(uid => uid !== user.uid)
                            : [...b.upvotedBy, user.uid],
                    };
                }
                return b;
            })
        );
        
        try {
            await upvoteBusiness(businessId, user.uid);
        } catch (e: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: e.message || "Could not record upvote. Reverting.",
            });
            fetchBusinesses(true);
        } finally {
            setUpvotingId(null);
        }
    };
    
    const canCreateBusiness = !!userProfile;

    const filteredBusinesses = useMemo(() => {
        return businesses.filter(business => {
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return business.title.toLowerCase().includes(searchLower) ||
                       business.description.toLowerCase().includes(searchLower) ||
                       business.tags.some(tag => tag.toLowerCase().includes(searchLower));
            }
            return true;
        });
    }, [businesses, searchTerm]);

    const businessCards = filteredBusinesses.map((business) => (
        <BusinessCard key={business.id} business={business} onUpvote={handleUpvote} isUpvoting={upvotingId === business.id} />
    ));

    if (ad && !userProfile?.isPremium && businessCards.length > 2) {
        businessCards.splice(3, 0, <AdCard key="ad-card" ad={ad} />);
    }

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div>
                    <CardTitle>Running Businesses</CardTitle>
                    <CardDescription>Browse established businesses seeking investment.</CardDescription>
                </div>
                 <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search businesses..." 
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
                    {canCreateBusiness && <SubmitBusinessDialog onBusinessCreated={() => fetchBusinesses(true)} />}
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
                ) : filteredBusinesses.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {businessCards}
                        </div>
                        {hasMore && !searchTerm && (
                            <div className="mt-8 text-center">
                                <Button onClick={() => fetchBusinesses(false)} disabled={loadingMore}>
                                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16">
                         <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mt-4">No Businesses Found</h3>
                        <p className="text-muted-foreground mt-2 mb-6">
                            {searchTerm ? "Try a different search term." : "Be the first to list your business and attract investors."}
                        </p>
                        {canCreateBusiness && !searchTerm && (
                            <SubmitBusinessDialog onBusinessCreated={() => fetchBusinesses(true)}>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    List Your Business
                                </Button>
                            </SubmitBusinessDialog>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
