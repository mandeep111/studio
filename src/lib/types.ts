import type { Timestamp } from "firebase/firestore";

export type UserRole = "User" | "Investor" | "Admin";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  expertise: string;
}

export type CreatorReference = {
  userId: string;
  name: string;
  avatarUrl: string;
  expertise: string;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  creator: CreatorReference;
  upvotes: number;
  upvotedBy: string[];
  solutionsCount: number;
  createdAt: Timestamp;
};

export type Solution = {
  id: string;
  problemId: string;
  problemTitle: string;
  creator: CreatorReference;
  description: string;
  upvotes: number;
  upvotedBy: string[];
  createdAt: Timestamp;
};

export type Idea = {
  id: string;
  creator: CreatorReference;
  title: string;
  description: string;
  tags: string[];
  upvotes: number;
  upvotedBy: string[];
  createdAt: Timestamp;
};
