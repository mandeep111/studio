import Header from "@/components/header";
import InvestorsClientPage from "@/components/investors-client-page";
import { getPaginatedInvestors } from "@/lib/firestore";

export default async function InvestorsPage() {
    const { users, lastVisible } = await getPaginatedInvestors({});

    const serializable = (data: any) => JSON.parse(JSON.stringify(data));

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40">
                 <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Investor Hub</h1>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Tired of the same recycled startup pitches? Discover a fresh pipeline of problems, solutions, and scalable businesses from creators all over the world.
                            </p>
                        </div>
                        </div>
                    </div>
                </section>
                <section className="w-full pb-12 md:pb-24 lg:pb-32">
                    <div className="container mx-auto px-4 md:px-6">
                        <InvestorsClientPage 
                            initialInvestors={serializable(users)} 
                            initialLastVisible={serializable(lastVisible)} 
                        />
                    </div>
                </section>
            </main>
        </div>
    )
}
