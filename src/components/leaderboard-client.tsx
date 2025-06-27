"use client";

import { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Gem, Trophy } from "lucide-react";

interface LeaderboardClientProps {
    initialData: UserProfile[];
}

export default function LeaderboardClient({ initialData }: LeaderboardClientProps) {
    // In a real app, you might fetch live data here, but for now we use initial server-fetched data.
    const users = initialData;

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
                            <div className="flex items-center gap-2 font-bold text-lg w-10">
                                {index < 3 ? (
                                    <Trophy className={
                                        index === 0 ? "text-yellow-500" :
                                        index === 1 ? "text-gray-400" :
                                        "text-amber-700"
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
            </CardContent>
        </Card>
    );
}
