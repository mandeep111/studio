import type { Timestamp } from "firebase/firestore";

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
  createdAt: Timestamp;
  price?: number;
  priceApproved: boolean;
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

export interface Idea extends BaseItem {
  title: string;
  tags: string[];
}

export interface Deal {
    id: string;
    investor: CreatorReference;
    problemCreator: CreatorReference;
    solutionCreator: CreatorReference;
    problemId: string;
    problemTitle: string;
    createdAt: Timestamp;
}

export interface Message {
    id: string;
    dealId: string;
    sender: CreatorReference;
    text: string;
    createdAt: Timestamp;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    link: string;
    read: boolean;
    createdAt: Timestamp;
}
