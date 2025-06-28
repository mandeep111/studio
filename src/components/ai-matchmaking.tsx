"use client";

import { getAiPairings, startDealAction, type AiPairingsFormState, findExistingDealAction } from "@/app/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wand2, Link as LinkIcon, Sparkles, Coffee, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useActionState, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "./submit-button";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile } from "@/lib/types";
import { getAllUsers, getPaymentSettings } from "@/lib/firestore";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MembershipPopup from "./membership-popup";
import BuyMeACoffeePopup from "./buy-me-a-coffee-popup";
import { useRouter } from "next/navigation";

const initialState: AiPairingsFormState = {
  message: "",
};

export default function AiMatchmaking() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [state, formAction] = useActionState(getAiPairings, initialState);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const { toast } = useToast();
  
  const [isMembershipPopupOpen, setMembershipPopupOpen] = useState(false);
  const [isCoffeePopupOpen, setCoffeePopupOpen] = useState(false);
  const [selectedPairing, setSelectedPairing] = useState<any>(null);
  const [isDealLoading, setIsDealLoading] = useState(false);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(true);


  useEffect(() => {
    getAllUsers().then(setAllUsers);
    getPaymentSettings().then(settings => setIsPaymentEnabled(settings.isEnabled));
  }, []);

  useEffect(() => {
    if (state.message && !state.pairings) {
      toast({
        variant: state.error ? "destructive" : "default",
        title: state.error ? "Error" : "AI Message",
        description: state.message,
      });
    }
  }, [state, toast]);

  const findCreator = (id: string) => allUsers.find(c => c.uid === id);
  
  const handleStartDealClick = async (pairing: any) => {
    if (!userProfile) return;
    
    setSelectedPairing(pairing);
    setIsDealLoading(true);

    const existingDeal = await findExistingDealAction(pairing.problemId, userProfile.uid);
    if (existingDeal.dealId) {
      router.push(`/deals/${existingDeal.dealId}`);
      return;
    }

    if (isPaymentEnabled) {
      setCoffeePopupOpen(true);
      setIsDealLoading(false);
    } else {
      await confirmStartDeal(0);
    }
  }

  const confirmStartDeal = async (amount: number) => {
    if (!selectedPairing || !userProfile) return;

    setIsDealLoading(true);

    const result = await startDealAction(
      userProfile,
      selectedPairing.problemCreatorId,
      selectedPairing.problemId,
      selectedPairing.problemTitle,
      'problem',
      amount,
      selectedPairing.solutionCreatorId
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
  }

  const isInvestor = userProfile?.role === 'Investor' || userProfile?.role === 'Admin';

  return (
    <>
      <MembershipPopup isOpen={isMembershipPopupOpen} onOpenChange={setMembershipPopupOpen} />
      <BuyMeACoffeePopup isOpen={isCoffeePopupOpen} onOpenChange={setCoffeePopupOpen} onConfirm={confirmStartDeal} />

      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI-Powered Matchmaking
            </CardTitle>
            <CardDescription>
              Describe your investment profile, and our AI will suggest high-potential problem/solution creator pairings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="investor-profile">Your Investor Profile</Label>
              <Textarea
                id="investor-profile"
                name="investorProfile"
                placeholder="e.g., 'Early-stage fund focused on sustainable tech, particularly in renewable energy and circular economy. Ticket size $100k-$500k. Looking for strong technical teams with a clear path to market.'"
                className="min-h-[120px]"
                required
                disabled={!isInvestor}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            {isInvestor ? (
              <SubmitButton pendingText="Generating..." className="w-full sm:w-auto">
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Pairings
              </SubmitButton>
            ) : (
              <Button type="button" onClick={() => setMembershipPopupOpen(true)} className="w-full sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" />
                Become an Investor to Use AI Matchmaking
              </Button>
            )}
          </CardFooter>
        </form>
        
        {state.pairings && state.pairings.length > 0 && isInvestor && (
          <div className="border-t p-6">
            <h3 className="mb-4 text-lg font-semibold">Suggested Pairings</h3>
            <div className="space-y-4">
              {state.pairings.map((pairing, index) => {
                const problemCreator = findCreator(pairing.problemCreatorId);
                const solutionCreator = findCreator(pairing.solutionCreatorId);
                if (!problemCreator || !solutionCreator) return null;

                return (
                  <Card key={index} className="bg-muted/50">
                    <CardHeader>
                      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={problemCreator.avatarUrl} />
                            <AvatarFallback>{problemCreator.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-semibold">
                            <p className="text-sm text-muted-foreground">Problem</p>
                            {problemCreator.name}
                          </div>
                        </div>
                        <LinkIcon className="h-5 w-5 shrink-0 text-primary" />
                        <div className="flex items-center gap-2">
                           <Avatar>
                            <AvatarImage src={solutionCreator.avatarUrl} />
                            <AvatarFallback>{solutionCreator.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-semibold">
                            <p className="text-sm text-muted-foreground">Solution</p>
                            {solutionCreator.name}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertTitle>AI's Reasoning</AlertTitle>
                        <AlertDescription>{pairing.matchReason}</AlertDescription>
                      </Alert>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        size="sm" 
                        className="ml-auto" 
                        onClick={() => handleStartDealClick(pairing)}
                        disabled={isDealLoading && selectedPairing?.problemId === pairing.problemId}
                       >
                        {isDealLoading && selectedPairing?.problemId === pairing.problemId ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Coffee className="mr-2 h-4 w-4" />
                        )}
                        Start Deal
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
