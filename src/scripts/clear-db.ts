// To run this script, use: npm run db:clear
// WARNING: This script will permanently delete ALL data from your Firestore database.
// Make sure you have a .env.local file with your Firebase project's credentials.

import { config } from 'dotenv';
config({ path: '.env.local' });

import { adminDb } from '../lib/firebase/admin';
import type { CollectionReference } from 'firebase-admin/firestore';

const COLLECTIONS_TO_DELETE = [
    'users',
    'problems',
    'solutions',
    'ideas',
    'businesses',
    'ads',
    'payments',
    'tags',
    'notifications',
];

async function deleteCollection(collectionPath: string, batchSize: number) {
  const collectionRef = adminDb.collection(collectionPath) as CollectionReference;
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query: any, resolve: (value?: unknown) => void) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = adminDb.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}


async function clearDealsAndMessages() {
    console.log('Clearing deals and their message subcollections...');
    const dealsSnapshot = await adminDb.collection('deals').get();

    if (dealsSnapshot.empty) {
        console.log('No deals to clear.');
        return;
    }

    const promises = [];
    for (const dealDoc of dealsSnapshot.docs) {
        console.log(`- Deleting messages for deal ${dealDoc.id}...`);
        const promise = deleteCollection(`deals/${dealDoc.id}/messages`, 100);
        promises.push(promise);
    }
    await Promise.all(promises);
    console.log('All message subcollections deleted.');

    await deleteCollection('deals', 100);
    console.log('Deals collection cleared.');
}

async function clearSettings() {
    console.log('Clearing settings...');
    try {
        await adminDb.collection('settings').doc('payment').delete();
        console.log('Payment settings cleared.');
    } catch(e) {
        console.log('No payment settings found to clear.');
    }
}


async function main() {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('!!! WARNING: THIS WILL DELETE ALL DATA IN YOUR DATABASE. !!!');
    console.log('!!!          This action is irreversible.                !!!');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    // Simple delay to give user a chance to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\nStarting database clearing process...');

    for (const collectionName of COLLECTIONS_TO_DELETE) {
        console.log(`Clearing ${collectionName}...`);
        await deleteCollection(collectionName, 100);
        console.log(`${collectionName} cleared.`);
    }
    
    await clearDealsAndMessages();
    await clearSettings();

    console.log('\nDatabase clearing complete!');
    process.exit(0);
}

main().catch(e => {
  console.error('An error occurred during database clearing:');
  console.error(e);
  process.exit(1);
});
