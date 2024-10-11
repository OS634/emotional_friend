import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyApqOFlq05JHVh7_Dyow_nkyRRPRsi-gOU",
    authDomain: "emotional-friend.firebaseapp.com",
    projectId: "emotional-friend",
    storageBucket: "emotional-friend.appspot.com",
    messagingSenderId: "681097661455",
    appId: "1:681097661455:web:cccc18d218d9b78caae77a",
    measurementId: "G-P73WG4CBL9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (database)
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

// Optionally initialize Firebase Analytics
const analytics = getAnalytics(app);

export { db, auth, provider, signInWithPopup };