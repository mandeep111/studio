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
} from "firebase/firestore";
import { db, storage } from "./firebase/config";
import type { Idea, Problem, Solution, UserProfile, Deal, Message, Notification, Business, CreatorReference } from "./types";
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


// --- Creation & Updates ---

async function createNotification(userId: string | "admins", message: string, link: string) {
    const notificationsCol = collection(db, "notifications");
    await addDoc(notificationsCol, {
        userId,
        message,
        link,
        read: false,
        createdAt: serverTimestamp(),
    });
}

export async function createProblem(title: string, description: string, tags: string, price: number | null, creator: UserProfile, attachment?: File) {
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
            tags: tags.split(',').map(t => t.trim()),
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
        };
        
        transaction.set(newProblemRef, problemData);

        // Award points to creator
        const userRef = doc(db, "users", creator.uid);
        transaction.update(userRef, { points: increment(50) });

        if (!priceApproved) {
            await createNotification(
                "admins", // Special ID for admin notifications
                `${creator.name} submitted a problem "${title}" with a price of $${price}, which requires approval.`,
                `/problems/${newProblemRef.id}`
            );
        }
    });
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
        interestedInvestorsCount: 0, // Solutions inherit this, but it's managed on the problem
    };
    
    batch.set(solutionRef, solutionData);

    batch.update(problemRef, { solutionsCount: increment(1) });

    await batch.commit();

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
}

export async function createIdea(title: string, description: string, tags: string, creator: UserProfile, attachment?: File) {
  const ideasCol = collection(db, "ideas");
  
  let attachmentData: { url: string; name: string } | null = null;
    if (attachment) {
        attachmentData = await uploadAttachment(attachment);
    }
  
  await addDoc(ideasCol, {
    title,
    description,
    tags: tags.split(',').map(t => t.trim()),
    creator: {
        userId: creator.uid,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        expertise: creator.expertise,
    },
    upvotes: 0,
    upvotedBy: [],
    createdAt: serverTimestamp(),
    attachmentUrl: attachmentData?.url || null,
    attachmentFileName: attachmentData?.name || null,
    interestedInvestorsCount: 0,
  });
}

export async function createBusiness(title: string, description: string, tags: string, stage: string, price: number | null, creator: UserProfile, attachment?: File) {
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
            tags: tags.split(',').map(t => t.trim()),
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
            price: price || null, // Represents funding sought
            priceApproved,
            attachmentUrl: attachmentData?.url || null,
            attachmentFileName: attachmentData?.name || null,
            interestedInvestorsCount: 0,
        };

        transaction.set(newBusinessRef, businessData);

        // Award points to creator for listing a business
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
}


// --- Upvote & Points ---

async function toggleUpvote(collectionName: "problems" | "solutions" | "ideas" | "businesses", docId: string, userId: string) {
    let creatorId: string | null = null;
    let isAlreadyUpvoted = false;

    await runTransaction(db, async (transaction) => {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) {
            throw new Error("Document does not exist!");
        }

        const data = docSnap.data();
        creatorId = data.creator.userId;

        if (creatorId === userId) {
            throw new Error("You cannot upvote your own content.");
        }

        isAlreadyUpvoted = (data.upvotedBy as string[]).includes(userId);

        const creatorRef = doc(db, "users", creatorId!);
        
        const pointValues = { problems: 20, solutions: 20, businesses: 10, ideas: 0 };
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
        await createNotification(
            creatorId,
            `${upvoterName} upvoted your ${collectionName.slice(0, -1)}!`,
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


// --- Investor & Deals ---

export async function becomeInvestor(userId: string) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        role: "Investor",
        isPremium: true
    });
}

export async function createDeal(
    investorProfile: UserProfile, 
    primaryCreatorId: string, 
    itemId: string, 
    itemTitle: string, 
    itemType: 'problem' | 'idea' | 'business', 
    solutionCreatorId?: string
): Promise<string> {
    
    const newDealRef = doc(collection(db, "deals"));

    await runTransaction(db, async (transaction) => {
        const participantsMap = new Map<string, CreatorReference>();

        // Add investor
        participantsMap.set(investorProfile.uid, { userId: investorProfile.uid, name: investorProfile.name, avatarUrl: investorProfile.avatarUrl, expertise: investorProfile.expertise });

        // Fetch and add primary creator
        const primaryCreatorSnap = await transaction.get(doc(db, "users", primaryCreatorId));
        if (!primaryCreatorSnap.exists()) throw new Error("Primary creator not found");
        const primaryCreator = {uid: primaryCreatorSnap.id, ...primaryCreatorSnap.data()} as UserProfile;
        participantsMap.set(primaryCreator.uid, { userId: primaryCreator.uid, name: primaryCreator.name, avatarUrl: primaryCreator.avatarUrl, expertise: primaryCreator.expertise });

        // Fetch and add solution creator if provided
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
        };

        if (solutionCreator) {
            dealData.solutionCreator = { userId: solutionCreator.uid, name: solutionCreator.name, avatarUrl: solutionCreator.avatarUrl, expertise: solutionCreator.expertise };
        }
        
        transaction.set(newDealRef, dealData);

        const itemRef = doc(db, `${itemType}s`, itemId);
        transaction.update(itemRef, { interestedInvestorsCount: increment(1) });
    });
    
    // Notifications part
    const dealLink = `/deals/${newDealRef.id}`;
    const dealDoc = await getDoc(newDealRef);
    if (!dealDoc.exists()) throw new Error("Could not create deal.");
    
    const dealData = dealDoc.data() as Deal;

    const participantsToNotify = (dealData.participantIds || []).filter(id => id !== investorProfile.uid);
    
    for (const participantId of participantsToNotify) {
        const message = `${investorProfile.name} wants to start a deal about "${itemTitle}"!`;
        await createNotification(participantId, message, dealLink);
    }
    
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

    // 1. Add the new message
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

    // 2. Increment unread count for other participants
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


export async function markDealAsRead(userId: string, dealId: string) {
    const userRef = doc(db, "users", userId);
    const fieldPath = `unreadDealMessages.${dealId}`;
    
    // Using deleteField to remove the key if the count is > 0
    // This is more efficient than setting it to 0.
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().unreadDealMessages?.[dealId]) {
        await updateDoc(userRef, {
            [fieldPath]: deleteField()
        });
    }
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
export async function getLeaderboardData(): Promise<UserProfile[]> {
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("points", ">", 0), orderBy("points", "desc"), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

export async function getUnapprovedItems() {
    const problemsQuery = query(collection(db, "problems"), where("priceApproved", "==", false));
    const solutionsQuery = query(collection(db, "solutions"), where("priceApproved", "==", false));
    const businessesQuery = query(collection(db, "businesses"), where("priceApproved", "==", false));

    const [problemsSnap, solutionsSnap, businessesSnap] = await Promise.all([
        getDocs(problemsQuery),
        getDocs(solutionsQuery),
        getDocs(businessesQuery),
    ]);

    const problems = problemsSnap.docs.map(doc => ({ type: 'problem' as const, id: doc.id, ...doc.data() as Problem }));
    const solutions = solutionsSnap.docs.map(doc => ({ type: 'solution' as const, id: doc.id, ...doc.data() as Solution }));
    const businesses = businessesSnap.docs.map(doc => ({ type: 'business' as const, id: doc.id, ...doc.data() as Business }));
    
    return [...problems, ...solutions, ...businesses];
}

export async function approveItem(type: 'problem' | 'solution' | 'business', id: string) {
    const collectionName = type === 'problem' ? 'problems' : (type === 'solution' ? 'solutions' : 'businesses');
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, { priceApproved: true });
}

export async function deleteItem(type: 'problem' | 'solution' | 'idea' | 'user' | 'business', id: string) {
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
