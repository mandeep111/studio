
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MessageSquare, MessagesSquare, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getDealsForUser } from "@/lib/firestore";
import type { Deal } from "@/lib/types";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

export default function DealsWidget() {
    const { user, userProfile } = useAuth();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const fetchDeals = async () => {
                const userDeals = await getDealsForUser(user.uid);
                setDeals(userDeals);
                setLoading(false);
            };
            fetchDeals();
        } else {
            setDeals([]);
            setLoading(false);
        }
    }, [user]);

    const unreadCount = useMemo(() => {
        if (!userProfile?.unreadDealMessages) return 0;
        return Object.values(userProfile.unreadDealMessages).reduce((sum, count) => sum + count, 0);
    }, [userProfile]);

    if (loading || deals.length === 0) {
        return null;
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center"
                >
                    <MessagesSquare className="h-8 w-8" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 mr-4 mb-2" side="top" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Your Deals</h4>
                        <p className="text-sm text-muted-foreground">
                            Active conversations you're a part of.
                        </p>
                    </div>
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {deals.map((deal) => (
                            <Link href={`/deals/${deal.id}`} key={deal.id} className="block group" onClick={() => setIsOpen(false)}>
                                <div className="relative flex items-center gap-3 rounded-md p-2 hover:bg-muted transition-colors">
                                    <Avatar>
                                        <AvatarImage src={deal.investor.avatarUrl} />
                                        <AvatarFallback>{deal.investor.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 truncate">
                                        <p className="text-sm font-medium truncate group-hover:underline">{deal.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            With {deal.primaryCreator.name}
                                            {deal.solutionCreator && ` & ${deal.solutionCreator.name}`}
                                        </p>
                                    </div>
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                     {(userProfile?.unreadDealMessages?.[deal.id] ?? 0) > 0 && (
                                        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
