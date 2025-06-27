import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreateProblemForm from "@/components/create-problem-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProblemPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to all problems
            </Link>
          <Card>
            <CardHeader>
              <CardTitle>Submit a New Problem</CardTitle>
              <CardDescription>
                Clearly articulate a problem you're facing or have identified. The community might have the solution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateProblemForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
