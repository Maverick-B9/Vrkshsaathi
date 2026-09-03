import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCQhUw_7XdP_ROD6a8ahQNADCcTR1-_Ic4",
  authDomain: "vrkshsaathi-cec57.firebaseapp.com",
  projectId: "vrkshsaathi-cec57",
  storageBucket: "vrkshsaathi-cec57.firebasestorage.app",
  messagingSenderId: "298269988904",
  appId: "1:298269988904:web:b7181a78354236507e3d1d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, "asia-south1");

async function run() {
  try {
    console.log("Logging in...");
    const userCredential = await signInWithEmailAndPassword(auth, "ballubalaram2003@gmail.com", "041105");
    const user = userCredential.user;
    console.log("Logged in as:", user.uid);

    // Wait 2 seconds to ensure token is ready
    await new Promise(r => setTimeout(r, 2000));
    
    // Explicitly get token
    const token = await user.getIdToken();
    console.log("Token length:", token.length);

    console.log("Calling setUserClaims...");
    const setUserClaims = httpsCallable(functions, "setUserClaims");
    const result = await setUserClaims({
      uid: user.uid,
      role: "super_admin",
      orgId: "org-ngo"
    });

    console.log("Result:", result.data);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
