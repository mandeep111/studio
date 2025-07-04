
import { getProblem } from "@/lib/firestore";
import Header from "@/components/header";
import EditProblemForm from "@/components/edit-problem-form";

export default async function EditProblemPage({ params }: { params: { id: string } }) {
    const problem = await getProblem(params.id);
    if (!problem) {
        throw new Error("Could not find the requested problem to edit.");
    }
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40 p-4 md:p-8">
                <div className="container mx-auto max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Problem</h1>
                    <EditProblemForm problem={JSON.parse(JSON.stringify(problem))} />
                </div>
            </main>
        </div>
    );
}
