"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Problem, Solution, UserProfile, Idea } from "@/lib/types";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { approveItemAction, deleteItemAction } from "@/app/actions";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { format } from 'date-fns';

type UnapprovedItem = (Problem & { type: 'problem' }) | (Solution & { type: 'solution' });
type DeletableItem = { id: string; type: 'problem' | 'solution' | 'idea' | 'user' };

interface AdminClientProps {
    initialItems: UnapprovedItem[];
    initialUsers: UserProfile[];
    initialProblems: Problem[];
    initialSolutions: Solution[];
    initialIdeas: Idea[];
}

export default function AdminClient({ 
    initialItems, 
    initialUsers, 
    initialProblems, 
    initialSolutions, 
    initialIdeas 
}: AdminClientProps) {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // State for client-side updates after deletion
    const [users, setUsers] = useState(initialUsers);
    const [problems, setProblems] = useState(initialProblems);
    const [solutions, setSolutions] = useState(initialSolutions);
    const [ideas, setIdeas] = useState(initialIdeas);
    const [unapprovedItems, setUnapprovedItems] = useState(initialItems);

    useEffect(() => {
        if (!loading && userProfile?.role !== 'Admin') {
            toast({ variant: "destructive", title: "Unauthorized", description: "You do not have access to this page." });
            router.push('/');
        }
    }, [userProfile, loading, router, toast]);

    const handleApprove = async (type: 'problem' | 'solution', id: string) => {
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
            // Update local state to reflect deletion
            switch(item.type) {
                case 'user': setUsers(prev => prev.filter(u => u.uid !== item.id)); break;
                case 'problem': setProblems(prev => prev.filter(p => p.id !== item.id)); break;
                case 'solution': setSolutions(prev => prev.filter(s => s.id !== item.id)); break;
                case 'idea': setIdeas(prev => prev.filter(i => i.id !== item.id)); break;
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    }

    if (loading || userProfile?.role !== 'Admin') {
        return <p>Loading or redirecting...</p>;
    }

    return (
        <Tabs defaultValue="approval">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="approval">Awaiting Approval</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="problems">Problems</TabsTrigger>
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
                <TabsTrigger value="ideas">Ideas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="approval" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Items Awaiting Approval</CardTitle>
                        <CardDescription>Problems and solutions with a price over $1,000 need your approval before they are displayed with a price.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {unapprovedItems.length === 0 ? (
                            <p className="text-muted-foreground">No items are currently awaiting approval.</p>
                        ) : (
                            <div className="space-y-4">
                                {unapprovedItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border p-4">
                                        <div>
                                            <Badge variant="secondary" className="capitalize mb-2">{item.type}</Badge>
                                            <p className="font-semibold">
                                                <Link href={`/${item.type}s/${item.id}`} className="hover:underline">
                                                    { 'title' in item ? item.title : `Solution for: ${item.problemTitle}` }
                                                </Link>
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Submitted by {item.creator.name} for ${item.price?.toLocaleString()}
                                            </p>
                                        </div>
                                        <Button onClick={() => handleApprove(item.type, item.id)}>Approve</Button>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                        <TableCell className="hidden lg:table-cell">{format(problem.createdAt.toDate(), 'PPP')}</TableCell>
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
                                        <TableCell className="hidden lg:table-cell">{format(solution.createdAt.toDate(), 'PPP')}</TableCell>
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
                                        <TableCell className="hidden lg:table-cell">{format(idea.createdAt.toDate(), 'PPP')}</TableCell>
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
