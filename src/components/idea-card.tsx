
import type { Idea } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ThumbsUp } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";

interface IdeaCardProps {
  idea: Idea;
  onUpvote: (ideaId: string) => void;
}

export default function IdeaCard({ idea, onUpvote }: IdeaCardProps) {
  const { user } = useAuth();
  const isUpvoted = user ? idea.upvotedBy.includes(user.uid) : false;
  const isCreator = user ? user.uid === idea.creator.userId : false;
  
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={idea.creator.avatarUrl} alt={idea.creator.name} />
            <AvatarFallback>{idea.creator.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{idea.title}</CardTitle>
            <CardDescription>by {idea.creator.name}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{idea.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 p-4">
        <Button variant={isUpvoted ? 'default' : 'outline'} size="sm" onClick={() => onUpvote(idea.id)} disabled={!user || isCreator}>
          <ThumbsUp className="h-4 w-4 mr-2" />
          <span>{idea.upvotes.toLocaleString()}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
