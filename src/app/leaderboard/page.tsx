import Header from "@/components/header";
import LeaderboardClient from "@/components/leaderboard-client";
import { getPaginatedLeaderboardData } from "@/lib/firestore";

export default async function LeaderboardPage() {
    const { users, lastVisible } = await getPaginatedLeaderboardData({});

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40">
                 <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Leaderboard</h1>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                See who is making the biggest impact on the Problem2Profit platform. Points are awarded for creating popular problems and receiving upvotes.
                            </p>
                        </div>
                        </div>
                    </div>
                </section>
                <section className="w-full pb-12 md:pb-24 lg:pb-32">
                    <div className="container mx-auto px-4 md:px-6">
                        <LeaderboardClient initialUsers={JSON.parse(JSON.stringify(users))} initialLastVisible={JSON.parse(JSON.stringify(lastVisible))} />
                    </div>
                </section>
            </main>
        </div>
    )
}
