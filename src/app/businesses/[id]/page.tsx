
import { getPaymentSettings } from "@/lib/firestore";
import Header from "@/components/header";
import BusinessClientPage from "@/components/business-client-page";
import { getBusinessById } from "@/app/actions";

export default async function BusinessPage({ params }: { params: { id: string } }) {
  const [business, paymentSettings] = await Promise.all([
    getBusinessById(params.id),
    getPaymentSettings()
  ]);

  if (!business) {
    throw new Error("Could not find the requested business. It may have been deleted.");
  }
  
  const serializable = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <BusinessClientPage 
              initialBusiness={serializable(business)} 
              isPaymentEnabled={paymentSettings.isEnabled}
            />
        </div>
      </main>
    </div>
  );
}
