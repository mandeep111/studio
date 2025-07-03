

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentSnapshot,
  startAfter,
  deleteField,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db, storage } from "./firebase/config";
import type { Idea, Problem, Solution, UserProfile, Deal, Message, Notification, Business, CreatorReference, Payment, Ad, PaymentSettings } from "./types";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

async function uploadAttachment(file: File): Promise<{ url: string; name: string }> {
  if (!file) {
    throw new Error("No file provided for upload.");
  }
  const fileId = uuidv4();
  const storageRef = ref(storage, `attachments/${fileId}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { url, name: file.name };
}

async function uploadAvatar(userId: string, file: File): Promise<{ url: string }> {
    if (!file) {
        throw new Error("No file provided for avatar upload.");
    }
    const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url };
}

// --- Data Fetching ---

export async function getProblems(): Promise<Problem[]> {
  const col = collection(db, "problems");
  const q = query(col, orderBy("createdAt", "desc"), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Problem));
}

export async function getSolutions(): Promise<Solution[]> {
  const col = collection(db, "solutions");
  const q = query(col, orderBy("upvotes", "desc"), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Solution));
}

export async function getIdeas(): Promise<Idea[]> {
  const col = collection(db, "ideas");
  const q = query(col, orderBy("createdAt", "desc"), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Idea));
}

export async function getBusinesses(): Promise<Business[]> {
    const col = collection(db, "businesses");
    const q = query(col, orderBy("createdAt", "desc"), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Business));
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const col = collection(db, "users");
  const snapshot = await getDocs(col);
  return snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id } as UserProfile));
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } as UserProfile : null;
}

export async function getProblem(id: string): Promise<Problem | null> {
    const docRef = doc(db, "problems", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Problem : null;
}

export async function getSolution(id: string): Promise<Solution | null> {
    const docRef = doc(db, "solutions", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Solution : null;
}

export async function getIdea(id: string): Promise<Idea | null> {
    const docRef = doc(db, "ideas", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Idea : null;
}

export async function getBusiness(id: string): Promise<Business | null> {
    const docRef = doc(db, "businesses", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? {id: docSnap.id, ...docSnap.data()} as Business : null;
}

export async function getSolutionsForProblem(problemId: string): Promise<Solution[]> {
    const col = collection(db, "solutions");
    const q = query(col, where("problemId", "==", problemId), orderBy("upvotes", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Solution));
}

export async function getProblemsByUser(userId: string): Promise<Problem[]> {
    const col = collection(db, "problems");
    const q = query(col, where("creator.userId", "==", userId));
    const snapshot = await getDocs(q);
    const problems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Problem));
    // Sort in-memory to avoid needing a composite index
    return problems.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function getSolutionsByUser(userId: string): Promise<Solution[]> {
    const col = collection(db, "solutions");
    const q = query(col, where("creator.userId", "==", userId));
    const snapshot = await getDocs(q);
    const solutions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Solution));
     // Sort in-memory to avoid needing a composite index
    return solutions.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function getIdeasByUser(userId: string): Promise<Idea[]> {
    const col = collection(db, "ideas");
    const q = query(col, where("creator.userId", "==", userId));
    const snapshot = await getDocs(q);
    const ideas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Idea));
     // Sort in-memory to avoid needing a composite index
    return ideas.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function getBusinessesByUser(userId: string): Promise<Business[]> {
    const col = collection(db, "businesses");
    const q = query(col, where("creator.userId", "==", userId));
    const snapshot = await getDocs(q);
    const businesses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Business));
    // Sort in-memory to avoid needing a composite index
    return businesses.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function getUpvotedItems(userId: string) {
    // Queries are changed to fetch all matching documents without ordering,
    // to avoid needing composite indexes. Sorting is handled in-memory.
    const problemsQuery = query(collection(db, "problems"), where("upvotedBy", "array-contains", userId));
    const solutionsQuery = query(collection(db, "solutions"), where("upvotedBy", "array-contains", userId));
    const ideasQuery = query(collection(db, "ideas"), where("upvotedBy", "array-contains", userId));
    const businessesQuery = query(collection(db, "businesses"), where("upvotedBy", "array-contains", userId));

    const [problemsSnap, solutionsSnap, ideasSnap, businessesSnap] = await Promise.all([
        getDocs(problemsQuery),
        getDocs(solutionsQuery),
        getDocs(ideasQuery),
        getDocs(businessesQuery)
    ]);

    const problems = problemsSnap.docs.map(doc => ({ type: 'problem' as const, ...doc.data() as Problem, id: doc.id }));
    const solutions = solutionsSnap.docs.map(doc => ({ type: 'solution' as const, ...doc.data() as Solution, id: doc.id }));
    const ideas = ideasSnap.docs.map(doc => ({ type: 'idea' as const, ...doc.data() as Idea, id: doc.id }));
    const businesses = businessesSnap.docs.map(doc => ({ type: 'business' as const, ...doc.data() as Business, id: doc.id }));


    const allItems = [...problems, ...solutions, ...ideas, ...businesses];
    
    // Sort by creation date descending
    allItems.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return allItems.slice(0, 20); // Limit total to 20
}

const PAGE_SIZE = 9;

export async function getPaginatedProblems(options: { sortBy: 'createdAt' | 'upvotes' | 'solutionsCount' | 'interestedInvestorsCount', lastVisible?: DocumentSnapshot | null }): Promise<{ data: Problem[], lastVisible: DocumentSnapshot | null }> {
    const col = collection(db, "problems");
    const { sortBy, lastVisible } = options;

    const qConstraints = [
        orderBy(sortBy, "desc"), 
        limit(PAGE_SIZE)
    ];
    
    if (lastVisible) {
      qConstraints.push(startAfter(lastVisible));
    }
    
    const q = query(col, ...qConstraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Problem));
    const newLastVisible = snapshot.docs.length === PAGE_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { data, lastVisible: newLastVisible };
}

export async function getPaginatedSolutions(options: { sortBy: 'createdAt' | 'upvotes', lastVisible?: DocumentSnapshot | null }): Promise<{ data: Solution[], lastVisible: DocumentSnapshot | null }> {
  const col = collection(db, "solutions");
  const { sortBy, lastVisible } = options;

  const qConstraints = [orderBy(sortBy, "desc"), limit(PAGE_SIZE)];
  if(lastVisible) {
    qConstraints.push(startAfter(lastVisible));
  }
  
  const q = query(col, ...qConstraints);
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Solution));
  const newLastVisible = snapshot.docs.length === PAGE_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { data, lastVisible: newLastVisible };
}

export async function getPaginatedIdeas(options: { sortBy: 'createdAt' | 'upvotes', lastVisible?: DocumentSnapshot | null }): Promise<{ data: Idea[], lastVisible: DocumentSnapshot | null }> {
  const col = collection(db, "ideas");
  const { sortBy, lastVisible } = options;

  const qConstraints = [orderBy(sortBy, "desc"), limit(PAGE_SIZE)];
  if(lastVisible) {
    qConstraints.push(startAfter(lastVisible));
  }
  
  const q = query(col, ...qConstraints);
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Idea));
  const newLastVisible = snapshot.docs.length === PAGE_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { data, lastVisible: newLastVisible };
}

export async function getPaginatedBusinesses(options: { sortBy: 'createdAt' | 'upvotes', lastVisible?: DocumentSnapshot | null }): Promise<{ data: Business[], lastVisible: DocumentSnapshot | null }> {
    const col = collection(db, "businesses");
    const { sortBy, lastVisible } = options;
  
    const qConstraints = [orderBy(sortBy, "desc"), limit(PAGE_SIZE)];
    if(lastVisible) {
      qConstraints.push(startAfter(lastVisible));
    }
    
    const q = query(col, ...qConstraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Business));
    const newLastVisible = snapshot.docs.length === PAGE_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { data, lastVisible: newLastVisible };
}

const INVESTOR_PAGE_SIZE = 12;
export async function getPaginatedInvestors(options: { sortBy?: 'dealsCount' | 'dealsCompletedCount' | 'upvotes' | 'name', lastVisible?: DocumentSnapshot | null }): Promise<{ users: UserProfile[], lastVisible: DocumentSnapshot | null }> {
    const usersCol = collection(db, "users");
    const { sortBy = 'name', lastVisible } = options;

    const qConstraints = [
        where("role", "==", "Investor"),
        orderBy(sortBy, sortBy === 'name' ? "asc" : "desc"),
        limit(INVESTOR_PAGE_SIZE)
    ];

    if (lastVisible) {
        qConstraints.push(startAfter(lastVisible));
    }

    const q = query(usersCol, ...qConstraints);
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    const newLastVisible = snapshot.docs.length === INVESTOR_PAGE_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;
    
    return { users, lastVisible: newLastVisible };
}

export async function getContentByCreators(creatorIds: string[]): Promise<Array<Problem | Solution>> {
    if (creatorIds.length === 0) return [];

    const CHUNK_SIZE = 30;
    const chunks = [];
    for (let i = 0; i < creatorIds.length; i += CHUNK_SIZE) {
        chunks.push(creatorIds.slice(i, i + CHUNK_SIZE));
    }
    
    const allContent: Array<(Problem & {type: 'problem'}) | (Solution & {type: 'solution'})> = [];

    for (const chunk of chunks) {
        const problemsQuery = query(collection(db, "problems"), where("creator.userId", "in", chunk));
        const solutionsQuery = query(collection(db, "solutions"), where("creator.userId", "in", chunk));

        const [problemsSnap, solutionsSnap] = await Promise.all([
            getDocs(problemsQuery),
            getDocs(solutionsQuery)
        ]);

        const problems = problemsSnap.docs.map(doc => ({ type: 'problem' as const, ...doc.data() as Problem, id: doc.id }));
        const solutions = solutionsSnap.docs.map(doc => ({ type: 'solution' as const, ...doc.data() as Solution, id: doc.id }));

        allContent.push(...problems, ...solutions);
    }
    
    allContent.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return allContent;
}


// --- Creation & Updates ---

export async function createNotification(userId: string | "admins", message: string, link: string) {
    const notificationsCol = collection(db, "notifications");
    await addDoc(notificationsCol, {
        userId,
        message,
        link,
        read: false,
        createdAt: serverTimestamp(),
    });
}

export async function addTags(tags: string[]) {
    if (!tags || tags.length === 0) return;
    const batch = writeBatch(db);
    const tagsCol = collection(db, "tags");
    tags.forEach(tag => {
        const tagRef = doc(tagsCol, tag.toLowerCase().trim());
        batch.set(tagRef, { name: tag.trim(), count: increment(1) }, { merge: true });
    });
    await batch.commit();
}

export async function getTags(): Promise<string[]> {
    const tagsCol = collection(db, "tags");
    const snapshot = await getDocs(tagsCol);
    return snapshot.docs.map(doc => doc.data().name as string);
}

// --- Upvote & Points ---

// This function is deprecated in favor of the upvoteItemAction in actions.ts
// to be called from the client with a user object.
// We leave it here in case it's called from other places but it should be removed.
async function toggleUpvote(collectionName: "problems" | "solutions" | "ideas" | "businesses", docId: string, userId: string) {
    // This logic has been moved to a server action for security.
}


// --- Investor & Deals ---

export async function logPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>) {
    const paymentsCol = collection(db, "payments");
    await addDoc(paymentsCol, {
        ...paymentData,
        createdAt: serverTimestamp(),
    });
}

export async function updateUserMembership(userId: string, plan: 'investor') {
    const userRef = doc(db, "users", userId);
    const updates: Partial<UserProfile> = {
        isPremium: true,
        role: 'Investor'
    };
    await updateDoc(userRef, updates);
}

export async function findDealByUserAndItem(itemId: string, investorId: string): Promise<Deal | null> {
    const dealsRef = collection(db, 'deals');
    const q = query(
        dealsRef, 
        where('relatedItemId', '==', itemId), 
        where('investor.userId', '==', investorId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const dealDoc = snapshot.docs[0];
    return { id: dealDoc.id, ...dealDoc.data() } as Deal;
}

export async function createDeal(
    investorProfile: UserProfile,
    primaryCreatorId: string,
    itemId: string,
    itemTitle: string,
    itemType: 'problem' | 'idea' | 'business',
    amount: number,
    solutionCreatorId?: string
): Promise<string> {
    // Dynamically import admin-only modules to keep this file client-safe
    const { adminDb } = await import('./firebase/admin');
    const { FieldValue } = await import('firebase-admin/firestore');

    const itemRef = adminDb.collection(`${itemType}s`).doc(itemId);
    const investorRef = adminDb.collection('users').doc(investorProfile.uid);
    const primaryCreatorRef = adminDb.collection('users').doc(primaryCreatorId);
    
    const primaryCreatorSnap = await primaryCreatorRef.get();
    if (!primaryCreatorSnap.exists) {
        throw new Error(`Primary creator with ID ${primaryCreatorId} not found.`);
    }
    const primaryCreator = primaryCreatorSnap.data() as UserProfile;

    let solutionCreator: UserProfile | null = null;
    if (solutionCreatorId) {
        const solutionCreatorRef = adminDb.collection('users').doc(solutionCreatorId);
        const solutionCreatorSnap = await solutionCreatorRef.get();
        if (solutionCreatorSnap.exists) {
            solutionCreator = solutionCreatorSnap.data() as UserProfile;
        }
    }
    
    const participantIds = [investorProfile.uid, primaryCreatorId];
    if (solutionCreatorId && solutionCreatorId !== primaryCreatorId) {
        participantIds.push(solutionCreatorId);
    }
    
    const dealRef = adminDb.collection('deals').doc();

    const dealData: Omit<Deal, 'id'> = {
        investor: {
            userId: investorProfile.uid,
            name: investorProfile.name,
            avatarUrl: investorProfile.avatarUrl,
            expertise: investorProfile.expertise,
        },
        primaryCreator: {
            userId: primaryCreator.uid,
            name: primaryCreator.name,
            avatarUrl: primaryCreator.avatarUrl,
            expertise: primaryCreator.expertise,
        },
        solutionCreator: solutionCreator ? {
            userId: solutionCreator.uid,
            name: solutionCreator.name,
            avatarUrl: solutionCreator.avatarUrl,
            expertise: solutionCreator.expertise,
        } : undefined,
        relatedItemId: itemId,
        title: itemTitle,
        type: itemType,
        createdAt: FieldValue.serverTimestamp() as any,
        participantIds,
        status: 'active',
    };

    const paymentRef = adminDb.collection('payments').doc();

    await adminDb.runTransaction(async (transaction) => {
        // Create the deal
        transaction.set(dealRef, dealData);
        // Update item interested count
        transaction.update(itemRef, { interestedInvestorsCount: FieldValue.increment(1) });
        // Update user deal counts
        transaction.update(investorRef, { dealsCount: FieldValue.increment(1) });
        transaction.update(primaryCreatorRef, { dealsCount: FieldValue.increment(1) });
        if (solutionCreatorId && solutionCreatorId !== primaryCreatorId) {
            transaction.update(adminDb.collection('users').doc(solutionCreatorId), { dealsCount: FieldValue.increment(1) });
        }
        
        // Log payment record (even for free deals, with amount 0)
        transaction.set(paymentRef, {
            userId: investorProfile.uid,
            userName: investorProfile.name,
            userAvatarUrl: investorProfile.avatarUrl,
            type: 'deal_creation',
            amount: amount,
            createdAt: FieldValue.serverTimestamp(),
            relatedDealId: dealRef.id,
            relatedDealTitle: itemTitle,
        });
    });

    // Send notifications and initial message outside the transaction
    const dealLink = `/deals/${dealRef.id}`;
    const notificationMessage = `${investorProfile.name} has started a deal for your ${itemType}: "${itemTitle}"`;
    await createNotification(primaryCreatorId, notificationMessage, dealLink);
    if (solutionCreatorId && solutionCreatorId !== primaryCreatorId) {
        await createNotification(solutionCreatorId, notificationMessage, dealLink);
    }

    await addSystemMessage(dealRef.id, 'Deal started! You can now chat securely.');

    // Update unread message counts for participants (except the investor who started it)
    const batch = adminDb.batch();
    const unreadUpdate = { [`unreadDealMessages.${dealRef.id}`]: 1 };
    batch.update(primaryCreatorRef, unreadUpdate);
    if (solutionCreatorId && solutionCreatorId !== primaryCreatorId) {
        batch.update(adminDb.collection('users').doc(solutionCreatorId), unreadUpdate);
    }
    await batch.commit();

    return dealRef.id;
}


export async function getDeal(id: string): Promise<Deal | null> {
    const docRef = doc(db, "deals", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Deal : null;
}

export async function getDealsForUser(userId: string): Promise<Deal[]> {
    const dealsCol = collection(db, "deals");
    const q = query(dealsCol, where("participantIds", "array-contains", userId));
    const snapshot = await getDocs(q);
    const allDeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));

    allDeals.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return allDeals;
}

export async function getMessages(dealId: string): Promise<Message[]> {
    const messagesCol = collection(db, `deals/${dealId}/messages`);
    const q = query(messagesCol, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
}

export async function addSystemMessage(dealId: string, text: string) {
    const messagesCol = collection(db, `deals/${dealId}/messages`);
    await addDoc(messagesCol, {
        dealId,
        text,
        sender: {
            userId: 'system',
            name: 'System',
            avatarUrl: '',
            expertise: 'System Message'
        },
        createdAt: serverTimestamp(),
    });
}


export async function markDealAsRead(userId: string, dealId: string) {
    const userRef = doc(db, "users", userId);
    const fieldPath = `unreadDealMessages.${dealId}`;
    
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().unreadDealMessages?.[dealId]) {
        await updateDoc(userRef, {
            [fieldPath]: deleteField()
        });
    }
}

// Deprecated in favor of server action
export async function updateDealStatus(
    dealId: string,
    investorId: string,
    status: 'completed' | 'cancelled'
): Promise<{ success: boolean; message: string }> {
    // This logic has been moved to a server action for security.
    return { success: false, message: 'This function is deprecated.' };
}


// --- Notifications ---
export async function getNotifications(userId: string): Promise<Notification[]> {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) return [];

    let q;
    if (userProfile.role === 'Admin') {
        q = query(collection(db, "notifications"), where("userId", "in", [userId, "admins"]), orderBy("createdAt", "desc"), limit(50));
    } else {
        q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
}


export async function markNotificationsAsRead(userId: string) {
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });

    await batch.commit();
}

// --- Leaderboard & Admin ---
const LEADERBOARD_PAGE_SIZE = 20;

export async function getPaginatedLeaderboardData(options: { lastVisible?: DocumentSnapshot | null }): Promise<{ users: UserProfile[], lastVisible: DocumentSnapshot | null }> {
    const usersCol = collection(db, "users");
    const { lastVisible } = options;
  
    const qConstraints = [
        where("points", ">", 0), 
        orderBy("points", "desc"), 
        limit(LEADERBOARD_PAGE_SIZE)
    ];
    if(lastVisible) {
      qConstraints.push(startAfter(lastVisible));
    }
    
    const q = query(usersCol, ...qConstraints);
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    const newLastVisible = snapshot.docs.length === LEADERBOARD_PAGE_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { users, lastVisible: newLastVisible };
}

export async function getPayments(): Promise<Payment[]> {
    const paymentsCol = collection(db, "payments");
    const q = query(paymentsCol, orderBy("createdAt", "desc"), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
}

export async function getUnapprovedItems() {
    const problemsQuery = query(collection(db, "problems"), where("priceApproved", "==", false));
    const solutionsQuery = query(collection(db, "solutions"), where("priceApproved", "==", false));
    const businessesQuery = query(collection(db, "businesses"), where("priceApproved", "==", false));
    const ideasQuery = query(collection(db, "ideas"), where("priceApproved", "==", false));

    const [problemsSnap, solutionsSnap, businessesSnap, ideasSnap] = await Promise.all([
        getDocs(problemsQuery),
        getDocs(solutionsQuery),
        getDocs(businessesQuery),
        getDocs(ideasQuery),
    ]);

    const problems = problemsSnap.docs.map(doc => ({ type: 'problem' as const, id: doc.id, ...doc.data() as Problem }));
    const solutions = solutionsSnap.docs.map(doc => ({ type: 'solution' as const, id: doc.id, ...doc.data() as Solution }));
    const businesses = businessesSnap.docs.map(doc => ({ type: 'business' as const, id: doc.id, ...doc.data() as Business }));
    const ideas = ideasSnap.docs.map(doc => ({ type: 'idea' as const, id: doc.id, ...doc.data() as Idea }));
    
    return [...problems, ...solutions, ...businesses, ...ideas];
}

// --- Ads ---

export async function getAds(): Promise<Ad[]> {
    const col = collection(db, "ads");
    const q = query(col, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
}

export async function getActiveAdForPlacement(placement: Ad['placement']): Promise<Ad | null> {
    const col = collection(db, "ads");
    const q = query(col, where("placement", "==", placement), where("isActive", "==", true), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const adDoc = snapshot.docs[0];
    return { id: adDoc.id, ...adDoc.data() } as Ad;
}

// --- Platform Settings ---

export async function getPaymentSettings(): Promise<PaymentSettings> {
    const docRef = doc(db, 'settings', 'payment');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as PaymentSettings;
    }
    // Default to enabled if not set
    return { isEnabled: true };
}

// --- Counts for Stats ---
export async function getCounts() {
    // This is not perfectly efficient, but for a prototype it's acceptable.
    // In a production environment, you would maintain these counts in a separate document
    // and update them with Cloud Functions on create/delete events.
    const problemsQuery = query(collection(db, "problems"));
    const solutionsQuery = query(collection(db, "solutions"));
    const ideasQuery = query(collection(db, "ideas"));
    const businessesQuery = query(collection(db, "businesses"));
    const investorsQuery = query(collection(db, "users"), where("role", "==", "Investor"));

    const [
        problemsSnap,
        solutionsSnap,
        ideasSnap,
        businessesSnap,
        investorsSnap
    ] = await Promise.all([
        getDocs(problemsQuery),
        getDocs(solutionsQuery),
        getDocs(ideasQuery),
        getDocs(businessesQuery),
        getDocs(investorsQuery)
    ]);

    return {
        problems: problemsSnap.size,
        solutions: solutionsSnap.size,
        ideas: ideasSnap.size,
        businesses: businessesSnap.size,
        investors: investorsSnap.size,
    };
}


// --- Functions below are deprecated and logic has moved to server actions ---
// They are kept for reference or if any part of the app still calls them,
// but they should be considered unsafe for direct client-side use for writes.

export async function approveItem(type: 'problem' | 'solution' | 'business' | 'idea', id: string) {
    console.warn("DEPRECATED: approveItem called from firestore.ts. Use server action instead.");
}

export async function deleteItem(type: 'problem' | 'solution' | 'idea' | 'user' | 'business' | 'ad', id: string) {
    console.warn("DEPRECATED: deleteItem called from firestore.ts. Use server action instead.");
}

export async function createAd(data: Omit<Ad, 'id' | 'createdAt' | 'isActive'>) {
    console.warn("DEPRECATED: createAd called from firestore.ts. Use server action instead.");
}

export async function toggleAdStatus(id: string, isActive: boolean) {
     console.warn("DEPRECATED: toggleAdStatus called from firestore.ts. Use server action instead.");
}

export async function updatePaymentSettings(isEnabled: boolean) {
     console.warn("DEPRECATED: updatePaymentSettings called from firestore.ts. Use server action instead.");
}

export async function updateUserProfile(userId: string, data: { name: string; expertise: string }, avatarFile?: File) {
    console.warn("DEPRECATED: updateUserProfile called from firestore.ts. Use server action instead.");
}

export const updateProblem = (id: string, data: { title: string; description: string; tags: string[] }, attachment?: File) => {
    console.warn("DEPRECATED: updateProblem called from firestore.ts. Use server action instead.");
}

export const updateSolution = (id: string, data: { description: string }, attachment?: File) => {
    console.warn("DEPRECATED: updateSolution called from firestore.ts. Use server action instead.");
}

export const updateIdea = (id: string, data: { title: string; description: string; tags: string[] }, attachment?: File) => {
    console.warn("DEPRECATED: updateIdea called from firestore.ts. Use server action instead.");
}

export const updateBusiness = (id: string, data: { title: string; description: string; tags: string[]; stage: string }, attachment?: File) => {
    console.warn("DEPRECATED: updateBusiness called from firestore.ts. Use server action instead.");
}
export async function sendMessage(dealId: string, text: string, sender: UserProfile) {
    console.warn("DEPRECATED: sendMessage called from firestore.ts. Use server action instead.");
}
