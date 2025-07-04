
import Header from "@/components/header";
import { getDeal, getMessages, getUserProfile, getProblem, getIdea, getBusiness } from "@/lib/firestore";
import type { UserProfile, Problem, Idea, Business } from "@/lib/types";
import DealClientPage from "@/components/deal-client-page";
import DealsListPanel from "@/components/deals-list-panel";

export default async function DealPage({ params }: { params: { id: string } }) {
  const deal = await getDeal(params.id);

  const initialMessages = await getMessages(params.id);

  let relatedItem: Problem | Idea | Business | null = null;
  // This will now throw an error if the related item is not found,
  // which will be caught by the nearest error.tsx boundary.
  if (deal.type === 'problem') {
    relatedItem = await getProblem(deal.relatedItemId);
  } else if (deal.type === 'idea') {
    relatedItem = await getIdea(deal.relatedItemId);
  } else if (deal.type === 'business') {
    relatedItem = await getBusiness(deal.relatedItemId);
  }
  
  const participantProfiles = await Promise.all(
      (deal.participantIds || []).map(id => getUserProfile(id).catch(err => {
          console.error(`Failed to fetch profile for participant ${id}:`, err);
          // Return null or a placeholder/error object if a participant is not found
          // This prevents the entire page from crashing if one participant is deleted.
          return null;
      }))
  );
  
  const participants = participantProfiles.filter(p => p !== null) as UserProfile[];

  const serializable = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="flex flex-col h-screen">
      <Header />
       <div className="flex-1 flex overflow-hidden">
        <DealsListPanel activeDealId={params.id} />
        <main className="flex-1 flex flex-col">
          <DealClientPage 
            initialDeal={serializable(deal)}
            initialMessages={serializable(initialMessages)}
            participants={serializable(participants)}
            relatedItem={serializable(relatedItem)}
          />
        </main>
      </div>
    </div>
  );
}
