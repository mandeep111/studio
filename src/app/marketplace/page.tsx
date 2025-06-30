"use client";

import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import MainTabs from "@/components/main-tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketplacePage() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
       <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-muted/40">
           <section className="w-full py-12 md:py-24">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-96" />
                        <Skeleton className="h-8 w-[600px]" />
                    </div>
                </div>
            </div>
            </section>
            <section className="w-full pb-12 md:pb-24 lg:pb-32">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <Skeleton className="h-[600px] w-full" />
                </div>
            </section>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/40">
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">The Marketplace</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Explore problems that need solving, discover innovative solutions, find running businesses, and engage with the community.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full pb-12 md:pb-24 lg:pb-32">
          <div id="main-content" className="container mx-auto px-4 md:px-6 lg:px-8">
            <MainTabs userProfile={userProfile} />
          </div>
        </section>
      </main>
    </div>
  );
}
