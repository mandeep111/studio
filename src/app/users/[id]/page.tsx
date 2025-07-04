import Header from "@/components/header";
import { 
    getUserProfileForServer, 
    getProblemsByUserForServer,
    getSolutionsByUserForServer,
    getIdeasByUserForServer,
    getBusinessesByUserForServer,
    getDealsForUserForServer,
} from "@/app/actions";
import { notFound } from "next/navigation";
import UserProfileClient from "@/components/user-profile-client";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const userProfile = await getUserProfileForServer(params.id);

  if (!userProfile) {
    notFound();
  }

  const [problems, solutions, ideas, businesses, deals] = await Promise.all([
    getProblemsByUserForServer(params.id),
    getSolutionsByUserForServer(params.id),
    getIdeasByUserForServer(params.id),
    getBusinessesByUserForServer(params.id),
    getDealsForUserForServer(params.id),
  ]);

  const serializable = (data: any) => JSON.parse(JSON.stringify(data));

  // The upvotedItems can only be fetched for the currently logged-in user,
  // so we pass an empty array here and let the client component fetch it if needed.
  const initialUpvotedItems: any[] = [];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <UserProfileClient 
                userProfile={userProfile}
                initialProblems={serializable(problems)}
                initialSolutions={serializable(solutions)}
                initialIdeas={serializable(ideas)}
                initialBusinesses={serializable(businesses)}
                initialUpvotedItems={serializable(initialUpvotedItems)}
                initialDeals={serializable(deals)}
            />
        </div>
      </main>
    </div>
  );
}
