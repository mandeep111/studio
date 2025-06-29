import Header from "@/components/header";
import LandingHero from "@/components/landing-hero";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <LandingHero />
      </main>
    </div>
  );
}
