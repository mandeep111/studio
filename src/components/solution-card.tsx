
import type { Solution } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ThumbsUp, Coffee, Loader2, MessageSquare, File } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

interface SolutionCardProps {
  solution: Solution;
  onUpvote: (solutionId: string) => void;
  onStartDeal?: (solution: Solution) => void;
  isPaymentEnabled?: boolean;
  isUpvoting: boolean;
  existingDealId?: string | null;
  isProtected?: boolean;
}

export default function SolutionCard({ solution, onUpvote, onStartDeal, isPaymentEnabled, isUpvoting, existingDealId, isProtected }: SolutionCardProps) {
  const { user, userProfile } = useAuth();
  const isUpvoted = user ? solution.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === solution.creator.userId : false;
  const isInvestor = userProfile?.role === "Investor" || userProfile?.role === "Admin";

  return (
    <Card className={cn("flex flex-col overflow-hidden transition-all hover:shadow-lg", solution.isClosed && "opacity-60 bg-muted/50")}>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardDescription>Solution for: <Link href={`/problems/${solution.problemId}`} className="text-primary hover:underline">{solution.problemTitle}</Link></CardDescription>
            {solution.isClosed && <Badge variant="destructive">Closed</Badge>}
        </div>
        <CardTitle className="text-lg">Solution by {solution.creator.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={solution.creator.avatarUrl} alt={solution.creator.name} />
            <AvatarFallback>{solution.creator.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{isProtected ? `${solution.description.substring(0, 150)}...` : solution.description}</p>
             {isProtected ? (
                <div className="mt-4 rounded-md border bg-background p-4 text-center">
                    <p className="text-sm font-semibold">This solution is protected.</p>
                    <p className="text-sm text-muted-foreground">Start a deal to view the full details and any attachments.</p>
                </div>
             ) : solution.attachmentUrl && (
                <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                        <a href={solution.attachmentUrl} target="_blank" rel="noopener noreferrer">
                            <File className="mr-2 h-4 w-4" />
                            View Attachment
                        </a>
                    </Button>
                </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
        <Button 
            variant={isUpvoted ? "default" : "outline"} 
            size="sm"
            onClick={() => onUpvote(solution.id)}
            disabled={!user || isCreator || isUpvoting}
            className="flex items-center gap-1 px-2 h-8"
        >
            {isUpvoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
            <span>{solution.upvotes.toLocaleString()}</span>
        </Button>
        <div className="flex items-center gap-2">
            <Link href={`/solutions/${solution.id}`} passHref>
                <Button size="sm" variant="outline" disabled={isUpvoting || solution.isClosed}>View Details</Button>
            </Link>
            {isInvestor && !isCreator && onStartDeal && (
                existingDealId ? (
                    <Button asChild size="sm">
                        <Link href={`/deals/${existingDealId}`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            View Deal
                        </Link>
                    </Button>
                ) : (
                    <Button size="sm" onClick={() => onStartDeal(solution)} disabled={isUpvoting || solution.isClosed}>
                        <Coffee className="mr-2 h-4 w-4" />
                        {isPaymentEnabled ? "Start Deal" : "Start (Free)"}
                    </Button>
                )
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
