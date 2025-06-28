
import type { Problem } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare, ThumbsUp, Lightbulb, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface ProblemCardProps {
  problem: Problem;
  onUpvote: (problemId: string) => void;
}

export default function ProblemCard({ problem, onUpvote }: ProblemCardProps) {
  const { user } = useAuth();
  const isUpvoted = user ? problem.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === problem.creator.userId : false;

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <Avatar>
          <AvatarImage src={problem.creator.avatarUrl} alt={problem.creator.name} />
          <AvatarFallback>{problem.creator.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">
            <Link href={`/problems/${problem.id}`} className="hover:underline">
              {problem.title}
            </Link>
          </CardTitle>
          <CardDescription>by {problem.creator.name}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-3 text-sm text-muted-foreground">{problem.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {problem.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 p-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Button 
                variant={isUpvoted ? "default" : "outline"} 
                size="sm"
                onClick={() => onUpvote(problem.id)}
                disabled={!user || isCreator}
                className="flex items-center gap-1 px-2 h-8"
            >
                <ThumbsUp className="h-4 w-4" />
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
          <Button size="sm" variant="outline">
            <Lightbulb className="mr-2 h-4 w-4" />
            View & Discuss
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
