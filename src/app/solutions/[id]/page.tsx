"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSolution, upvoteSolution } from "@/lib/firestore";
import type { Solution } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ExternalLink, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SolutionPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolution = async () => {
      setLoading(true);
      const solutionData = await getSolution(params.id);
      setSolution(solutionData);
      setLoading(false);
    };
    fetchSolution();
  }, [params.id]);

  const handleUpvote = async () => {
    if (!user || !solution) return;

    const originalSolution = solution;
    const upvoted = originalSolution.upvotedBy.includes(user.uid);
    
    // Optimistic update
    setSolution(prev => {
        if (!prev) return null;
        return {
            ...prev,
            upvotes: upvoted ? prev.upvotes - 1 : prev.upvotes + 1,
            upvotedBy: upvoted ? prev.upvotedBy.filter(id => id !== user.uid) : [...prev.upvotedBy, user.uid]
        }
    });

    try {
        await upvoteSolution(solution.id, user.uid);
    } catch(e) {
        // Revert on error
        setSolution(originalSolution);
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
    }
  };

  if (loading) {
    return <SolutionPageSkeleton />;
  }

  if (!solution) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Solution not found</h1>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              Go back home
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  const isUpvoted = user ? solution.upvotedBy.includes(user.uid) : false;

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
              <Button variant={isUpvoted ? "default" : "outline"} size="sm" onClick={handleUpvote} disabled={!user}>
                <ThumbsUp className="h-5 w-5 mr-2" />
                <span>{solution.upvotes.toLocaleString()} Upvotes</span>
              </Button>
              <Link href={`/problems/${solution.problemId}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  View Original Problem
                  <ExternalLink className="h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}


const SolutionPageSkeleton = () => (
    <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
            <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
                <Skeleton className="h-6 w-48 mb-4" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-64 mb-4" />
                        <div className="flex items-start gap-4 pt-2">
                             <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-72 lg:w-96" />
                                <Skeleton className="h-5 w-48" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-4/5" />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Skeleton className="h-10 w-32" />
                         <Skeleton className="h-6 w-40" />
                    </CardFooter>
                </Card>
            </div>
        </main>
    </div>
);
