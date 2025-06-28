"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getBusiness, upvoteBusiness } from "@/lib/firestore";
import type { Business } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, CheckCircle, DollarSign, File, Gem, Coffee, Users, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubmitBusinessDialog } from "@/components/submit-business-dialog";
import { Button } from "./ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { startDealAction, findExistingDealAction } from "@/app/actions";
import BuyMeACoffeePopup from "./buy-me-a-coffee-popup";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface BusinessClientPageProps {
  initialBusiness: Business;
  isPaymentEnabled: boolean;
}

export default function BusinessClientPage({ initialBusiness, isPaymentEnabled }: BusinessClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [isCoffeePopupOpen, setCoffeePopupOpen] = useState(false);
  const [isDealLoading, setIsDealLoading] = useState(false);

  useEffect(() => {
    const dealStatus = searchParams.get('deal');
    if (dealStatus === 'pending' && userProfile && business) {
        toast({
            title: "Payment Successful!",
            description: "Finalizing your deal, please wait...",
        });

        const pollForDeal = async () => {
            let attempts = 0;
            const maxAttempts = 10; // Poll for 10 seconds
            
            const intervalId = setInterval(async () => {
                attempts++;
                const existingDeal = await findExistingDealAction(business.id, userProfile.uid);
                
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
  }, [searchParams, business, userProfile, router, toast]);

  const fetchBusiness = useCallback(async () => {
    if (!business?.id) return;
    const businessData = await getBusiness(business.id);
    if (businessData) {
      setBusiness(businessData);
    }
  }, [business?.id]);

  useEffect(() => {
    setBusiness(initialBusiness);
  }, [initialBusiness]);


  const handleBusinessUpvote = async () => {
    if (!user || !business || user.uid === business.creator.userId) return;

    setBusiness(prevBusiness => {
        if (!prevBusiness) return prevBusiness;
        const isAlreadyUpvoted = prevBusiness.upvotedBy.includes(user.uid);
        return {
            ...prevBusiness,
            upvotes: isAlreadyUpvoted ? prevBusiness.upvotes - 1 : prevBusiness.upvotes + 1,
            upvotedBy: isAlreadyUpvoted
                ? prevBusiness.upvotedBy.filter(uid => uid !== user.uid)
                : [...prevBusiness.upvotedBy, user.uid],
        };
    });

    try {
        await upvoteBusiness(business.id, user.uid);
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."})
        fetchBusiness(); // Revert
    }
  };

  const handleStartDealClick = async () => {
    if (!userProfile || !business) return;
    setIsDealLoading(true);

    const existingDeal = await findExistingDealAction(business.id, userProfile.uid);
    if (existingDeal.dealId) {
      router.push(`/deals/${existingDeal.dealId}`);
      return;
    }

    if (isPaymentEnabled) {
      setCoffeePopupOpen(true);
      setIsDealLoading(false);
    } else {
      // If payments are off, start the deal for free
      await handleStartDeal(0);
    }
  };

  const handleStartDeal = async (amount: number) => {
    if (!userProfile || (userProfile.role !== "Investor" && userProfile.role !== "Admin") || !business) return;
    
    setIsDealLoading(true);

    const result = await startDealAction(
      userProfile,
      business.creator.userId,
      business.id,
      business.title,
      'business',
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

  const isBusinessUpvoted = user && business ? business.upvotedBy.includes(user.uid) : false;
  const isCreator = user?.uid === business?.creator.userId;

  if (!business) return null;

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
          Back to all businesses
        </Link>
        {userProfile?.isPremium && (
          <SubmitBusinessDialog onBusinessCreated={() => router.push('/')} />
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
              <AvatarImage src={business.creator.avatarUrl} alt={business.creator.name} />
              <AvatarFallback>{business.creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl lg:text-3xl">{business.title}</CardTitle>
              <CardDescription className="mt-1">
                Business by {business.creator.name} &bull; Expertise: {business.creator.expertise}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed">{business.description}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{business.stage}</Badge>
                {business.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </div>
            {business.price && (
                <Badge variant={business.priceApproved ? "default" : "destructive"} className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Funding Sought: {business.price.toLocaleString()}
                    {business.priceApproved ? <CheckCircle className="h-4 w-4 ml-1" /> : '(Awaiting Approval)'}
                </Badge>
            )}
          </div>
           {business.attachmentUrl && (
                <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold mb-2">Attachment</h4>
                    {userProfile?.isPremium ? (
                        <Button asChild variant="outline">
                            <a href={business.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <File className="mr-2 h-4 w-4" />
                                {business.attachmentFileName || 'Download Attachment'}
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
                    variant={isBusinessUpvoted ? "default" : "outline"}
                    size="sm"
                    onClick={handleBusinessUpvote}
                    disabled={!user || isCreator}
                >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    <span>{business.upvotes.toLocaleString()} Upvotes</span>
                </Button>
                 <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{business.interestedInvestorsCount || 0} Investors</span>
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
