
import { getPaymentSettings } from "@/lib/firestore";
import Header from "@/components/header";
import ProblemClientPage from "@/components/problem-client-page";
import AdDisplay from "@/components/ad-display";
import { getProblemById, getSolutionsForProblem as getSolutionsForProblemServer } from "@/app/actions";

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const [problem, solutions, paymentSettings] = await Promise.all([
    getProblemById(params.id),
    getSolutionsForProblemServer(params.id),
    getPaymentSettings()
  ]);

  const serializable = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <ProblemClientPage 
              initialProblem={serializable(problem)} 
              initialSolutions={serializable(solutions)} 
              isPaymentEnabled={paymentSettings.isEnabled}
            />
        </div>
      </main>
    </div>
  );
}
