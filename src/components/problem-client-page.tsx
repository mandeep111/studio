
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProblem, getSolutionsForProblem, upvoteProblem, upvoteSolution } from "@/lib/firestore";
import type { Problem, Solution } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, ThumbsUp, CheckCircle, DollarSign, Coffee, File, Gem, Users } from "lucide-react";
import SolutionCard from "@/components/solution-card";
import CreateSolutionForm from "@/components/create-solution-form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { SubmitProblemDialog } from "@/components/submit-problem-dialog";
import BuyMeACoffeePopup from "./buy-me-a-coffee-popup";
import { startDealAction } from "@/app/actions";
import { Button } from "./ui/button";

interface ProblemClientPageProps {
  initialProblem: Problem;
  initialSolutions: Solution[];
}

export default function ProblemClientPage({ initialProblem, initialSolutions }: ProblemClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [problem, setProblem] = useState<Problem>(initialProblem);
  const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);
  const [isCoffeePopupOpen, setCoffeePopupOpen] = useState(false);

  useEffect(() => {
    setProblem(initialProblem);
    setSolutions(initialSolutions);
  }, [initialProblem, initialSolutions]);

  const fetchProblemAndSolutions = useCallback(async () => {
    if (!problem?.id) return;
    const problemData = await getProblem(problem.id);
    if (problemData) {
      setProblem(problemData);
      const solutionsData = await getSolutionsForProblem(problem.id);
      setSolutions(solutionsData);
    }
  }, [problem?.id]);


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

  const handleStartDeal = async () => {
    if (!userProfile || userProfile.role !== "Investor" || !problem) return;
  
    const formData = new FormData();
    formData.append('investorProfile', JSON.stringify(userProfile));
    formData.append('primaryCreatorId', problem.creator.userId);
    formData.append('itemId', problem.id);
    formData.append('itemTitle', problem.title);
    formData.append('itemType', 'problem');

    const result = await startDealAction(formData);

    if (result.success && result.dealId) {
        toast({ title: "Deal Started!", description: "You can now chat with the creator." });
        router.push(`/deals/${result.dealId}`);
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  const isProblemCreator = user?.uid === problem?.creator.userId;
  const isProblemUpvoted = user && problem ? problem.upvotedBy.includes(user.uid) : false;
  const hasUserSubmittedSolution = user ? solutions.some(s => s.creator.userId === user.uid) : false;
  const canSubmitSolution = userProfile && (userProfile.role === 'User' || userProfile.role === 'Admin') && !isProblemCreator && !hasUserSubmittedSolution;

  if (!problem) return null;

  return (
    <>
      <BuyMeACoffeePopup 
        isOpen={isCoffeePopupOpen} 
        onOpenChange={setCoffeePopupOpen} 
        onConfirm={handleStartDeal} 
      />
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to all problems
        </Link>
        {(userProfile?.role === 'User' || userProfile?.role === 'Admin') && (
          <SubmitProblemDialog />
        )}
      </div>
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
                    {problem.priceApproved ? <CheckCircle className="h-4 w-4 ml-1" /> : '(Awaiting Approval)'}
                </Badge>
            )}
          </div>
            {problem.attachmentUrl && (
                <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold mb-2">Attachment</h4>
                    {userProfile?.isPremium ? (
                        <Button asChild variant="outline">
                            <a href={problem.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <File className="mr-2 h-4 w-4" />
                                {problem.attachmentFileName || 'Download Attachment'}
                            </a>
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md bg-muted border">
                            <Gem className="h-4 w-4 text-primary" />
                            <span>A file is attached. <Link href="/membership" className="underline text-primary">Upgrade to Premium</Link> to view.</span>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-muted-foreground">
            <Button
              variant={isProblemUpvoted ? "default" : "outline"}
              size="sm"
              onClick={handleProblemUpvote}
              disabled={!user || isProblemCreator}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              <span>{problem.upvotes.toLocaleString()} Upvotes</span>
            </Button>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{problem.interestedInvestorsCount || 0} Investors</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{solutions.length} Solutions</span>
            </div>
          </div>
          {userProfile?.role === "Investor" && !isProblemCreator && (
            <Button onClick={() => setCoffeePopupOpen(true)}>
              <Coffee className="mr-2 h-4 w-4" />
              Start a Deal
            </Button>
          )}
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
      
      {canSubmitSolution && (
        <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Propose Your Solution</h2>
            <CreateSolutionForm problemId={problem.id} problemTitle={problem.title} onSolutionCreated={fetchProblemAndSolutions} />
        </section>
      )}
    </>
  );
}
