
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Users, BrainCircuit } from 'lucide-react';
import MembershipCard from '@/components/membership-card';
import { getPaymentSettings } from '@/lib/firestore';

export default async function MembershipPage() {
  
  const { isEnabled: isPaymentEnabled } = await getPaymentSettings();

  const creatorFeatures = [
    "Submit unlimited problems & ideas",
    "Submit unlimited solutions",
    "Submit your business for funding",
    "Set a price for your submissions",
    "Earn points & build reputation"
  ];
  
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
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Choose Your Path</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Whether you're an innovator with the next big idea or an investor looking to fund it, VentureForge has a plan for you.
                  { !isPaymentEnabled && <span className="block mt-2 font-semibold text-primary">Payments are currently disabled. All upgrades are free!</span> }
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full pb-12 md:pb-24 lg:pb-32">
          <div className="container grid items-start justify-center gap-8 px-4 md:grid-cols-2 md:px-6 lg:gap-12">
            
            <MembershipCard
              title="Creator"
              description="For the innovators, thinkers, and builders."
              icon={<BrainCircuit className="h-8 w-8 text-primary" />}
              features={creatorFeatures}
              monthlyPrice={5}
              lifetimePrice={50}
              planType="creator"
              isPaymentEnabled={isPaymentEnabled}
            />
            
            <MembershipCard
              title="Investor"
              description="For the visionaries who fund the future."
              icon={<Star className="h-8 w-8 text-yellow-500" />}
              features={investorFeatures}
              monthlyPrice={10}
              lifetimePrice={100}
              planType="investor"
              isPopular
              isPaymentEnabled={isPaymentEnabled}
            />

          </div>
          <div className="container text-center mt-12">
            <h3 className="text-lg font-semibold mb-2">Free Tier</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All users can join for free to browse content, upvote, and build reputation. 
              You can unlock the ability to set prices for your submissions by upgrading to a Creator plan or by earning 10,000 points.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
