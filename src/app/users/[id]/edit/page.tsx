
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/lib/types';
import Header from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import EditProfileForm from '@/components/edit-profile-form';

export default function EditProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;
    const [profileToEdit, setProfileToEdit] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            if (user.uid !== userId) {
                router.push(`/users/${userId}`); // Can't edit someone else's profile
                return;
            }

            getUserProfile(userId).then(profile => {
                setProfileToEdit(profile);
                setLoading(false);
            });
        }
    }, [authLoading, user, userId, router]);

    if (loading || authLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <Header />
                <main className="flex-1 bg-muted/40 p-4 md:p-8">
                    <div className="container mx-auto max-w-2xl">
                        <Skeleton className="h-10 w-1/3 mb-8" />
                        <div className="space-y-6">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <div className="flex justify-end">
                                <Skeleton className="h-10 w-24" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!profileToEdit) {
        return <div>Profile not found.</div>;
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-muted/40 p-4 md:p-8">
                <div className="container mx-auto max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Profile</h1>
                    <EditProfileForm userProfile={profileToEdit} />
                </div>
            </main>
        </div>
    );
}
