
// To run this script, use: npm run db:seed
// Make sure you have a .env.local file with your Firebase project's credentials.

import { config } from 'dotenv';
config({ path: '.env.local' }); // Make sure to load the local env file

import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../src/lib/firebase/config';
import type { UserProfile, CreatorReference } from '../src/lib/types';
import { ADMIN_AVATARS, INVESTOR_AVATARS, USER_AVATARS } from '../src/lib/avatars';

const USERS: Omit<UserProfile, 'uid'>[] = [
  {
    email: 'admin@prob2profit.com',
    name: 'Admin User',
    role: 'Admin',
    avatarUrl: ADMIN_AVATARS[0],
    expertise: 'Platform Management',
    points: 0,
    isPremium: true,
    unreadDealMessages: {},
    dealsCount: 0,
  },
  {
    email: 'problem.creator@problem2profit.com',
    name: 'Pat Problem',
    role: 'User',
    avatarUrl: USER_AVATARS[0],
    expertise: 'Product Management',
    points: 50,
    isPremium: true,
    unreadDealMessages: {},
    dealsCount: 0,
  },
  {
    email: 'solution.creator@problem2profit.com',
    name: 'Sam Solution',
    role: 'User',
    avatarUrl: USER_AVATARS[1],
    expertise: 'Software Engineering',
    points: 20,
    isPremium: true,
    unreadDealMessages: {},
    dealsCount: 0,
  },
  {
    email: 'investor@problem2profit.com',
    name: 'Ivy Investor',
    role: 'Investor',
    avatarUrl: INVESTOR_AVATARS[0],
    expertise: 'Venture Capital',
    points: 120,
    isPremium: true,
    unreadDealMessages: {},
    dealsCount: 0,
    dealsCompletedCount: 0,
    dealsCancelledCount: 0,
    upvotes: 0,
    upvotedBy: [],
  },
    {
    email: 'idea.creator@problem2profit.com',
    name: 'Iggy Idea',
    role: 'User',
    avatarUrl: USER_AVATARS[2],
    expertise: 'Creative Thinking',
    points: 10,
    isPremium: true,
    unreadDealMessages: {},
    dealsCount: 0,
  },
  {
    email: 'problem.creator2@problem2profit.com',
    name: 'Penny Prospect',
    role: 'User',
    avatarUrl: USER_AVATARS[3],
    expertise: 'Urban Planning',
    points: 15,
    isPremium: true,
    unreadDealMessages: {},
    dealsCount: 0,
  },
  {
    email: 'business.owner@problem2profit.com',
    name: 'Brenda Business',
    role: 'User',
    avatarUrl: USER_AVATARS[4],
    expertise: 'E-commerce',
    points: 40,
    isPremium: true,
    unreadDealMessages: {},
    dealsCount: 0,
  },
   {
    email: 'investor2@problem2profit.com',
    name: 'Ian Invests',
    role: 'Investor',
    avatarUrl: INVESTOR_AVATARS[1],
    expertise: 'Fintech',
    points: 250,
    isPremium: true,
    unreadDealMessages: {},
    dealsCount: 0,
    dealsCompletedCount: 0,
    dealsCancelledCount: 0,
    upvotes: 0,
    upvotedBy: [],
  }
];

async function seedUsers() {
  console.log('Seeding users...');
  const usersCollection = collection(db, 'users');
  const batch = writeBatch(db);

  for (const user of USERS) {
    const userId = user.email; 
    const userRef = doc(usersCollection, userId);
    batch.set(userRef, { ...user, uid: userId });
  }

  await batch.commit();
  console.log('Users seeded successfully!');
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

    const problemCreator = seededUsers.find(u => u.email === 'problem.creator@problem2profit.com')!;
    const solutionCreator = seededUsers.find(u => u.email === 'solution.creator@problem2profit.com')!;
    const problemCreator2 = seededUsers.find(u => u.email === 'problem.creator2@problem2profit.com')!;

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
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
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
        priceApproved: false, 
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
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
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
    });

    // Problem 3 (from new user)
    const problem3Ref = doc(problemsCollection);
    batch.set(problem3Ref, {
        title: 'Improving Community Recycling Programs',
        description: 'Many local recycling programs suffer from low participation and high contamination rates. How can we use technology to educate residents and simplify the recycling process?',
        tags: ['Community', 'Sustainability', 'Education', 'Green Tech'],
        creator: createCreatorRef(problemCreator2),
        upvotes: 5,
        upvotedBy: [],
        solutionsCount: 1,
        createdAt: Timestamp.now(),
        price: 250,
        priceApproved: true,
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
    });

    // Solution for Problem 3 (from original solution creator)
    const solution3Ref = doc(solutionsCollection);
    batch.set(solution3Ref, {
        problemId: problem3Ref.id,
        problemTitle: 'Improving Community Recycling Programs',
        description: 'A mobile app that uses image recognition to identify recyclable materials, provides clear instructions, and tracks a user\'s recycling impact with a points-based reward system.',
        creator: createCreatorRef(solutionCreator),
        upvotes: 10,
        upvotedBy: [],
        createdAt: Timestamp.now(),
        price: 25000,
        priceApproved: false, 
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
    });

    // Problem 4 (no solution)
    const problem4Ref = doc(problemsCollection);
    batch.set(problem4Ref, {
        title: 'Remote Team Collaboration Burnout',
        description: 'With the rise of remote work, teams are experiencing increased burnout due to constant virtual meetings and a lack of clear work-life boundaries. We need tools and strategies to foster healthier remote collaboration.',
        tags: ['HR Tech', 'Wellness', 'Remote Work', 'Productivity'],
        creator: createCreatorRef(problemCreator),
        upvotes: 12,
        upvotedBy: [],
        solutionsCount: 0,
        createdAt: Timestamp.now(),
        price: null,
        priceApproved: true,
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
    });


    await batch.commit();
    console.log('Problems and solutions seeded successfully!');
}

async function seedIdeas(seededUsers: UserProfile[]) {
    console.log('Seeding ideas...');
    const ideasCollection = collection(db, 'ideas');
    const batch = writeBatch(db);

    const ideaCreator = seededUsers.find(u => u.email === 'idea.creator@problem2profit.com')!;

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
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
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
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
    });

    // Idea 3
    const idea3Ref = doc(ideasCollection);
    batch.set(idea3Ref, {
        title: 'Subscription Box for Local Artisans',
        description: 'A curated subscription box service that features unique, handcrafted goods from local artisans in a different city each month, helping small businesses reach a wider audience.',
        tags: ['E-commerce', 'Small Business', 'Artisan', 'Subscription'],
        creator: createCreatorRef(ideaCreator),
        upvotes: 9,
        upvotedBy: [],
        createdAt: Timestamp.now(),
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
    });

    await batch.commit();
    console.log('Ideas seeded successfully!');
}

async function seedBusinesses(seededUsers: UserProfile[]) {
    console.log('Seeding businesses...');
    const businessesCollection = collection(db, 'businesses');
    const batch = writeBatch(db);

    const businessOwner = seededUsers.find(u => u.email === 'business.owner@problem2profit.com')!;

    batch.set(doc(businessesCollection), {
        title: 'EcoWear - Sustainable Fashion',
        description: 'An e-commerce brand offering stylish apparel made from 100% recycled materials. We have a growing customer base and are seeking funding to expand our product line and marketing efforts.',
        tags: ['E-commerce', 'Sustainability', 'Fashion', 'Retail'],
        creator: createCreatorRef(businessOwner),
        upvotes: 42,
        upvotedBy: [],
        createdAt: Timestamp.now(),
        price: 150000, // funding sought
        priceApproved: false,
        stage: 'Early Revenue',
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 1,
        isClosed: false,
    });

    batch.set(doc(businessesCollection), {
        title: 'LocalEats - Farm-to-Table Delivery',
        description: 'A subscription service that partners with local farms to deliver fresh, organic produce directly to consumers. We are looking to scale our operations to three new cities.',
        tags: ['Food Tech', 'Subscription', 'Logistics', 'Health'],
        creator: createCreatorRef(businessOwner),
        upvotes: 28,
        upvotedBy: [],
        createdAt: Timestamp.now(),
        price: 250000,
        priceApproved: false,
        stage: 'Scaling',
        attachmentUrl: null,
        attachmentFileName: null,
        interestedInvestorsCount: 0,
        isClosed: false,
    });
    
    await batch.commit();
    console.log('Businesses seeded successfully!');
}

async function seedSettings() {
    console.log('Seeding settings...');
    const settingsRef = doc(db, 'settings', 'payment');
    await setDoc(settingsRef, { isEnabled: true });
    console.log('Settings seeded successfully!');
}


async function main() {
    console.log('Starting database seeding process...');
    console.log('NOTE: This script uses user emails as document IDs for simplicity. In a real application, Firebase Authentication UIDs should be used.');
    
    const seededUsers = await seedUsers();
    await seedProblemsAndSolutions(seededUsers);
    await seedIdeas(seededUsers);
    await seedBusinesses(seededUsers);
    await seedSettings();

    console.log('Database seeding complete! Your collections have been created.');
    process.exit(0);
}

main().catch(e => {
  console.error('An error occurred during seeding:');
  console.error(e);
  process.exit(1);
});
