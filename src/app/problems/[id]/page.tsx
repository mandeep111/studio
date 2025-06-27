"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getProblem, getSolutionsForProblem, upvoteProblem, upvoteSolution } from "@/lib/firestore";
import type { Problem, Solution } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, ThumbsUp, CheckCircle, DollarSign } from "lucide-react";
import SolutionCard from "@/components/solution-card";
import CreateSolutionForm from "@/components/create-solution-form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ProblemPage({ params }: { params: { id: string } }) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProblemAndSolutions = useCallback(async () => {
    setLoading(true);
    const problemData = await getProblem(params.id);
    if (problemData) {
      setProblem(problemData);
      const solutionsData = await getSolutionsForProblem(params.id);
      setSolutions(solutionsData);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchProblemAndSolutions();
  }, [fetchProblemAndSolutions]);

  const handleProblemUpvote = async () => {
    if (!user || !problem) return;
    try {
        await upvoteProblem(problem.id, user.uid);
        fetchProblemAndSolutions();
        toast({title: "Success", description: "Your upvote has been recorded."})
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."})
    }
  };

  const handleSolutionUpvote = async (solutionId: string) => {
    if (!user) return;
     try {
        await upvoteSolution(solutionId, user.uid);
        fetchProblemAndSolutions();
        toast({title: "Success", description: "Your upvote has been recorded."})
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."})
    }
  };

  if (loading) {
    return <ProblemPageSkeleton />;
  }

  if (!problem) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Problem not found</h1>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              Go back home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isProblemUpvoted = user ? problem.upvotedBy.includes(user.uid) : false;

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
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
                {problem.price && (
                    <Badge variant={problem.priceApproved ? "default" : "destructive"} className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" /> {problem.price.toFixed(2)}
                        {problem.priceApproved ? <CheckCircle className="h-4 w-4" /> : '(Awaiting Approval)'}
                    </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex items-center gap-6 text-muted-foreground">
              <Button variant={isProblemUpvoted ? "default" : "outline"} size="sm" onClick={handleProblemUpvote} disabled={!user}>
                <ThumbsUp className="h-5 w-5 mr-2" />
                <span>{problem.upvotes.toLocaleString()} Upvotes</span>
              </Button>
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
                solutions.map(solution => (
                  <SolutionCard key={solution.id} solution={solution} onUpvote={() => handleSolutionUpvote(solution.id)} />
                ))
              ) : (
                <p className="text-muted-foreground">No solutions proposed yet. Be the first to propose one!</p>
              )}
            </div>
          </section>

          <Separator className="my-8" />
          
          {userProfile?.role === 'User' && (
            <section className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Propose Your Solution</h2>
                <CreateSolutionForm problemId={problem.id} problemTitle={problem.title} onSolutionCreated={fetchProblemAndSolutions} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

const ProblemPageSkeleton = () => (
    <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
            <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
                <Skeleton className="h-6 w-48 mb-4" />
                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-80 lg:w-96" />
                                <Skeleton className="h-5 w-64" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-3/4" />
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-6 text-muted-foreground">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-6 w-24" />
                    </CardFooter>
                </Card>

                <section className="mt-8">
                    <Skeleton className="h-8 w-64 mb-4" />
                    <div className="space-y-6">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </section>
            </div>
        </main>
    </div>
)
