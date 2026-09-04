import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { db } from "../../firebase/config";
import { StatusBadge } from "../../components/StatusBadge/StatusBadge";
import type { TreeStatus } from "../../types/firestore";

export function TreeList() {
  const { orgId } = useOutletContext<{ orgId: string }>();
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchTrees() {
      try {
        let q = query(collection(db, "trees"), where("registrarOrgId", "==", orgId));
        if (statusFilter !== "ALL") {
          q = query(q, where("status", "==", statusFilter));
        }
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTrees(data);
      } catch (err) {
        console.error("Failed to fetch trees", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrees();
  }, [orgId, statusFilter]);

  const handleDelete = async (treeId: string) => {
    if (!window.confirm(`Are you sure you want to delete tree ${treeId}?`)) return;
    try {
      await deleteDoc(doc(db, "trees", treeId));
      setTrees(trees.filter(t => t.id !== treeId));
    } catch (err) {
      console.error("Failed to delete tree", err);
      alert("Failed to delete tree. Ensure you have the right permissions.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Header + filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <h2 className="font-display text-2xl sm:text-3xl text-ink-bark">Registered Trees</h2>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="self-start sm:self-auto bg-white border border-field-parchment-dark text-ink-bark font-sans text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ui-focus-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="HEALTHY">Healthy</option>
          <option value="NEEDS_ATTENTION">Needs Attention</option>
          <option value="DEAD">Dead</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-bark">Loading...</div>
      ) : trees.length === 0 ? (
        <div className="bg-white rounded-tag p-8 text-center shadow-sm border border-field-parchment-dark text-slate-bark">
          No trees found.
        </div>
      ) : (
        <>
          {/* ── Mobile card list (hidden on md+) ───────────────── */}
          <div className="flex flex-col gap-3 md:hidden">
            {trees.map(tree => (
              <div key={tree.id} className="bg-white rounded-tag p-4 border border-field-parchment-dark shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {tree.qrCodeUrl ? (
                      <a href={tree.qrCodeUrl} target="_blank" rel="noreferrer">
                        <img src={tree.qrCodeUrl} alt="QR" className="w-10 h-10 border border-field-parchment-dark rounded-sm bg-white flex-shrink-0" />
                      </a>
                    ) : (
                      <div className="w-10 h-10 border border-field-parchment-dark rounded-sm bg-field-parchment flex items-center justify-center text-lg">🌳</div>
                    )}
                    <div>
                      <p className="font-sans text-sm font-semibold text-ink-bark">{tree.species}</p>
                      <p className="font-sans text-xs text-slate-bark">{tree.location?.ward || tree.ward}</p>
                    </div>
                  </div>
                  <StatusBadge status={tree.status as TreeStatus} />
                </div>
                <div className="flex items-center justify-between border-t border-field-parchment-dark pt-2">
                  <p className="font-mono text-[10px] text-slate-bark truncate max-w-[160px]">{tree.id}</p>
                  <button
                    onClick={() => handleDelete(tree.id)}
                    className="text-laterite-clay text-xs font-sans font-medium px-3 py-1 rounded-full border border-laterite-clay/30 hover:bg-laterite-clay/10 active:scale-95 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table (hidden on mobile) ────────────────── */}
          <div className="hidden md:block bg-white rounded-tag shadow-sm border border-field-parchment-dark overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-field-parchment border-b border-field-parchment-dark text-slate-bark font-sans text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">QR Code</th>
                  <th className="p-4 font-medium">Tree ID</th>
                  <th className="p-4 font-medium">Species</th>
                  <th className="p-4 font-medium">Ward</th>
                  <th className="p-4 font-medium">Custodian</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trees.map(tree => (
                  <tr key={tree.id} className="border-b border-field-parchment-dark hover:bg-field-parchment/30 transition-colors">
                    <td className="p-4">
                      {tree.qrCodeUrl ? (
                        <a href={tree.qrCodeUrl} target="_blank" rel="noreferrer" className="block w-max bg-white p-1 rounded-sm border border-field-parchment-dark hover:border-moss-canopy transition-colors">
                          <QRCodeSVG value={tree.qrCodeUrl} size={40} level="L" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-bark">N/A</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-sm text-ink-bark">{tree.id}</td>
                    <td className="p-4 font-sans text-sm text-ink-bark font-medium">{tree.species}</td>
                    <td className="p-4 font-sans text-sm text-slate-bark">{tree.location?.ward || tree.ward}</td>
                    <td className="p-4 font-sans text-sm text-ink-bark">{tree.custodianId}</td>
                    <td className="p-4">
                      <StatusBadge status={tree.status as TreeStatus} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        <a
                          href={`/tree/${tree.id}/history`}
                          className="text-moss-canopy hover:text-moss-canopy-dark text-sm font-sans font-medium transition-colors"
                        >
                          View Details
                        </a>
                        <button 
                          onClick={() => handleDelete(tree.id)}
                          className="text-laterite-clay hover:text-laterite-clay-light text-sm font-sans font-medium transition-colors"
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
        </>
      )}
    </div>
  );
}
