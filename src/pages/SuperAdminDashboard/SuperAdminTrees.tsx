import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Button, EmptyState } from "../../components/ui";

interface Tree {
  id: string;
  species?: string;
  healthStatus?: string;
  plantedDate?: string;
  ward?: string;
  registrarOrgId?: string;
}

export function SuperAdminTrees() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrees = async () => {
    setLoading(true);
    try {
      // Query all trees in the database
      const q = query(collection(db, "trees"), orderBy("plantedDate", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Tree));
      setTrees(data);
    } catch (err) {
      console.error("Failed to fetch trees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  const handleDeleteTree = async (treeId: string) => {
    if (!window.confirm("Are you sure you want to completely delete this tree record? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, "trees", treeId));
      setTrees((prev) => prev.filter((t) => t.id !== treeId));
    } catch (err: any) {
      console.error("Failed to delete tree:", err);
      alert(err.message || "Failed to delete tree.");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-bark animate-pulse">Loading Global Tree Database...</div>;
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display text-ink-bark mb-2">Global Tree Database</h2>
          <p className="text-slate-bark">
            View and manage all registered trees across every organization and ward.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchTrees}>Refresh List</Button>
      </div>

      {trees.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="No Trees Found"
          description="There are currently no trees registered in the system."
        />
      ) : (
        <div className="bg-white rounded-tag shadow-tag border border-field-parchment-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-field-parchment text-slate-bark uppercase tracking-wider text-xs border-b border-field-parchment-dark">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tree ID</th>
                  <th className="px-6 py-4 font-semibold">Species</th>
                  <th className="px-6 py-4 font-semibold">Health Status</th>
                  <th className="px-6 py-4 font-semibold">Ward / Org</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-field-parchment-dark text-ink-bark">
                {trees.map((tree) => (
                  <tr key={tree.id} className="hover:bg-moss-canopy/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{tree.id}</td>
                    <td className="px-6 py-4 font-medium">{tree.species || "Unknown"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                        tree.healthStatus === "HEALTHY" ? "bg-moss-canopy/10 text-moss-canopy-dark" :
                        tree.healthStatus === "CRITICAL" ? "bg-laterite-clay/10 text-laterite-clay" :
                        "bg-turmeric-ochre/10 text-turmeric-ochre-dark"
                      }`}>
                        {tree.healthStatus || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-bark">
                      <div>Ward: {tree.ward || "—"}</div>
                      <div className="text-xs">Org: {tree.registrarOrgId || "—"}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <a
                          href={`/tree/${tree.id}`}
                          className="text-moss-canopy hover:text-moss-canopy-dark font-medium transition-colors"
                        >
                          View Details
                        </a>
                        <button
                          onClick={() => handleDeleteTree(tree.id)}
                          className="text-laterite-clay hover:text-red-700 font-medium transition-colors"
                          title="Delete Tree"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
