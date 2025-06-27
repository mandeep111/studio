"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Problem, Solution } from "@/lib/types";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { approveItemAction } from "@/app/actions";
import Link from "next/link";
import { Badge } from "./ui/badge";

type UnapprovedItem = (Problem & { type: 'problem' }) | (Solution & { type: 'solution' });

interface AdminClientProps {
    initialItems: UnapprovedItem[];
}

export default function AdminClient({ initialItems }: AdminClientProps) {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!loading && userProfile?.role !== 'Admin') {
            toast({ variant: "destructive", title: "Unauthorized", description: "You do not have access to this page." });
            router.push('/');
        }
    }, [userProfile, loading, router, toast]);

    const handleApprove = async (type: 'problem' | 'solution', id: string) => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('id', id);

        const result = await approveItemAction(formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    };

    if (loading || userProfile?.role !== 'Admin') {
        return <p>Loading or redirecting...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Items Awaiting Approval</CardTitle>
                <CardDescription>Problems and solutions with a price over $1,000 need your approval before they are displayed with a price.</CardDescription>
            </CardHeader>
            <CardContent>
                {initialItems.length === 0 ? (
                    <p className="text-muted-foreground">No items are currently awaiting approval.</p>
                ) : (
                    <div className="space-y-4">
                        {initialItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border p-4">
                                <div>
                                    <Badge variant="secondary" className="capitalize mb-2">{item.type}</Badge>
                                    <p className="font-semibold">
                                        <Link href={`/${item.type}s/${item.id}`} className="hover:underline">
                                            { 'title' in item ? item.title : `Solution for: ${item.problemTitle}` }
                                        </Link>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Submitted by {item.creator.name} for ${item.price?.toLocaleString()}
                                    </p>
                                </div>
                                <Button onClick={() => handleApprove(item.type, item.id)}>Approve</Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
