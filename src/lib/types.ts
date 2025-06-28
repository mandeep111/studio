import type { Timestamp } from "firebase/firestore";

// Allow Timestamps to be serialized for client components
type SerializableTimestamp = Timestamp | { seconds: number; nanoseconds: number; };

export type UserRole = "User" | "Investor" | "Admin";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  expertise: string;
  points: number;
  isPremium: boolean;
}

export type CreatorReference = {
  userId: string;
  name: string;
  avatarUrl: string;
  expertise: string;
};

export interface BaseItem {
  id: string;
  creator: CreatorReference;
  description: string;
  upvotes: number;
  upvotedBy: string[];
  createdAt: SerializableTimestamp;
  price?: number;
  priceApproved: boolean;
  attachmentUrl?: string;
  attachmentFileName?: string;
}

export interface Problem extends BaseItem {
  title: string;
  tags: string[];
  solutionsCount: number;
}

export interface Solution extends BaseItem {
  problemId: string;
  problemTitle: string;
}

export interface Idea extends Omit<BaseItem, 'price' | 'priceApproved'> {
    id: string;
    title: string;
    description: string;
    creator: CreatorReference;
    upvotes: number;
    upvotedBy: string[];
    createdAt: SerializableTimestamp;
    tags: string[];
    attachmentUrl?: string;
    attachmentFileName?: string;
}

export interface Business extends BaseItem {
  title: string;
  tags: string[];
  stage: string;
}

export type UpvotedItem = (Problem & { type: 'problem' }) | (Solution & { type: 'solution' }) | (Idea & { type: 'idea' }) | (Business & { type: 'business' });

export interface Deal {
    id: string;
    investor: CreatorReference;
    problemCreator: CreatorReference;
    solutionCreator?: CreatorReference;
    problemId: string;
    problemTitle: string;
    createdAt: SerializableTimestamp;
}

export interface Message {
    id: string;
    dealId: string;
    sender: CreatorReference;
    text: string;
    createdAt: SerializableTimestamp;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    link: string;
    read: boolean;
    createdAt: SerializableTimestamp;
}
