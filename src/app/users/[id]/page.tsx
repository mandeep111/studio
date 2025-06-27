import Header from "@/components/header";
import { getProblemsByUser, getSolutionsByUser, getUserProfile, getIdeasByUser, getUpvotedItems } from "@/lib/firestore";
import { notFound } from "next/navigation";
import UserProfileClient from "@/components/user-profile-client";
import { auth } from "@/lib/firebase/config";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const userProfile = await getUserProfile(params.id);
  const currentUser = auth.currentUser;

  if (!userProfile) {
    notFound();
  }

  const [problems, solutions, ideas, upvotedItems] = await Promise.all([
    getProblemsByUser(params.id),
    getSolutionsByUser(params.id),
    getIdeasByUser(params.id),
    // Only fetch upvoted items if the logged-in user is viewing their own profile
    currentUser?.uid === params.id ? getUpvotedItems(params.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <UserProfileClient 
                userProfile={userProfile}
                initialProblems={problems}
                initialSolutions={solutions}
                initialIdeas={ideas}
                initialUpvotedItems={upvotedItems}
            />
        </div>
      </main>
    </div>
  );
}
