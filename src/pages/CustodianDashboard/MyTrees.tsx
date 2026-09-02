import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { LivingTag } from "../../components/LivingTag/LivingTag";
import { Spinner, EmptyState } from "../../components/ui";

export function MyTrees() {
  const { custodianId } = useOutletContext<{ custodianId: string }>();
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrees() {
      if (!custodianId) return;
      try {
        const q = query(collection(db, "trees"), where("custodianId", "==", custodianId));
        const snap = await getDocs(q);
        setTrees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch trees", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrees();
  }, [custodianId]);

  if (loading) {
    return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  }

  if (trees.length === 0) {
    return (
      <div className="bg-white rounded-tag shadow-sm p-4">
        <EmptyState 
          icon="🌳"
          title="No Trees Assigned" 
          description="You haven't been assigned any trees yet. Check back later." 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h2 className="font-display text-2xl text-ink-bark">My Trees</h2>
        <p className="font-sans text-sm text-slate-bark mt-1">You are the Custodian for {trees.length} trees.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {trees.map(tree => (
          <div key={tree.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <LivingTag
              treeId={tree.id}
              species={tree.species || "Unknown Species"}
              ward={tree.ward}
              status={tree.status}
              lastVerifiedAt={tree.lastVerifiedAt?.toDate() || null}
              size="sm"
              qrCodeUrl={tree.qrCodeUrl}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
