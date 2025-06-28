import { BrainCircuit, Lightbulb, Sparkles, Users, Briefcase } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

const features = [
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: "Problem & Solution Marketplace",
    description: "Submit real-world problems and propose innovative solutions, creating a public library of challenges and innovations.",
  },
  {
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    title: "Running Businesses",
    description: "List your established business to find strategic investors and secure funding for your next stage of growth.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Investor Hub",
    description: "Investors gain access to a curated list of problems, solutions, and running businesses, with tools to identify promising new ventures.",
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "AI-Powered Matchmaking",
    description: "Leverage our AI tool to discover high-potential pairings between problem creators and solution builders.",
  },
];

export default function LandingHero() {
  return (
    <div className="w-full bg-muted/40">
      <div className="container px-4 md:px-6">
        <section className="py-12 md:py-24 lg:py-32">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Where Great Ideas Meet Smart Investment
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  VentureForge is the marketplace for innovation. Connect with a community of thinkers, creators, and investors to turn brilliant ideas into reality.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" asChild>
                  <Link href="#main-content">Get Started</Link>
                </Button>
              </div>
            </div>
            <img
                src="https://placehold.co/600x400.png"
                data-ai-hint="collaboration technology"
                width="600"
                height="400"
                alt="Hero"
                className="mx-auto aspect-[3/2] overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
            />
          </div>
        </section>
      </div>
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
              <h2 className="font-heading text-3xl font-bold tracking-tighter sm:text-5xl">How VentureForge Works</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform provides all the tools you need to connect, collaborate, and create value.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:max-w-none mt-12">
            {features.map((feature) => (
              <div key={feature.title} className="grid gap-4 text-center">
                <div className="flex justify-center items-center">{feature.icon}</div>
                <div className="grid gap-1">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
