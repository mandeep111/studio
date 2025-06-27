import { notFound } from "next/navigation";
import Link from "next/link";
import { problemData, solutionData } from "@/lib/mock-data";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ExternalLink, ThumbsUp } from "lucide-react";

export default function SolutionPage({ params }: { params: { id: string } }) {
  const solution = solutionData.find((s) => s.id === params.id);
  
  if (!solution) {
    notFound();
  }

  const problem = problemData.find(p => p.id === solution.problemId);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
          <Link href={`/problems/${solution.problemId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to problem
          </Link>
          <Card>
            <CardHeader>
              <CardDescription>Solution for: {solution.problemTitle}</CardDescription>
              <div className="flex items-start gap-4 pt-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={solution.creator.avatarUrl} alt={solution.creator.name} />
                  <AvatarFallback>{solution.creator.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl lg:text-3xl">Solution by {solution.creator.name}</CardTitle>
                  <CardDescription className="mt-1">
                    Expertise: {solution.creator.expertise}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{solution.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="flex items-center gap-1 text-muted-foreground">
                    <ThumbsUp className="h-5 w-5" />
                    <span>{solution.upvotes.toLocaleString()} Upvotes</span>
                </div>
                {problem && (
                    <Link href={`/problems/${problem.id}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                        View Original Problem
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                )}
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
