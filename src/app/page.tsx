
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/header";
import MainTabs from "@/components/main-tabs";
import LandingHero from "@/components/landing-hero";

export default function Home() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    // AuthProvider shows a skeleton, so we can return null or a minimal loader here
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <LandingHero />
        <div id="main-content" className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
          <MainTabs userProfile={userProfile} />
        </div>
      </main>
    </div>
  );
}
