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
        // In production, this directly invokes the getTreeHistory Cloud Function
        // which securely aggregates public timeline data server-side without exposing
        // global collection read permissions.
        // const res = await httpsCallable(functions, "getTreeHistory")({ treeId });
        
        console.log(`Mocking getTreeHistory Cloud Function for tree: ${treeId}`);
        
        const mockFn = async () => {
          return new Promise<{ events: TimelineEvent[], treeInfo: any }>((resolve) => {
            setTimeout(() => {
              resolve({
                treeInfo: {
                  id: treeId,
                  species: "Ficus religiosa",
                  ward: "Ward 42"
                },
                events: [
                  {
                    id: "evt-1",
                    type: "PLANTED",
                    timestamp: new Date("2026-06-01T10:00:00Z").getTime(),
                    title: "Planted in Ground",
                    description: "Planted at Ward 42"
                  },
                  {
                    id: "evt-2",
                    type: "REGISTERED",
                    timestamp: new Date("2026-06-01T11:00:00Z").getTime(),
                    title: "Registered to System",
                    description: "Custodian assigned: cust-123"
                  },
                  {
                    id: "evt-3",
                    type: "UPCOMING_CHECKPOINT",
                    timestamp: new Date("2027-06-01T10:00:00Z").getTime(),
                    title: "Year 1 Checkpoint Due",
                    description: "Upcoming verification checkpoint.",
                    isFuture: true
                  }
                ]
              });
            }, 800);
          });
        };

        const data = await mockFn();
        setTreeInfo(data.treeInfo);
        
        // Ensure chronological sorting even from the backend
        const sortedEvents = data.events.sort((a, b) => a.timestamp - b.timestamp);
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
