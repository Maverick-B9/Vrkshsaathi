import { useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { queueIncidentForSync } from "../../lib/offlineQueue";
import { compressPhoto } from "../../lib/imageCompressor";

interface IncidentPayload {
  treeId: string;
  category: string;
  notes?: string;
  photoBlob?: Blob | null;
  audioBlob?: Blob | null;
}

export function useSubmitIncident() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitIncident = async (payload: IncidentPayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Compress photo if present (for both online and offline paths)
      let compressedPhoto: Blob | null = null;
      if (payload.photoBlob) {
        compressedPhoto = await compressPhoto(payload.photoBlob);
      }

      const reportedAt = new Date().toISOString();
      const status = "PENDING";

      if (!navigator.onLine) {
        // Offline path: Queue for sync
        await queueIncidentForSync({
          ...payload,
          photoBlob: compressedPhoto,
          status,
          reportedAt,
        });
        setIsSubmitting(false);
        return { success: true, offline: true };
      }

      // Online path
      // CRITICAL ORDER: addDoc must finish before uploadBytes begins

      // 2. Create the Firestore document
      const docRef = await addDoc(collection(db, "incidents"), {
        treeId: payload.treeId,
        category: payload.category,
        notes: payload.notes || null,
        status,
        reportedAt: new Date(reportedAt),
        createdAt: new Date(reportedAt).toISOString(),
        reportedVia: payload.audioBlob ? "VOICE" : payload.photoBlob ? "PHOTO" : "TAP",
        hasEvidence: !!(payload.photoBlob || payload.audioBlob),
        languageCode: "en", // default; overridden by voice flow with actual lang
        escalationHistory: [],
      });

      // 3. Upload photo to Storage (Trigger will now find the doc)
      if (compressedPhoto) {
        const photoRef = ref(storage, `incidents/${docRef.id}/photo.jpg`);
        await uploadBytes(photoRef, compressedPhoto);
      }

      // 4. Upload audio to Storage and store voiceUrl on the incident
      if (payload.audioBlob) {
        // Dynamic extension
        const mime = payload.audioBlob.type;
        const ext = mime.includes("mp4") ? "mp4" : mime.includes("webm") ? "webm" : "m4a";
        const audioRef = ref(storage, `incidents/${docRef.id}/audio.${ext}`);
        await uploadBytes(audioRef, payload.audioBlob);
        const voiceUrl = await getDownloadURL(audioRef);
        await updateDoc(doc(db, "incidents", docRef.id), { voiceUrl });
      }

      // Simulate async Gemini Vision backend processing if an image is attached
      if (compressedPhoto) {
        console.log("Mocking async Gemini Vision trigger (analyzeIncidentPhoto)...");
        const incidentRef = doc(db, "incidents", docRef.id);
        setTimeout(async () => {
          try {
            await updateDoc(incidentRef, {
              aiHealthSignal: "Visible damage" // Constrained to visual observations
            });
            console.log("Mock aiHealthSignal injected.");
          } catch (e) {
            console.error("Mock AI injection failed", e);
          }
        }, 3000);
      }

      setIsSubmitting(false);
      return { success: true, offline: false };
    } catch (err) {
      console.error("Submission failed", err);
      setError("Failed to submit report. Please try again.");
      setIsSubmitting(false);
      return { success: false, error: err };
    }
  };

  return { submitIncident, isSubmitting, error };
}
