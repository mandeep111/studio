"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createProblem } from '@/lib/firestore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from './submit-button';
import { DollarSign, Gem } from 'lucide-react';
import Link from 'next/link';

interface CreateProblemFormProps {
    onProblemCreated?: () => void;
}

export default function CreateProblemForm({ onProblemCreated }: CreateProblemFormProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [attachment, setAttachment] = useState<File | null>(null);


  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user;

  const canSetPrice = userProfile && (userProfile.isPremium || userProfile.points >= 10000);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormLoading(true);

    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit a problem." });
        setFormLoading(false);
        return;
    }

    if (userProfile.role !== 'User' && userProfile.role !== 'Admin' && !userProfile.isPremium) {
        toast({ variant: "destructive", title: "Permission Denied", description: "Only Premium Users and Admins can create problems." });
        setFormLoading(false);
        return;
    }

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const priceStr = formData.get('price') as string;
    const price = canSetPrice && priceStr ? parseFloat(priceStr) : null;
    
    if (!title || !description || !tags) {
        toast({ variant: "destructive", title: "Validation Error", description: "All fields are required." });
        setFormLoading(false);
        return;
    }
    if (canSetPrice && priceStr && isNaN(parseFloat(priceStr))) {
        toast({ variant: "destructive", title: "Validation Error", description: "Price must be a valid number."});
        setFormLoading(false);
        return;
    }

    try {
        await createProblem(title, description, tags, price, userProfile, attachment || undefined);
        toast({ title: "Success!", description: "Problem submitted successfully. You've earned 50 points!" });
        formRef.current?.reset();
        setAttachment(null);
        if (onProblemCreated) {
            onProblemCreated();
        }
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to submit problem." });
    } finally {
        setFormLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Problem Title</Label>
        <Input id="title" name="title" placeholder="e.g., Plastic waste in oceans" required disabled={isFieldsDisabled} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the problem in detail. What is the context? Who is affected? What are the current challenges?"
          className="min-h-[120px]"
          required
          disabled={isFieldsDisabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="e.g. Sustainability, Environment, Technology (comma-separated)" required disabled={isFieldsDisabled}/>
        <p className="text-xs text-muted-foreground">
          Comma-separated list of tags.
        </p>
      </div>
       <div className="space-y-2">
        <Label htmlFor="price">Price (Optional)</Label>
        {canSetPrice ? (
          <>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="price" name="price" type="number" step="0.01" placeholder="100.00" className="pl-8" disabled={isFieldsDisabled}/>
            </div>
            <p className="text-xs text-muted-foreground">
              Set a price for your problem. Prices over $1,000 require admin approval.
            </p>
          </>
        ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md bg-muted border">
                <Gem className="h-4 w-4 text-primary" />
                <span><Link href="/membership" className="underline text-primary">Upgrade to Creator</Link> or earn 10,000 points to set a price.</span>
            </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="attachment">Attachment (Optional)</Label>
        <Input id="attachment" name="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} disabled={isFieldsDisabled} />
        <p className="text-xs text-muted-foreground">
            Premium users will be able to see this attachment.
        </p>
      </div>
      <div className="flex justify-end pt-4">
        <SubmitButton pendingText="Submitting..." disabled={isSubmitDisabled}>Submit Problem</SubmitButton>
      </div>
    </form>
  );
}
