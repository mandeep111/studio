
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { upvoteItemAction } from "@/app/actions";
import type { Business } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, CheckCircle, DollarSign, File, Gem, Coffee, Users, Info, MessageSquare, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { startDealAction, findExistingDealAction, deleteItemAction, getBusinessById } from "@/app/actions";
import BuyMeACoffeePopup from "./buy-me-a-coffee-popup";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [existingDealId, setExistingDealId] = useState<string | null>(null);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile && userProfile.role === 'Investor') {
        findExistingDealAction(initialBusiness.id, userProfile.uid).then(result => {
            if (result.dealId) {
                setExistingDealId(result.dealId);
            }
        });
    }
  }, [userProfile, initialBusiness.id]);

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
    const businessData = await getBusinessById(business.id);
    if (businessData) {
      setBusiness(businessData);
    }
  }, [business?.id]);

  useEffect(() => {
    setBusiness(initialBusiness);
  }, [initialBusiness]);


  const handleBusinessUpvote = async () => {
    if (!user || !business || user.uid === business.creator.userId) return;

    setUpvotingId(business.id);

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
        await upvoteItemAction(user.uid, business.id, 'business');
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."})
        fetchBusiness(); // Revert
    }

    setUpvotingId(null);
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
    if (!userProfile || userProfile.role !== "Investor" || !business) return;
    
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
  
  const handleDelete = async () => {
    if (!user || user.uid !== business.creator.userId) return;
    setIsDeleting(true);

    const formData = new FormData();
    formData.append('type', 'business');
    formData.append('id', business.id);

    const result = await deleteItemAction(formData);

    if(result.success) {
      toast({ title: "Success", description: "Business deleted successfully." });
      router.push('/marketplace');
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
      setIsDeleting(false);
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
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to all businesses
        </Link>
        {isCreator && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                  <Link href={`/businesses/${business.id}/edit`}>
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
                              This action cannot be undone. This will permanently delete your business "{business.title}".
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
            <Link href={`/users/${business.creator.userId}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={business.creator.avatarUrl} alt={business.creator.name} />
                <AvatarFallback>{business.creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <CardTitle className="text-2xl lg:text-3xl">{business.title}</CardTitle>
              <CardDescription className="mt-1">
                Business by <Link href={`/users/${business.creator.userId}`} className="hover:underline font-medium text-foreground">{business.creator.name}</Link> &bull; Expertise: {business.creator.expertise}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed">{business.description}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{business.stage}</Badge>
                {business.tags.map((tag, index) => (
                  <Badge key={`${tag}-${index}`} variant="secondary">{tag}</Badge>
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
                    disabled={!user || isCreator || !!upvotingId}
                >
                    {upvotingId === business.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                    <span>{business.upvotes.toLocaleString()} Upvotes</span>
                </Button>
                 <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{business.interestedInvestorsCount || 0} Investors</span>
                </div>
            </div>
           {userProfile?.role === "Investor" && !isCreator && (
            existingDealId ? (
                <Button asChild>
                    <Link href={`/deals/${existingDealId}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View Deal
                    </Link>
                </Button>
            ) : (
                <Button onClick={handleStartDealClick} disabled={isDealLoading || business.isClosed}>
                    {isDealLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coffee className="mr-2 h-4 w-4" />}
                    {isPaymentEnabled ? "Start a Deal" : "Start Deal (Free)"}
                </Button>
            )
          )}
        </CardFooter>
      </Card>
    </>
  );
}
