
import Header from "@/components/header";
import { 
    getUserProfileById,
    getProblemsByUser, 
    getSolutionsByUser, 
    getIdeasByUser, 
    getBusinessesByUser, 
    getDealsForUser 
} from "@/app/actions";
import { notFound } from "next/navigation";
import UserProfileClient from "@/components/user-profile-client";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const userProfile = await getUserProfileById(params.id);

  if (!userProfile) {
    notFound();
  }

  // These can still be fetched on the server as they depend on the visited user's ID
  const [problems, solutions, ideas, businesses, deals] = await Promise.all([
    getProblemsByUser(params.id),
    getSolutionsByUser(params.id),
    getIdeasByUser(params.id),
    getBusinessesByUser(params.id),
    getDealsForUser(params.id),
  ]);

  const serializable = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <UserProfileClient 
                userProfile={serializable(userProfile)}
                initialProblems={serializable(problems)}
                initialSolutions={serializable(solutions)}
                initialIdeas={serializable(ideas)}
                initialBusinesses={serializable(businesses)}
                initialDeals={serializable(deals)}
            />
        </div>
      </main>
    </div>
  );
}
