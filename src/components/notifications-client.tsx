"use client";

import type { Notification } from "@/lib/types";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

interface NotificationsClientProps {
    initialNotifications: Notification[];
}

export default function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const { userProfile } = useAuth();
    const [notifications, setNotifications] = useState(initialNotifications);

    useEffect(() => {
        if (!userProfile) return;

        const q = query(
            collection(db, "notifications"), 
            where("userId", "in", [userProfile.uid, "admins"]), 
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(newNotifications);
        });

        return () => unsubscribe();
    }, [userProfile]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(notif => (
                            <Link href={notif.link} key={notif.id} className="block">
                                <div className={cn(
                                    "p-4 rounded-lg border transition-colors hover:bg-accent",
                                    notif.read ? "bg-transparent" : "bg-primary/10"
                                )}>
                                    <p>{notif.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate()) : ''} ago
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
