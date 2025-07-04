
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
import { db } from "./firebase/config";
import type { Idea, Problem, Solution, UserProfile, Deal, Message, Notification, Business, CreatorReference, Payment, Ad, PaymentSettings } from "./types";

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
        where("isClosed", "==", false),
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

export async function getTags(): Promise<string[]> {
    const tagsCol = collection(db, "tags");
    const snapshot = await getDocs(tagsCol);
    return snapshot.docs.map(doc => doc.data().name as string);
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

export async function getPaginatedLeaderboardData(options: { sortBy?: 'points' | 'name', lastVisible?: DocumentSnapshot | null }): Promise<{ users: UserProfile[], lastVisible: DocumentSnapshot | null }> {
    const usersCol = collection(db, "users");
    const { sortBy = 'points', lastVisible } = options;
  
    const qConstraints = [
        orderBy(sortBy, sortBy === 'name' ? 'asc' : 'desc'),
        limit(LEADERBOARD_PAGE_SIZE)
    ];

    if (sortBy === 'points') {
        qConstraints.unshift(where("points", ">", 0));
    }
    
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
