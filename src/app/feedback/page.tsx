import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeedbackPage() {
  const adminEmail = "admin@prob2profit.com";

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto max-w-2xl px-4 md:px-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">Contact Us</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Have questions, feedback, or a suggestion? We'd love to hear from you.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                The best way to reach us is by email. We'll do our best to get back to you as soon as possible.
              </p>
              <Button asChild>
                <a href={`mailto:${adminEmail}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Us
                </a>
              </Button>
               <p className="text-sm text-muted-foreground mt-6">
                You can reach us at: <a href={`mailto:${adminEmail}`} className="font-medium text-primary hover:underline">{adminEmail}</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
