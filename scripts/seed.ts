// To run this script, use: npm run db:seed
// Make sure you have a .env.local file with your Firebase project's credentials.

import { config } from 'dotenv';
config({ path: '.env.local' }); // Make sure to load the local env file

import {
  collection,
  doc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../src/lib/firebase/config';
import type { UserProfile, CreatorReference } from '../src/lib/types';

const USERS: Omit<UserProfile, 'uid'>[] = [
  {
    email: 'admin@trisolve.com',
    name: 'Admin User',
    role: 'Admin',
    avatarUrl: `https://i.pravatar.cc/150?u=admin@trisolve.com`,
    expertise: 'Platform Management',
    points: 100,
    isPremium: true,
  },
  {
    email: 'problem.creator@trisolve.com',
    name: 'Pat Problem',
    role: 'User',
    avatarUrl: `https://i.pravatar.cc/150?u=problem.creator@trisolve.com`,
    expertise: 'Product Management',
    points: 50,
    isPremium: false,
  },
  {
    email: 'solution.creator@trisolve.com',
    name: 'Sam Solution',
    role: 'User',
    avatarUrl: `https://i.pravatar.cc/150?u=solution.creator@trisolve.com`,
    expertise: 'Software Engineering',
    points: 20,
    isPremium: false,
  },
  {
    email: 'investor@trisolve.com',
    name: 'Ivy Investor',
    role: 'Investor',
    avatarUrl: `https://i.pravatar.cc/150?u=investor@trisolve.com`,
    expertise: 'Venture Capital',
    points: 0,
    isPremium: true,
  },
    {
    email: 'idea.creator@trisolve.com',
    name: 'Iggy Idea',
    role: 'User',
    avatarUrl: `https://i.pravatar.cc/150?u=idea.creator@trisolve.com`,
    expertise: 'Creative Thinking',
    points: 10,
    isPremium: false,
  },
];

async function seedUsers() {
  console.log('Seeding users...');
  const usersCollection = collection(db, 'users');
  const batch = writeBatch(db);

  for (const user of USERS) {
    // We'll use the email as the UID for simplicity in this seed script.
    // In a real app, Firebase Auth would generate these UIDs.
    const userId = user.email; 
    const userRef = doc(usersCollection, userId);
    batch.set(userRef, { ...user, uid: userId });
  }

  await batch.commit();
  console.log('Users seeded successfully!');
  // Return the created user profiles with their UIDs for linking
  return USERS.map(u => ({...u, uid: u.email}));
}

function createCreatorRef(user: UserProfile): CreatorReference {
    return {
        userId: user.uid,
        name: user.name,
        avatarUrl: user.avatarUrl,
        expertise: user.expertise,
    }
}

async function seedProblemsAndSolutions(seededUsers: UserProfile[]) {
    console.log('Seeding problems and solutions...');
    const problemsCollection = collection(db, 'problems');
    const solutionsCollection = collection(db, 'solutions');
    const batch = writeBatch(db);

    const problemCreator = seededUsers.find(u => u.email === 'problem.creator@trisolve.com')!;
    const solutionCreator = seededUsers.find(u => u.email === 'solution.creator@trisolve.com')!;

    // Problem 1
    const problem1Ref = doc(problemsCollection);
    batch.set(problem1Ref, {
        title: 'Reducing Urban Traffic Congestion',
        description: 'Major cities worldwide suffer from severe traffic congestion, leading to increased pollution, economic losses, and decreased quality of life. We need innovative solutions to manage traffic flow efficiently.',
        tags: ['Smart Cities', 'Transportation', 'AI', 'Logistics'],
        creator: createCreatorRef(problemCreator),
        upvotes: 15,
        upvotedBy: [],
        solutionsCount: 1,
        createdAt: Timestamp.now(),
        price: 500,
        priceApproved: true,
    });

    // Solution for Problem 1
    const solution1Ref = doc(solutionsCollection);
    batch.set(solution1Ref, {
        problemId: problem1Ref.id,
        problemTitle: 'Reducing Urban Traffic Congestion',
        description: 'An AI-powered dynamic traffic light system that adjusts signal timings in real-time based on traffic data from cameras and sensors. This can optimize traffic flow and reduce idle times.',
        creator: createCreatorRef(solutionCreator),
        upvotes: 25,
        upvotedBy: [],
        createdAt: Timestamp.now(),
        price: 75000,
        priceApproved: false, // Will require admin approval
    });

    // Problem 2
    const problem2Ref = doc(problemsCollection);
    batch.set(problem2Ref, {
        title: 'Making Healthy Eating More Accessible',
        description: 'Access to fresh, healthy, and affordable food is a challenge for many communities, especially in urban "food deserts". How can technology help bridge this gap?',
        tags: ['Health', 'Food Tech', 'Community', 'Wellness'],
        creator: createCreatorRef(problemCreator),
        upvotes: 8,
        upvotedBy: [],
        solutionsCount: 0,
        createdAt: Timestamp.now(),
        price: null,
        priceApproved: true,
    });

    await batch.commit();
    console.log('Problems and solutions seeded successfully!');
}

async function seedIdeas(seededUsers: UserProfile[]) {
    console.log('Seeding ideas...');
    const ideasCollection = collection(db, 'ideas');
    const batch = writeBatch(db);

    const ideaCreator = seededUsers.find(u => u.email === 'idea.creator@trisolve.com')!;

    // Idea 1
    const idea1Ref = doc(ideasCollection);
    batch.set(idea1Ref, {
        title: 'Gamified Language Learning for Niche Languages',
        description: 'An app that uses gamification, story-telling, and AI-driven conversation partners to teach less common or endangered languages, helping to preserve cultural heritage.',
        tags: ['Education', 'AI', 'Culture', 'Mobile App'],
        creator: createCreatorRef(ideaCreator),
        upvotes: 12,
        upvotedBy: [],
        createdAt: Timestamp.now(),
    });
    
    // Idea 2
    const idea2Ref = doc(ideasCollection);
     batch.set(idea2Ref, {
        title: 'Personalized Public Art Guide',
        description: 'A mobile app that uses your location to provide augmented reality overlays and detailed information about public art, murals, and sculptures around you.',
        tags: ['Art', 'AR', 'Tourism', 'Mobile App'],
        creator: createCreatorRef(ideaCreator),
        upvotes: 5,
        upvotedBy: [],
        createdAt: Timestamp.now(),
    });

    await batch.commit();
    console.log('Ideas seeded successfully!');
}


async function main() {
    console.log('Starting database seeding process...');
    console.log('NOTE: This script uses user emails as document IDs for simplicity. In a real application, Firebase Authentication UIDs should be used.');
    
    const seededUsers = await seedUsers();
    await seedProblemsAndSolutions(seededUsers);
    await seedIdeas(seededUsers);

    console.log('Database seeding complete! Your collections have been created.');
    process.exit(0);
}

main().catch(e => {
  console.error('An error occurred during seeding:');
  console.error(e);
  process.exit(1);
});
