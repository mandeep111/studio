"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getIdea, upvoteIdea } from "@/lib/firestore";
import type { Idea } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, Coffee, File, Gem, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubmitIdeaDialog } from "@/components/submit-idea-dialog";
import BuyMeACoffeePopup from "./buy-me-a-coffee-popup";
import { startDealAction } from "@/app/actions";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface IdeaClientPageProps {
  initialIdea: Idea;
}

export default function IdeaClientPage({ initialIdea }: IdeaClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [idea, setIdea] = useState<Idea>(initialIdea);
  const [isCoffeePopupOpen, setCoffeePopupOpen] = useState(false);
  const [isDealLoading, setIsDealLoading] = useState(false);

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
    if (!user || !idea) return;
    try {
        await upvoteIdea(idea.id, user.uid);
        fetchIdea();
        toast({title: "Success", description: "Your upvote has been recorded."})
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."})
    }
  };

   const handleStartDeal = async (amount: number) => {
    if (!userProfile || userProfile.role !== "Investor" || !idea) return;
    
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
        {(userProfile?.role === 'User' || userProfile?.role === 'Admin') && (
          <SubmitIdeaDialog onIdeaCreated={fetchIdea} />
        )}
      </div>
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
            <div className="flex items-center gap-6 text-muted-foreground">
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
           {userProfile?.role === "Investor" && !isCreator && (
            <Button onClick={() => setCoffeePopupOpen(true)} disabled={isDealLoading}>
              {isDealLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coffee className="mr-2 h-4 w-4" />}
              Start a Deal
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
