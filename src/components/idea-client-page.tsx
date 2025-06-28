"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getIdea, upvoteIdea } from "@/lib/firestore";
import type { Idea } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, Coffee, File, Gem, Users, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubmitIdeaDialog } from "@/components/submit-idea-dialog";
import BuyMeACoffeePopup from "./buy-me-a-coffee-popup";
import { startDealAction, findExistingDealAction } from "@/app/actions";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

interface IdeaClientPageProps {
  initialIdea: Idea;
  isPaymentEnabled: boolean;
}

export default function IdeaClientPage({ initialIdea, isPaymentEnabled }: IdeaClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState<Idea>(initialIdea);
  const [isCoffeePopupOpen, setCoffeePopupOpen] = useState(false);
  const [isDealLoading, setIsDealLoading] = useState(false);

  useEffect(() => {
    const dealStatus = searchParams.get('deal');
    if (dealStatus === 'pending' && userProfile && idea) {
        toast({
            title: "Payment Successful!",
            description: "Finalizing your deal, please wait...",
        });

        const pollForDeal = async () => {
            let attempts = 0;
            const maxAttempts = 10; // Poll for 10 seconds
            
            const intervalId = setInterval(async () => {
                attempts++;
                const existingDeal = await findExistingDealAction(idea.id, userProfile.uid);
                
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
  }, [searchParams, idea, userProfile, router, toast]);

  const fetchIdea = useCallback(async () => {
    if (!idea?.id) return;
    const ideaData = await getIdea(idea.id);
    if (ideaData) {
      setIdea(ideaData);
    }
  }, [idea?.id]);

  useEffect(() => {
    setIdea(initialIdea);
  }, [initialIdea]);


  const handleIdeaUpvote = async () => {
    if (!user || !idea || user.uid === idea.creator.userId) return;

    setIdea(prevIdea => {
        if (!prevIdea) return prevIdea;
        const isUpvoted = prevIdea.upvotedBy.includes(user.uid);
        return {
            ...prevIdea,
            upvotes: isUpvoted ? prevIdea.upvotes - 1 : prevIdea.upvotes + 1,
            upvotedBy: isUpvoted ? prevIdea.upvotedBy.filter(uid => uid !== user.uid) : [...prevIdea.upvotedBy, user.uid]
        };
    });

    try {
        await upvoteIdea(idea.id, user.uid);
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."})
        fetchIdea(); // Revert
    }
  };

  const handleStartDealClick = async () => {
    if (!userProfile || !idea) return;
    setIsDealLoading(true);

    const existingDeal = await findExistingDealAction(idea.id, userProfile.uid);
    if (existingDeal.dealId) {
      router.push(`/deals/${existingDeal.dealId}`);
      return;
    }

    if (isPaymentEnabled) {
      setCoffeePopupOpen(true);
      setIsDealLoading(false);
    } else {
      await handleStartDeal(0); // Start deal for free
    }
  }

   const handleStartDeal = async (amount: number) => {
    if (!userProfile || (userProfile.role !== "Investor" && userProfile.role !== "Admin") || !idea) return;
    
    setIsDealLoading(true);
  
    const result = await startDealAction(
        userProfile,
        idea.creator.userId,
        idea.id,
        idea.title,
        'idea',
        amount
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


  const isIdeaUpvoted = user && idea ? idea.upvotedBy.includes(user.uid) : false;
  const isCreator = user?.uid === idea?.creator.userId;

  if (!idea) return null;

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
          Back to all ideas
        </Link>
        {userProfile?.isPremium && (
          <SubmitIdeaDialog onIdeaCreated={fetchIdea} />
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
              <AvatarImage src={idea.creator.avatarUrl} alt={idea.creator.name} />
              <AvatarFallback>{idea.creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl lg:text-3xl">{idea.title}</CardTitle>
              <CardDescription className="mt-1">
                Idea by {idea.creator.name} &bull; Expertise: {idea.creator.expertise}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed">{idea.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {idea.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
           {idea.attachmentUrl && (
                <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold mb-2">Attachment</h4>
                    {userProfile?.isPremium ? (
                        <Button asChild variant="outline">
                            <a href={idea.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <File className="mr-2 h-4 w-4" />
                                {idea.attachmentFileName || 'Download Attachment'}
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
                    variant={isIdeaUpvoted ? "default" : "outline"}
                    size="sm"
                    onClick={handleIdeaUpvote}
                    disabled={!user || isCreator}
                >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    <span>{idea.upvotes.toLocaleString()} Upvotes</span>
                </Button>
                 <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{idea.interestedInvestorsCount || 0} Investors</span>
                </div>
            </div>
           {(userProfile?.role === "Investor" || userProfile?.role === "Admin") && !isCreator && (
            <Button onClick={handleStartDealClick} disabled={isDealLoading}>
              {isDealLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coffee className="mr-2 h-4 w-4" />}
              {isPaymentEnabled ? "Start a Deal" : "Start Deal (Free)"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
