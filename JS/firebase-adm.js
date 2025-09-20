// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAE34wFaTK91aYLe8ar4V6DvGcEXyxyG3s",
  authDomain: "street-to-sweet-7f126.firebaseapp.com",
  projectId: "street-to-sweet-7f126",
  storageBucket: "street-to-sweet-7f126.firebasestorage.app",
  messagingSenderId: "879182530266",
  appId: "1:879182530266:web:08e5fd3ec431a5c77c87e3",
  measurementId: "G-9D3VNC4QE4",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporta a conexão e as funções para serem usadas em outros scripts
// Firebase Storage foi removido.
export {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
};
