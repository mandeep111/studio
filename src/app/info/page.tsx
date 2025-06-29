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
                            For Creators (Problem & Solution Providers)
                        </CardTitle>
                        <CardDescription>Protecting your intellectual property.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>Your ideas are valuable. Here’s how to share them safely before a formal deal is in place:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Don't Reveal Everything:</strong> Think of your public problem or solution description as a "teaser." Provide enough detail to generate interest, but hold back the core "secret sauce," proprietary algorithms, or detailed implementation plans.</li>
                            <li><strong>Use Attachments Wisely:</strong> You can upload detailed documents (business plans, technical specifications) as attachments. These attachments are <strong>only visible to investors who start a deal with you</strong>, creating a secure second layer of information sharing.</li>
                            <li><strong>Focus on the "What" and "Why":</strong> Describe what the problem is and why it's important, or what your solution does and the value it provides. Save the "how" for private conversations within a deal.</li>
                            <li><strong>Build Your Reputation:</strong> A strong reputation, built by earning points through popular content, signals credibility to investors and makes them more likely to engage in a deal to learn more.</li>
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            For Investors
                        </CardTitle>
                         <CardDescription>Making informed investment decisions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>Our platform connects you with innovators, but due diligence is key. Here's how to protect yourself:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Check the Creator's Profile:</strong> Review their reputation points, expertise, and history of submissions. A long-standing, active user is generally more reliable.</li>
                            <li><strong>Use the AI Matchmaker:</strong> Our AI tool analyzes reputation and expertise to suggest promising pairings, providing an initial layer of vetting.</li>
                            <li><strong>Start a Deal to Vet:</strong> The deal-making process is your opportunity for due diligence. Use the private chat to ask detailed questions, request more information, and assess the creator's knowledge and seriousness.</li>
                            <li><strong>Start Small:</strong> The initial "deal creation" fee is a small contribution to facilitate the introduction. Do not transfer significant funds outside of a formal, legally-binding agreement managed outside of this platform.</li>
                             <li><strong>Report Suspicious Activity:</strong> If you suspect a creator is misrepresenting themselves or their idea, please report it to our admin team immediately.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
