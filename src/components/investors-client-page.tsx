
"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaginatedInvestors } from "@/lib/firestore";
import type { UserProfile } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Loader2, Search, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import { Input } from "./ui/input";
import InvestorCard from "./investor-card";

interface InvestorsClientPageProps {
    initialInvestors: UserProfile[];
    initialLastVisible: DocumentSnapshot | null;
}

export default function InvestorsClientPage({ initialInvestors, initialLastVisible }: InvestorsClientPageProps) {
    const [investors, setInvestors] = useState<UserProfile[]>(initialInvestors);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<'dealsCount' | 'dealsCompletedCount' | 'upvotes' | 'name'>('name');
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(initialLastVisible);
    const [hasMore, setHasMore] = useState(true);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    const fetchInvestors = useCallback(async (reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setLastVisible(null); 
        } else {
            setLoadingMore(true);
        }

        try {
            const { users, lastVisible: newLastVisible } = await getPaginatedInvestors({
                sortBy,
                lastVisible: reset ? null : lastVisible,
            });
            setInvestors(prev => reset ? users : [...prev, ...users]);
            setLastVisible(newLastVisible);
            setHasMore(!!newLastVisible);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch investors." });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sortBy, lastVisible, toast]);

    useEffect(() => {
        setInvestors(initialInvestors);
        setLastVisible(initialLastVisible);
        setHasMore(!!initialLastVisible);
    }, [initialInvestors, initialLastVisible]);

    useEffect(() => {
        fetchInvestors(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy]);


    const filteredInvestors = investors.filter(investor =>
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.expertise.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div>
                    <CardTitle>All Investors</CardTitle>
                    <CardDescription>Browse all investors on the platform.</CardDescription>
                </div>
                 <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or expertise..." 
                            className="pl-8 w-full sm:w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Select value={sortBy} onValueChange={(value: 'dealsCount' | 'dealsCompletedCount' | 'upvotes' | 'name') => setSortBy(value)}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="dealsCompletedCount">Most Deals Completed</SelectItem>
                            <SelectItem value="dealsCount">Most Deals Started</SelectItem>
                            <SelectItem value="upvotes">Most Upvoted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <div className="flex justify-end items-center pt-2">
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredInvestors.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredInvestors.map(investor => <InvestorCard key={investor.uid} investor={investor} />)}
                        </div>
                        {hasMore && !searchTerm && (
                            <div className="mt-8 text-center">
                                <Button onClick={() => fetchInvestors(false)} disabled={loadingMore}>
                                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16">
                         <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mt-4">No Investors Found</h3>
                        <p className="text-muted-foreground mt-2 mb-6">
                            {searchTerm ? "Try a different search term." : "No investors match your criteria."}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
