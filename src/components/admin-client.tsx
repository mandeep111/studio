
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Problem, Solution, UserProfile, Idea, Payment, Ad, Business, PaymentSettings } from "@/lib/types";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { approveItemAction, deleteItemAction, toggleAdStatusAction, updatePaymentSettingsAction } from "@/app/actions";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Trash2, Settings } from "lucide-react";
import { format } from 'date-fns';
import { getDateFromTimestamp } from "@/lib/utils";
import CreateAdForm from "./create-ad-form";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

type UnapprovedItem = (Problem & { type: 'problem' }) | (Solution & { type: 'solution' }) | (Business & { type: 'business' }) | (Idea & { type: 'idea' });
type DeletableItem = { id: string; type: 'problem' | 'solution' | 'idea' | 'user' | 'business' | 'ad' };

interface AdminClientProps {
    initialItems: UnapprovedItem[];
    initialUsers: UserProfile[];
    initialProblems: Problem[];
    initialSolutions: Solution[];
    initialIdeas: Idea[];
    initialPayments: Payment[];
    initialAds: Ad[];
    initialBusinesses: Business[];
    initialPaymentSettings: PaymentSettings;
}

export default function AdminClient({ 
    initialItems, 
    initialUsers, 
    initialProblems, 
    initialSolutions, 
    initialIdeas,
    initialPayments,
    initialAds,
    initialBusinesses,
    initialPaymentSettings
}: AdminClientProps) {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [users, setUsers] = useState(initialUsers);
    const [problems, setProblems] = useState(initialProblems);
    const [solutions, setSolutions] = useState(initialSolutions);
    const [ideas, setIdeas] = useState(initialIdeas);
    const [businesses, setBusinesses] = useState(initialBusinesses);
    const [unapprovedItems, setUnapprovedItems] = useState(initialItems);
    const [payments, setPayments] = useState(initialPayments);
    const [ads, setAds] = useState(initialAds);
    const [paymentSettings, setPaymentSettings] = useState(initialPaymentSettings);

    useEffect(() => {
        if (!loading && userProfile?.role !== 'Admin') {
            toast({ variant: "destructive", title: "Unauthorized", description: "You do not have access to this page." });
            router.push('/');
        }
    }, [userProfile, loading, router, toast]);

    const handleApprove = async (type: 'problem' | 'solution' | 'business' | 'idea', id: string) => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('id', id);

        const result = await approveItemAction(formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setUnapprovedItems(prev => prev.filter(item => item.id !== id));
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    };
    
    const handleDelete = async (item: DeletableItem) => {
        const formData = new FormData();
        formData.append('type', item.type);
        formData.append('id', item.id);

        const result = await deleteItemAction(formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            switch(item.type) {
                case 'user': setUsers(prev => prev.filter(u => u.uid !== item.id)); break;
                case 'problem': setProblems(prev => prev.filter(p => p.id !== item.id)); break;
                case 'solution': setSolutions(prev => prev.filter(s => s.id !== item.id)); break;
                case 'idea': setIdeas(prev => prev.filter(i => i.id !== item.id)); break;
                case 'ad': setAds(prev => prev.filter(a => a.id !== item.id)); break;
                case 'business': setBusinesses(prev => prev.filter(b => b.id !== item.id)); break;
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    }
    
    const handleToggleAdStatus = async (ad: Ad) => {
        const formData = new FormData();
        formData.append('id', ad.id);
        formData.append('isActive', String(!ad.isActive));
        const result = await toggleAdStatusAction(formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setAds(prev => prev.map(a => a.id === ad.id ? {...a, isActive: !a.isActive} : a));
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    }

    const handlePaymentSettingsToggle = async () => {
        const newIsEnabled = !paymentSettings.isEnabled;
        const formData = new FormData();
        formData.append('isEnabled', String(newIsEnabled));
        
        const result = await updatePaymentSettingsAction(formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setPaymentSettings({ isEnabled: newIsEnabled });
        } else {
             toast({ variant: "destructive", title: "Error", description: result.message });
        }
    }
    
    const handleAdCreated = (newAd: Ad) => {
        // In a real app, we'd refetch, but for now this is fine.
        setAds(prev => [newAd, ...prev]);
    }

    if (loading || userProfile?.role !== 'Admin') {
        return <p>Loading or redirecting...</p>;
    }
    
    const AdminTab = ({ value, children, count }: { value: string, children: React.ReactNode, count?: number }) => (
        <TabsTrigger value={value} className="justify-center">
            {children}
            {count !== undefined && count > 0 && <Badge variant="secondary" className="ml-2">{count}</Badge>}
        </TabsTrigger>
    );

    return (
        <Tabs defaultValue="approval">
            <div className="overflow-x-auto pb-2">
                <TabsList className="h-auto">
                    <AdminTab value="approval" count={unapprovedItems.length}>Approval</AdminTab>
                    <AdminTab value="payments" count={payments.length}>Payments</AdminTab>
                    <AdminTab value="ads" count={ads.length}>Ads</AdminTab>
                    <AdminTab value="settings"><Settings className="h-4 w-4" /></AdminTab>
                    <AdminTab value="users" count={users.length}>Users</AdminTab>
                    <AdminTab value="problems" count={problems.length}>Problems</AdminTab>
                    <AdminTab value="solutions" count={solutions.length}>Solutions</AdminTab>
                    <AdminTab value="ideas" count={ideas.length}>Ideas</AdminTab>
                    <AdminTab value="businesses" count={businesses.length}>Businesses</AdminTab>
                </TabsList>
            </div>
            
            <TabsContent value="approval" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Items Awaiting Approval</CardTitle>
                        <CardDescription>Problems, solutions, and businesses with a price over $1,000 need your approval.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {unapprovedItems.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No items are currently awaiting approval.</p>
                        ) : (
                            <div className="space-y-4">
                                {unapprovedItems.map(item => (
                                    <Card key={item.id} className="p-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <Badge variant="secondary" className="capitalize mb-2">{item.type}</Badge>
                                                <p className="font-semibold">
                                                    <Link href={`/${item.type}s/${item.id}`} className="hover:underline">
                                                         {item.type === 'solution' ? `Solution for: ${item.problemTitle}` : item.title}
                                                    </Link>
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Submitted by {item.creator.name} for ${item.price?.toLocaleString()}
                                                </p>
                                            </div>
                                            <Button onClick={() => handleApprove(item.type, item.id)}>Approve</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="payments" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>All transactions made on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map(payment => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                             <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={payment.userAvatarUrl} />
                                                    <AvatarFallback>{payment.userName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="truncate">{payment.userName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {payment.type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            ${payment.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{format(getDateFromTimestamp(payment.createdAt), 'PPp')}</TableCell>
                                        <TableCell className="text-sm capitalize">
                                            {payment.details || (payment.type === 'membership' && `${payment.plan} - ${payment.paymentFrequency}`)}
                                             {payment.type === 'deal_creation' && payment.relatedDealId && (
                                                <Button variant="link" asChild className="p-0 h-auto">
                                                    <Link href={`/deals/${payment.relatedDealId}`}>
                                                        View Deal
                                                    </Link>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="ads" className="mt-4">
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-1">
                        <Card>
                             <CardHeader>
                                <CardTitle>Create Ad</CardTitle>
                                <CardDescription>Create a new advertisement to display on the site.</CardDescription>
                             </CardHeader>
                             <CardContent>
                                <CreateAdForm onAdCreated={handleAdCreated} />
                             </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Ads</CardTitle>
                                <CardDescription>Toggle ads on or off, or delete them.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Placement</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ads.map(ad => (
                                            <TableRow key={ad.id}>
                                                <TableCell className="font-medium">
                                                    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{ad.title}</a>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{ad.placement}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={ad.isActive ? "default" : "outline"}>
                                                        {ad.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Switch
                                                        checked={ad.isActive}
                                                        onCheckedChange={() => handleToggleAdStatus(ad)}
                                                        aria-label="Toggle ad status"
                                                        className="mr-2"
                                                    />
                                                    <DeleteButton item={{type: 'ad', id: ad.id}} itemName={ad.title} onDelete={handleDelete} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

             <TabsContent value="settings" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Settings</CardTitle>
                        <CardDescription>Manage global settings for the OppChain platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center justify-between rounded-lg border p-4">
                           <div>
                                <Label htmlFor="payment-toggle" className="font-semibold">Enable Payments</Label>
                                <p className="text-sm text-muted-foreground">
                                    Turn this on to require Stripe payments for membership upgrades and deal creation.
                                </p>
                           </div>
                           <Switch
                             id="payment-toggle"
                             checked={paymentSettings.isEnabled}
                             onCheckedChange={handlePaymentSettingsToggle}
                           />
                       </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Manage Users ({users.length})</CardTitle>
                        <CardDescription>View and manage all registered users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead className="hidden md:table-cell">Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatarUrl} />
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>{user.points}</TableCell>
                                        <TableCell className="text-right">
                                            <DeleteButton item={{type: 'user', id: user.uid}} itemName={user.name} onDelete={handleDelete} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="problems" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Problems ({problems.length})</CardTitle>
                        <CardDescription>View and manage all submitted problems.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="hidden md:table-cell">Creator</TableHead>
                                    <TableHead className="hidden lg:table-cell">Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {problems.map(problem => (
                                    <TableRow key={problem.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/problems/${problem.id}`} className="hover:underline">
                                                {problem.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{problem.creator.name}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{format(getDateFromTimestamp(problem.createdAt), 'PPP')}</TableCell>
                                        <TableCell className="text-right">
                                             <DeleteButton item={{type: 'problem', id: problem.id}} itemName={problem.title} onDelete={handleDelete} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="solutions" className="mt-4">
                 <Card>
                     <CardHeader>
                        <CardTitle>Manage Solutions ({solutions.length})</CardTitle>
                        <CardDescription>View and manage all submitted solutions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>For Problem</TableHead>
                                    <TableHead className="hidden md:table-cell">Creator</TableHead>
                                    <TableHead className="hidden lg:table-cell">Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {solutions.map(solution => (
                                    <TableRow key={solution.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/solutions/${solution.id}`} className="hover:underline">
                                                Solution for {solution.problemTitle}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{solution.creator.name}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{format(getDateFromTimestamp(solution.createdAt), 'PPP')}</TableCell>
                                        <TableCell className="text-right">
                                             <DeleteButton item={{type: 'solution', id: solution.id}} itemName={`Solution for "${solution.problemTitle}"`} onDelete={handleDelete} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </TabsContent>
            
            <TabsContent value="ideas" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Ideas ({ideas.length})</CardTitle>
                        <CardDescription>View and manage all submitted ideas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="hidden md:table-cell">Creator</TableHead>
                                    <TableHead className="hidden lg:table-cell">Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ideas.map(idea => (
                                    <TableRow key={idea.id}>
                                        <TableCell className="font-medium">{idea.title}</TableCell>
                                        <TableCell className="hidden md:table-cell">{idea.creator.name}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{format(getDateFromTimestamp(idea.createdAt), 'PPP')}</TableCell>
                                        <TableCell className="text-right">
                                            <DeleteButton item={{type: 'idea', id: idea.id}} itemName={idea.title} onDelete={handleDelete} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="businesses" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Businesses ({businesses.length})</CardTitle>
                        <CardDescription>View and manage all submitted businesses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="hidden md:table-cell">Creator</TableHead>
                                    <TableHead>Stage</TableHead>
                                    <TableHead>Funding</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {businesses.map(business => (
                                    <TableRow key={business.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/businesses/${business.id}`} className="hover:underline">
                                                {business.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{business.creator.name}</TableCell>
                                        <TableCell><Badge variant="outline">{business.stage}</Badge></TableCell>
                                        <TableCell>${business.price?.toLocaleString() || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                             <DeleteButton item={{type: 'business', id: business.id}} itemName={business.title} onDelete={handleDelete} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

function DeleteButton({ item, itemName, onDelete }: { item: DeletableItem, itemName: string, onDelete: (item: DeletableItem) => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the {item.type} "{itemName}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(item)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, delete it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
