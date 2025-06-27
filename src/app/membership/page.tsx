import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function MembershipPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/40">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Membership</div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Become a TriSolve Investor</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Unlock powerful tools to find and fund the next big thing. Our membership gives you exclusive access to AI-powered matchmaking and direct lines to innovators.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="mx-auto w-full max-w-sm space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Investor Tier</CardTitle>
                  <CardDescription>All the tools you need to connect and invest.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold">$29<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                  <ul className="grid gap-2 text-left text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      AI-Powered Matchmaking
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Start Deals & Group Chats
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Direct Contact with Creators
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Priority Support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" asChild>
                        {/* In a real app, this would link to a checkout page */}
                        <Link href="/">Get Started</Link>
                    </Button>
                </CardFooter>
              </Card>
               <p className="text-xs text-muted-foreground">
                Payments are not yet implemented. Clicking "Get Started" will take you to the homepage. Your role will be updated to Investor when you use the AI Matchmaking tool.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
