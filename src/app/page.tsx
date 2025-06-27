import Header from "@/components/header";
import MainTabs from "@/components/main-tabs";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
          <MainTabs />
        </div>
      </main>
    </div>
  );
}
