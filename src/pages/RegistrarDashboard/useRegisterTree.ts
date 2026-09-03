import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import type { TreeStatus } from "../../types/firestore";

interface RegisterTreePayload {
  species: string;
  road?: string;
  landmark: string;
  ward: string;
  cityOrVillage?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  location?: { lat: number; lng: number };
  custodianId: string;
  registrarOrgId: string;
  viabilityScore: number;
}

export function useRegisterTree() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerTree = async (payload: RegisterTreePayload) => {
    setIsSubmitting(true);
    setError(null);

    // INVARIANT: Tree must never be created without a custodianId.
    if (!payload.custodianId || payload.custodianId.trim() === "") {
      const msg = "Invariant Violation: custodianId is required to register a tree.";
      setError(msg);
      setIsSubmitting(false);
      return { success: false, error: msg };
    }

    try {
      const docRef = await addDoc(collection(db, "trees"), {
        species: payload.species,
        location: {
          lat: payload.location?.lat || 0,
          lng: payload.location?.lng || 0,
          road: payload.road || "",
          landmark: payload.landmark || "",
          ward: payload.ward || "",
          cityOrVillage: payload.cityOrVillage || "",
          district: payload.district || "",
          state: payload.state || "",
          country: payload.country || "India",
          pincode: payload.pincode || ""
        },
        custodianId: payload.custodianId,
        registrarOrgId: payload.registrarOrgId,
        viabilityScore: payload.viabilityScore,
        status: "HEALTHY" as TreeStatus, // Initial status
        plantedDate: serverTimestamp(),
        lastVerifiedAt: serverTimestamp(), // Registration counts as first verification
      });

      setIsSubmitting(false);
      return { success: true, treeId: docRef.id };
    } catch (err: any) {
      console.error("Failed to register tree", err);
      setError(err.message || "Failed to register tree.");
      setIsSubmitting(false);
      return { success: false, error: err.message };
    }
  };

  return { registerTree, isSubmitting, error };
}
