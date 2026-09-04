import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { EmptyState, Button, AIHealthBadge } from "../../components/ui";

export function SuperAdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        // Query all incidents globally
        const q = query(
          collection(db, "incidents"),
          orderBy("createdAt", "desc")
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setReports(data);
      } catch (err) {
        console.error("Failed to load global reports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleNotify = async (esc: any) => {
    try {
      await addDoc(collection(db, "alerts"), {
        title: "URGENT INCIDENT ALERT",
        message: `Tree ID: ${esc.treeId}
Category: ${esc.category?.replace("_", " ")}
Status: ${esc.status}
Assigned To: ${esc.assignedTo}
Organization: ${esc.orgName || "Unknown"}
Custodian: ${esc.custodianName || "Unknown"}

Please take immediate action to resolve this issue.`,
        treeId: esc.treeId,
        createdAt: new Date().toISOString()
      });
      alert("Alert broadcasted successfully to all administrators!");
    } catch (err) {
      console.error("Failed to broadcast alert", err);
      alert("Failed to send alert. Check permissions.");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-bark animate-pulse">Loading Global Reports...</div>;
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <div>
        <h2 className="font-display text-3xl text-ink-bark mb-2">Global Incident Reports</h2>
        <p className="font-sans text-sm text-slate-bark mb-8">
          Oversee all active and historical incidents across the entire system. You can generate alerts to notify responsible parties.
        </p>

        {reports.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No Incident Reports"
            description="There are currently no incidents recorded in the system."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {reports.map((esc) => (
              <div key={esc.id} className="bg-white border-l-4 border-turmeric-ochre-dark p-6 rounded-r-tag shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded-sm ${
                      esc.status === "RESOLVED" ? "bg-moss-canopy/10 text-moss-canopy-dark" : "bg-turmeric-ochre/10 text-turmeric-ochre-dark"
                    }`}>
                      STATUS: {esc.status || "PENDING"}
                    </span>
                    <span className="bg-field-parchment-dark/50 text-ink-bark text-[10px] font-bold px-2 py-1 uppercase rounded-sm">
                      ASSIGNED: {esc.assignedTo || "UNKNOWN"}
                    </span>
                    <span className="font-sans text-xs text-slate-bark tracking-wide">ID: {esc.id}</span>
                  </div>
                  <h3 className="font-sans text-lg font-medium text-ink-bark">{esc.category?.replace("_", " ") || "Unknown Issue"}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="font-sans text-sm text-slate-bark">
                      Tree: {esc.treeId} • Org: {esc.orgName || "—"} • Custodian: {esc.custodianName || "—"}
                    </p>
                    {esc.aiHealthSignal && (
                      <AIHealthBadge signal={esc.aiHealthSignal} />
                    )}
                  </div>
                  <p className="font-mono text-xs text-slate-bark mt-2">
                    Reported: {new Date(esc.createdAt).toLocaleString()}
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
                  <Button variant="secondary" size="sm" onClick={() => handleNotify(esc)}>Send Alert</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
