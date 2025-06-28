"use client";

import { useState, useEffect } from "react";
import type { Deal, Message, UserProfile, Problem, Idea, Business } from "@/lib/types";
import ChatInterface from "@/components/chat-interface";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, DollarSign, Handshake, Info, Loader2, Ban } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { updateDealStatusAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const handleUpdateStatus = async (status: 'completed' | 'cancelled') => {
    if (!userProfile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('dealId', deal.id);
    formData.append('status', status);
    formData.append('investorId', userProfile.uid);

    const result = await updateDealStatusAction(formData);

    if (result.success) {
        toast({ title: "Success", description: result.message });
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const isInvestor = userProfile?.uid === deal.investor.userId;

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
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
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
                        </div>

                        {isInvestor && deal.status === 'active' && (
                            <div className="flex gap-2 sm:ml-auto flex-shrink-0">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" disabled={isSubmitting || authLoading}>
                                            <Handshake className="mr-2 h-4 w-4" />
                                            Finalize Deal
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Finalize This Deal?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will mark the deal as complete, and the chat will be closed. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleUpdateStatus('completed')}>
                                                Yes, Finalize
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={isSubmitting || authLoading}>
                                            <Ban className="mr-2 h-4 w-4" />
                                            Cancel Deal
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel This Deal?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently cancel the deal, and the chat will be closed. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleUpdateStatus('cancelled')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Yes, Cancel Deal
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>
            
            <ChatInterface 
                dealId={deal.id} 
                initialMessages={initialMessages} 
                dealStatus={deal.status}
            />
        </div>
      </main>
  );
}
