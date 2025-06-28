
"use client";

import Header from "@/components/header";
import NotificationsClient from "@/components/notifications-client";
import { useAuth } from "@/hooks/use-auth";
import { markNotificationsAsRead, getNotifications } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Notification } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            const fetchAndMark = async () => {
                setPageLoading(true);
                const userNotifications = await getNotifications(user.uid);
                // The notifications need to be serialized for the client component
                setNotifications(JSON.parse(JSON.stringify(userNotifications)));
                await markNotificationsAsRead(user.uid);
                setPageLoading(false);
            };
            fetchAndMark();
        }
    }, [user]);

    if (loading || pageLoading || !user) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <Header />
                <main className="flex-1 bg-muted/40 p-4 md:p-8">
                     <div className="container px-4 md:px-6">
                        <Skeleton className="h-12 w-1/2 mb-4" />
                        <Skeleton className="h-8 w-3/4 mb-8" />
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full rounded-lg" />
                            <Skeleton className="h-20 w-full rounded-lg" />
                            <Skeleton className="h-20 w-full rounded-lg" />
                        </div>
                     </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40">
                 <section className="w-full py-12 md:py-24">
                    <div className="container px-4 md:px-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Your Notifications</h1>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                                Stay updated with the latest activity related to your contributions.
                            </p>
                        </div>
                    </div>
                </section>
                <section className="w-full pb-12 md:pb-24">
                    <div className="container mx-auto px-4 md:px-6">
                       <NotificationsClient initialNotifications={notifications} />
                    </div>
                </section>
            </main>
        </div>
    );
}
