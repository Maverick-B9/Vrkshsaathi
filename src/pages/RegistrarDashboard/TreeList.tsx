import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
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

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex justify-between items-end">
        <h2 className="font-display text-3xl text-ink-bark">Registered Trees</h2>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-field-parchment-dark text-ink-bark font-sans text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ui-focus-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="HEALTHY">Healthy</option>
          <option value="NEEDS_ATTENTION">Needs Attention</option>
          <option value="DEAD">Dead</option>
        </select>
      </div>

      <div className="bg-white rounded-tag shadow-sm border border-field-parchment-dark overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-bark">Loading...</div>
        ) : trees.length === 0 ? (
          <div className="p-8 text-center text-slate-bark">No trees found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-field-parchment border-b border-field-parchment-dark text-slate-bark font-sans text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">QR Code</th>
                <th className="p-4 font-medium">Tree ID</th>
                <th className="p-4 font-medium">Species</th>
                <th className="p-4 font-medium">Ward</th>
                <th className="p-4 font-medium">Custodian</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {trees.map(tree => (
                <tr key={tree.id} className="border-b border-field-parchment-dark hover:bg-field-parchment/30 transition-colors">
                  <td className="p-4">
                    {tree.qrCodeUrl ? (
                      <a href={tree.qrCodeUrl} target="_blank" rel="noreferrer">
                        <img src={tree.qrCodeUrl} alt="QR" className="w-10 h-10 border border-field-parchment-dark rounded-sm bg-white" />
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
