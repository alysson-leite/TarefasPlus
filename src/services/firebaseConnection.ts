
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCZIMTJEbrLVo0qxukCQAjD7jv-FMjxMrA",
  authDomain: "tarefasplus-41136.firebaseapp.com",
  projectId: "tarefasplus-41136",
  storageBucket: "tarefasplus-41136.appspot.com",
  messagingSenderId: "484113598780",
  appId: "1:484113598780:web:5d4418c3015694284a3639"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp)

export { db };