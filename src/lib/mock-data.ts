import type { Creator, Problem, Solution, Idea } from './types';

export const problemCreators: Creator[] = [
  {
    id: 'pc1',
    name: 'Alice Innovations',
    avatarUrl: 'https://placehold.co/100x100.png',
    reputationScore: 4.8,
    expertise: 'Sustainable Urban Planning',
    reviews: 125,
  },
  {
    id: 'pc2',
    name: 'Bob Builders',
    avatarUrl: 'https://placehold.co/100x100.png',
    reputationScore: 4.5,
    expertise: 'Renewable Energy Systems',
    reviews: 88,
  },
  {
    id: 'pc3',
    name: 'FutureThink Co.',
    avatarUrl: 'https://placehold.co/100x100.png',
    reputationScore: 4.9,
    expertise: 'AI in Healthcare',
    reviews: 210,
  },
];

export const solutionCreators: Creator[] = [
  {
    id: 'sc1',
    name: 'Charlie Constructs',
    avatarUrl: 'https://placehold.co/100x100.png',
    reputationScore: 4.7,
    expertise: 'Modular & Prefabricated Housing',
    reviews: 95,
  },
  {
    id: 'sc2',
    name: 'Diana Designs',
    avatarUrl: 'https://placehold.co/100x100.png',
    reputationScore: 4.9,
    expertise: 'Grid-scale Battery Storage',
    reviews: 150,
  },
  {
    id: 'sc3',
    name: 'EcoSolve Ltd.',
    avatarUrl: 'https://placehold.co/100x100.png',
    reputationScore: 4.6,
    expertise: 'Predictive Medical Diagnostics AI',
    reviews: 180,
  },
  {
    id: 'sc4',
    name: 'Frank Futures',
    avatarUrl: 'https://placehold.co/100x100.png',
    reputationScore: 4.2,
    expertise: 'Circular Economy Logistics',
    reviews: 75,
  },
  {
    id: 'sc5',
    name: 'Grace Green-tech',
    avatarUrl: 'https://placehold.co/100x100.png',
    reputationScore: 4.8,
    expertise: 'Bioplastics Development',
    reviews: 112,
  },
];

export const allCreators = [...problemCreators, ...solutionCreators];

export const problemData: Problem[] = [
  {
    id: 'p1',
    title: 'Affordable Housing Crisis in Metro Areas',
    description: 'Developing a scalable model for high-quality, affordable housing in densely populated urban centers.',
    tags: ['Urban Development', 'Housing', 'Social Impact'],
    creator: problemCreators[0],
    upvotes: 2300,
    solutionsCount: 15,
  },
  {
    id: 'p2',
    title: 'Intermittent Power Supply from Renewables',
    description: 'How can we ensure a consistent and reliable power supply when relying on solar and wind energy sources?',
    tags: ['Energy', 'Sustainability', 'Infrastructure'],
    creator: problemCreators[1],
    upvotes: 1800,
    solutionsCount: 8,
  },
  {
    id: 'p3',
    title: 'Early Detection of Neurodegenerative Diseases',
    description: 'Creating a non-invasive, accessible, and accurate tool for early diagnosis of diseases like Alzheimer\'s.',
    tags: ['Healthcare', 'AI', 'Biotech'],
    creator: problemCreators[2],
    upvotes: 3100,
    solutionsCount: 22,
  },
];

export const solutionData: Solution[] = [
  {
    id: 's1',
    problemId: 'p1',
    problemTitle: 'Affordable Housing Crisis in Metro Areas',
    creator: solutionCreators[0],
    description: 'Utilizing modular, factory-built housing units that can be rapidly assembled on-site, reducing construction time and cost by up to 40%.',
    upvotes: 850,
  },
  {
    id: 's2',
    problemId: 'p2',
    problemTitle: 'Intermittent Power Supply from Renewables',
    creator: solutionCreators[1],
    description: 'A network of decentralized, containerized battery storage systems managed by an AI to predict energy demand and stabilize the grid.',
    upvotes: 1200,
  },
  {
    id: 's3',
    problemId: 'p3',
    problemTitle: 'Early Detection of Neurodegenerative Diseases',
    creator: solutionCreators[2],
    description: 'An AI-powered retinal scan analysis app that detects early biomarkers of neurodegeneration with 95% accuracy from a standard eye exam.',
    upvotes: 2500,
  },
];

export const randomIdeasData: Idea[] = [
    {
      id: 'i1',
      creator: solutionCreators[3],
      title: 'Gamified Waste Sorting App',
      description: 'An app that uses image recognition to identify types of waste and turns proper sorting into a points-based game with community leaderboards.',
      tags: ['Gamification', 'Recycling', 'Sustainability'],
      upvotes: 720,
    },
    {
      id: 'i2',
      creator: solutionCreators[4],
      title: 'Algae-based Bioplastics for Packaging',
      description: 'Developing a fully biodegradable plastic alternative from microalgae, suitable for food packaging and single-use items.',
      tags: ['Biotech', 'Materials Science', 'Circular Economy'],
      upvotes: 1500,
    },
    {
      id: 'i3',
      creator: problemCreators[0],
      title: 'Peer-to-Peer Skill Sharing for Seniors',
      description: 'A platform connecting retired seniors who want to teach skills (e.g., gardening, woodworking) with younger people eager to learn.',
      tags: ['Community', 'Education', 'Social Impact'],
      upvotes: 980,
    }
]
