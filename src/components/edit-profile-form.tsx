
"use client";

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { updateUserProfileAction } from '@/app/actions';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SubmitButton } from './submit-button';
import { User as UserIcon } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  expertise: z.string().min(2, { message: 'Expertise must be at least 2 characters.' }),
  avatar: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  userProfile: UserProfile;
}

export default function EditProfileForm({ userProfile }: EditProfileFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: userProfile.name,
            expertise: userProfile.expertise,
        },
    });

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            form.setValue('avatar', file);
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        const formData = new FormData();
        formData.append('userId', userProfile.uid);
        formData.append('name', data.name);
        formData.append('expertise', data.expertise);
        if (data.avatar instanceof File) {
            formData.append('avatar', data.avatar);
        }
        
        try {
            const result = await updateUserProfileAction(formData);
            if (result.success) {
                toast({ title: 'Success', description: 'Profile updated successfully.' });
                router.push(`/users/${userProfile.uid}`);
                router.refresh(); // To make sure header avatar updates
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        }
    };

    return (
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Public Information</CardTitle>
                        <CardDescription>This will be displayed on your public profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={avatarPreview || userProfile.avatarUrl} />
                                <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
                            </Avatar>
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                Change Photo
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="expertise"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Area of Expertise</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Software Engineering" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                         <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                         <SubmitButton pendingText="Saving...">Save Changes</SubmitButton>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
