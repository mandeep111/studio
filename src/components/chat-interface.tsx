"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Message } from '@/lib/types';
import { postMessageAction } from '@/app/actions';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn, getDateFromTimestamp } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { markDealAsRead } from '@/lib/firestore';

interface ChatInterfaceProps {
    dealId: string;
    initialMessages: Message[];
}

export default function ChatInterface({ dealId, initialMessages }: ChatInterfaceProps) {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile) {
      markDealAsRead(userProfile.uid, dealId);
    }
  }, [userProfile, dealId]);


  useEffect(() => {
    const q = query(collection(db, `deals/${dealId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages: Message[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            newMessages.push({ id: doc.id, ...data } as Message);
        });
        setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [dealId]);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
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
    <div className="flex-1 flex flex-col bg-muted/20 rounded-lg border">
        <ScrollArea className="flex-grow p-4 space-y-4" viewportRef={viewportRef}>
            {messages.map((msg, index) => {
                const isSender = msg.sender.userId === userProfile?.uid;
                const showAvatar = !isSender && (index === messages.length - 1 || messages[index+1].sender.userId !== msg.sender.userId);
                
                return (
                    <div key={msg.id} className={cn(
                        "flex items-end gap-2 w-full",
                        isSender ? 'justify-end' : 'justify-start'
                    )}>
                        {!isSender && (
                            <div className="w-8 shrink-0">
                                {showAvatar && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={msg.sender.avatarUrl} />
                                        <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )}
                        <div className={cn(
                            "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg flex flex-col",
                             isSender 
                             ? 'bg-primary text-primary-foreground rounded-br-none' 
                             : 'bg-background border rounded-bl-none'
                        )}>
                            {!isSender && <p className="text-xs font-semibold pb-1">{msg.sender.name}</p>}
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <p className={cn(
                                "text-xs pt-1 text-right",
                                isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>
                                {msg.createdAt && format(getDateFromTimestamp(msg.createdAt), 'p')}
                            </p>
                        </div>
                    </div>
                )
            })}
        </ScrollArea>
        <div className="p-2 border-t bg-background rounded-b-lg">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    autoComplete="off"
                    disabled={!userProfile}
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || !userProfile}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                </Button>
            </form>
        </div>
    </div>
  );
}
