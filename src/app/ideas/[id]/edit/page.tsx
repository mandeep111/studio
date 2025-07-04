
import { getIdea } from "@/lib/firestore";
import Header from "@/components/header";
import EditIdeaForm from "@/components/edit-idea-form";

export default async function EditIdeaPage({ params }: { params: { id: string } }) {
    const idea = await getIdea(params.id);
    if (!idea) {
        throw new Error("Could not find the requested idea to edit.");
    }
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40 p-4 md:p-8">
                <div className="container mx-auto max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Idea</h1>
                    <EditIdeaForm idea={JSON.parse(JSON.stringify(idea))} />
                </div>
            </main>
        </div>
    );
}
