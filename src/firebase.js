import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCa_9XSFrfcPUtxLMvRyZ1ZuAjY_Cz6KnA",
    authDomain: "payroll-a0175.firebaseapp.com",
    projectId: "payroll-a0175",
    storageBucket: "payroll-a0175.firebasestorage.app",
    messagingSenderId: "916288446530",
    appId: "1:916288446530:web:3a2e5bf2e65027a4adcddb",
    measurementId: "G-MFN3N3SJ27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();