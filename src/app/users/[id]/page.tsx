import Header from "@/components/header";
import { getProblemsByUser, getSolutionsByUser, getUserProfile } from "@/lib/firestore";
import { notFound } from "next/navigation";
import UserProfileClient from "@/components/user-profile-client";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const userProfile = await getUserProfile(params.id);

  if (!userProfile) {
    notFound();
  }

  const [problems, solutions] = await Promise.all([
    getProblemsByUser(params.id),
    getSolutionsByUser(params.id),
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
            />
        </div>
      </main>
    </div>
  );
}
