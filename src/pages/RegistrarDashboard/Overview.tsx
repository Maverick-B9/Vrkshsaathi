import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "../../firebase/config";

export function Overview() {
  const { orgId } = useOutletContext<{ orgId: string }>();
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    needsAttention: 0,
    dead: 0,
    escalations: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const treesRef = collection(db, "trees");
        
        // In a real production app with millions of trees, 
        // these should be pre-computed in a stats document using Cloud Functions.
        // For the MVP, we use getCountFromServer which is performant and cheap.
        const totalQ = query(treesRef, where("registrarOrgId", "==", orgId));
        const healthyQ = query(treesRef, where("registrarOrgId", "==", orgId), where("status", "==", "HEALTHY"));
        const attentionQ = query(treesRef, where("registrarOrgId", "==", orgId), where("status", "==", "NEEDS_ATTENTION"));
        const deadQ = query(treesRef, where("registrarOrgId", "==", orgId), where("status", "==", "DEAD"));
        
        const [total, healthy, attention, dead] = await Promise.all([
          getCountFromServer(totalQ),
          getCountFromServer(healthyQ),
          getCountFromServer(attentionQ),
          getCountFromServer(deadQ)
        ]);

        // Mock escalation count for now
        const escalations = 3; 

        setStats({
          total: total.data().count,
          healthy: healthy.data().count,
          needsAttention: attention.data().count,
          dead: dead.data().count,
          escalations,
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    }
    fetchStats();
  }, [orgId]);

  const survivalRate = stats.total > 0 
    ? Math.round(((stats.healthy + stats.needsAttention) / stats.total) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <h2 className="font-display text-3xl text-ink-bark">Org Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Trees" value={stats.total} />
        <StatCard title="Survival Rate" value={`${survivalRate}%`} />
        <StatCard title="Needs Attention" value={stats.needsAttention} highlight="warning" />
        <StatCard title="Active Escalations" value={stats.escalations} highlight="error" />
      </div>

      <div className="bg-white rounded-tag p-6 shadow-tag mt-4">
        <h3 className="font-display text-xl text-ink-bark mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <a href="/registrar/register" className="px-4 py-2 bg-moss-canopy text-white rounded font-sans text-sm font-medium hover:bg-moss-canopy-dark transition-colors">
            Register New Tree
          </a>
          <a href="/registrar/custodians/new" className="px-4 py-2 bg-field-parchment text-ink-bark border border-field-parchment-dark rounded font-sans text-sm font-medium hover:bg-white transition-colors">
            Invite Custodian
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }: { title: string; value: number | string; highlight?: "warning" | "error" }) {
  let textColor = "text-moss-canopy";
  if (highlight === "warning") textColor = "text-turmeric-ochre";
  if (highlight === "error") textColor = "text-ui-error";

  return (
    <div className="bg-white p-6 rounded-tag shadow-sm border border-field-parchment-dark">
      <h4 className="font-sans text-sm font-medium text-slate-bark uppercase tracking-wide">{title}</h4>
      <p className={`font-display text-4xl mt-2 ${textColor}`}>{value}</p>
    </div>
  );
}
