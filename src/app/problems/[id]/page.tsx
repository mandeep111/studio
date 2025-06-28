import { getProblem, getSolutionsForProblem, getActiveAdForPlacement, getPaymentSettings } from "@/lib/firestore";
import Header from "@/components/header";
import { notFound } from "next/navigation";
import ProblemClientPage from "@/components/problem-client-page";

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const [problem, solutions, ad, paymentSettings] = await Promise.all([
    getProblem(params.id),
    getSolutionsForProblem(params.id),
    getActiveAdForPlacement('problem-detail'),
    getPaymentSettings()
  ]);

  if (!problem) {
    notFound();
  }

  const serializable = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <ProblemClientPage 
              initialProblem={serializable(problem)} 
              initialSolutions={serializable(solutions)} 
              ad={serializable(ad)}
              isPaymentEnabled={paymentSettings.isEnabled}
            />
        </div>
      </main>
    </div>
  );
}
