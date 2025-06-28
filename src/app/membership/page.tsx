
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Users, BrainCircuit, Loader2 } from 'lucide-react';
import { getPaymentSettings } from '@/lib/firestore';
import MembershipClientCard from '@/components/membership-client-card';

export default async function MembershipPage() {
  
  const { isEnabled: isPaymentEnabled } = await getPaymentSettings();
  
  const investorFeatures = [
    "All Creator features included",
    "AI-Powered Matchmaking tool",
    "Start Deals with creators",
    "Direct messaging with creators",
    "View premium attachments",
    "Priority support"
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/40">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Membership</div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Become an Investor</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Unlock the full potential of Problem2Profit with our lifetime Investor membership. Get exclusive access to AI-powered tools, direct messaging, and premium content to find and fund the next big thing.
                  { !isPaymentEnabled && <span className="block mt-2 font-semibold text-primary">Payments are currently disabled. All upgrades are free!</span> }
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full pb-12 md:pb-24 lg:pb-32">
          <div className="container flex justify-center px-4 md:px-6">
            
            <MembershipClientCard
              title="Investor"
              description="For the visionaries who fund the future."
              icon={<Star className="h-8 w-8 text-yellow-500" />}
              features={investorFeatures}
              lifetimePrice={50}
              isPaymentEnabled={isPaymentEnabled}
            />

          </div>
          <div className="container text-center mt-12">
            <h3 className="text-lg font-semibold mb-2">Free Tier</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All users can join for free to browse content, submit problems, solutions, and ideas, upvote, and build reputation.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
