// To run this script, use: npm run test:integrity
// It checks the end-to-end functionality of core features.

import { config } from 'dotenv';
config({ path: '.env.local' });

import { collection, doc, addDoc, getDoc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase/config';
import { suggestPairings } from '../src/ai/flows/suggest-pairings';
import type { UserProfile } from '../src/lib/types';
import { ADMIN_AVATARS, USER_AVATARS } from '../src/lib/avatars';
import { startDealAction, upgradeMembershipAction } from '../src/app/actions';

// A temporary object to hold IDs of created documents for cleanup
const testData = {
    problemCreatorId: 'test-problem-creator-id',
    solutionCreatorId: 'test-solution-creator-id',
    problemId: '',
    paymentTestUserId: 'test-payment-user-id',
};

async function main() {
    console.log('🚀 Starting VentureForge Integrity Test...');
    try {
        await testFirestoreConnection();
        await testCoreFunctionality();
        await testAiFlow();
        await testPaymentToggle();
        console.log('\n✅✅✅ Integrity Test Passed Successfully! ✅✅✅');
        process.exit(0);
    } catch (error) {
        console.error('\n❌❌❌ Integrity Test Failed! ❌❌❌');
        console.error('Error:', (error as Error).message);
        console.error((error as Error).stack);
        process.exit(1);
    } finally {
        await cleanup();
    }
}

async function testFirestoreConnection() {
    console.log('\n- Testing Firestore Connection...');
    try {
        // A simple read operation to test connectivity
        await getDoc(doc(db, 'users', 'non-existent-user'));
        console.log('  ✅ Firestore connection is OK.');
    } catch (e) {
        throw new Error(`Failed to connect to Firestore: ${(e as Error).message}`);
    }
}

async function testCoreFunctionality() {
    console.log('- Testing Core Functionality (Create/Read)...');
    
    // 1. Create temporary users
    const problemCreatorProfile: UserProfile = {
        uid: testData.problemCreatorId,
        email: 'test.problem.creator@trisolve.com',
        name: 'Test Problem Creator',
        role: 'User',
        avatarUrl: USER_AVATARS[5],
        expertise: 'Testing',
        points: 0,
        isPremium: false,
    };
    
    const solutionCreatorProfile: UserProfile = {
        uid: testData.solutionCreatorId,
        email: 'test.solution.creator@trisolve.com',
        name: 'Test Solution Creator',
        role: 'User',
        avatarUrl: ADMIN_AVATARS[5],
        expertise: 'Testing Solutions',
        points: 0,
        isPremium: false,
    };

    await setDoc(doc(db, 'users', testData.problemCreatorId), problemCreatorProfile);
    await setDoc(doc(db, 'users', testData.solutionCreatorId), solutionCreatorProfile);
    console.log('  ✅ Temporary users created.');

    // 2. Create a temporary problem
    const problemRef = await addDoc(collection(db, 'problems'), {
        title: 'Test Problem: Integrity Check',
        description: 'This is a temporary problem for testing.',
        creator: { userId: testData.problemCreatorId, name: 'Test Problem Creator', avatarUrl: '', expertise: 'Testing' },
        upvotes: 0,
        solutionsCount: 0,
        createdAt: new Date(),
    });
    testData.problemId = problemRef.id;
    console.log('  ✅ Temporary problem created.');

    const problemDoc = await getDoc(problemRef);
    if (!problemDoc.exists()) {
        throw new Error('Failed to read the temporary problem after creation.');
    }
    console.log('  ✅ Temporary problem read successfully.');
}

async function testAiFlow() {
    console.log('- Testing AI Matchmaking Flow...');

    const input = {
        investorProfile: 'A test investor interested in any valid tech solution.',
        problems: [{
            id: testData.problemId,
            title: 'Test Problem: Integrity Check',
            description: 'This is a temporary problem for testing.',
            creatorId: testData.problemCreatorId
        }],
        problemCreators: [{
            creatorId: testData.problemCreatorId,
            reputationScore: 10,
            expertise: 'Testing'
        }],
        solutionCreators: [{
            creatorId: testData.solutionCreatorId,
            reputationScore: 15,
            expertise: 'Testing Solutions'
        }]
    };

    const result = await suggestPairings(input);

    if (!result || !result.suggestedPairings) {
        throw new Error('AI flow did not return the expected output structure.');
    }
    
    console.log('  ✅ AI flow executed successfully and returned a valid response.');
}

async function testPaymentToggle() {
    console.log('- Testing Payment Toggle Feature...');
    const settingsRef = doc(db, 'settings', 'payment');
    
    // Create a temporary user for testing payments
    const paymentTestUser: UserProfile = {
        uid: testData.paymentTestUserId,
        email: 'test.payment.user@trisolve.com',
        name: 'Test Payment User',
        role: 'User',
        avatarUrl: USER_AVATARS[6],
        expertise: 'Finance Testing',
        points: 0,
        isPremium: false,
    };
    await setDoc(doc(db, 'users', testData.paymentTestUserId), paymentTestUser);
    
    try {
        // 1. Disable payments
        await updateDoc(settingsRef, { isEnabled: false });
        console.log('  - Payments disabled for test.');

        // 2. Test free membership upgrade
        const upgradeResult = await upgradeMembershipAction('investor', 'lifetime', 100, paymentTestUser);
        if (!upgradeResult.success || !upgradeResult.instant) {
            throw new Error('Free membership upgrade failed. Expected instant success.');
        }
        const updatedUserDoc = await getDoc(doc(db, 'users', testData.paymentTestUserId));
        if (!updatedUserDoc.exists() || updatedUserDoc.data().role !== 'Investor') {
            throw new Error('User role was not upgraded to Investor in the database.');
        }
        console.log('  ✅ Free membership upgrade successful.');

        // 3. Test free deal creation
        const dealResult = await startDealAction(
            updatedUserDoc.data() as UserProfile, // Now an investor
            testData.problemCreatorId,
            testData.problemId,
            'Test Problem: Integrity Check',
            'problem',
            0 // Amount is ignored when payments are off
        );
        if (!dealResult.success || !dealResult.dealId) {
            throw new Error('Free deal creation failed. Expected a dealId in return.');
        }
        const dealDoc = await getDoc(doc(db, 'deals', dealResult.dealId));
        if (!dealDoc.exists()) {
            throw new Error('Deal document was not created in the database.');
        }
        await deleteDoc(dealDoc.ref); // Clean up the test deal immediately
        console.log('  ✅ Free deal creation successful.');

    } finally {
        // ALWAYS re-enable payments
        await updateDoc(settingsRef, { isEnabled: true });
        console.log('  - Payments re-enabled.');
    }
}


async function cleanup() {
    console.log('\n- 🧹 Cleaning up test data...');
    const promises = [];
    if (testData.problemId) {
        promises.push(deleteDoc(doc(db, 'problems', testData.problemId)));
    }
    promises.push(deleteDoc(doc(db, 'users', testData.problemCreatorId)));
    promises.push(deleteDoc(doc(db, 'users', testData.solutionCreatorId)));
    promises.push(deleteDoc(doc(db, 'users', testData.paymentTestUserId)));
    
    try {
        await Promise.all(promises);
        console.log('  ✅ Cleanup complete.');
    } catch (error) {
        console.error('  ⚠️  Error during cleanup:', (error as Error).message);
    }
}

// Run the main function
main();
