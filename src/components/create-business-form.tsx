"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createBusiness } from '@/lib/firestore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from './submit-button';
import { DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CreateBusinessFormProps {
    onBusinessCreated?: () => void;
}

export default function CreateBusinessForm({ onBusinessCreated }: CreateBusinessFormProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [stage, setStage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user;


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit a business." });
        return;
    }
    setFormLoading(true);

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null;
    
    if (!title || !description || !tags || !stage) {
        toast({ variant: "destructive", title: "Validation Error", description: "All fields are required." });
        setFormLoading(false);
        return;
    }
    if (!price || isNaN(price)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Funding sought must be a valid number."});
        setFormLoading(false);
        return;
    }

    try {
        await createBusiness(title, description, tags, stage, price, userProfile);
        toast({ title: "Success!", description: "Business submitted successfully. You've earned 30 points!" });
        formRef.current?.reset();
        if (onBusinessCreated) {
            onBusinessCreated();
        }
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to submit business." });
    } finally {
        setFormLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Business Name</Label>
        <Input id="title" name="title" placeholder="e.g., EcoWear Sustainable Fashion" required disabled={isFieldsDisabled} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe your business. What problem does it solve? What is your business model?"
          className="min-h-[120px]"
          required
          disabled={isFieldsDisabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stage">Business Stage</Label>
        <Select onValueChange={setStage} required disabled={isFieldsDisabled}>
            <SelectTrigger>
                <SelectValue placeholder="Select business stage" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Idea">Idea</SelectItem>
                <SelectItem value="Prototype">Prototype / MVP</SelectItem>
                <SelectItem value="Early Revenue">Early Revenue</SelectItem>
                <SelectItem value="Scaling">Scaling</SelectItem>
            </SelectContent>
        </Select>
      </div>
       <div className="space-y-2">
        <Label htmlFor="price">Funding Sought</Label>
        <div className="relative">
             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="price" name="price" type="number" step="1000" placeholder="50000" className="pl-8" required disabled={isFieldsDisabled}/>
        </div>
        <p className="text-xs text-muted-foreground">
          Set a funding amount. Amounts over $1,000 require admin approval.
        </p>
      </div>
       <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="e.g. E-commerce, B2C, SaaS (comma-separated)" required disabled={isFieldsDisabled}/>
        <p className="text-xs text-muted-foreground">
          Comma-separated list of relevant tags.
        </p>
      </div>
      <div className="flex justify-end pt-4">
        <SubmitButton pendingText="Submitting..." disabled={isSubmitDisabled}>Submit Business</SubmitButton>
      </div>
    </form>
  );
}
