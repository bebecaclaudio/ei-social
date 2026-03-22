import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDM-lK7SVxnQ8j2_QacTPLauE50RaTKPRM",
  authDomain: "ei-social.firebaseapp.com",
  projectId: "ei-social",
  storageBucket: "ei-social.firebasestorage.app",
  messagingSenderId: "1005094792930",
  appId: "1:1005094792930:web:9519944aabba7fc8c778bb",
  measurementId: "G-8QSJC6HDTQ"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias para usar nos outros arquivos (.jsx)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);