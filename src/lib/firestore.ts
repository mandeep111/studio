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
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return allItems.slice(0, 20); // Limit total to 20
}

const PAGE_SIZE = 9;

export async function getPaginatedProblems(options: { sortBy: 'createdAt' | 'upvotes', lastVisible?: DocumentSnapshot | null }): Promise<{ data: Problem[], lastVisible: DocumentSnapshot | null }> {
  const col = collection(db, "problems");
  const { sortBy, lastVisible } = options;

  const qConstraints = [orderBy(sortBy, "desc"), limit(PAGE_SIZE)];
  if(lastVisible) {
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
export async function getPaginatedInvestors(options: { sortBy?: 'dealsCount' | 'upvotes' | 'name', lastVisible?: DocumentSnapshot | null }): Promise<{ users: UserProfile[], lastVisible: DocumentSnapshot | null }> {
    const usersCol = collection(db, "users");
    const { sortBy = 'dealsCount', lastVisible } = options;

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

export async function createProblem(title: string, description: string, tags: string[], price: number | null, creator: UserProfile, attachment?: File) {
    await runTransaction(db, async (transaction) => {
        let attachmentData: { url: string; name: string } | null = null;
        if (attachment) {
            attachmentData = await uploadAttachment(attachment);
        }

        const problemsCol = collection(db, "problems");
        const newProblemRef = doc(problemsCol);

        const priceApproved = price ? price <= 1000 : true;
        
        const problemData: Omit<Problem, 'id'> = {
            title,
            description,
            tags,
            creator: {
                userId: creator.uid,
                name: creator.name,
                avatarUrl: creator.avatarUrl,
                expertise: creator.expertise,
            },
            upvotes: 0,
            upvotedBy: [],
            solutionsCount: 0,
            createdAt: serverTimestamp(),
            price: price || null,
            priceApproved,
            attachmentUrl: attachmentData?.url || null,
            attachmentFileName: attachmentData?.name || null,
            interestedInvestorsCount: 0,
            isClosed: false,
        };
        
        transaction.set(newProblemRef, problemData);

        const userRef = doc(db, "users", creator.uid);
        transaction.update(userRef, { points: increment(50) });

        if (!priceApproved) {
            await createNotification(
                "admins", 
                `${creator.name} submitted a problem "${title}" with a price of $${price}, which requires approval.`,
                `/problems/${newProblemRef.id}`
            );
        }
    });

    await addTags(tags);
}


export async function createSolution(description: string, problemId: string, problemTitle: string, price: number | null, creator: UserProfile, attachment?: File) {
    const batch = writeBatch(db);
    
    let attachmentData: { url: string; name: string } | null = null;
    if (attachment) {
        attachmentData = await uploadAttachment(attachment);
    }
    
    const solutionRef = doc(collection(db, "solutions"));
    const problemRef = doc(db, "problems", problemId);
    
    const priceApproved = price ? price <= 1000 : true;

    const solutionData: Omit<Solution, 'id'> = {
        problemId,
        problemTitle,
        description,
        creator: {
            userId: creator.uid,
            name: creator.name,
            avatarUrl: creator.avatarUrl,
            expertise: creator.expertise,
        },
        upvotes: 0,
        upvotedBy: [],
        createdAt: serverTimestamp(),
        price: price || null,
        priceApproved,
        attachmentUrl: attachmentData?.url || null,
        attachmentFileName: attachmentData?.name || null,
        interestedInvestorsCount: 0,
        isClosed: false,
    };
    
    batch.set(solutionRef, solutionData);

    batch.update(problemRef, { solutionsCount: increment(1) });

    const problemDoc = await getDoc(problemRef);
    const problemCreatorId = problemDoc.data()?.creator.userId;

    if (problemCreatorId && problemCreatorId !== creator.uid) {
        await createNotification(
            problemCreatorId,
            `${creator.name} proposed a new solution for your problem: "${problemTitle}"`,
            `/problems/${problemId}`
        );
    }
    if (!priceApproved) {
        await createNotification(
            "admins",
            `${creator.name} submitted a solution for "${problemTitle}" with a price of $${price}, which requires approval.`,
            `/solutions/${solutionRef.id}`
        );
    }
    
    await batch.commit();
}

export async function createIdea(title: string, description: string, tags: string[], price: number | null, creator: UserProfile, attachment?: File) {
  const ideasCol = collection(db, "ideas");
  
  let attachmentData: { url: string; name: string } | null = null;
    if (attachment) {
        attachmentData = await uploadAttachment(attachment);
    }
    
    const priceApproved = price ? price <= 1000 : true;
  
  const newIdeaRef = doc(ideasCol);

  await addDoc(ideasCol, {
    title,
    description,
    tags,
    creator: {
        userId: creator.uid,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        expertise: creator.expertise,
    },
    upvotes: 0,
    upvotedBy: [],
    createdAt: serverTimestamp(),
    price: price || null,
    priceApproved,
    attachmentUrl: attachmentData?.url || null,
    attachmentFileName: attachmentData?.name || null,
    interestedInvestorsCount: 0,
    isClosed: false,
  });

   if (!priceApproved) {
        await createNotification(
            "admins",
            `${creator.name} submitted an idea "${title}" with a price of $${price}, which requires approval.`,
            `/ideas/${newIdeaRef.id}`
        );
    }

  await addTags(tags);
}

export async function createBusiness(title: string, description: string, tags: string[], stage: string, price: number | null, creator: UserProfile, attachment?: File) {
    await runTransaction(db, async (transaction) => {
        let attachmentData: { url: string; name: string } | null = null;
        if (attachment) {
            attachmentData = await uploadAttachment(attachment);
        }

        const businessesCol = collection(db, "businesses");
        const newBusinessRef = doc(businessesCol);

        const priceApproved = price ? price <= 1000 : true;
        
        const businessData: Omit<Business, 'id'> = {
            title,
            description,
            tags,
            stage,
            creator: {
                userId: creator.uid,
                name: creator.name,
                avatarUrl: creator.avatarUrl,
                expertise: creator.expertise,
            },
            upvotes: 0,
            upvotedBy: [],
            createdAt: serverTimestamp(),
            price: price || null, 
            priceApproved,
            attachmentUrl: attachmentData?.url || null,
            attachmentFileName: attachmentData?.name || null,
            interestedInvestorsCount: 0,
            isClosed: false,
        };

        transaction.set(newBusinessRef, businessData);

        const userRef = doc(db, "users", creator.uid);
        transaction.update(userRef, { points: increment(30) });

        if (!priceApproved) {
            await createNotification(
                "admins",
                `${creator.name} submitted a business "${title}" with funding of $${price}, which requires approval.`,
                `/businesses/${newBusinessRef.id}`
            );
        }
    });
    
    await addTags(tags);
}


// --- Upvote & Points ---

async function toggleUpvote(collectionName: "problems" | "solutions" | "ideas" | "businesses", docId: string, userId: string) {
    let creatorId: string | null = null;
    let isAlreadyUpvoted = false;
    let itemTitle = "";

    await runTransaction(db, async (transaction) => {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) {
            throw new Error("Document does not exist!");
        }

        const data = docSnap.data();
        creatorId = data.creator.userId;
        itemTitle = data.title || data.problemTitle;

        if (creatorId === userId) {
            throw new Error("You cannot upvote your own content.");
        }

        isAlreadyUpvoted = (data.upvotedBy as string[]).includes(userId);

        const creatorRef = doc(db, "users", creatorId!);
        
        const pointValues = { problems: 20, solutions: 20, businesses: 10, ideas: 10 };
        const pointChange = pointValues[collectionName] * (isAlreadyUpvoted ? -1 : 1);
        
        transaction.update(docRef, {
            upvotes: increment(isAlreadyUpvoted ? -1 : 1),
            upvotedBy: isAlreadyUpvoted ? arrayRemove(userId) : arrayUnion(userId)
        });

        if (pointChange !== 0) {
            transaction.update(creatorRef, { points: increment(pointChange) });
        }
    });

    if (!isAlreadyUpvoted && creatorId && creatorId !== userId) {
        const upvoterSnap = await getDoc(doc(db, "users", userId));
        const upvoterName = upvoterSnap.exists() ? upvoterSnap.data().name : "Someone";
        
        let message = `${upvoterName} upvoted your ${collectionName.slice(0, -1)}`;
        if (itemTitle) {
            message += `: "${itemTitle}"`;
        }
        
        await createNotification(
            creatorId,
            message,
            `/${collectionName}/${docId}`
        );
    }
}


export async function upvoteProblem(docId: string, userId: string) {
    await toggleUpvote("problems", docId, userId);
}
export async function upvoteSolution(docId: string, userId: string) {
    await toggleUpvote("solutions", docId, userId);
}
export async function upvoteIdea(docId: string, userId: string) {
    await toggleUpvote("ideas", docId, userId);
}
export async function upvoteBusiness(docId: string, userId: string) {
    await toggleUpvote("businesses", docId, userId);
}

export async function upvoteInvestor(investorId: string, voterId: string) {
    await runTransaction(db, async (transaction) => {
        const investorRef = doc(db, "users", investorId);
        const investorSnap = await transaction.get(investorRef);

        if (!investorSnap.exists() || investorSnap.data().role !== 'Investor') {
            throw new Error("Investor profile not found.");
        }
        if (investorId === voterId) {
            throw new Error("You cannot upvote yourself.");
        }

        const data = investorSnap.data();
        const isAlreadyUpvoted = (data.upvotedBy || []).includes(voterId);

        transaction.update(investorRef, {
            upvotes: increment(isAlreadyUpvoted ? -1 : 1),
            upvotedBy: isAlreadyUpvoted ? arrayRemove(voterId) : arrayUnion(voterId)
        });
    });
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
    
    const newDealRef = doc(collection(db, "deals"));

    await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, `${itemType}s`, itemId);
        const itemSnap = await transaction.get(itemRef);
        if (!itemSnap.exists()) throw new Error("Item to start deal on not found.");
        if (itemSnap.data().isClosed) {
            throw new Error("This item is already part of a completed deal and is closed to new deals.");
        }
    
        const participantsMap = new Map<string, CreatorReference>();

        participantsMap.set(investorProfile.uid, { userId: investorProfile.uid, name: investorProfile.name, avatarUrl: investorProfile.avatarUrl, expertise: investorProfile.expertise });

        const primaryCreatorSnap = await transaction.get(doc(db, "users", primaryCreatorId));
        if (!primaryCreatorSnap.exists()) throw new Error("Primary creator not found");
        const primaryCreator = {uid: primaryCreatorSnap.id, ...primaryCreatorSnap.data()} as UserProfile;
        participantsMap.set(primaryCreator.uid, { userId: primaryCreator.uid, name: primaryCreator.name, avatarUrl: primaryCreator.avatarUrl, expertise: primaryCreator.expertise });

        let solutionCreator: UserProfile | null = null;
        if (solutionCreatorId) {
            const solutionCreatorSnap = await transaction.get(doc(db, "users", solutionCreatorId));
            if (solutionCreatorSnap.exists()) {
                solutionCreator = {uid: solutionCreatorSnap.id, ...solutionCreatorSnap.data()} as UserProfile;
                participantsMap.set(solutionCreator.uid, { userId: solutionCreator.uid, name: solutionCreator.name, avatarUrl: solutionCreator.avatarUrl, expertise: solutionCreator.expertise });
            }
        }
        
        const dealData: Omit<Deal, 'id'> = {
            investor: { userId: investorProfile.uid, name: investorProfile.name, avatarUrl: investorProfile.avatarUrl, expertise: investorProfile.expertise },
            primaryCreator: { userId: primaryCreator.uid, name: primaryCreator.name, avatarUrl: primaryCreator.avatarUrl, expertise: primaryCreator.expertise },
            relatedItemId: itemId,
            title: itemTitle,
            type: itemType,
            createdAt: serverTimestamp(),
            participantIds: Array.from(participantsMap.keys()),
            status: 'active',
        };

        if (solutionCreator) {
            dealData.solutionCreator = { userId: solutionCreator.uid, name: solutionCreator.name, avatarUrl: solutionCreator.avatarUrl, expertise: solutionCreator.expertise };
        }
        
        transaction.set(newDealRef, dealData);
        transaction.update(itemRef, { interestedInvestorsCount: increment(1) });
        
        const investorRef = doc(db, "users", investorProfile.uid);
        transaction.update(investorRef, { dealsCount: increment(1) });
    });
    
    const dealLink = `/deals/${newDealRef.id}`;
    
    const dealDoc = await getDoc(newDealRef);
    if (!dealDoc.exists()) throw new Error("Could not create deal.");
    const dealData = dealDoc.data() as Deal;

    const participantsToNotify = (dealData.participantIds || []).filter(id => id !== investorProfile.uid);
    for (const participantId of participantsToNotify) {
        const message = `${investorProfile.name} wants to start a deal about "${itemTitle}"!`;
        await createNotification(participantId, message, dealLink);
    }
    
    await logPayment({
        userId: investorProfile.uid,
        userName: investorProfile.name,
        userAvatarUrl: investorProfile.avatarUrl,
        type: 'deal_creation',
        amount,
        relatedDealId: newDealRef.id,
        relatedDealTitle: itemTitle,
        details: amount === 0 ? 'Free deal (payments disabled)' : undefined,
    });

    return newDealRef.id;
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

export async function sendMessage(dealId: string, text: string, sender: UserProfile) {
    const batch = writeBatch(db);

    const messagesCol = collection(db, `deals/${dealId}/messages`);
    batch.set(doc(messagesCol), {
        dealId,
        text,
        sender: {
            userId: sender.uid,
            name: sender.name,
            avatarUrl: sender.avatarUrl,
            expertise: sender.expertise
        },
        createdAt: serverTimestamp(),
    });

    const dealRef = doc(db, "deals", dealId);
    const dealSnap = await getDoc(dealRef);
    if (dealSnap.exists()) {
        const deal = dealSnap.data() as Deal;
        const participantIds = deal.participantIds || [];

        for (const participantId of participantIds) {
            if (participantId !== sender.uid) {
                const userRef = doc(db, "users", participantId);
                const fieldPath = `unreadDealMessages.${dealId}`;
                batch.update(userRef, { [fieldPath]: increment(1) });
            }
        }
    }
    
    await batch.commit();
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

export async function updateDealStatus(
    dealId: string,
    investorId: string,
    status: 'completed' | 'cancelled'
): Promise<{ success: boolean; message: string }> {
    return await runTransaction(db, async (transaction) => {
        const dealRef = doc(db, "deals", dealId);
        const dealSnap = await transaction.get(dealRef);

        if (!dealSnap.exists()) {
            return { success: false, message: "Deal not found." };
        }

        const deal = dealSnap.data() as Deal;

        if (deal.investor.userId !== investorId) {
            return { success: false, message: "Only the investor can update the deal status." };
        }

        if (deal.status !== 'active') {
            return { success: false, message: "This deal is already closed." };
        }

        transaction.update(dealRef, { status: status });

        // If a deal is completed, mark the related item as closed.
        if (status === 'completed') {
            const itemRef = doc(db, `${deal.type}s`, deal.relatedItemId);
            transaction.update(itemRef, { isClosed: true });
        }


        // Add a system message to the chat
        const messagesCol = collection(db, `deals/${dealId}/messages`);
        const systemMessage = {
            dealId,
            text: `The deal has been marked as ${status} by the investor.`,
            sender: {
                userId: 'system',
                name: 'System',
                avatarUrl: '',
                expertise: 'System Message'
            },
            createdAt: serverTimestamp(),
        };
        transaction.set(doc(messagesCol), systemMessage);

        return { success: true, message: `Deal successfully marked as ${status}.` };
    });
}


// --- Notifications ---
export async function getNotifications(userId: string): Promise<Notification[]> {
    const col = collection(db, "notifications");
    const q = query(col, where("userId", "in", [userId, "admins"]), orderBy("createdAt", "desc"), limit(50));
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

export async function approveItem(type: 'problem' | 'solution' | 'business' | 'idea', id: string) {
    const collectionName = `${type}s`;
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, { priceApproved: true });
}

export async function deleteItem(type: 'problem' | 'solution' | 'idea' | 'user' | 'business' | 'ad', id: string) {
    if (type === 'ad') {
        await deleteDoc(doc(db, 'ads', id));
        return;
    }

    const batch = writeBatch(db);
    const collectionName = type === 'user' ? 'users' : `${type}s`;
    const itemRef = doc(db, collectionName, id);

    if (type === 'solution') {
        const solutionDoc = await getDoc(itemRef);
        if (solutionDoc.exists()) {
            const problemId = solutionDoc.data().problemId;
            const problemRef = doc(db, 'problems', problemId);
            batch.update(problemRef, { solutionsCount: increment(-1) });
        }
    } else if (type === 'problem') {
        const solutionsQuery = query(collection(db, 'solutions'), where('problemId', '==', id));
        const solutionsSnapshot = await getDocs(solutionsQuery);
        solutionsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    batch.delete(itemRef);
    await batch.commit();
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

export async function createAd(data: Omit<Ad, 'id' | 'createdAt' | 'isActive'>) {
    const col = collection(db, "ads");
    await addDoc(col, {
        ...data,
        isActive: true,
        createdAt: serverTimestamp(),
    });
}

export async function toggleAdStatus(id: string, isActive: boolean) {
    const docRef = doc(db, "ads", id);
    await updateDoc(docRef, { isActive });
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

export async function updatePaymentSettings(isEnabled: boolean) {
    const docRef = doc(db, 'settings', 'payment');
    await setDoc(docRef, { isEnabled });
}

export async function updateUserProfile(userId: string, data: { name: string; expertise: string }, avatarFile?: File) {
    const batch = writeBatch(db);
    const userRef = doc(db, "users", userId);

    const updateData: { name: string; expertise: string; avatarUrl?: string } = {
        name: data.name,
        expertise: data.expertise,
    };
    
    let newAvatarUrl: string | undefined = undefined;
    if (avatarFile) {
        const { url } = await uploadAttachment(avatarFile);
        updateData.avatarUrl = url;
        newAvatarUrl = url;
    }

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const existingProfile = userSnap.data() as UserProfile;
    
    const newCreatorRef: CreatorReference = {
        userId: userId,
        name: data.name,
        avatarUrl: newAvatarUrl || existingProfile.avatarUrl,
        expertise: data.expertise,
    };

    // 1. Update User Profile
    batch.update(userRef, updateData);

    // 2. Update denormalized creator fields in items
    const collectionsToUpdate = ['problems', 'solutions', 'ideas', 'businesses'];
    for (const collectionName of collectionsToUpdate) {
        const q = query(collection(db, collectionName), where("creator.userId", "==", userId));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => batch.update(doc.ref, { creator: newCreatorRef }));
    }

    // 3. Update denormalized fields in deals
    const dealsAsInvestorQuery = query(collection(db, "deals"), where("investor.userId", "==", userId));
    const dealsAsPrimaryCreatorQuery = query(collection(db, "deals"), where("primaryCreator.userId", "==", userId));
    const dealsAsSolutionCreatorQuery = query(collection(db, "deals"), where("solutionCreator.userId", "==", userId));
    
    const [dealsAsInvestorSnap, dealsAsPrimaryCreatorSnap, dealsAsSolutionCreatorSnap] = await Promise.all([
        getDocs(dealsAsInvestorQuery),
        getDocs(dealsAsPrimaryCreatorQuery),
        getDocs(dealsAsSolutionCreatorQuery)
    ]);
    
    dealsAsInvestorSnap.forEach(doc => batch.update(doc.ref, { investor: newCreatorRef }));
    dealsAsPrimaryCreatorSnap.forEach(doc => batch.update(doc.ref, { primaryCreator: newCreatorRef }));
    dealsAsSolutionCreatorSnap.forEach(doc => batch.update(doc.ref, { solutionCreator: newCreatorRef }));

    // Messages will not be updated to avoid performance issues. The sender info is a snapshot.
    
    await batch.commit();
}
