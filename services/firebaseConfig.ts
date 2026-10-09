import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCK8mUgFPTNLWND9X-tAQzeEjYgYzjuP6Q",
  authDomain: "statai-app-2026-ricardo.firebaseapp.com",
  projectId: "statai-app-2026-ricardo",
  storageBucket: "statai-app-2026-ricardo.firebasestorage.app",
  messagingSenderId: "300199479797",
  appId: "1:300199479797:web:426de1a6f214efbc54b8bc",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "southamerica-east1");

export default app;
