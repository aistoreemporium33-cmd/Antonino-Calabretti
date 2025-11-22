import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, onSnapshot, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { Transaction } from '../types';

// Helper to handle the environment where config might be injected or missing
const getFirebaseConfig = () => {
  if (typeof (window as any).__firebase_config !== 'undefined') {
    return JSON.parse((window as any).__firebase_config);
  }
  // Fallback or check process.env if available in your build setup
  return {}; 
};

let db: Firestore | null = null;
let auth: Auth | null = null;
let app: FirebaseApp | null = null;

const config = getFirebaseConfig();
const hasConfig = Object.keys(config).length > 0;

if (hasConfig && getApps().length === 0) {
  try {
    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase init error:", e);
  }
} else if (hasConfig) {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

// --- API Facade ---

export const isFirebaseAvailable = () => !!db && !!auth;

export const signInAnon = async () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signInAnonymously(auth);
};

export const subscribeToProfile = (userId: string, callback: (data: any) => void) => {
  if (!db) return () => {};
  const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
  return onSnapshot(doc(db, profilePath), (docSnap) => {
    if (docSnap.exists()) {
        callback(docSnap.data());
    } else {
        // Init profile with balance
        setDoc(doc(db, profilePath), { 
            name: 'Anya', 
            trait: 'gentle', 
            isPremium: false, 
            imageGenerationCount: 0,
            balance: 0,
            transactions: [],
            idVerified: false
        }, { merge: true });
    }
  });
};

export const saveChatHistory = async (userId: string, messages: any[]) => {
  if (!db) return;
  const historyPath = `artifacts/default-app-id/users/${userId}/history/chat`;
  await setDoc(doc(db, historyPath), { messages }, { merge: true });
};

export const updateImageCount = async (userId: string, newCount: number) => {
  if (!db) return;
  const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
  await setDoc(doc(db, profilePath), { imageGenerationCount: newCount }, { merge: true });
};

export const upgradeUser = async (userId: string) => {
  if (!db) return;
  const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
  await setDoc(doc(db, profilePath), { isPremium: true }, { merge: true });
};

export const processPayment = async (userId: string, amount: number, description: string) => {
    if (!db) return;
    const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
    
    const newTransaction: Transaction = {
        id: Date.now().toString(),
        amount: amount,
        date: new Date().toISOString(),
        description: description,
        type: amount >= 0 ? 'credit' : 'debit'
    };

    await updateDoc(doc(db, profilePath), {
        isPremium: true,
        balance: increment(amount),
        transactions: arrayUnion(newTransaction)
    });
};

export const updateIdentity = async (userId: string, data: { realName: string, nationality: string, idNumber: string, birthDate: string }) => {
    if (!db) return;
    const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
    await updateDoc(doc(db, profilePath), {
        ...data,
        idVerified: true
    });
};

export { auth, db };