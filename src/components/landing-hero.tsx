import { Lightbulb, Sparkles, Users, Briefcase, DollarSign, BrainCircuit } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import StatsSection from "./stats-section";

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
    description: "Investors gain access to a curated list of problems, solutions, and running bannes, with tools to identify promising new ventures.",
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "AI-Powered Matchmaking",
    description: "Leverage our AI tool to discover high-potential pairings between problem creators and solution builders.",
  },
];

const personas = [
  {
    icon: <BrainCircuit className="h-10 w-10 text-primary" />,
    title: "The Problem Expert",
    description: "You see the challenges and gaps in the market. You understand a problem intimately but need the right team and resources to bring a solution to life. Share your insights and find partners to build with.",
  },
  {
    icon: <Lightbulb className="h-10 w-10 text-primary" />,
    title: "The Solution Creator",
    description: "You're an innovator, a builder, an expert in your field. You have the skills to solve complex problems but need the right challenge to tackle. Browse problems and apply your talent to create impactful solutions.",
  },
  {
    icon: <DollarSign className="h-10 w-10 text-primary" />,
    title: "The Strategic Investor",
    description: "You're searching for the next big opportunity. From early-stage ideas to growing businesses, you seek ventures with high potential. Find curated, vetted opportunities and connect directly with creators.",
  },
];


export default function LandingHero() {
  return (
    <div className="w-full">
      <div className="bg-muted/40">
        <div className="container px-4 md:px-6">
            <section className="py-12 md:py-24 lg:py-32">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                    <h1 className="font-heading text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                      The Online Shark Tank
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                      Where your crazy idea might actually work. A platform where your ideas, no matter how wild, genius, or half-baked, can finally find their people.
                    </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Button size="lg" asChild>
                    <Link href="/marketplace">Get Started</Link>
                    </Button>
                </div>
                </div>
                <Image
                    src="/banner.gif"
                    width="600"
                    height="400"
                    alt="An animated flow from a problem to a solution and investment"
                    className="mx-auto aspect-[3/2] overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                    unoptimized
                    priority={true}
                />
            </div>
            </section>
        </div>
      </div>

      <StatsSection />

      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
              <h2 className="font-heading text-3xl font-bold tracking-tighter sm:text-5xl">How Problem2Profit Works</h2>
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

      <section id="roles" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">Who is it for?</div>
              <h2 className="font-heading text-3xl font-bold tracking-tighter sm:text-5xl">Built for Every Innovator</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Whether you have an idea, a skill, or the capital to make things happen, there's a place for you here.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
            {personas.map((persona) => (
              <div key={persona.title} className="grid gap-4 text-center p-6 rounded-lg bg-background shadow-lg transition-transform hover:-translate-y-2">
                <div className="flex justify-center items-center">{persona.icon}</div>
                <div className="grid gap-1">
                    <h3 className="text-xl font-bold">{persona.title}</h3>
                    <p className="text-sm text-muted-foreground">{persona.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
