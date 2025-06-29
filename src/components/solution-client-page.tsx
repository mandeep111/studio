
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSolution, upvoteSolution } from "@/lib/firestore";
import { findExistingDealAction } from "@/app/actions";
import type { Solution } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ExternalLink, ThumbsUp, File, Coffee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

interface SolutionClientPageProps {
  initialSolution: Solution;
}

export default function SolutionClientPage({ initialSolution }: SolutionClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [solution, setSolution] = useState<Solution>(initialSolution);
  const [existingDealId, setExistingDealId] = useState<string | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(true);

  
  useEffect(() => {
    setSolution(initialSolution);
    if (userProfile && userProfile.role === 'Investor') {
        setLoadingDeal(true);
        findExistingDealAction(initialSolution.problemId, userProfile.uid).then(result => {
            if (result.dealId) {
                setExistingDealId(result.dealId);
            }
            setLoadingDeal(false);
        });
    } else {
        setLoadingDeal(false);
    }
  }, [initialSolution, userProfile]);

  const handleUpvote = async () => {
    if (!user || !solution || user.uid === solution.creator.userId) return;
    
    setSolution(prevSolution => {
        if (!prevSolution) return prevSolution;
        const isUpvoted = prevSolution.upvotedBy.includes(user.uid);
        return {
            ...prevSolution,
            upvotes: isUpvoted ? prevSolution.upvotes - 1 : prevSolution.upvotes + 1,
            upvotedBy: isUpvoted ? prevSolution.upvotedBy.filter(uid => uid !== user.uid) : [...prevSolution.upvotedBy, user.uid]
        };
    });

    try {
        await upvoteSolution(solution.id, user.uid);
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."});
        const revertedSolution = await getSolution(solution.id);
        if (revertedSolution) {
          setSolution(revertedSolution);
        }
    }
  };

  if (!solution) return null;

  const isUpvoted = user ? solution.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === solution.creator.userId : false;
  const canViewSolution = !loadingDeal && ((userProfile?.role === 'Investor' || userProfile?.role === 'Admin') || !!existingDealId);


  return (
    <>
      <Link href={`/problems/${solution.problemId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to problem
      </Link>
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Solution for: <Link className="text-primary hover:underline" href={`/problems/${solution.problemId}`}>{solution.problemTitle}</Link></CardDescription>
              {solution.isClosed && <Badge variant="destructive">Closed</Badge>}
            </div>
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
            {loadingDeal ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : canViewSolution ? (
                <>
                    <p className="text-lg leading-relaxed">{solution.description}</p>
                    {solution.attachmentUrl && (
                        <div className="mt-6 border-t pt-4">
                            <h4 className="font-semibold mb-2">Attachment</h4>
                            <Button asChild variant="outline">
                                <a href={solution.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                    <File className="mr-2 h-4 w-4" />
                                    {solution.attachmentFileName || 'Download Attachment'}
                                </a>
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <p className="text-lg leading-relaxed">{`${solution.description.substring(0, 200)}...`}</p>
                    <div className="mt-4 rounded-md border bg-background p-4 text-center">
                        <p className="text-sm font-semibold">This solution is protected.</p>
                        <p className="text-sm text-muted-foreground">You must have an active deal for the related problem to view full details.</p>
                        <Button asChild className="mt-2">
                            <Link href={`/problems/${solution.problemId}`}>Go to Problem Page</Link>
                        </Button>
                    </div>
                </>
            )}
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
