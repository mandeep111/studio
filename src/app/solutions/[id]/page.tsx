
import Header from "@/components/header";
import { getSolution } from "@/lib/firestore";
import SolutionClientPage from "@/components/solution-client-page";

export default async function SolutionPage({ params }: { params: { id: string } }) {
  // getSolution will throw an error if the solution is not found,
  // which will be caught by the global error boundary.
  const solution = await getSolution(params.id);

  const serializableSolution = JSON.parse(JSON.stringify(solution));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <SolutionClientPage initialSolution={serializableSolution} />
        </div>
      </main>
    </div>
  );
}
