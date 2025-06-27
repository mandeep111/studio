
export type Creator = {
  id: string;
  name: string;
  avatarUrl: string;
  reputationScore: number;
  expertise: string;
  reviews: number;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  creator: Creator;
  upvotes: number;
  solutionsCount: number;
};

export type Solution = {
  id: string;
  problemId: string;
  problemTitle: string;
  creator: Creator;
  description: string;
  upvotes: number;
};
