import Header from "@/components/header";
import NotificationsClient from "@/components/notifications-client";
import { auth } from "@/lib/firebase/config";
import { getNotifications } from "@/lib/firestore";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
    const user = auth.currentUser;
    if (!user) {
        redirect('/login');
    }

    const notifications = await getNotifications(user.uid);
    const serializableNotifications = JSON.parse(JSON.stringify(notifications));

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
                       <NotificationsClient initialNotifications={serializableNotifications} />
                    </div>
                </section>
            </main>
        </div>
    );
}
