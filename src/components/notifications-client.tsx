
"use client";

import type { Notification } from "@/lib/types";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy, limit, type QuerySnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { getDateFromTimestamp } from "@/lib/utils";

interface NotificationsClientProps {
    initialNotifications: Notification[];
}

export default function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const { userProfile } = useAuth();
    const [notifications, setNotifications] = useState(initialNotifications);

    useEffect(() => {
        if (!userProfile) return;

        const notificationMap = new Map<string, Notification>();

        const updateState = () => {
            const sorted = Array.from(notificationMap.values()).sort(
                (a, b) => getDateFromTimestamp(b.createdAt).getTime() - getDateFromTimestamp(a.createdAt).getTime()
            );
            setNotifications(sorted);
        };
        
        const handleError = (error: Error) => {
             console.error("Firestore snapshot error in notifications:", error);
        };

        const unsubscribes: (() => void)[] = [];

        // Listener for personal notifications
        const personalQuery = query(collection(db, "notifications"), where("userId", "==", userProfile.uid), orderBy("createdAt", "desc"), limit(50));
        const unsubPersonal = onSnapshot(personalQuery, (snapshot) => {
            snapshot.docs.forEach(doc => {
                notificationMap.set(doc.id, { id: doc.id, ...doc.data() } as Notification);
            });
            updateState();
        }, handleError);
        unsubscribes.push(unsubPersonal);

        // Additional listener for admins
        if (userProfile.role === 'Admin') {
            const adminQuery = query(collection(db, "notifications"), where("userId", "==", "admins"), orderBy("createdAt", "desc"), limit(50));
            const unsubAdmin = onSnapshot(adminQuery, (snapshot) => {
                snapshot.docs.forEach(doc => {
                    notificationMap.set(doc.id, { id: doc.id, ...doc.data() } as Notification);
                });
                updateState();
            }, handleError);
            unsubscribes.push(unsubAdmin);
        }

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
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
                                        {notif.createdAt ? formatDistanceToNow(getDateFromTimestamp(notif.createdAt)) : ''} ago
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
