
import type { Problem } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare, ThumbsUp, Lightbulb, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ProblemCardProps {
  problem: Problem;
  onUpvote: (problemId: string, creatorId: string) => void;
  isUpvoting: boolean;
}

export default function ProblemCard({ problem, onUpvote, isUpvoting }: ProblemCardProps) {
  const { user } = useAuth();
  const isUpvoted = user ? problem.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === problem.creator.userId : false;

  return (
    <Card className={cn("flex flex-col overflow-hidden transition-all hover:shadow-lg", problem.isClosed && "opacity-60 bg-muted/50")}>
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <Link href={`/users/${problem.creator.userId}`} onClick={(e) => e.stopPropagation()}>
          <Avatar>
            <AvatarImage src={problem.creator.avatarUrl} alt={problem.creator.name} />
            <AvatarFallback>{problem.creator.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <CardTitle className="text-lg">
            <Link href={`/problems/${problem.id}`} className="hover:underline">
              {problem.title}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-2">
            <CardDescription>by <Link href={`/users/${problem.creator.userId}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{problem.creator.name}</Link></CardDescription>
            {problem.isClosed && <Badge variant="destructive">Closed</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-3 text-sm text-muted-foreground">{problem.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {problem.tags.map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 p-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Button 
                variant={isUpvoted ? "default" : "outline"} 
                size="sm"
                onClick={() => onUpvote(problem.id, problem.creator.userId)}
                disabled={!user || isCreator || isUpvoting}
                className="flex items-center gap-1 px-2 h-8"
            >
                {isUpvoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                <span>{problem.upvotes.toLocaleString()}</span>
            </Button>
            <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{problem.interestedInvestorsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{problem.solutionsCount.toLocaleString()}</span>
            </div>
        </div>
        <Link href={`/problems/${problem.id}`} passHref>
          <Button size="sm" variant="outline" disabled={isUpvoting || problem.isClosed}>
            <Lightbulb className="mr-2 h-4 w-4" />
            View & Discuss
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
