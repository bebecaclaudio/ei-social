import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

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
const analytics = getAnalytics(app);

// Exporta as ferramentas para usar no Feed.jsx, Cadastro.jsx, etc.
export const db = getFirestore(app);
export const auth = getAuth(app);