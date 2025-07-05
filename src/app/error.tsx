
'use client'; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Header from '@/components/header';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real application, you would log this error to a service like Sentry, LogRocket, etc.
    console.error("==================== GLOBAL ERROR BOUNDARY CAUGHT ====================");
    console.error("Error:", error.message);
    if (error.digest) {
      console.error("Digest:", error.digest);
    }
    console.error(error); // Log the full error object for stack trace
    console.error("======================================================================");
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Application Error</CardTitle>
                    <CardDescription>
                        An unexpected error occurred. We've logged the details for debugging.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground mb-4">
                        You can try to reload the page or click the button below. If the issue persists, check your environment variables (`.env.local`) are set correctly.
                    </p>
                    <Button onClick={() => reset()}>
                        Try Again
                    </Button>
                </CardContent>
                <CardFooter className="flex-col gap-2 items-start text-left bg-muted/50 p-4 rounded-b-lg">
                    <p className="font-semibold text-sm">Error Details:</p>
                    <ScrollArea className="h-32 w-full rounded-md border bg-background p-2">
                        <pre className="text-xs text-destructive whitespace-pre-wrap">
                            <p><strong>Message:</strong> {error.message}</p>
                            {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
                        </pre>
                    </ScrollArea>
                </CardFooter>
            </Card>
        </main>
    </div>
  );
}
