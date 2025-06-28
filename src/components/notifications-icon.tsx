
"use client";

import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsIcon({ userId }: { userId: string }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });
        return () => unsubscribe();
    }, [userId]);

    return (
        <Button variant="ghost" size="icon" onClick={() => router.push('/notifications')} className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                    {unreadCount}
                </span>
            )}
        </Button>
    )
}
