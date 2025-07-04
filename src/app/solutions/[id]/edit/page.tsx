
import { getSolution } from "@/lib/firestore";
import Header from "@/components/header";
import EditSolutionForm from "@/components/edit-solution-form";

export default async function EditSolutionPage({ params }: { params: { id: string } }) {
    // getSolution will throw an error if not found, which is caught by the global error boundary.
    const solution = await getSolution(params.id);

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40 p-4 md:p-8">
                <div className="container mx-auto max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Solution</h1>
                    <EditSolutionForm solution={JSON.parse(JSON.stringify(solution))} />
                </div>
            </main>
        </div>
    );
}
