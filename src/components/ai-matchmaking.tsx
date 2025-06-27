"use client";

import { useFormStatus } from "react-dom";
import { getAiPairings, FormState } from "@/app/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wand2, Users, Link as LinkIcon, Loader2, ArrowRight } from "lucide-react";
import { allCreators } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useActionState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const initialState: FormState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Pairings
        </>
      )}
    </Button>
  );
}

export default function AiMatchmaking() {
  const [state, formAction] = useActionState(getAiPairings, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.pairings) {
      toast({
        variant: state.error ? "destructive" : "default",
        title: state.error ? "Error" : "AI Message",
        description: state.message,
      });
    }
  }, [state, toast]);

  const findCreator = (id: string) => allCreators.find(c => c.id === id);

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            AI-Powered Matchmaking
          </CardTitle>
          <CardDescription>
            Describe your investment profile, and our AI will suggest high-potential problem/solution creator pairings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full gap-2">
            <Label htmlFor="investor-profile">Your Investor Profile</Label>
            <Textarea
              id="investor-profile"
              name="investorProfile"
              placeholder="e.g., 'Early-stage fund focused on sustainable tech, particularly in renewable energy and circular economy. Ticket size $100k-$500k. Looking for strong technical teams with a clear path to market.'"
              className="min-h-[120px]"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <SubmitButton />
        </CardFooter>
      </form>
      
      {state.pairings && state.pairings.length > 0 && (
        <div className="border-t p-6">
          <h3 className="mb-4 text-lg font-semibold">Suggested Pairings</h3>
          <div className="space-y-4">
            {state.pairings.map((pairing, index) => {
              const problemCreator = findCreator(pairing.problemCreatorId);
              const solutionCreator = findCreator(pairing.solutionCreatorId);
              if (!problemCreator || !solutionCreator) return null;

              return (
                <Card key={index} className="bg-muted/50">
                  <CardHeader>
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={problemCreator.avatarUrl} />
                          <AvatarFallback>{problemCreator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-semibold">
                          <p className="text-sm text-muted-foreground">Problem</p>
                          {problemCreator.name}
                        </div>
                      </div>
                      <LinkIcon className="h-5 w-5 shrink-0 text-primary" />
                      <div className="flex items-center gap-2">
                         <Avatar>
                          <AvatarImage src={solutionCreator.avatarUrl} />
                          <AvatarFallback>{solutionCreator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-semibold">
                          <p className="text-sm text-muted-foreground">Solution</p>
                          {solutionCreator.name}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Wand2 className="h-4 w-4" />
                      <AlertTitle>AI's Reasoning</AlertTitle>
                      <AlertDescription>{pairing.matchReason}</AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="ml-auto">
                      View Partnership Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
