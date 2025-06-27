"use server";
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
} from "firebase/firestore";
import { db } from "./firebase/config";
import type { Idea, Problem, Solution, UserProfile, Deal, Message, Notification } from "./types";

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

export async function getUpvotedItems(userId: string) {
    // Queries are changed to fetch all matching documents without ordering,
    // to avoid needing composite indexes. Sorting is handled in-memory.
    const problemsQuery = query(collection(db, "problems"), where("upvotedBy", "array-contains", userId));
    const solutionsQuery = query(collection(db, "solutions"), where("upvotedBy", "array-contains", userId));
    const ideasQuery = query(collection(db, "ideas"), where("upvotedBy", "array-contains", userId));

    const [problemsSnap, solutionsSnap, ideasSnap] = await Promise.all([
        getDocs(problemsQuery),
        getDocs(solutionsQuery),
        getDocs(ideasQuery)
    ]);

    const problems = problemsSnap.docs.map(doc => ({ type: 'problem', ...doc.data() as Problem, id: doc.id }));
    const solutions = solutionsSnap.docs.map(doc => ({ type: 'solution', ...doc.data() as Solution, id: doc.id }));
    const ideas = ideasSnap.docs.map(doc => ({ type: 'idea', ...doc.data() as Idea, id: doc.id }));

    const allItems = [...problems, ...solutions, ...ideas];
    
    // Sort by creation date descending
    allItems.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return allItems.slice(0, 20); // Limit total to 20
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

export async function createProblem(title: string, description: string, tags: string, price: number | null, creator: UserProfile) {
    await runTransaction(db, async (transaction) => {
        const problemsCol = collection(db, "problems");
        const newProblemRef = doc(problemsCol);

        const priceApproved = price ? price <= 1000 : true;
        
        transaction.set(newProblemRef, {
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
            priceApproved
        });

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


export async function createSolution(description: string, problemId: string, problemTitle: string, price: number | null, creator: UserProfile) {
    const batch = writeBatch(db);
    
    const solutionRef = doc(collection(db, "solutions"));
    const problemRef = doc(db, "problems", problemId);
    
    const priceApproved = price ? price <= 1000 : true;

    batch.set(solutionRef, {
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
        priceApproved
    });

    batch.update(problemRef, { solutionsCount: increment(1) });

    await batch.commit();

    const problemDoc = await getDoc(problemRef);
    const problemCreatorId = problemDoc.data()?.creator.userId;

    if (problemCreatorId) {
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

export async function createIdea(title: string, description: string, tags: string, creator: UserProfile) {
  const ideasCol = collection(db, "ideas");
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
  });
}

// --- Upvote & Points ---

async function toggleUpvote(collectionName: "problems" | "solutions" | "ideas", docId: string, userId: string) {
    const docRef = doc(db, collectionName, docId);
    
    // Data needed for notification, fetched outside transaction
    let creatorId: string | null = null;
    let isAlreadyUpvoted = false;

    await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) {
            throw new Error("Document does not exist!");
        }

        const data = docSnap.data();
        creatorId = data.creator.userId;
        isAlreadyUpvoted = (data.upvotedBy as string[]).includes(userId);

        const creatorRef = doc(db, "users", creatorId!);
        
        // Award/remove 20 points for upvotes on problems and solutions. Ideas don't give points.
        const pointChange = (collectionName === 'problems' || collectionName === 'solutions') ? (isAlreadyUpvoted ? -20 : 20) : 0;
        
        transaction.update(docRef, {
            upvotes: increment(isAlreadyUpvoted ? -1 : 1),
            upvotedBy: isAlreadyUpvoted ? arrayRemove(userId) : arrayUnion(userId)
        });

        if (pointChange !== 0 && creatorId !== userId) {
            transaction.update(creatorRef, { points: increment(pointChange) });
        }
    });

    // Send notification outside the transaction
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


// --- Investor & Deals ---

export async function becomeInvestor(userId: string) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        role: "Investor",
        isPremium: true
    });
}

export async function createDeal(investorProfile: UserProfile, problemCreatorId: string, solutionCreatorId: string, problemId: string): Promise<string> {
    const problem = await getProblem(problemId);
    if (!problem) throw new Error("Problem not found");

    const problemCreatorSnap = await getDoc(doc(db, "users", problemCreatorId));
    const solutionCreatorSnap = await getDoc(doc(db, "users", solutionCreatorId));
    if (!problemCreatorSnap.exists() || !solutionCreatorSnap.exists()) {
        throw new Error("Creator not found");
    }
    const problemCreator = {uid: problemCreatorSnap.id, ...problemCreatorSnap.data()} as UserProfile;
    const solutionCreator = {uid: solutionCreatorSnap.id, ...solutionCreatorSnap.data()} as UserProfile;

    const dealsCol = collection(db, "deals");
    const newDealRef = await addDoc(dealsCol, {
        investor: { userId: investorProfile.uid, name: investorProfile.name, avatarUrl: investorProfile.avatarUrl, expertise: investorProfile.expertise },
        problemCreator: { userId: problemCreator.uid, name: problemCreator.name, avatarUrl: problemCreator.avatarUrl, expertise: problemCreator.expertise },
        solutionCreator: { userId: solutionCreator.uid, name: solutionCreator.name, avatarUrl: solutionCreator.avatarUrl, expertise: solutionCreator.expertise },
        problemId: problem.id,
        problemTitle: problem.title,
        createdAt: serverTimestamp(),
    });

    // Notify creators
    const dealLink = `/deals/${newDealRef.id}`;
    await createNotification(problemCreatorId, `An investor wants to start a deal with you and ${solutionCreator.name}!`, dealLink);
    await createNotification(solutionCreatorId, `An investor wants to start a deal with you and ${problemCreator.name}!`, dealLink);

    return newDealRef.id;
}


export async function getDeal(id: string): Promise<Deal | null> {
    const docRef = doc(db, "deals", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Deal : null;
}

export async function getMessages(dealId: string): Promise<Message[]> {
    const messagesCol = collection(db, `deals/${dealId}/messages`);
    const q = query(messagesCol, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
}

export async function sendMessage(dealId: string, text: string, sender: UserProfile) {
    const messagesCol = collection(db, `deals/${dealId}/messages`);
    await addDoc(messagesCol, {
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
}


// --- Notifications ---
export async function getNotifications(userId: string): Promise<Notification[]> {
    const col = collection(db, "notifications");
    const q = query(col, where("userId", "in", [userId, "admins"]), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
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

    const [problemsSnap, solutionsSnap] = await Promise.all([
        getDocs(problemsQuery),
        getDocs(solutionsQuery)
    ]);

    const problems = problemsSnap.docs.map(doc => ({ type: 'problem', id: doc.id, ...doc.data() as Problem }));
    const solutions = solutionsSnap.docs.map(doc => ({ type: 'solution', id: doc.id, ...doc.data() as Solution }));
    
    return [...problems, ...solutions];
}

export async function approveItem(type: 'problem' | 'solution', id: string) {
    const collectionName = type === 'problem' ? 'problems' : 'solutions';
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, { priceApproved: true });
}

export async function deleteItem(type: 'problem' | 'solution' | 'idea' | 'user', id: string) {
    const batch = writeBatch(db);

    if (type === 'user') {
        const userRef = doc(db, 'users', id);
        batch.delete(userRef);
        // Note: this leaves the user's content (problems, solutions, etc.) in the database.
        // A more robust implementation might reassign content or perform a soft delete.
    } else if (type === 'idea') {
        const ideaRef = doc(db, 'ideas', id);
        batch.delete(ideaRef);
    } else if (type === 'solution') {
        const solutionRef = doc(db, 'solutions', id);
        const solutionDoc = await getDoc(solutionRef);
        if (solutionDoc.exists()) {
            const problemId = solutionDoc.data().problemId;
            const problemRef = doc(db, 'problems', problemId);
            // Decrement the solutionsCount on the parent problem.
            batch.update(problemRef, { solutionsCount: increment(-1) });
            batch.delete(solutionRef);
        }
    } else if (type === 'problem') {
        const problemRef = doc(db, 'problems', id);
        
        // Also delete all solutions associated with this problem to prevent orphaned data.
        const solutionsQuery = query(collection(db, 'solutions'), where('problemId', '==', id));
        const solutionsSnapshot = await getDocs(solutionsQuery);
        solutionsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        batch.delete(problemRef);
    } else {
        throw new Error("Invalid item type for deletion.");
    }

    await batch.commit();
}
