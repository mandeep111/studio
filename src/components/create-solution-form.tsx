
"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
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
import { createSolutionAction } from '@/app/actions';


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

  const form = useForm<z.infer<typeof solutionFormSchema>>({
    resolver: zodResolver(solutionFormSchema),
    defaultValues: { description: "", price: "" },
  });

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user;

  const canSetPrice = userProfile && (userProfile.isPremium || userProfile.points >= 10000);
  const showPriceInput = !isPaymentEnabled || canSetPrice;

  const onSubmit = async (values: z.infer<typeof solutionFormSchema>) => {
    setFormLoading(true);

    const formData = new FormData();
    formData.append('description', values.description);
    if (values.price) formData.append('price', values.price);
    formData.append('problemId', problemId);
    formData.append('problemTitle', problemTitle);
    
    const fileInput = document.getElementById('attachment-solution') as HTMLInputElement;
    if (fileInput?.files?.[0]) {
        formData.append('attachment', fileInput.files[0]);
    }
    
    const result = await createSolutionAction(formData);
    
    if (result.success) {
        toast({ title: "Success!", description: result.message });
        form.reset();
        if (fileInput) fileInput.value = "";
        onSolutionCreated();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
    
    setFormLoading(false);
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
              {showPriceInput ? (
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
              ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md bg-muted border">
                    <Gem className="h-4 w-4 text-primary" />
                    <span>Become an <Link href="/membership" className="underline text-primary">Investor</Link> or earn 10,000 points to set a price.</span>
                  </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment-solution">Attachment (Optional)</Label>
              <Input id="attachment-solution" name="attachment" type="file" disabled={isFieldsDisabled} />
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
