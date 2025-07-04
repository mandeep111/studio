
import { getBusiness } from "@/lib/firestore";
import Header from "@/components/header";
import EditBusinessForm from "@/components/edit-business-form";

export default async function EditBusinessPage({ params }: { params: { id: string } }) {
    // getBusiness will throw an error if not found, which is caught by the global error boundary.
    const business = await getBusiness(params.id);
    
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40 p-4 md:p-8">
                <div className="container mx-auto max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Business</h1>
                    <EditBusinessForm business={JSON.parse(JSON.stringify(business))} />
                </div>
            </main>
        </div>
    );
}
