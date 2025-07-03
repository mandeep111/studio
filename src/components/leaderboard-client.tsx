"use client";

import { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Gem, Trophy, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import type { DocumentSnapshot } from "firebase/firestore";
import { getPaginatedLeaderboardData } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardClientProps {
    initialUsers: UserProfile[];
    initialLastVisible: DocumentSnapshot | null;
}

export default function LeaderboardClient({ initialUsers, initialLastVisible }: LeaderboardClientProps) {
    const [users, setUsers] = useState(initialUsers);
    const [lastVisible, setLastVisible] = useState(initialLastVisible);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(!!initialLastVisible);
    const { toast } = useToast();

    const fetchMoreUsers = useCallback(async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const { users: newUsers, lastVisible: newLastVisible } = await getPaginatedLeaderboardData({ lastVisible });
            setUsers(prev => [...prev, ...JSON.parse(JSON.stringify(newUsers))]);
            setLastVisible(JSON.parse(JSON.stringify(newLastVisible)));
            setHasMore(!!newLastVisible);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch more users." });
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastVisible, toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Innovators</CardTitle>
                <CardDescription>Users ranked by their total points.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {users.map((user, index) => (
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
                    ))}
                </div>
                {hasMore && (
                    <div className="mt-8 text-center">
                        <Button onClick={fetchMoreUsers} disabled={loadingMore}>
                            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Load More
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
