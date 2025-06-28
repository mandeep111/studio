import type { Business } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ThumbsUp, Briefcase, DollarSign } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface BusinessCardProps {
  business: Business;
  onUpvote: (businessId: string) => void;
}

export default function BusinessCard({ business, onUpvote }: BusinessCardProps) {
  const { user } = useAuth();
  const isUpvoted = user ? business.upvotedBy.includes(user.uid) : false;

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <Avatar>
          <AvatarImage src={business.creator.avatarUrl} alt={business.creator.name} />
          <AvatarFallback>{business.creator.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">
            <Link href={`/businesses/${business.id}`} className="hover:underline">
              {business.title}
            </Link>
          </CardTitle>
          <CardDescription>by {business.creator.name}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-3 text-sm text-muted-foreground">{business.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{business.stage}</Badge>
            {business.price && (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> 
                    Funding: {business.price.toLocaleString()}
                </Badge>
            )}
            {business.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 p-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Button 
                variant={isUpvoted ? "default" : "outline"} 
                size="sm"
                onClick={() => onUpvote(business.id)}
                disabled={!user}
                className="flex items-center gap-1 px-2 h-8"
            >
                <ThumbsUp className="h-4 w-4" />
                <span>{business.upvotes.toLocaleString()}</span>
            </Button>
        </div>
        <Link href={`/businesses/${business.id}`} passHref>
          <Button size="sm" variant="outline">
            <Briefcase className="mr-2 h-4 w-4" />
            View Business
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
