import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import { EmptyState, Button, AIHealthBadge } from "../../components/ui";

export function WardEscalations() {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEscalations() {
      try {
        // Query incidents that have reached the final ESCALATED status
        const q = query(
          collection(db, "incidents"),
          where("status", "==", "ESCALATED")
          // In production, we'd also filter by the specific escalation tier if needed
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Mocking some data for the UI if firestore is empty
        if (data.length === 0) {
          console.log("No escalations found in db, injecting mock escalation for demo...");
          setEscalations([{
            id: "esc-123",
            treeId: "tree-999",
            category: "WATER_NEEDED",
            severity: "HIGH",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            escalationLevel: "WARD",
            orgName: "Green Earth NGO",
            custodianName: "Rahul Sharma"
          }]);
        } else {
          setEscalations(data);
        }
      } catch (err) {
        console.error("Failed to load ward escalations", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEscalations();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-bark animate-pulse">Loading Escalation Queue...</div>;
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <div>
        <h2 className="font-display text-3xl text-ink-bark mb-2">Final Escalation Queue</h2>
        <p className="font-sans text-sm text-slate-bark mb-8">
          Incidents that have breached both the initial Custodian deadline and the secondary Registrar deadline. Ward intervention is immediately required.
        </p>

        {escalations.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No Active Escalations"
            description="All incidents are being handled within their SLA windows by Custodians and Registrars."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {escalations.map((esc) => (
              <div key={esc.id} className="bg-white border-l-4 border-laterite-clay p-6 rounded-r-tag shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-laterite-clay/10 text-laterite-clay text-[10px] font-bold px-2 py-1 uppercase rounded-sm">
                      WARD ESCALATION
                    </span>
                    <span className="font-sans text-xs text-slate-bark tracking-wide">ID: {esc.id}</span>
                  </div>
                  <h3 className="font-sans text-lg font-medium text-ink-bark">{esc.category.replace("_", " ")}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="font-sans text-sm text-slate-bark">
                      Tree: {esc.treeId} • Org: {esc.orgName} • Custodian: {esc.custodianName}
                    </p>
                    {esc.aiHealthSignal && (
                      <AIHealthBadge signal={esc.aiHealthSignal} />
                    )}
                  </div>
                  <p className="font-mono text-xs text-laterite-clay mt-2">
                    SLA Breached: {new Date(esc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">View Tree</Button>
                  <Button variant="primary" size="sm">Intervene</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
