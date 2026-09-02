import { openDB, type DBSchema } from "idb";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase/config";

export interface PendingIncident {
  id?: number;
  payload: {
    treeId: string;
    category: string;
    notes?: string;
    photoBlob?: Blob | null;
    audioBlob?: Blob | null;
    status: string; // usually "PENDING"
    reportedAt: string; // ISO string
  };
}

interface TreeLifeDB extends DBSchema {
  pending_incidents: {
    key: number;
    value: PendingIncident;
    autoIncrement: true;
  };
}

let dbPromise: ReturnType<typeof openDB<TreeLifeDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TreeLifeDB>("tree-life-idb", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("pending_incidents")) {
          db.createObjectStore("pending_incidents", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
}

export async function queueIncidentForSync(incident: PendingIncident["payload"]): Promise<void> {
  const db = await getDB();
  await db.add("pending_incidents", { payload: incident });
}

export async function syncOfflineIncidents(): Promise<void> {
  const localDb = await getDB();
  const allPending = await localDb.getAll("pending_incidents");

  for (const item of allPending) {
    try {
      // 1. Create document first
      const docRef = await addDoc(collection(db, "incidents"), {
        treeId: item.payload.treeId,
        category: item.payload.category,
        notes: item.payload.notes || null,
        status: item.payload.status,
        reportedAt: new Date(item.payload.reportedAt),
      });

      // 2. Upload photo if present
      if (item.payload.photoBlob) {
        const photoRef = ref(storage, `incidents/${docRef.id}/photo.jpg`);
        await uploadBytes(photoRef, item.payload.photoBlob);
      }

      // 3. Upload audio if present
      if (item.payload.audioBlob) {
        // Derive extension from MIME type
        const mime = item.payload.audioBlob.type;
        const ext = mime.includes("mp4") ? "mp4" : mime.includes("webm") ? "webm" : "m4a";
        const audioRef = ref(storage, `incidents/${docRef.id}/audio.${ext}`);
        await uploadBytes(audioRef, item.payload.audioBlob);
      }

      // 4. Remove from IDB on success
      if (item.id) {
        await localDb.delete("pending_incidents", item.id);
      }
    } catch (err) {
      console.error("Failed to sync incident", item, err);
      // Leave in IDB for next retry
    }
  }
}

// Reliable foreground sync triggers
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOfflineIncidents().catch(console.error);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      syncOfflineIncidents().catch(console.error);
    }
  });
}
