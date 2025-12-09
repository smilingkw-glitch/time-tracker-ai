// ---------------------- Firebase Initialization ---------------------- //
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// ---------------------- Your Firebase Config ---------------------- //
const firebaseConfig = {
  apiKey: "AIzaSyC0J72Xd-2hGniRVe_iMuIjh2Z1M2Up278",
  authDomain: "time-tracker-ai-21d3f.firebaseapp.com",
  projectId: "time-tracker-ai-21d3f",
  storageBucket: "time-tracker-ai-21d3f.firebasestorage.app",
  messagingSenderId: "392736566446",
  appId: "1:392736566446:web:8c849e725bd988e280513f",
  measurementId: "G-GBNKPJMQBM"
};


// ---------------------- Initialize Firebase Services ---------------------- //
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Everything below this is your main app logic.
// --------------------------------------------------------------------- //
