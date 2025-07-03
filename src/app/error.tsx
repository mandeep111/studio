
'use client'; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Header from '@/components/header';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real application, you would log this error to a service like Sentry, LogRocket, etc.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
        <body>
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
                    <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                            <CardTitle className="text-2xl">Something Went Wrong</CardTitle>
                            <CardDescription>
                                An unexpected error occurred. We're sorry for the inconvenience.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground mb-4">
                                You can try to reload the page or click the button below.
                            </p>
                            <Button onClick={() => reset()}>
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </body>
    </html>
  );
}
