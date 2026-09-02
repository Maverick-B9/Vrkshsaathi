import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { Button, CountdownTimer, Modal, Textarea } from "../../components/ui";

export function IncidentQueue() {
  const { custodianId } = useOutletContext<{ custodianId: string }>();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve flow state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photoBlob, setPhotoBlob] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchIncidents() {
      if (!custodianId) return;
      try {
        // Find trees owned by custodian
        const treesQ = query(collection(db, "trees"), where("custodianId", "==", custodianId));
        const treeSnap = await getDocs(treesQ);
        const treeIds = treeSnap.docs.map(d => d.id);

        if (treeIds.length === 0) {
          setIncidents([]);
          setLoading(false);
          return;
        }

        // Find PENDING incidents for those trees
        // Note: Firestore 'in' query supports up to 10 items.
        // For production, you might query incidents directly by a duplicate `custodianId` field on the incident doc.
        // Assuming batched queries here for simplicity if under 10 trees, or flattening.
        const chunkedTreeIds = treeIds.slice(0, 10);
        
        const incQ = query(
          collection(db, "incidents"), 
          where("treeId", "in", chunkedTreeIds),
          where("status", "==", "PENDING")
        );
        const incSnap = await getDocs(incQ);
        
        const data = incSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        // Sort by deadline locally for MVP
        data.sort((a, b) => {
          const dA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const dB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return dA - dB;
        });

        setIncidents(data);
      } catch (err) {
        console.error("Failed to fetch incidents", err);
      } finally {
        setLoading(false);
      }
    }
    fetchIncidents();
  }, [custodianId]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId) return;
    setIsSubmitting(true);

    try {
      // 1. Upload Resolution Photo (authenticated, scoped to 'custodian' by Storage Rules)
      if (photoBlob) {
        const photoRef = ref(storage, `resolutions/${resolvingId}/resolution.jpg`);
        await uploadBytes(photoRef, photoBlob);
      }

      // 2. Mark incident resolved
      await updateDoc(doc(db, "incidents", resolvingId), {
        status: "RESOLVED",
        resolutionNotes: notes,
        resolvedAt: new Date().toISOString(),
      });

      // Optimistic update
      setIncidents(prev => prev.filter(i => i.id !== resolvingId));
      setResolvingId(null);
      setNotes("");
      setPhotoBlob(null);
    } catch (err) {
      console.error("Failed to resolve", err);
      alert("Failed to submit resolution. Check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-bark">Loading Queue...</div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-2xl text-ink-bark">Action Queue</h2>
          <p className="font-sans text-sm text-slate-bark mt-1">
            Resolve these within 48 hours to prevent escalation.
          </p>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="bg-white rounded-tag p-12 text-center shadow-sm border border-field-parchment-dark">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="font-display text-lg text-ink-bark">All Caught Up</h3>
          <p className="font-sans text-sm text-slate-bark mt-1">No pending incidents for your trees.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {incidents.map(inc => (
            <div key={inc.id} className="bg-white rounded-tag p-5 border border-field-parchment-dark shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-xs text-slate-bark mb-1">Tree: {inc.treeId}</div>
                  <h3 className="font-sans text-lg font-medium text-ink-bark">
                    {inc.category.replace("_", " ")}
                  </h3>
                  {inc.notes && (
                    <p className="font-sans text-sm text-slate-bark mt-2 bg-field-parchment/50 p-2 rounded">
                      "{inc.notes}"
                    </p>
                  )}
                </div>
                {/* True-Source Countdown Timer */}
                <div className="text-right">
                  <div className="font-sans text-xs text-slate-bark mb-1 uppercase tracking-wide">Time Left</div>
                  {inc.deadline ? (
                    <CountdownTimer deadline={inc.deadline} className="text-lg" />
                  ) : (
                    <span className="font-mono text-sm text-slate-bark">No SLA</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-field-parchment-dark">
                <Button variant="secondary" onClick={() => window.location.href=`/tree/${inc.treeId}`}>
                  View Tree
                </Button>
                <Button onClick={() => setResolvingId(inc.id)}>
                  Resolve Issue
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!resolvingId} onClose={() => setResolvingId(null)} title="Resolve Incident">
        <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4 mt-2">
          <p className="font-sans text-sm text-slate-bark">
            Upload a photo showing the issue has been addressed (e.g. tree watered, guard fixed).
          </p>
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="block w-full text-sm text-slate-bark file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-moss-canopy/10 file:text-moss-canopy hover:file:bg-moss-canopy/20"
            onChange={(e) => setPhotoBlob(e.target.files?.[0] || null)}
          />

          <Textarea 
            label="Resolution Notes" 
            placeholder="What did you do?" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setResolvingId(null)} type="button">Cancel</Button>
            <Button type="submit" loading={isSubmitting} disabled={!photoBlob}>Submit Resolution</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
