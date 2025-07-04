import { getIdeaForServer, getPaymentSettingsForServer } from "@/app/actions";
import Header from "@/components/header";
import { notFound } from "next/navigation";
import IdeaClientPage from "@/components/idea-client-page";

export default async function IdeaPage({ params }: { params: { id: string } }) {
  const [idea, paymentSettings] = await Promise.all([
    getIdeaForServer(params.id),
    getPaymentSettingsForServer()
  ]);

  if (!idea) {
    notFound();
  }
  
  const serializable = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <IdeaClientPage 
              initialIdea={serializable(idea)} 
              isPaymentEnabled={paymentSettings.isEnabled}
            />
        </div>
      </main>
    </div>
  );
}
