/**
 * Firebase SDK initialisation for TREE-LIFE.
 *
 * All config values come from Vite env vars (VITE_FIREBASE_*).
 * On Vercel these are set as environment variables in the project
 * settings — they are *public* Firebase identifiers, not secrets.
 * The real security boundary is the Firestore / Storage rules.
 *
 * When VITE_USE_EMULATOR=true the SDK is pointed at the local
 * Firebase Emulator Suite — no real cloud traffic is generated.
 */
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  getStorage,
  connectStorageEmulator,
} from "firebase/storage";
import {
  getFunctions,
  connectFunctionsEmulator,
} from "firebase/functions";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Prevent double-init during HMR
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db        = getFirestore(app);
export const auth      = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch(console.error);
export const storage   = getStorage(app);
export const functions = getFunctions(app, "asia-south1"); // Mumbai region

// ─── Emulator wiring ────────────────────────────────────────────────
const USE_EMULATOR = import.meta.env.VITE_USE_EMULATOR === "true";

if (USE_EMULATOR) {
  // Guard against double-connect on HMR reloads
  // @ts-expect-error — internal flag
  if (!db._settingsFrozen) {
    connectFirestoreEmulator(db, "127.0.0.1", 8081);
  }
  // Auth emulator ignores double-connect gracefully
  if (!(auth as unknown as { emulatorConfig: unknown }).emulatorConfig) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  // Functions + Storage don't expose a stable "already connected" flag,
  // but the emulator URLs are idempotent — safe to call on each reload.
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectStorageEmulator(storage, "127.0.0.1", 9199);

  console.info("[TREE-LIFE] 🔌 Firebase Emulator Suite active");
}

export default app;
