
"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from './ui/textarea';
import { SubmitButton } from './submit-button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import type { Solution } from '@/lib/types';
import { updateSolutionAction } from '@/app/actions';

const solutionFormSchema = z.object({
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
});

export default function EditSolutionForm({ solution }: { solution: Solution }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const form = useForm<z.infer<typeof solutionFormSchema>>({
    resolver: zodResolver(solutionFormSchema),
    defaultValues: { description: solution.description },
  });

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user || user.uid !== solution.creator.userId;

  const onSubmit = async (values: z.infer<typeof solutionFormSchema>) => {
    if (isSubmitDisabled) return;
    setFormLoading(true);
    
    const formData = new FormData();
    formData.append('id', solution.id);
    formData.append('description', values.description);
    if (attachment) {
        formData.append('attachment', attachment);
    }
    
    const result = await updateSolutionAction(formData);

    if (result.success) {
        toast({ title: "Success!", description: result.message });
        router.push(`/solutions/${solution.id}`);
        router.refresh();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setFormLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Solution Details</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="pt-6 space-y-4">
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution Description</FormLabel>
                  <FormControl>
                    <Textarea
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
              <Label htmlFor="attachment-solution">New Attachment (Optional)</Label>
              <Input id="attachment-solution" name="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} disabled={isFieldsDisabled} />
              <p className="text-xs text-muted-foreground">
                  Uploading a new file will replace the existing one.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
             <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
             <SubmitButton pendingText="Saving..." disabled={isSubmitDisabled}>Save Changes</SubmitButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
