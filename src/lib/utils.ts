import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Firestore Timestamp (or a serialized plain object) to a JS Date.
 */
export function getDateFromTimestamp(ts: Timestamp | { seconds: number; nanoseconds: number }): Date {
    if (!ts) return new Date();

    // If it's a Firestore Timestamp object, use its toDate() method
    if ('toDate' in ts && typeof ts.toDate === 'function') {
        return ts.toDate();
    }
    
    // If it's a serialized plain object, reconstruct the Date
    return new Date(ts.seconds * 1000 + ts.nanoseconds / 1000000);
}
