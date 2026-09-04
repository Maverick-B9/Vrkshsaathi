import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
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
          where("status", "==", "ESCALATED"),
          where("assignedTo", "==", "WARD_ADMIN"),
          orderBy("createdAt", "asc")
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setEscalations(data);
      } catch (err) {
        console.error("Failed to load ward escalations", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEscalations();
  }, []);

  const resolveEscalation = async (id: string) => {
    try {
      await updateDoc(doc(db, "incidents", id), {
        status: "RESOLVED",
        resolutionNotes: "Resolved via Ward Admin Intervention",
        resolvedAt: new Date().toISOString()
      });
      setEscalations(prev => prev.filter(e => e.id !== id));
      alert("Incident marked as resolved.");
    } catch (err) {
      console.error("Failed to resolve escalation", err);
      alert("Failed to resolve. Check permissions.");
    }
  };

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
                  {esc.notes && (
                    <p className="font-sans text-sm text-slate-bark mt-2 bg-field-parchment/50 p-2 rounded">
                      "{esc.notes}"
                    </p>
                  )}
                  {esc.photoUrl && (
                    <div className="mt-3">
                      <img src={esc.photoUrl} alt="Incident" className="w-full max-w-sm rounded-tag border border-field-parchment-dark object-cover max-h-48" />
                    </div>
                  )}
                  {esc.voiceUrl && (
                    <div className="mt-3">
                      <audio controls src={esc.voiceUrl} className="w-full max-w-sm" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => window.location.href=`/tree/${esc.treeId}/history`}>View Tree</Button>
                  <Button variant="primary" size="sm" onClick={() => resolveEscalation(esc.id)}>Intervene</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
