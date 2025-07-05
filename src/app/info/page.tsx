import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, ShieldCheck } from 'lucide-react';

export default function InfoPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Info & Safety Center</h1>
                <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl/relaxed mt-4">
                    Guidance for using Problem2Profit effectively and safely.
                </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-6 w-6 text-primary" />
                            For Creators (That's You!)
                        </CardTitle>
                        <CardDescription>Your Idea Deserves a Stage.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>At Problem2Profit, you don’t need a polished pitch or a three-piece suit. All you need is an idea that solves a problem. Here's how to share it safely:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Don't Spill the Secret Sauce:</strong> Share just enough to spark curiosity. Think of your public description as a teaser, but keep your core intellectual property private.</li>
                            <li><strong>Use Private Attachments:</strong> You can upload business plans or prototypes privately. These are only visible to investors who express serious interest and start a deal with you.</li>
                            <li><strong>Control the Conversation:</strong> You control the pace and the pitch. If an investor's offer doesn’t feel right, you get to say “no thanks” like a boss.</li>
                            <li><strong>Report Suspicious Activity:</strong> If you ever feel an investor is acting in bad faith, please report it to our admin team immediately.</li>
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            For Investors
                        </CardTitle>
                         <CardDescription>We Didn’t Forget You!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>Tired of recycled startup pitches? Problem2Profit gives you access to a fresh pipeline of problems, solutions, and scalable businesses from creators all over the world.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Use the AI Matchmaker:</strong> Our AI tool helps you discover ideas aligned with your interests by analyzing creator reputation and expertise.</li>
                             <li><strong>Platform Facilitation Fee:</strong> The $20 deal contribution fee helps maintain the platform and ensures creators are connected with serious investors. All further financial transactions must be handled through external, legally-binding agreements. We don't take a cut of your deals.</li>
                             <li><strong>Vet in Private Chats:</strong> Use the secure, private deal chat to ask detailed questions, assess the creator's knowledge, and perform your due diligence before making any moves.</li>
                             <li><strong>Review Reputation:</strong> Check a creator's profile for their reputation points, expertise, and submission history. An active, long-standing user is generally more reliable.</li>
                             <li><strong>Start Small:</strong> Do not transfer significant funds outside of a formal, legally-binding agreement. This platform is for discovery and initial contact.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
