
"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createProblem } from '@/lib/firestore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from './submit-button';
import { DollarSign, Gem } from 'lucide-react';
import Link from 'next/link';
import { TagInput } from './ui/tag-input';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


interface CreateProblemFormProps {
    onProblemCreated?: () => void;
    isPaymentEnabled: boolean;
}

const problemFormSchema = z.object({
  title: z.string().min(10, { message: "Title must be at least 10 characters long." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters long." }),
  price: z.string().optional(),
});

export default function CreateProblemForm({ onProblemCreated, isPaymentEnabled }: CreateProblemFormProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  const form = useForm<z.infer<typeof problemFormSchema>>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: { title: "", description: "", price: "" },
  });


  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user;

  const canSetPrice = userProfile && (userProfile.isPremium || userProfile.points >= 10000);

  const onSubmit = async (values: z.infer<typeof problemFormSchema>) => {
    setFormLoading(true);

    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit a problem." });
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
        await createProblem(values.title, values.description, tags, price, userProfile, attachment || undefined);
        toast({ title: "Success!", description: "Problem submitted successfully. You've earned 50 points!" });
        form.reset();
        setTags([]);
        setAttachment(null);
        if (onProblemCreated) {
            onProblemCreated();
        }
    } catch (error) {
        console.error(error);
        let errorMessage = "Failed to submit problem.";
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Plastic waste in oceans" {...field} disabled={isFieldsDisabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the problem in detail. What is the context? Who is affected? What are the current challenges?"
                  className="min-h-[120px]"
                  {...field}
                  disabled={isFieldsDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (Optional)</Label>
          <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Add relevant tags..."
              disabled={isFieldsDisabled}
          />
          <p className="text-xs text-muted-foreground">
            Press Enter or comma to add a tag.
          </p>
        </div>

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
                        <Input type="number" step="0.01" placeholder="100.00" className="pl-8" {...field} disabled={isFieldsDisabled}/>
                      </FormControl>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set a price for your problem. Prices over $1,000 require admin approval.
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
          <Label htmlFor="attachment">Attachment (Optional)</Label>
          <Input id="attachment" name="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} disabled={isFieldsDisabled} />
          <p className="text-xs text-muted-foreground">
              Investors will be able to see this attachment.
          </p>
        </div>
        <div className="flex justify-end pt-4">
          <SubmitButton pendingText="Submitting..." disabled={isSubmitDisabled}>Submit Problem</SubmitButton>
        </div>
      </form>
    </Form>
  );
}
