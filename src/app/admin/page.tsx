import Header from "@/components/header";
import AdminClient from "@/components/admin-client";
import { getUnapprovedItems, getAllUsers, getProblems, getSolutions, getIdeas } from "@/lib/firestore";

// This page should be server-side rendered to protect it.
export default async function AdminPage() {
    
    const [unapprovedItems, users, problems, solutions, ideas] = await Promise.all([
        getUnapprovedItems(),
        getAllUsers(),
        getProblems(),
        getSolutions(),
        getIdeas(),
    ]);

    const serializable = (data: any) => JSON.parse(JSON.stringify(data));

    return (
         <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40">
                 <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Admin Dashboard</h1>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Manage the platform, approve high-value items, and oversee deals.
                            </p>
                        </div>
                        </div>
                    </div>
                </section>
                <section className="w-full pb-12 md:pb-24 lg:pb-32">
                    <div className="container mx-auto px-4 md:px-6">
                        <AdminClient 
                            initialItems={serializable(unapprovedItems)}
                            initialUsers={serializable(users)}
                            initialProblems={serializable(problems)}
                            initialSolutions={serializable(solutions)}
                            initialIdeas={serializable(ideas)}
                        />
                    </div>
                </section>
            </main>
        </div>
    )
}
