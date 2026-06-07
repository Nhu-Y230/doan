import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyC4_54ru-UqXcHO1vbGxOlN1zFqlwRLN18",
  authDomain:        "wed-du-an.firebaseapp.com",
  projectId:         "wed-du-an",
  storageBucket:     "wed-du-an.firebasestorage.app",
  messagingSenderId: "898773167279",
  appId:             "1:898773167279:web:be2cd9f0f21026e62c385a",
  measurementId:     "G-X7N907NLRK"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { auth, db, collection, addDoc };

