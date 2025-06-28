import type { UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Handshake, User, ThumbsUp } from "lucide-react";
import Link from "next/link";

interface InvestorCardProps {
  investor: UserProfile;
}

export default function InvestorCard({ investor }: InvestorCardProps) {

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={investor.avatarUrl} alt={investor.name} />
          <AvatarFallback>{investor.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">
             <Link href={`/users/${investor.uid}`} className="hover:underline">
                {investor.name}
            </Link>
          </CardTitle>
          <CardDescription>{investor.expertise}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-primary" />
              <span>{(investor.dealsCount || 0).toLocaleString()} Deals</span>
            </div>
             <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-primary" />
              <span>{(investor.upvotes || 0).toLocaleString()} Upvotes</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/users/${investor.uid}`}>
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
