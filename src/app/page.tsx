
import Header from "@/components/header";
import LandingHero from "@/components/landing-hero";
import StatsSection from "@/components/stats-section";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <LandingHero />
        <StatsSection />
      </main>
    </div>
  );
}
