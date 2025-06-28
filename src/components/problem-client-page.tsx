
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getProblem, getSolutionsForProblem, upvoteProblem, upvoteSolution } from "@/lib/firestore";
import type { Problem, Solution, Ad } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, ThumbsUp, CheckCircle, DollarSign, Coffee, File, Gem, Users, Info } from "lucide-react";
import SolutionCard from "@/components/solution-card";
import CreateSolutionForm from "@/components/create-solution-form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { SubmitProblemDialog } from "@/components/submit-problem-dialog";
import BuyMeACoffeePopup from "./buy-me-a-coffee-popup";
import { startDealAction, findExistingDealAction } from "@/app/actions";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import AdDisplay from "./ad-display";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ProblemClientPageProps {
  initialProblem: Problem;
  initialSolutions: Solution[];
  ad: Ad | null;
  isPaymentEnabled: boolean;
}

export default function ProblemClientPage({ initialProblem, initialSolutions, ad, isPaymentEnabled }: ProblemClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [problem, setProblem] = useState<Problem>(initialProblem);
  const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);
  const [isCoffeePopupOpen, setCoffeePopupOpen] = useState(false);
  const [dealConfig, setDealConfig] = useState<{ solution?: Solution } | null>(null);
  const [isDealLoading, setIsDealLoading] = useState(false);

  useEffect(() => {
    const dealStatus = searchParams.get('deal');
    if (dealStatus === 'pending' && userProfile && problem) {
        toast({
            title: "Payment Successful!",
            description: "Finalizing your deal, please wait...",
        });

        const pollForDeal = async () => {
            let attempts = 0;
            const maxAttempts = 10; // Poll for 10 seconds
            
            const intervalId = setInterval(async () => {
                attempts++;
                const existingDeal = await findExistingDealAction(problem.id, userProfile.uid);
                
                if (existingDeal.dealId) {
                    clearInterval(intervalId);
                    toast({
                        title: "Deal Ready!",
                        description: "Redirecting you to the chat...",
                    });
                    router.push(`/deals/${existingDeal.dealId}`);
                } else if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                     toast({
                        variant: "destructive",
                        title: "Deal Creation Timed Out",
                        description: "There was an issue creating your deal. Please contact support if this persists.",
                    });
                }
            }, 1000); // Poll every second

            return () => clearInterval(intervalId);
        };

        pollForDeal();
    }
  }, [searchParams, problem, userProfile, router, toast]);

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
    if (!user || !problem || user.uid === problem.creator.userId) return;

    setProblem(prevProblem => {
        if (!prevProblem) return prevProblem;
        const isAlreadyUpvoted = prevProblem.upvotedBy.includes(user.uid);
        return {
            ...prevProblem,
            upvotes: isAlreadyUpvoted ? prevProblem.upvotes - 1 : prevProblem.upvotes + 1,
            upvotedBy: isAlreadyUpvoted
                ? prevProblem.upvotedBy.filter(uid => uid !== user.uid)
                : [...prevProblem.upvotedBy, user.uid],
        };
    });

    try {
        await upvoteProblem(problem.id, user.uid);
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Could not record upvote."})
        fetchProblemAndSolutions(); // Revert
    }
  };

  const handleSolutionUpvote = async (solutionId: string) => {
    if (!user) return;
     
    setSolutions(prevSolutions => prevSolutions.map(s => {
        if (s.id === solutionId) {
            if (s.creator.userId === user.uid) return s;
            const isAlreadyUpvoted = s.upvotedBy.includes(user.uid);
            return {
                ...s,
                upvotes: isAlreadyUpvoted ? s.upvotes - 1 : s.upvotes + 1,
                upvotedBy: isAlreadyUpvoted
                    ? s.upvotedBy.filter(uid => uid !== user.uid)
                    : [...s.upvotedBy, user.uid],
            };
        }
        return s;
    }));

     try {
        await upvoteSolution(solutionId, user.uid);
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Could not record upvote."})
        fetchProblemAndSolutions(); // Revert
    }
  };
  
  const handleStartDealClick = async (solution?: Solution) => {
      if (!userProfile || (userProfile.role !== "Investor" && userProfile.role !== "Admin")) return;
      setIsDealLoading(true);

      const existingDeal = await findExistingDealAction(problem.id, userProfile.uid);
      if(existingDeal.dealId) {
        router.push(`/deals/${existingDeal.dealId}`);
        return;
      }
      
      setDealConfig({ solution });

      if (isPaymentEnabled) {
        setCoffeePopupOpen(true);
        setIsDealLoading(false);
      } else {
        await confirmAndStartDeal(0); // Start deal for free
      }
  }

  const confirmAndStartDeal = async (amount: number) => {
    if (!userProfile || !problem || dealConfig === null) return;
  
    setIsDealLoading(true);

    const result = await startDealAction(
        userProfile,
        problem.creator.userId,
        problem.id,
        problem.title,
        'problem',
        amount,
        dealConfig.solution?.creator.userId
    );
    
    if (result.success && result.url) {
        window.location.href = result.url;
    } else if (result.success && result.dealId) {
        toast({ title: "Deal Started!", description: "The deal has been created successfully." });
        router.push(`/deals/${result.dealId}`);
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
        setIsDealLoading(false);
    }
  };


  const isProblemCreator = user?.uid === problem?.creator.userId;
  const isProblemUpvoted = user && problem ? problem.upvotedBy.includes(user.uid) : false;
  const hasUserSubmittedSolution = user ? solutions.some(s => s.creator.userId === user.uid) : false;
  const canSubmitSolution = userProfile?.isPremium && !isProblemCreator && !hasUserSubmittedSolution;
  const canStartDeal = userProfile && (userProfile.role === 'Investor' || userProfile.role === 'Admin');

  if (!problem) return null;

  return (
    <>
      <BuyMeACoffeePopup 
        isOpen={isCoffeePopupOpen} 
        onOpenChange={setCoffeePopupOpen} 
        onConfirm={confirmAndStartDeal} 
      />
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to all problems
        </Link>
        {userProfile?.isPremium && (
          <SubmitProblemDialog onProblemCreated={() => router.push('/')} />
        )}
      </div>
       {!isPaymentEnabled && (
        <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Payments Disabled</AlertTitle>
            <AlertDescription>
                The payment system is currently turned off. All premium actions are free.
            </AlertDescription>
        </Alert>
      )}
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
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
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
          {canStartDeal && !isProblemCreator && (
            <Button onClick={() => handleStartDealClick()} disabled={isDealLoading}>
              {isDealLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coffee className="mr-2 h-4 w-4" />}
              {isPaymentEnabled ? "Start Deal with Creator" : "Start Deal (Free)"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {ad && !userProfile?.isPremium && <AdDisplay ad={ad} />}

      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Proposed Solutions ({solutions.length})</h2>
        <div className="space-y-6">
          {solutions.length > 0 ? (
            solutions.map(solution => (
              <SolutionCard 
                key={solution.id} 
                solution={solution} 
                onUpvote={() => handleSolutionUpvote(solution.id)}
                onStartDeal={handleStartDealClick} 
                isPaymentEnabled={isPaymentEnabled}
              />
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
