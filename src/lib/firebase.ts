import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "jovial-thunder-6lcf1",
  appId: "1:552559129837:web:14da818051f2048ec888e4",
  apiKey: "AIzaSyCoH7J5CK6bvsELD2azfKKnG0LoVwAmz0o",
  authDomain: "jovial-thunder-6lcf1.firebaseapp.com",
  storageBucket: "jovial-thunder-6lcf1.firebasestorage.app",
  messagingSenderId: "552559129837"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-dailythreads-c8b925a5-2aff-4aed-ba0d-8c8d3b0f704d");

export const wardrobeItemsCol = collection(db, 'wardrobeItems');
export const outfitsCol = collection(db, 'outfits');
export const calendarPlansCol = collection(db, 'calendarPlans');
export const tripsCol = collection(db, 'trips');
export const buySkipScansCol = collection(db, 'buySkipScans');

export { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
