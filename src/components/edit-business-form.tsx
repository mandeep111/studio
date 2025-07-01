
"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from './submit-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TagInput } from './ui/tag-input';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import type { Business } from '@/lib/types';
import { updateBusinessAction } from '@/app/actions';

const businessFormSchema = z.object({
  title: z.string().min(5, { message: "Business name must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  stage: z.string({ required_error: "Please select a business stage."}),
});

export default function EditBusinessForm({ business }: { business: Business }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>(business.tags || []);
  
  const form = useForm<z.infer<typeof businessFormSchema>>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: { 
        title: business.title,
        description: business.description,
        stage: business.stage,
    },
  });

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user || user.uid !== business.creator.userId;

  const onSubmit = async (values: z.infer<typeof businessFormSchema>) => {
    if (isSubmitDisabled) return;
    setFormLoading(true);

    const formData = new FormData();
    formData.append('id', business.id);
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('stage', values.stage);
    tags.forEach(tag => formData.append('tags', tag));
    if (attachment) {
        formData.append('attachment', attachment);
    }
    
    const result = await updateBusinessAction(formData);

    if (result.success) {
        toast({ title: "Success!", description: result.message });
        router.push(`/businesses/${business.id}`);
        router.refresh();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setFormLoading(false);
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Edit Business Details</CardTitle>
        </CardHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Business Name</FormLabel>
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
                <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Business Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldsDisabled}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select business stage" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Idea">Idea</SelectItem>
                            <SelectItem value="Prototype">Prototype / MVP</SelectItem>
                            <SelectItem value="Early Revenue">Early Revenue</SelectItem>
                            <SelectItem value="Scaling">Scaling</SelectItem>
                        </SelectContent>
                        </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <TagInput
                        value={tags}
                        onChange={setTags}
                        placeholder="e.g. E-commerce, B2C..."
                        disabled={isFieldsDisabled}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="attachment-business">New Attachment (Optional)</Label>
                    <Input id="attachment-business" name="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} disabled={isFieldsDisabled} />
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
