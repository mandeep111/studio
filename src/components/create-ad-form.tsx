"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createAdAction } from '@/app/actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SubmitButton } from './submit-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Ad } from '@/lib/types';

interface CreateAdFormProps {
    onAdCreated: (newAd: Ad) => void;
}

export default function CreateAdForm({ onAdCreated }: CreateAdFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await createAdAction(formData);

    if (result.success) {
      toast({ title: "Success!", description: result.message });
      formRef.current?.reset();
      // We can't know the full Ad object here, so we'll just trigger a refetch in the parent
      onAdCreated(null as any); 
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Ad Title</Label>
        <Input id="title" name="title" placeholder="e.g., The Best Productivity Tool" required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input id="imageUrl" name="imageUrl" placeholder="https://placehold.co/600x400.png" required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="linkUrl">Link URL</Label>
        <Input id="linkUrl" name="linkUrl" placeholder="https://example.com" required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="placement">Placement</Label>
        <Select name="placement" required disabled={loading}>
            <SelectTrigger>
                <SelectValue placeholder="Select where to display the ad" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="problem-detail">Problem Detail</SelectItem>
                <SelectItem value="solution-detail">Solution Detail</SelectItem>
                <SelectItem value="idea-detail">Idea Detail</SelectItem>
                <SelectItem value="business-detail">Business Detail</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end pt-4">
        <SubmitButton pendingText="Creating..." disabled={loading}>Create Ad</SubmitButton>
      </div>
    </form>
  );
}
