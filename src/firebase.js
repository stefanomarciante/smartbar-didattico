import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 1. PRIMA definisci la configurazione con le tue chiavi reali
const firebaseConfig = {
  apiKey: "AIzaSyBLc8IxluwK5NnAPoF769PyfM6iUnGdow4",
  authDomain: "cassabardidattico-a8ef3.firebaseapp.com",
  projectId: "cassabardidattico-a8ef3",
  storageBucket: "cassabardidattico-a8ef3.firebasestorage.app",
  messagingSenderId: "317063484473",
  appId: "1:317063484473:web:ee740f5d759844c8e2e9e8"
};

// 2. POI inizializza l'app (crea la variabile 'app')
const app = initializeApp(firebaseConfig);

// 3. INFINE esporta il database (passando 'app' già inizializzata)
export const db = getFirestore(app);

// Aggiungi questa riga per l'autenticazione
export const auth = getAuth(app); 