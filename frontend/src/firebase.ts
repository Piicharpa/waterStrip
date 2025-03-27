import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC4Ti5OLRkhqOxaBbBRtbCRXl265kIAjhM",
  authDomain: "aquality-23a89.firebaseapp.com",
  projectId: "aquality-23a89",
  storageBucket: "aquality-23a89.firebasestorage.app",
  messagingSenderId: "745648763490",
  appId: "1:745648763490:web:91b30330a2a64dcd39973b",
  measurementId: "G-9NLY5TVEFJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ฟังก์ชันเข้าสู่ระบบด้วย Google
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// ฟังก์ชันออกจากระบบ
const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

export { auth, signInWithGoogle, logout };
