
import type { Solution } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ThumbsUp, Coffee, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface SolutionCardProps {
  solution: Solution;
  onUpvote: (solutionId: string) => void;
  onStartDeal?: (solution: Solution) => void;
  isPaymentEnabled?: boolean;
  isUpvoting: boolean;
}

export default function SolutionCard({ solution, onUpvote, onStartDeal, isPaymentEnabled, isUpvoting }: SolutionCardProps) {
  const { user, userProfile } = useAuth();
  const isUpvoted = user ? solution.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === solution.creator.userId : false;
  const isInvestor = userProfile?.role === "Investor" || userProfile?.role === "Admin";
  
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader>
        <CardDescription>Solution for: <Link href={`/problems/${solution.problemId}`} className="text-primary hover:underline">{solution.problemTitle}</Link></CardDescription>
        <CardTitle className="text-lg">Solution by {solution.creator.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={solution.creator.avatarUrl} alt={solution.creator.name} />
            <AvatarFallback>{solution.creator.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">{solution.description}</p>
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
                <Button size="sm" variant="outline" disabled={isUpvoting}>View Details</Button>
            </Link>
            {isInvestor && !isCreator && onStartDeal && (
                 <Button size="sm" onClick={() => onStartDeal(solution)} disabled={isUpvoting}>
                    <Coffee className="mr-2 h-4 w-4" />
                    {isPaymentEnabled ? "Start Deal" : "Start (Free)"}
                </Button>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
