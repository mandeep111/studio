
import type { Solution } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface SolutionCardProps {
  solution: Solution;
  onUpvote: (solutionId: string) => void;
}

export default function SolutionCard({ solution, onUpvote }: SolutionCardProps) {
  const { user } = useAuth();
  const isUpvoted = user ? solution.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === solution.creator.userId : false;
  
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
      <CardFooter className="flex justify-between bg-muted/50 p-4">
        <Button 
            variant={isUpvoted ? "default" : "outline"} 
            size="sm"
            onClick={() => onUpvote(solution.id)}
            disabled={!user || isCreator}
            className="flex items-center gap-1 px-2 h-8"
        >
            <ThumbsUp className="h-4 w-4" />
            <span>{solution.upvotes.toLocaleString()}</span>
        </Button>
        <Link href={`/solutions/${solution.id}`} passHref>
            <Button size="sm">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
