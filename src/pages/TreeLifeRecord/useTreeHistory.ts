import { useEffect, useState } from "react";

export type EventType = "PLANTED" | "REGISTERED" | "REPORTED" | "RESOLVED" | "VERIFIED" | "UPCOMING_CHECKPOINT" | "DIED";

export interface TimelineEvent {
  id: string;
  type: EventType;
  timestamp: number;
  title: string;
  description?: string;
  meta?: any;
  isFuture?: boolean;
}

export function useTreeHistory(treeId: string) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [treeInfo, setTreeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!treeId) return;
      setLoading(true);
      setError(null);
      
      try {
        const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore");
        const treeRef = doc(db, "trees", treeId);
        const treeSnap = await getDoc(treeRef);
        
        if (!treeSnap.exists()) {
          throw new Error("Tree not found.");
        }
        
        const treeData = treeSnap.data();
        const info = {
          id: treeId,
          species: treeData.species || "Unknown",
          ward: treeData.ward || "Unknown"
        };
        
        setTreeInfo(info);
        
        const generatedEvents: TimelineEvent[] = [];
        
        if (treeData.plantedDate) {
          generatedEvents.push({
            id: `planted-${treeId}`,
            type: "PLANTED",
            timestamp: new Date(treeData.plantedDate).getTime(),
            title: "Planted in Ground",
            description: `Planted at ${info.ward}`
          });
        }
        
        if (treeData.createdAt) {
          generatedEvents.push({
            id: `registered-${treeId}`,
            type: "REGISTERED",
            timestamp: new Date(treeData.createdAt).getTime(),
            title: "Registered to System",
            description: treeData.custodianId ? `Custodian assigned: ${treeData.custodianId}` : "No custodian assigned"
          });
        }
        
        const incQ = query(collection(db, "incidents"), where("treeId", "==", treeId));
        const incSnap = await getDocs(incQ);
        
        incSnap.forEach(doc => {
          const inc = doc.data();
          generatedEvents.push({
             id: `inc-${doc.id}`,
             type: "REPORTED",
             timestamp: new Date(inc.createdAt).getTime(),
             title: `Incident: ${inc.category?.replace("_", " ") || "Issue"}`,
             description: `Status: ${inc.status}`
          });
        });
        
        const sortedEvents = generatedEvents.sort((a, b) => a.timestamp - b.timestamp);
        setEvents(sortedEvents);

      } catch (err: any) {
        console.error("Failed to fetch tree history:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [treeId]);

  return { events, treeInfo, loading, error };
}
