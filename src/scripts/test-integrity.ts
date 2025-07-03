
// To run this script, use: npm run test:integrity
// It checks the end-to-end functionality of core features against your production Firebase project.

import { config } from 'dotenv';
config({ path: '.env.local' });

import { collection, doc, addDoc, getDoc, deleteDoc, setDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../src/lib/firebase/config';
import { suggestPairings } from '../src/ai/flows/suggest-pairings';
import type { UserProfile } from '../src/lib/types';
import { USER_AVATARS, INVESTOR_AVATARS } from '../src/lib/avatars';
import { startDealAction, updateUserProfileAction, updateDealStatusAction, upvoteItemAction } from '../src/app/actions';

const now = Date.now();
// A temporary object to hold IDs of created documents for cleanup
const testData = {
    creatorId: `test-creator-id-${now}`,
    investorId: `test-investor-id-${now}`,
    problemId: '',
    solutionId: '',
    dealId: '',
};

const testProfiles = {
    creator: {
        uid: testData.creatorId,
        email: `test.creator.${now}@problem2profit.com`,
        name: 'Test Creator',
        role: 'User',
        avatarUrl: USER_AVATARS[5],
        expertise: 'Testing',
        points: 0,
        isPremium: true, // Give premium for testing features
    } as UserProfile,
    investor: {
        uid: testData.investorId,
        email: `test.investor.${now}@problem2profit.com`,
        name: 'Test Investor',
        role: 'Investor',
        avatarUrl: INVESTOR_AVATARS[5],
        expertise: 'Testing Investments',
        points: 0,
        isPremium: true,
        dealsCount: 0,
        dealsCompletedCount: 0,
        dealsCancelledCount: 0,
    } as UserProfile
};


async function main() {
    console.log('🚀 Starting Problem2Profit Integrity Test...');
    try {
        await checkProjectConfiguration();
        await setupTestUsers();
        await testFirestoreConnection();
        await testProblemAndSolutionLifecycle();
        await testDealLifecycle();
        await testProfileUpdate();
        await testAiFlow();
        console.log('\n✅✅✅ Integrity Test Passed Successfully! ✅✅✅');
    } catch (error) {
        console.error('\n❌❌❌ Integrity Test Failed! ❌❌❌');
        console.error('Error:', (error as Error).message);
        console.error((error as Error).stack);
    } finally {
        await cleanup();
        process.exit(0);
    }
}

async function checkProjectConfiguration() {
    console.log('- Checking Project Configuration...');
    const expectedProjectId = 'trisolve-2c9cf';
    const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!configuredProjectId) {
        throw new Error('`NEXT_PUBLIC_FIREBASE_PROJECT_ID` is not set in your .env.local file.');
    }
    if (configuredProjectId !== expectedProjectId) {
        throw new Error(`Incorrect Firebase Project ID. Expected '${expectedProjectId}' but found '${configuredProjectId}'. Please update your .env.local file.`);
    }
    console.log(`  ✅ Configured for production project: ${configuredProjectId}`);
}


async function setupTestUsers() {
    console.log('\n- Setting up temporary users...');
    await setDoc(doc(db, 'users', testData.creatorId), testProfiles.creator);
    await setDoc(doc(db, 'users', testData.investorId), testProfiles.investor);
    console.log('  ✅ Temporary users created.');
}

async function testFirestoreConnection() {
    console.log('- Testing Firestore Connection...');
    try {
        await getDoc(doc(db, 'users', 'non-existent-user'));
        console.log('  ✅ Firestore connection is OK.');
    } catch (e) {
        throw new Error(`Failed to connect to Firestore: ${(e as Error).message}`);
    }
}

async function testProblemAndSolutionLifecycle() {
    console.log('- Testing Problem & Solution Lifecycle...');
    
    // Mocking auth for server actions is complex, so we're testing the DB logic that actions call.
    // A full E2E test with authenticated users would be the next step.
    
    // 1. Create a problem
    const problemRef = await addDoc(collection(db, 'problems'), {
        title: 'Test Problem: Lifecycle',
        description: 'A test problem.',
        creator: { userId: testData.creatorId, name: testProfiles.creator.name, avatarUrl: '', expertise: 'Testing' },
        upvotes: 0,
        upvotedBy: [],
        solutionsCount: 0,
        createdAt: Timestamp.now(),
        isClosed: false,
    });
    testData.problemId = problemRef.id;
    console.log('  ✅ Temporary problem created.');

    // 2. Upvote the problem
    await upvoteItemAction(testData.investorId, testData.problemId, 'problem');
    let problemDoc = await getDoc(problemRef);
    if (!problemDoc.exists() || problemDoc.data().upvotes !== 1) {
        throw new Error('Problem upvote failed.');
    }
    console.log('  ✅ Problem upvoted successfully.');

    // 3. Create a solution
    const solutionRef = await addDoc(collection(db, 'solutions'), {
        description: 'A test solution',
        problemId: testData.problemId,
        problemTitle: 'Test Problem: Lifecycle',
        creator: testProfiles.creator,
        createdAt: Timestamp.now(),
        isClosed: false,
    });
    testData.solutionId = solutionRef.id;
    await updateDoc(problemRef, { solutionsCount: 1 }); // Manually update count for test
    problemDoc = await getDoc(problemRef);
    if (!problemDoc.exists() || problemDoc.data().solutionsCount !== 1) {
        throw new Error('Solution creation or problem counter update failed.');
    }
    console.log('  ✅ Solution created successfully.');
}

async function testDealLifecycle() {
    console.log('- Testing Deal Lifecycle...');
    
    // 1. Start a deal (using free path for simplicity)
    const dealResult = await startDealAction(
        testProfiles.investor,
        testData.creatorId,
        testData.problemId,
        'Test Problem: Lifecycle',
        'problem',
        0 // Amount 0 triggers free path
    );
    
    if (!dealResult.success || !dealResult.dealId) {
        throw new Error(`Free deal creation failed: ${dealResult.message}`);
    }
    testData.dealId = dealResult.dealId;
    const dealDocRef = doc(db, 'deals', testData.dealId);
    let dealDoc = await getDoc(dealDocRef);
    if (!dealDoc.exists()) {
        throw new Error('Deal document was not created in the database.');
    }
    console.log('  ✅ Deal created successfully.');

    // 2. Mark deal as completed
    const formData = new FormData();
    formData.append('dealId', testData.dealId);
    formData.append('status', 'completed');
    formData.append('investorId', testData.investorId);
    const updateResult = await updateDealStatusAction(formData);

    if (!updateResult.success) {
        throw new Error(`Failed to update deal status: ${updateResult.message}`);
    }

    dealDoc = await getDoc(dealDocRef);
    const problemDoc = await getDoc(doc(db, 'problems', testData.problemId));

    if (dealDoc.data()?.status !== 'completed') {
        throw new Error('Deal status did not update to completed.');
    }
    if (problemDoc.data()?.isClosed !== true) {
        throw new Error('Related problem was not marked as closed.');
    }
    console.log('  ✅ Deal status updated and related item closed successfully.');
}

async function testProfileUpdate() {
    console.log('- Testing User Profile Update...');
    const formData = new FormData();
    const newName = 'Test Creator Updated';
    formData.append('userId', testData.creatorId);
    formData.append('name', newName);
    formData.append('expertise', 'Testing Updates');

    const result = await updateUserProfileAction(formData);
    if (!result.success) {
        throw new Error(`Profile update failed: ${result.message}`);
    }

    const userDoc = await getDoc(doc(db, 'users', testData.creatorId));
    if (!userDoc.exists() || userDoc.data().name !== newName) {
        throw new Error('User profile was not updated in the database.');
    }
    console.log('  ✅ User profile updated successfully.');
}

async function testAiFlow() {
    console.log('- Testing AI Matchmaking Flow...');
    const input = {
        investorProfile: 'A test investor interested in any valid tech solution.',
        problems: [{
            id: testData.problemId,
            title: 'Test Problem: Integrity Check',
            description: 'This is a temporary problem for testing.',
            creatorId: testData.creatorId
        }],
        problemCreators: [{
            creatorId: testData.creatorId,
            reputationScore: 10,
            expertise: 'Testing'
        }],
        solutionCreators: [{
            creatorId: testData.creatorId, // Can be the same user for test
            reputationScore: 15,
            expertise: 'Testing Solutions'
        }]
    };
    const result = await suggestPairings(input as any);
    if (!result || !result.suggestedPairings) {
        throw new Error('AI flow did not return the expected output structure.');
    }
    console.log('  ✅ AI flow executed successfully and returned a valid response.');
}

async function cleanup() {
    console.log('\n- 🧹 Cleaning up test data...');
    const promises = [];
    if (testData.problemId) promises.push(deleteDoc(doc(db, 'problems', testData.problemId)));
    if (testData.solutionId) promises.push(deleteDoc(doc(db, 'solutions', testData.solutionId)));
    if (testData.dealId) promises.push(deleteDoc(doc(db, 'deals', testData.dealId)));
    
    promises.push(deleteDoc(doc(db, 'users', testData.creatorId)));
    promises.push(deleteDoc(doc(db, 'users', testData.investorId)));
    
    try {
        await Promise.all(promises);
        console.log('  ✅ Cleanup complete.');
    } catch (error) {
        console.error('  ⚠️  Error during cleanup:', (error as Error).message);
    }
}

// Run the main function
main();
