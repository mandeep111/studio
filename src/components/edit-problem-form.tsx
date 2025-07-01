
"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from './submit-button';
import { TagInput } from './ui/tag-input';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import type { Problem } from '@/lib/types';
import { updateProblemAction } from '@/app/actions';

const problemFormSchema = z.object({
  title: z.string().min(10, { message: "Title must be at least 10 characters long." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters long." }),
});

export default function EditProblemForm({ problem }: { problem: Problem }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>(problem.tags || []);
  
  const form = useForm<z.infer<typeof problemFormSchema>>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: { 
        title: problem.title,
        description: problem.description,
    },
  });

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user || user.uid !== problem.creator.userId;

  const onSubmit = async (values: z.infer<typeof problemFormSchema>) => {
    if (isSubmitDisabled) return;
    setFormLoading(true);

    const formData = new FormData();
    formData.append('id', problem.id);
    formData.append('title', values.title);
    formData.append('description', values.description);
    tags.forEach(tag => formData.append('tags', tag));
    if (attachment) {
        formData.append('attachment', attachment);
    }
    
    const result = await updateProblemAction(formData);

    if (result.success) {
        toast({ title: "Success!", description: result.message });
        router.push(`/problems/${problem.id}`);
        router.refresh();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setFormLoading(false);
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Edit Problem Details</CardTitle>
        </CardHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Problem Title</FormLabel>
                    <FormControl>
                        <Input {...field} disabled={isFieldsDisabled} />
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
                    <Label htmlFor="tags">Tags</Label>
                    <TagInput
                        value={tags}
                        onChange={setTags}
                        placeholder="Add relevant tags..."
                        disabled={isFieldsDisabled}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="attachment">New Attachment (Optional)</Label>
                    <Input id="attachment" name="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} disabled={isFieldsDisabled} />
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
