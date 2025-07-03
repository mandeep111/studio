
import type { Idea } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ThumbsUp, Users, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface IdeaCardProps {
  idea: Idea;
  onUpvote: (ideaId: string) => void;
  isUpvoting: boolean;
}

export default function IdeaCard({ idea, onUpvote, isUpvoting }: IdeaCardProps) {
  const { user } = useAuth();
  const isUpvoted = user ? idea.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === idea.creator.userId : false;
  
  return (
    <Card className={cn("flex flex-col overflow-hidden transition-all hover:shadow-lg", idea.isClosed && "opacity-60 bg-muted/50")}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Link href={`/users/${idea.creator.userId}`} onClick={(e) => e.stopPropagation()}>
            <Avatar>
              <AvatarImage src={idea.creator.avatarUrl} alt={idea.creator.name} />
              <AvatarFallback>{idea.creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <CardTitle className="text-lg">
              <Link href={`/ideas/${idea.id}`} className="hover:underline">
                {idea.title}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2">
                <CardDescription>by <Link href={`/users/${idea.creator.userId}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{idea.creator.name}</Link></CardDescription>
                {idea.isClosed && <Badge variant="destructive">Closed</Badge>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{idea.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {idea.tags.map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 p-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Button variant={isUpvoted ? 'default' : 'outline'} size="sm" onClick={() => onUpvote(idea.id)} disabled={!user || isCreator || isUpvoting} className="flex items-center gap-1 px-2 h-8">
              {isUpvoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
              <span>{idea.upvotes.toLocaleString()}</span>
            </Button>
            <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{idea.interestedInvestorsCount || 0}</span>
            </div>
        </div>
         <Link href={`/ideas/${idea.id}`} passHref>
          <Button size="sm" disabled={isUpvoting || idea.isClosed}>View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
