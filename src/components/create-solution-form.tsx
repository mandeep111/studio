
"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createSolution } from '@/lib/firestore';
import { Card, CardContent, CardFooter } from './ui/card';
import { Textarea } from './ui/textarea';
import { SubmitButton } from './submit-button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { DollarSign, Gem } from 'lucide-react';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


interface CreateSolutionFormProps {
    problemId: string;
    problemTitle: string;
    onSolutionCreated: () => void;
    isPaymentEnabled: boolean;
}

const solutionFormSchema = z.object({
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  price: z.string().optional(),
});

export default function CreateSolutionForm({ problemId, problemTitle, onSolutionCreated, isPaymentEnabled }: CreateSolutionFormProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const form = useForm<z.infer<typeof solutionFormSchema>>({
    resolver: zodResolver(solutionFormSchema),
    defaultValues: { description: "", price: "" },
  });

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user;

  const canSetPrice = userProfile && (userProfile.isPremium || userProfile.points >= 10000);

  const onSubmit = async (values: z.infer<typeof solutionFormSchema>) => {
    setFormLoading(true);

    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit a solution." });
        setFormLoading(false);
        return;
    }

    const price = canSetPrice && values.price ? parseFloat(values.price) : null;
    if (canSetPrice && values.price && isNaN(price)) {
        form.setError("price", { type: "manual", message: "Price must be a valid number." });
        setFormLoading(false);
        return;
    }

    try {
        await createSolution(values.description, problemId, problemTitle, price, userProfile, attachment || undefined);
        toast({ title: "Success!", description: "Solution posted successfully." });
        form.reset();
        setAttachment(null);
        onSolutionCreated(); // Callback to refetch solutions
    } catch (error) {
        console.error(error);
        let errorMessage = "Failed to post solution.";
        if (error instanceof Error) {
            if ((error as any).code?.includes('storage')) {
                errorMessage = "Storage permission error. Please check your Firebase rules and ensure you are logged in.";
            } else {
                errorMessage = error.message;
            }
        }
        toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
        setFormLoading(false);
    }
  };


  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="pt-6 space-y-4">
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                        placeholder="Describe your innovative solution here..."
                        className="min-h-[120px]"
                        disabled={isFieldsDisabled}
                        {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label>Price (Optional)</Label>
              {canSetPrice ? (
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                <Input type="number" step="0.01" placeholder="100.00" className="pl-8" {...field} disabled={isFieldsDisabled} />
                                </FormControl>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Set a price for your solution. Prices over $1,000 require admin approval.
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              ) : isPaymentEnabled ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md bg-muted border">
                    <Gem className="h-4 w-4 text-primary" />
                    <span>Become an <Link href="/membership" className="underline text-primary">Investor</Link> or earn 10,000 points to set a price.</span>
                  </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment-solution">Attachment (Optional)</Label>
              <Input id="attachment-solution" name="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} disabled={isFieldsDisabled} />
              <p className="text-xs text-muted-foreground">
                  Investors will be able to see this attachment.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton className="ml-auto" disabled={isSubmitDisabled} pendingText="Posting...">Post Solution</SubmitButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
