
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getProblem, getSolutionsForProblem } from "@/lib/firestore";
import { upvoteItemAction } from "@/app/actions";
import type { Problem, Solution } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, ThumbsUp, CheckCircle, DollarSign, Coffee, File, Gem, Users, Info, Loader2, Edit, Trash2 } from "lucide-react";
import SolutionCard from "@/components/solution-card";
import CreateSolutionForm from "@/components/create-solution-form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import BuyMeACoffeePopup from "./buy-me-a-coffee-popup";
import { startDealAction, findExistingDealAction, deleteItemAction } from "@/app/actions";
import { Button } from "./ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

interface ProblemClientPageProps {
  initialProblem: Problem;
  initialSolutions: Solution[];
  isPaymentEnabled: boolean;
}

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function ProblemClientPage({ initialProblem, initialSolutions, isPaymentEnabled }: ProblemClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [problem, setProblem] = useState<Problem>(initialProblem);
  const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);
  const [isCoffeePopupOpen, setCoffeePopupOpen] = useState(false);
  const [dealConfig, setDealConfig] = useState<{ solution?: Solution } | null>(null);
  const [isDealLoading, setIsDealLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);
  const [existingDealId, setExistingDealId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile && userProfile.role === 'Investor') {
        findExistingDealAction(initialProblem.id, userProfile.uid).then(result => {
            if (result.dealId) {
                setExistingDealId(result.dealId);
            }
        });
    }
  }, [userProfile, initialProblem.id]);

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


  const handleUpvote = async (itemId: string, itemType: 'problem' | 'solution') => {
    if (!user || upvotingId) return;
    setUpvotingId(itemId);

    if (itemType === 'problem') {
        setProblem(prev => {
            if (!prev) return prev;
            const isUpvoted = prev.upvotedBy.includes(user.uid);
            return {...prev, upvotes: isUpvoted ? prev.upvotes - 1 : prev.upvotes + 1, upvotedBy: isUpvoted ? prev.upvotedBy.filter(uid => uid !== user.uid) : [...prev.upvotedBy, user.uid]};
        });
    } else {
        setSolutions(prev => prev.map(s => {
            if (s.id === itemId) {
                const isUpvoted = s.upvotedBy.includes(user.uid);
                return {...s, upvotes: isUpvoted ? s.upvotes - 1 : s.upvotes + 1, upvotedBy: isUpvoted ? s.upvotedBy.filter(uid => uid !== user.uid) : [...s.upvotedBy, user.uid]};
            }
            return s;
        }));
    }

    const result = await upvoteItemAction(itemId, itemType);
    if (!result.success) {
        toast({variant: "destructive", title: "Error", description: result.message});
        fetchProblemAndSolutions(); // Revert
    }
    
    setUpvotingId(null);
  };
  
  const confirmAndStartDeal = async (amount: number, directDealConfig?: { solution?: Solution }) => {
    const configToUse = directDealConfig || dealConfig;
    if (!userProfile || !problem || !configToUse) return;

    setIsDealLoading(true);

    try {
        const result = await startDealAction(
            userProfile,
            problem.creator.userId,
            problem.id,
            problem.title,
            'problem',
            amount,
            configToUse.solution?.creator.userId
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
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
        setIsDealLoading(false);
    }
  };

  const handleStartDealClick = async (solution?: Solution) => {
      if (!userProfile || userProfile.role !== "Investor") return;
      
      if (problem.isClosed) {
        toast({ variant: "destructive", title: "Deal Closed", description: "This item is already part of a finalized deal." });
        return;
      }
      
      setIsDealLoading(true);

      const existingDeal = await findExistingDealAction(problem.id, userProfile.uid);
      if(existingDeal.dealId) {
        router.push(`/deals/${existingDeal.dealId}`);
        return;
      }
      
      const currentDealConfig = { solution };
      setDealConfig(currentDealConfig);

      if (isPaymentEnabled) {
        setCoffeePopupOpen(true);
        setIsDealLoading(false);
      } else {
        await confirmAndStartDeal(0, currentDealConfig);
      }
  }

  const handleDelete = async () => {
    if (!user || user.uid !== problem.creator.userId) return;
    setIsDeleting(true);

    const formData = new FormData();
    formData.append('type', 'problem');
    formData.append('id', problem.id);

    const result = await deleteItemAction(formData);

    if(result.success) {
      toast({ title: "Success", description: "Problem deleted successfully." });
      router.push('/marketplace');
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
      setIsDeleting(false);
    }
  };


  const isProblemCreator = user?.uid === problem?.creator.userId;
  const isProblemUpvoted = user && problem ? problem.upvotedBy.includes(user.uid) : false;
  const hasUserSubmittedSolution = user ? solutions.some(s => s.creator.userId === user.uid) : false;
  const canSubmitSolution = userProfile?.role === 'User' && !isProblemCreator && !hasUserSubmittedSolution;
  const canStartDeal = userProfile && userProfile.role === 'Investor';

  if (!problem) return null;

  return (
    <>
      <BuyMeACoffeePopup 
        isOpen={isCoffeePopupOpen} 
        onOpenChange={setCoffeePopupOpen} 
        onConfirm={(amount) => confirmAndStartDeal(amount)} 
      />
      <div className="flex justify-between items-center mb-4">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to all problems
        </Link>
        {isProblemCreator && (
            <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/problems/${problem.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your problem "{problem.title}" and all its solutions.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Yes, delete it
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
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
            <Link href={`/users/${problem.creator.userId}`}>
                <Avatar className="h-12 w-12">
                    <AvatarImage src={problem.creator.avatarUrl} alt={problem.creator.name} />
                    <AvatarFallback>{problem.creator.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
            <div>
                <div className="flex items-center gap-4">
                    <CardTitle className="text-2xl lg:text-3xl">{problem.title}</CardTitle>
                    {problem.isClosed && <Badge variant="destructive">Closed</Badge>}
                </div>
              <CardDescription className="mt-1">
                Problem by <Link href={`/users/${problem.creator.userId}`} className="hover:underline font-medium text-foreground">{problem.creator.name}</Link> &bull; Expertise: {problem.creator.expertise}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed">{problem.description}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex flex-wrap gap-2">
                {problem.tags.map((tag, index) => (
                  <Badge key={`${tag}-${index}`} variant="secondary">{tag}</Badge>
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
                    {existingDealId ? (
                        <Button asChild variant="outline">
                            <a href={problem.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <File className="mr-2 h-4 w-4" />
                                {problem.attachmentFileName || 'Download Attachment'}
                            </a>
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md bg-muted border">
                            <Coffee className="h-4 w-4 text-primary" />
                            <span>An attachment is available. Start a deal to view.</span>
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
              onClick={() => handleUpvote(problem.id, 'problem')}
              disabled={!user || isProblemCreator || upvotingId === problem.id}
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
            existingDealId ? (
                <Button asChild>
                    <Link href={`/deals/${existingDealId}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View Your Deal
                    </Link>
                </Button>
            ) : (
                <Button onClick={() => handleStartDealClick()} disabled={isDealLoading || problem.isClosed}>
                    {isDealLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coffee className="mr-2 h-4 w-4" />}
                    {isPaymentEnabled ? "Start Deal with Creator" : "Start Deal (Free)"}
                </Button>
            )
          )}
        </CardFooter>
      </Card>

      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Proposed Solutions ({solutions.length})</h2>
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
          {solutions.length > 0 ? (
            solutions.map(solution => (
              <motion.div key={solution.id} variants={itemVariants}>
                <SolutionCard 
                  solution={solution} 
                  onUpvote={(id) => handleUpvote(id, 'solution')}
                  onStartDeal={handleStartDealClick} 
                  isPaymentEnabled={isPaymentEnabled}
                  isUpvoting={upvotingId === solution.id}
                  existingDealId={existingDealId}
                />
              </motion.div>
            ))
          ) : (
            <p className="text-muted-foreground">No solutions proposed yet. Be the first to propose one!</p>
          )}
        </motion.div>
      </section>

      <Separator className="my-8" />
      
      {canSubmitSolution && (
        <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Propose Your Solution</h2>
            <CreateSolutionForm problemId={problem.id} problemTitle={problem.title} onSolutionCreated={fetchProblemAndSolutions} isPaymentEnabled={isPaymentEnabled} />
        </section>
      )}
    </>
  );
}
