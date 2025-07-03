
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSolution } from "@/lib/firestore";
import { findExistingDealAction, deleteItemAction, upvoteItemAction } from "@/app/actions";
import type { Solution } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ExternalLink, ThumbsUp, File, Loader2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

interface SolutionClientPageProps {
  initialSolution: Solution;
}

export default function SolutionClientPage({ initialSolution }: SolutionClientPageProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [solution, setSolution] = useState<Solution>(initialSolution);
  const [existingDealId, setExistingDealId] = useState<string | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  
  useEffect(() => {
    setSolution(initialSolution);
    if (userProfile && userProfile.role === 'Investor') {
        setLoadingDeal(true);
        findExistingDealAction(initialSolution.problemId, userProfile.uid).then(result => {
            if (result.dealId) {
                setExistingDealId(result.dealId);
            }
            setLoadingDeal(false);
        });
    } else {
        setLoadingDeal(false);
    }
  }, [initialSolution, userProfile]);

  const handleUpvote = async () => {
    if (!user || !solution || user.uid === solution.creator.userId || !!upvotingId) return;

    setUpvotingId(solution.id);
    
    setSolution(prevSolution => {
        if (!prevSolution) return prevSolution;
        const isUpvoted = prevSolution.upvotedBy.includes(user.uid);
        return {
            ...prevSolution,
            upvotes: isUpvoted ? prevSolution.upvotes - 1 : prevSolution.upvotes + 1,
            upvotedBy: isUpvoted ? prevSolution.upvotedBy.filter(uid => uid !== user.uid) : [...prevSolution.upvotedBy, user.uid]
        };
    });

    const result = await upvoteItemAction(user.uid, solution.id, 'solution');

    if (!result.success) {
        toast({variant: "destructive", title: "Error", description: result.message});
        const revertedSolution = await getSolution(solution.id);
        if (revertedSolution) {
          setSolution(revertedSolution);
        }
    }
    setUpvotingId(null);
  };
  
  const handleDelete = async () => {
    if (!user || user.uid !== solution.creator.userId) return;
    setIsDeleting(true);

    const formData = new FormData();
    formData.append('type', 'solution');
    formData.append('id', solution.id);

    const result = await deleteItemAction(formData);

    if(result.success) {
      toast({ title: "Success", description: "Solution deleted successfully." });
      router.push(`/problems/${solution.problemId}`);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
      setIsDeleting(false);
    }
  };

  if (!solution) return null;

  const isUpvoted = user ? solution.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === solution.creator.userId : false;
  const canViewSolution = !loadingDeal && ((userProfile?.role === 'Investor' || userProfile?.role === 'Admin') || !!existingDealId);


  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Link href={`/problems/${solution.problemId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to problem
        </Link>
        {isCreator && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                  <Link href={`/solutions/${solution.id}/edit`}>
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
                              This action cannot be undone. This will permanently delete your solution.
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
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Solution for: <Link className="text-primary hover:underline" href={`/problems/${solution.problemId}`}>{solution.problemTitle}</Link></CardDescription>
              {solution.isClosed && <Badge variant="destructive">Closed</Badge>}
            </div>
          <div className="flex items-start gap-4 pt-2">
            <Link href={`/users/${solution.creator.userId}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={solution.creator.avatarUrl} alt={solution.creator.name} />
                <AvatarFallback>{solution.creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <CardTitle className="text-2xl lg:text-3xl">Solution by {solution.creator.name}</CardTitle>
              <CardDescription className="mt-1">
                Expertise: <Link href={`/users/${solution.creator.userId}`} className="hover:underline font-medium text-foreground">{solution.creator.expertise}</Link>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {loadingDeal ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : canViewSolution ? (
                <>
                    <p className="text-lg leading-relaxed">{solution.description}</p>
                    {solution.attachmentUrl && (
                        <div className="mt-6 border-t pt-4">
                            <h4 className="font-semibold mb-2">Attachment</h4>
                            <Button asChild variant="outline">
                                <a href={solution.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                    <File className="mr-2 h-4 w-4" />
                                    {solution.attachmentFileName || 'Download Attachment'}
                                </a>
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <p className="text-lg leading-relaxed">{`${solution.description.substring(0, 200)}...`}</p>
                    <div className="mt-4 rounded-md border bg-background p-4 text-center">
                        <p className="text-sm font-semibold">This solution is protected.</p>
                        <p className="text-sm text-muted-foreground">You must have an active deal for the related problem to view full details.</p>
                        <Button asChild className="mt-2">
                            <Link href={`/problems/${solution.problemId}`}>Go to Problem Page</Link>
                        </Button>
                    </div>
                </>
            )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant={isUpvoted ? "default" : "outline"} size="sm" onClick={handleUpvote} disabled={!user || isCreator || !!upvotingId}>
             {upvotingId === solution.id ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <ThumbsUp className="h-5 w-5 mr-2" />}
            <span>{solution.upvotes.toLocaleString()} Upvotes</span>
          </Button>
          <Link href={`/problems/${solution.problemId}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              View Original Problem
              <ExternalLink className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </>
  );
}
