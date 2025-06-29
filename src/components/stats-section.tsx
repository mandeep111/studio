import { getCounts } from "@/lib/firestore";
import StatsCounter from "./stats-counter";
import { BrainCircuit, Lightbulb, Briefcase, Sparkles, Users } from "lucide-react";

export default async function StatsSection() {
  const counts = await getCounts();

  const stats = [
    { name: "Problems Posted", value: counts.problems, icon: <BrainCircuit className="h-8 w-8 text-primary" /> },
    { name: "Solutions Crafted", value: counts.solutions, icon: <Lightbulb className="h-8 w-8 text-primary" /> },
    { name: "Businesses Listed", value: counts.businesses, icon: <Briefcase className="h-8 w-8 text-primary" /> },
    { name: "Ideas Shared", value: counts.ideas, icon: <Sparkles className="h-8 w-8 text-primary" /> },
    { name: "Active Investors", value: counts.investors, icon: <Users className="h-8 w-8 text-primary" /> },
  ];

  return (
    <section id="stats" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-5 lg:gap-12">
          {stats.map((stat) => (
            <div key={stat.name} className="flex flex-col items-center justify-center space-y-2 text-center">
              {stat.icon}
              <div className="text-4xl font-bold tracking-tighter">
                <StatsCounter value={stat.value} />
              </div>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
