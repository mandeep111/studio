import Header from "@/components/header";
import { getDeal, getMessages } from "@/lib/firestore";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatInterface from "@/components/chat-interface";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default async function DealPage({ params }: { params: { id: string } }) {
  const deal = await getDeal(params.id);
  
  if (!deal) {
    notFound();
  }

  const initialMessages = await getMessages(params.id);

  const serializable = (data: any) => JSON.parse(JSON.stringify(data));
  const participants = [deal.investor, deal.problemCreator];
  if (deal.solutionCreator) {
    participants.push(deal.solutionCreator);
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex flex-col bg-muted/40">
        <div className="container mx-auto py-4 flex-1 flex flex-col">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Deal: {deal.problemTitle}</CardTitle>
                    <CardDescription>A conversation between the investor and creators.</CardDescription>
                    <div className="flex items-center space-x-4 pt-2">
                        <div className="font-semibold">Participants:</div>
                        {participants.map(p => (
                             <div key={p.userId} className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={p.avatarUrl} />
                                    <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </CardHeader>
            </Card>
            
            <ChatInterface dealId={params.id} initialMessages={serializable(initialMessages)} />
        </div>
      </main>
    </div>
  );
}
