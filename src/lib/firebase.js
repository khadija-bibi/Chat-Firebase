import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chat-react-4ca49.firebaseapp.com",
  projectId: "chat-react-4ca49",
  storageBucket: "chat-react-4ca49.appspot.com",
  messagingSenderId: "713324379916",
  appId: "1:713324379916:web:3031db71f264678620d329"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();