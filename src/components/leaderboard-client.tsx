
"use client";

import { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Gem, Trophy, Loader2, Search } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import type { DocumentSnapshot } from "firebase/firestore";
import { getPaginatedLeaderboardData } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Skeleton } from "./ui/skeleton";

interface LeaderboardClientProps {
    initialUsers: UserProfile[];
    initialLastVisible: DocumentSnapshot | null;
}

export default function LeaderboardClient({ initialUsers, initialLastVisible }: LeaderboardClientProps) {
    const [users, setUsers] = useState(initialUsers);
    const [lastVisible, setLastVisible] = useState(initialLastVisible);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(!!initialLastVisible);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<'points' | 'name'>('points');

    const fetchUsers = useCallback(async (reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setLastVisible(null);
        } else {
            setLoadingMore(true);
        }
        try {
            const { users: newUsers, lastVisible: newLastVisible } = await getPaginatedLeaderboardData({
                sortBy,
                lastVisible: reset ? null : lastVisible,
            });
            setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
            setLastVisible(JSON.parse(JSON.stringify(newLastVisible)));
            setHasMore(!!newLastVisible);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch users." });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sortBy, lastVisible, toast]);

    useEffect(() => {
        fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.expertise.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const LeaderboardRow = ({ user, index }: { user: UserProfile, index: number }) => (
        <div key={user.uid} className="flex items-center gap-4 rounded-md border p-4">
            <div className="flex items-center justify-center font-bold text-lg w-10">
                {index < 3 ? (
                    <Trophy className={
                        index === 0 ? "text-yellow-500 h-6 w-6" :
                        index === 1 ? "text-gray-400 h-6 w-6" :
                        "text-amber-700 h-6 w-6"
                    }/>
                ) : (
                    <span className="text-muted-foreground">{index + 1}</span>
                )}
            </div>
             <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.expertise}</p>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold">
                <Gem className="h-5 w-5 text-yellow-500" />
                {user.points.toLocaleString()}
            </div>
        </div>
    );
    
    const SkeletonRow = () => (
         <div className="flex items-center gap-4 rounded-md border p-4">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16" />
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Top Innovators</CardTitle>
                    <CardDescription>Users ranked by their total points.</CardDescription>
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
                     <Select value={sortBy} onValueChange={(value: 'points' | 'name') => setSortBy(value)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="points">Top Points</SelectItem>
                            <SelectItem value="name">Name (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {filteredUsers.map((user, index) => (
                                <LeaderboardRow key={user.uid} user={user} index={index} />
                            ))}
                        </div>
                        {hasMore && !searchTerm && (
                            <div className="mt-8 text-center">
                                <Button onClick={() => fetchUsers(false)} disabled={loadingMore}>
                                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
