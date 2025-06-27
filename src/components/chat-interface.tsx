"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Message, UserProfile } from '@/lib/types';
import { postMessageAction } from '@/app/actions';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface ChatInterfaceProps {
    dealId: string;
    initialMessages: Message[];
}

export default function ChatInterface({ dealId, initialMessages }: ChatInterfaceProps) {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, `deals/${dealId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages: Message[] = [];
        querySnapshot.forEach((doc) => {
            newMessages.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [dealId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile) return;

    const formData = new FormData();
    formData.append('dealId', dealId);
    formData.append('message', newMessage);
    formData.append('sender', JSON.stringify(userProfile));
    
    setNewMessage('');
    await postMessageAction(formData);
  };

  return (
    <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
            {messages.map(msg => (
                <div key={msg.id} className={cn(
                    "flex items-end gap-2",
                    msg.sender.userId === userProfile?.uid ? 'justify-end' : 'justify-start'
                )}>
                    {msg.sender.userId !== userProfile?.uid && (
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.sender.avatarUrl} />
                            <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn(
                        "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg",
                         msg.sender.userId === userProfile?.uid 
                         ? 'bg-primary text-primary-foreground' 
                         : 'bg-background border'
                    )}>
                        <p className="text-sm">{msg.text}</p>
                    </div>
                     {msg.sender.userId === userProfile?.uid && (
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.sender.avatarUrl} />
                            <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            ))}
        </ScrollArea>
        <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={!userProfile}
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || !userProfile}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    </Card>
  );
}
