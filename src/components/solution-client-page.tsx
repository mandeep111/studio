
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSolution, upvoteSolution } from "@/lib/firestore";
import type { Solution } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ExternalLink, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SolutionClientPageProps {
  initialSolution: Solution;
}

export default function SolutionClientPage({ initialSolution }: SolutionClientPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solution, setSolution] = useState<Solution>(initialSolution);
  
  useEffect(() => {
    setSolution(initialSolution);
  }, [initialSolution]);

  const handleUpvote = async () => {
    if (!user || !solution) return;
    
    try {
        await upvoteSolution(solution.id, user.uid);
        const updatedSolution = await getSolution(solution.id);
        if (updatedSolution) {
          setSolution(updatedSolution);
        }
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
    }
  };

  if (!solution) return null;

  const isUpvoted = user ? solution.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === solution.creator.userId : false;

  return (
    <>
      <Link href={`/problems/${solution.problemId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to problem
      </Link>
      <Card>
        <CardHeader>
          <CardDescription>Solution for: <Link className="text-primary hover:underline" href={`/problems/${solution.problemId}`}>{solution.problemTitle}</Link></CardDescription>
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
          <Button variant={isUpvoted ? "default" : "outline"} size="sm" onClick={handleUpvote} disabled={!user || isCreator}>
            <ThumbsUp className="h-5 w-5 mr-2" />
            <span>{solution.upvotes.toLocaleString()} Upvotes</span>
          </Button>
          <Link href={`/problems/${solution.problemId}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              View Original Problem
              <ExternalLink className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </>
  );
}
