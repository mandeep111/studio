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
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase/config";
import type { Idea, Problem, Solution, UserProfile } from "./types";

// Fetch all problems, solutions, ideas
export async function getProblems(): Promise<Problem[]> {
  const col = collection(db, "problems");
  const q = query(col, orderBy("createdAt", "desc"), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Problem));
}

export async function getSolutions(): Promise<Solution[]> {
  const col = collection(db, "solutions");
  const q = query(col, orderBy("createdAt", "desc"), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Solution));
}

export async function getIdeas(): Promise<Idea[]> {
  const col = collection(db, "ideas");
  const q = query(col, orderBy("createdAt", "desc"), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Idea));
}

export async function getUsers(): Promise<UserProfile[]> {
  const col = collection(db, "users");
  const snapshot = await getDocs(col);
  return snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id } as UserProfile));
}

// Fetch a single document by ID
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
    const q = query(col, where("problemId", "==", problemId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Solution));
}


// Create new documents
export async function createProblem(title: string, description: string, tags: string, creator: UserProfile) {
  const problemsCol = collection(db, "problems");
  await addDoc(problemsCol, {
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
  });
}

export async function createSolution(description: string, problemId: string, problemTitle: string, creator: UserProfile) {
    const batch = writeBatch(db);
    
    // Add new solution
    const solutionRef = doc(collection(db, "solutions"));
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
    });

    // Increment solutionsCount on the problem
    const problemRef = doc(db, "problems", problemId);
    batch.update(problemRef, { solutionsCount: increment(1) });
    
    await batch.commit();
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

// Upvote functionality
async function toggleUpvote(collectionName: string, docId: string, userId: string) {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error("Document does not exist!");
    }

    const upvotedBy = docSnap.data().upvotedBy as string[];

    if (upvotedBy.includes(userId)) {
        // User has already upvoted, so remove upvote
        await updateDoc(docRef, {
            upvotes: increment(-1),
            upvotedBy: arrayRemove(userId)
        });
    } else {
        // User has not upvoted, so add upvote
        await updateDoc(docRef, {
            upvotes: increment(1),
            upvotedBy: arrayUnion(userId)
        });
    }
}

export const upvoteProblem = async (docId: string, userId: string) => toggleUpvote("problems", docId, userId);
export const upvoteSolution = async (docId: string, userId: string) => toggleUpvote("solutions", docId, userId);
export const upvoteIdea = async (docId: string, userId: string) => toggleUpvote("ideas", docId, userId);