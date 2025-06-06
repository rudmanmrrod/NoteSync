import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import type { LocalNote } from "@shared/schema";

// Check if Firebase is properly configured
const hasFirebaseConfig = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

let app: any = null;
let db: any = null;
let auth: any = null;

if (hasFirebaseConfig) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

// Initialize anonymous authentication
let isAuthReady = false;
let currentUser: any = null;

if (hasFirebaseConfig && auth) {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    isAuthReady = true;
  });
}

// Ensure user is authenticated
async function ensureAuth() {
  if (!hasFirebaseConfig || !auth) {
    throw new Error('Firebase not configured');
  }
  
  if (!isAuthReady) {
    await new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve(undefined);
      });
    });
  }
  
  if (!currentUser) {
    await signInAnonymously(auth);
  }
}

// Convert Firestore timestamp to ISO string
function timestampToString(timestamp: any): string {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date().toISOString();
}

// Convert ISO string to Firestore timestamp
function stringToTimestamp(dateString: string): Timestamp {
  return Timestamp.fromDate(new Date(dateString));
}

export class FirebaseSync {
  private isOnline = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async isAvailable(): Promise<boolean> {
    // Disable Firebase sync for offline mode
    return false;
  }

  async syncToFirebase(notes: LocalNote[]): Promise<boolean> {
    if (!(await this.isAvailable())) return false;

    try {
      await ensureAuth();
      const notesCollection = collection(db, `users/${currentUser.uid}/notes`);

      for (const note of notes) {
        const firebaseNote = {
          title: note.title,
          content: note.content,
          tags: note.tags,
          isFavorite: note.isFavorite,
          isArchived: note.isArchived,
          isDeleted: note.isDeleted,
          createdAt: stringToTimestamp(note.createdAt),
          updatedAt: stringToTimestamp(note.updatedAt),
          localId: note.id,
        };

        if (note.firebaseId) {
          // Update existing document
          await updateDoc(doc(notesCollection, note.firebaseId), firebaseNote);
        } else {
          // Create new document
          const docRef = doc(notesCollection);
          await setDoc(docRef, firebaseNote);
          // Update local note with firebase ID (handled by caller)
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
      return false;
    }
  }

  async syncFromFirebase(): Promise<LocalNote[]> {
    if (!(await this.isAvailable())) return [];

    try {
      await ensureAuth();
      const notesCollection = collection(db, `users/${currentUser.uid}/notes`);
      const q = query(notesCollection, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const firebaseNotes: LocalNote[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const note: LocalNote = {
          id: data.localId || doc.id,
          title: data.title || 'Untitled Note',
          content: data.content || '',
          tags: data.tags || [],
          isFavorite: data.isFavorite || false,
          isArchived: data.isArchived || false,
          isDeleted: data.isDeleted || false,
          createdAt: timestampToString(data.createdAt),
          updatedAt: timestampToString(data.updatedAt),
          firebaseId: doc.id,
          lastSyncedAt: new Date().toISOString(),
        };
        firebaseNotes.push(note);
      });

      return firebaseNotes;
    } catch (error) {
      console.error('Error syncing from Firebase:', error);
      return [];
    }
  }

  async deleteFromFirebase(firebaseId: string): Promise<boolean> {
    if (!(await this.isAvailable()) || !firebaseId) return false;

    try {
      await ensureAuth();
      const noteDoc = doc(db, `users/${currentUser.uid}/notes`, firebaseId);
      await deleteDoc(noteDoc);
      return true;
    } catch (error) {
      console.error('Error deleting from Firebase:', error);
      return false;
    }
  }
}

export const firebaseSync = new FirebaseSync();
