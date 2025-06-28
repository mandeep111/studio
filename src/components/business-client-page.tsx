"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getBusiness, upvoteBusiness } from "@/lib/firestore";
import type { Business } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, CheckCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubmitBusinessDialog } from "@/components/submit-business-dialog";

interface BusinessClientPageProps {
  initialBusiness: Business;
}

export default function BusinessClientPage({ initialBusiness }: BusinessClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business>(initialBusiness);

  const fetchBusiness = useCallback(async () => {
    const businessData = await getBusiness(business.id);
    if (businessData) {
      setBusiness(businessData);
    }
  }, [business.id]);

  useEffect(() => {
    setBusiness(initialBusiness);
  }, [initialBusiness]);


  const handleBusinessUpvote = async () => {
    if (!user || !business) return;
    try {
        await upvoteBusiness(business.id, user.uid);
        fetchBusiness();
        toast({title: "Success", description: "Your upvote has been recorded."})
    } catch(e) {
        toast({variant: "destructive", title: "Error", description: "Could not record upvote."})
    }
  };

  const isBusinessUpvoted = user ? business.upvotedBy.includes(user.uid) : false;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to all businesses
        </Link>
        {(userProfile?.role === 'User' || userProfile?.role === 'Admin') && (
          <SubmitBusinessDialog />
        )}
      </div>
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
        </CardContent>
        <CardFooter className="flex items-center gap-6 text-muted-foreground">
          <button
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleBusinessUpvote}
            disabled={!user || isBusinessUpvoted}
          >
            <ThumbsUp className="h-5 w-5" />
            <span>{business.upvotes.toLocaleString()} Upvotes</span>
          </button>
        </CardFooter>
      </Card>
    </>
  );
}
