"use client";

import { useState, useEffect } from "react";
import type { Deal, Message, UserProfile, Problem, Idea, Business } from "@/lib/types";
import ChatInterface from "@/components/chat-interface";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, DollarSign, Handshake, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { markDealAsCompleteAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DealClientPageProps {
  initialDeal: Deal;
  initialMessages: Message[];
  participants: UserProfile[];
  relatedItem: Problem | Idea | Business | null;
}

export default function DealClientPage({
  initialDeal,
  initialMessages,
  participants,
  relatedItem
}: DealClientPageProps) {
  const [deal, setDeal] = useState<Deal>(initialDeal);
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "deals", initialDeal.id), (doc) => {
      if (doc.exists()) {
        setDeal({ id: doc.id, ...doc.data() } as Deal);
      }
    });
    return () => unsub();
  }, [initialDeal.id]);

  const handleMarkAsComplete = async () => {
    if (!userProfile || deal.status === 'completed' || deal.completionVotes.includes(userProfile.uid)) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('dealId', deal.id);
    formData.append('userId', userProfile.uid);
    formData.append('userName', userProfile.name);

    const result = await markDealAsCompleteAction(formData);

    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const waitingFor = participants.filter(p => !deal.completionVotes.includes(p.uid));

  return (
    <main className="flex-1 flex flex-col bg-muted/40">
        <div className="container mx-auto py-4 flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Deal: {deal.title}</CardTitle>
                    {relatedItem?.price && (
                        <CardDescription className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Budget: ${relatedItem.price.toLocaleString()}
                        </CardDescription>
                    )}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="font-semibold">Participants:</div>
                        {participants.map(p => (
                             <div key={p.uid} className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={p.avatarUrl} />
                                    <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </CardHeader>
                {deal.status === 'active' && (
                    <CardFooter className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {deal.completionVotes.length > 0 && (
                            <Alert variant="default" className="w-full sm:w-auto flex-grow">
                                <Info className="h-4 w-4"/>
                                <AlertTitle>Pending Completion</AlertTitle>
                                <AlertDescription>
                                    Waiting for: {waitingFor.map(p => p.name).join(', ')}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button 
                            onClick={handleMarkAsComplete}
                            disabled={isSubmitting || deal.completionVotes.includes(userProfile?.uid || '') || authLoading}
                            className="w-full sm:w-auto sm:ml-auto"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Handshake className="mr-2 h-4 w-4" />}
                            {deal.completionVotes.includes(userProfile?.uid || '') ? "You Voted to Complete" : "Mark as Complete"}
                        </Button>
                    </CardFooter>
                )}
            </Card>
            
            <ChatInterface 
                dealId={deal.id} 
                initialMessages={initialMessages} 
                isCompleted={deal.status === 'completed'}
            />
        </div>
      </main>
  );
}
