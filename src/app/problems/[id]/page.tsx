import { notFound } from "next/navigation";
import Link from "next/link";
import { problemData, solutionData } from "@/lib/mock-data";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, ThumbsUp } from "lucide-react";
import SolutionCard from "@/components/solution-card";
import CreateSolutionForm from "@/components/create-solution-form";
import { Separator } from "@/components/ui/separator";

export default function ProblemPage({ params }: { params: { id: string } }) {
  const problem = problemData.find((p) => p.id === params.id);
  
  if (!problem) {
    notFound();
  }

  const solutions = solutionData.filter(s => s.problemId === problem.id);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to all problems
            </Link>
          <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={problem.creator.avatarUrl} alt={problem.creator.name} />
                        <AvatarFallback>{problem.creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl lg:text-3xl">{problem.title}</CardTitle>
                        <CardDescription className="mt-1">
                            Problem by {problem.creator.name} &bull; Expertise: {problem.creator.expertise}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed">{problem.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {problem.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-1">
                    <ThumbsUp className="h-5 w-5" />
                    <span>{problem.upvotes.toLocaleString()} Upvotes</span>
                </div>
                <div className="flex items-center gap-1">
                    <MessageSquare className="h-5 w-5" />
                    <span>{solutions.length} Solutions</span>
                </div>
            </CardFooter>
          </Card>

          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Proposed Solutions ({solutions.length})</h2>
            <div className="space-y-6">
                {solutions.length > 0 ? (
                    solutions.map(solution => <SolutionCard key={solution.id} solution={solution} />)
                ) : (
                    <p className="text-muted-foreground">No solutions proposed yet. Be the first to propose one!</p>
                )}
            </div>
          </section>

          <Separator className="my-8" />

          <section className="mt-8">
             <h2 className="text-2xl font-bold mb-4">Propose Your Solution</h2>
             <CreateSolutionForm problemId={problem.id} />
          </section>
        </div>
      </main>
    </div>
  );
}
