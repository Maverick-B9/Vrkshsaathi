import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { EmptyState, Button, CountdownTimer, AIHealthBadge } from "../../components/ui";

export function EscalationInbox() {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { claims } = useAuth();

  useEffect(() => {
    async function fetchEscalations() {
      if (!claims?.orgId) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "incidents"),
          where("status", "==", "ESCALATED"),
          where("assignedTo", "==", claims.orgId),
          orderBy("createdAt", "asc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEscalations(data);
      } catch (err) {
        console.error("Failed to load registrar escalations", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEscalations();
  }, [claims]);

  const resolveEscalation = async (id: string) => {
    try {
      await updateDoc(doc(db, "incidents", id), {
        status: "RESOLVED",
        resolutionNotes: "Resolved via Registrar Intervention",
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
    return <div className="p-12 text-center text-slate-bark animate-pulse">Loading Escalation Inbox...</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="mb-2">
        <h2 className="font-display text-3xl text-ink-bark">Escalation Inbox</h2>
        <p className="font-sans text-sm text-slate-bark mt-1">
          Incidents that Custodians failed to resolve within the 48-hour SLA.
        </p>
      </div>

      {escalations.length === 0 ? (
        <div className="bg-white rounded-tag border border-field-parchment-dark p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="font-display text-xl text-ink-bark">Inbox Zero</h3>
          <p className="font-sans text-sm text-slate-bark mt-1">All escalations have been handled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {escalations.map(esc => (
            <div key={esc.id} className="bg-white rounded-tag p-5 border border-ui-error/30 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 border-l-4 border-l-ui-error">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-medium bg-ui-error/10 text-ui-error px-2 py-0.5 rounded">SLA BREACHED</span>
                </div>
                  <h3 className="font-sans text-lg font-medium text-ink-bark">{esc.category.replace("_", " ")}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="font-sans text-sm text-slate-bark">
                      Tree: {esc.treeId} • Custodian: {esc.custodianName}
                    </p>
                    {esc.aiHealthSignal && (
                      <AIHealthBadge signal={esc.aiHealthSignal} />
                    )}
                  </div>
                  <p className="font-mono text-xs text-laterite-clay mt-2">
                    Breached at: {new Date(esc.breachedAt).toLocaleString()}
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
                <Button variant="secondary" onClick={() => resolveEscalation(esc.id)}>
                  Mark Resolved
                </Button>
                <Button onClick={() => window.location.href = `/tree/${esc.treeId}/history`}>
                  View Tree
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
