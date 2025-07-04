// To run this script, use: npm run test:integrity
// It checks the end-to-end functionality of core features against your production Firebase project.

import { config } from 'dotenv';
config({ path: '.env.local' });
import type { UserProfile } from '../src/lib/types';


async function runTest() {
    // USE ADMIN SDK FOR SCRIPTING
    const { adminDb: db } = await import('../src/lib/firebase/admin');
    
    const { suggestPairings } = await import('../src/ai/flows/suggest-pairings');
    const { USER_AVATARS, INVESTOR_AVATARS } = await import('../src/lib/avatars');
    const { 
        startDealAction, 
        updateUserProfileAction, 
        updateDealStatusAction, 
        upvoteItemAction,
        createProblemAction,
        createSolutionAction
    } = await import('../src/app/actions');

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
            isPremium: true,
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
        await db.collection('users').doc(testData.creatorId).set(testProfiles.creator);
        await db.collection('users').doc(testData.investorId).set(testProfiles.investor);
        console.log('  ✅ Temporary users created.');
    }

    async function testFirestoreConnection() {
        console.log('- Testing Firestore Connection...');
        try {
            await db.collection('users').doc('non-existent-user').get();
            console.log('  ✅ Firestore connection is OK.');
        } catch (e) {
            throw new Error(`Failed to connect to Firestore: ${(e as Error).message}`);
        }
    }

    async function testProblemAndSolutionLifecycle() {
        console.log('- Testing Problem & Solution Lifecycle...');
        
        // 1. Create a problem using the server action
        const problemFormData = new FormData();
        problemFormData.append('title', 'Test Problem: Lifecycle');
        problemFormData.append('description', 'A test problem.');
        const createProblemResult = await createProblemAction(testData.creatorId, problemFormData);
        if (!createProblemResult.success) {
            throw new Error(`Problem creation failed: ${createProblemResult.message}`);
        }
        
        // Find the created problem to get its ID
        const problemsCol = db.collection('problems');
        const q = problemsCol.where("title", "==", 'Test Problem: Lifecycle').where("creator.userId", "==", testData.creatorId);
        const problemSnapshot = await q.get();
        if (problemSnapshot.empty) {
            throw new Error('Could not find the created test problem.');
        }
        testData.problemId = problemSnapshot.docs[0].id;
        const problemRef = db.collection('problems').doc(testData.problemId);
        console.log('  ✅ Temporary problem created.');

        // 2. Upvote the problem using the server action
        const upvoteResult = await upvoteItemAction(testData.investorId, testData.problemId, 'problem');
        if (!upvoteResult.success) {
            throw new Error(`Problem upvote failed: ${upvoteResult.message}`);
        }
        let problemDoc = await problemRef.get();
        if (!problemDoc.exists || problemDoc.data()!.upvotes !== 1) {
            throw new Error('Problem upvote count did not update correctly.');
        }
        console.log('  ✅ Problem upvoted successfully.');

        // 3. Create a solution using the server action
        const solutionFormData = new FormData();
        solutionFormData.append('description', 'A test solution');
        solutionFormData.append('problemId', testData.problemId);
        solutionFormData.append('problemTitle', 'Test Problem: Lifecycle');
        const createSolutionResult = await createSolutionAction(testData.creatorId, solutionFormData);
        if (!createSolutionResult.success) {
            throw new Error(`Solution creation failed: ${createSolutionResult.message}`);
        }
        
        problemDoc = await problemRef.get();
        if (!problemDoc.exists || problemDoc.data()!.solutionsCount !== 1) {
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
        const dealDocRef = db.collection('deals').doc(testData.dealId);
        let dealDoc = await dealDocRef.get();
        if (!dealDoc.exists) {
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

        dealDoc = await dealDocRef.get();
        const problemDoc = await db.collection('problems').doc(testData.problemId).get();

        if (dealDoc.data()!.status !== 'completed') {
            throw new Error('Deal status did not update to completed.');
        }
        if (problemDoc.data()!.isClosed !== true) {
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

        const userDoc = await db.collection('users').doc(testData.creatorId).get();
        if (!userDoc.exists || userDoc.data()!.name !== newName) {
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
        if (testData.problemId) promises.push(db.collection('problems').doc(testData.problemId).delete());
        
        // Clean up any solutions created for the test problem
        if (testData.problemId) {
            const solutionsQuery = db.collection('solutions').where('problemId', '==', testData.problemId);
            const solutionSnapshot = await solutionsQuery.get();
            solutionSnapshot.forEach(doc => promises.push(doc.ref.delete()));
        }

        if (testData.dealId) promises.push(db.collection('deals').doc(testData.dealId).delete());
        
        promises.push(db.collection('users').doc(testData.creatorId).delete());
        promises.push(db.collection('users').doc(testData.investorId).delete());
        
        try {
            await Promise.all(promises);
            console.log('  ✅ Cleanup complete.');
        } catch (error) {
            console.error('  ⚠️  Error during cleanup:', (error as Error).message);
        }
    }

    // Run the main function
    main();
}

runTest();
