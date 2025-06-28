import Header from "@/components/header";
import { getDeal, getMessages, getUserProfile, getProblem, getIdea, getBusiness } from "@/lib/firestore";
import { notFound } from "next/navigation";
import type { UserProfile, Problem, Idea, Business } from "@/lib/types";
import DealClientPage from "@/components/deal-client-page";

export default async function DealPage({ params }: { params: { id: string } }) {
  const deal = await getDeal(params.id);
  
  if (!deal) {
    notFound();
  }

  const initialMessages = await getMessages(params.id);

  let relatedItem: Problem | Idea | Business | null = null;
  if (deal.type === 'problem') {
    relatedItem = await getProblem(deal.relatedItemId);
  } else if (deal.type === 'idea') {
    relatedItem = await getIdea(deal.relatedItemId);
  } else if (deal.type === 'business') {
    relatedItem = await getBusiness(deal.relatedItemId);
  }
  
  const participantProfiles = await Promise.all(
      (deal.participantIds || []).map(id => getUserProfile(id))
  );
  
  const participants = participantProfiles.filter(p => p !== null) as UserProfile[];

  const serializable = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="flex flex-col h-screen">
      <Header />
       <DealClientPage 
          initialDeal={serializable(deal)}
          initialMessages={serializable(initialMessages)}
          participants={serializable(participants)}
          relatedItem={serializable(relatedItem)}
        />
    </div>
  );
}
