
"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getDealsForUser } from '@/lib/firestore';
import type { Deal } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface DealsListPanelProps {
    activeDealId: string;
}

const DealItem = ({ deal, isActive }: { deal: Deal, isActive: boolean }) => {
    return (
        <Link href={`/deals/${deal.id}`} className={cn(
            "flex items-center gap-3 rounded-md p-2 transition-colors",
            isActive ? 'bg-primary/10' : 'hover:bg-accent'
        )}>
            <Avatar className="h-10 w-10">
                <AvatarImage src={deal.investor.avatarUrl} />
                <AvatarFallback>{deal.investor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
                <p className="font-medium truncate text-sm">{deal.title}</p>
                <p className="text-xs text-muted-foreground">
                    With {deal.primaryCreator.name}
                    {deal.solutionCreator && ` & ${deal.solutionCreator.name}`}
                </p>
            </div>
        </Link>
    )
}

const LoadingSkeleton = () => (
    <aside className="w-80 border-r bg-muted/40 p-2 hidden md:flex flex-col">
        <div className="p-2 space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
    </aside>
);

export default function DealsListPanel({ activeDealId }: DealsListPanelProps) {
    const { user } = useAuth();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const dealsQuery = query(collection(db, "deals"), where("participantIds", "array-contains", user.uid));
            const unsubscribe = onSnapshot(dealsQuery, (snapshot) => {
                const userDeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal))
                    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
                setDeals(userDeals);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setDeals([]);
            setLoading(false);
        }
    }, [user]);

    const activeDeals = useMemo(() => deals.filter(d => d.status === 'active'), [deals]);
    const archivedDeals = useMemo(() => deals.filter(d => d.status !== 'active'), [deals]);

    if (loading) {
        return <LoadingSkeleton />;
    }
    
    return (
        <aside className="w-80 border-r bg-muted/40 hidden md:flex flex-col">
            <ScrollArea className="flex-1 p-2">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="space-y-2 pt-2">
                        {activeDeals.length > 0 
                            ? activeDeals.map(deal => <DealItem key={deal.id} deal={deal} isActive={deal.id === activeDealId} />) 
                            : <p className="p-4 text-center text-sm text-muted-foreground">No active deals.</p>
                        }
                    </TabsContent>
                    <TabsContent value="archived" className="space-y-2 pt-2">
                         {archivedDeals.length > 0 
                            ? archivedDeals.map(deal => <DealItem key={deal.id} deal={deal} isActive={deal.id === activeDealId} />) 
                            : <p className="p-4 text-center text-sm text-muted-foreground">No archived deals.</p>
                        }
                    </TabsContent>
                </Tabs>
            </ScrollArea>
        </aside>
    );
}
