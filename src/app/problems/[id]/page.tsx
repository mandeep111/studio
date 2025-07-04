import { getProblem, getSolutionsForProblem, getPaymentSettings, getUserProfile } from "@/lib/firestore";
import Header from "@/components/header";
import { notFound } from "next/navigation";
import ProblemClientPage from "@/components/problem-client-page";
import AdDisplay from "@/components/ad-display";
import { auth } from "@/lib/firebase/config";

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const [problem, solutions, paymentSettings] = await Promise.all([
    getProblem(params.id),
    getSolutionsForProblem(params.id),
    getPaymentSettings()
  ]);

  if (!problem) {
    notFound();
  }

  // We need to know if the current user is premium to decide whether to show an ad.
  // This avoids showing ads to paying members.
  const currentUser = auth.currentUser;
  const userProfile = currentUser ? await getUserProfile(currentUser.uid) : null;
  const isPremiumUser = userProfile?.isPremium;
  
  // Ad should only show if the user is not premium AND the content is substantial.
  const hasSufficientContent = problem.description.length > 300 || solutions.length > 0;
  const showAd = !isPremiumUser && hasSufficientContent;

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
            {showAd && <AdDisplay />}
        </div>
      </main>
    </div>
  );
}
