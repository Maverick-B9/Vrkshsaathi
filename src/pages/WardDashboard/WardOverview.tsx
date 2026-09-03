import { useEffect, useState } from "react";
import { collection, query, getAggregateFromServer, count, sum, average, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";

// Mock data generation for the leaderboard until we build a scheduled aggregation function
// In production, calculating these rates across thousands of records requires 
// a nightly scheduled Cloud Function writing to an `org_stats` collection.
interface OrgStat {
  id: string;
  name: string;
  survivalRate: number; // Primary (e.g. 95.5)
  stewardshipScore: number; // Secondary (e.g. 88.0)
  totalPlanted: number; // Tertiary (e.g. 1250)
}

export function WardOverview() {
  const [stats, setStats] = useState({
    totalPlanted: 0,
    activeIncidents: 0,
    survivalRate: 0
  });
  const [leaderboard, setLeaderboard] = useState<OrgStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch ward-level aggregates
        // (For the MVP, we assume the Ward Admin can see everything in the collections)
        const treesQ = collection(db, "trees");
        const incQ = query(collection(db, "incidents")); // In a real app: where("status", "==", "PENDING")

        const incAgg = await getAggregateFromServer(incQ, {
          totalCount: count()
        });
        const treeDocs = await getDocs(treesQ);
        
        let healthyCount = 0;
        let totalTrees = 0;
        const orgMap: Record<string, { total: number; healthy: number }> = {};
        
        treeDocs.forEach(doc => {
          const t = doc.data();
          totalTrees++;
          if (t.healthStatus === "HEALTHY") healthyCount++;
          
          if (t.registrarOrgId) {
            if (!orgMap[t.registrarOrgId]) orgMap[t.registrarOrgId] = { total: 0, healthy: 0 };
            orgMap[t.registrarOrgId].total++;
            if (t.healthStatus === "HEALTHY") orgMap[t.registrarOrgId].healthy++;
          }
        });

        const overallSurvival = totalTrees > 0 ? (healthyCount / totalTrees * 100).toFixed(1) : "0.0";
        
        setStats({
          totalPlanted: totalTrees,
          activeIncidents: incAgg.data().totalCount,
          survivalRate: parseFloat(overallSurvival)
        });

        const realLeaderboard: OrgStat[] = Object.keys(orgMap).map(orgId => {
          const org = orgMap[orgId];
          const orgSurvival = (org.healthy / org.total * 100);
          return {
            id: orgId,
            name: orgId, // Using orgId as name since we don't have an organizations collection
            survivalRate: parseFloat(orgSurvival.toFixed(1)),
            stewardshipScore: 100, // Placeholder until incident resolution times are tracked
            totalPlanted: org.total
          };
        });

        realLeaderboard.sort((a, b) => {
          if (b.survivalRate !== a.survivalRate) return b.survivalRate - a.survivalRate;
          if (b.stewardshipScore !== a.stewardshipScore) return b.stewardshipScore - a.stewardshipScore;
          return b.totalPlanted - a.totalPlanted;
        });

        setLeaderboard(realLeaderboard);
      } catch (err) {
        console.error("Failed to fetch ward aggregates", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-bark animate-pulse">Loading Ward Telemetry...</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Top Level Stats */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-ink-bark mb-4">Ward Telemetry</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-moss-canopy/10 border border-moss-canopy/30 rounded-tag p-5 flex flex-col justify-between">
            <span className="font-sans text-xs font-medium text-moss-canopy-dark uppercase tracking-wide">Survival Rate</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl sm:text-4xl text-moss-canopy-dark">{stats.survivalRate}%</span>
              <span className="font-sans text-xs text-moss-canopy">ward avg</span>
            </div>
          </div>
          <div className="bg-white border border-field-parchment-dark rounded-tag p-5 flex flex-col justify-between shadow-sm">
            <span className="font-sans text-xs font-medium text-slate-bark uppercase tracking-wide">Total Planted</span>
            <span className="mt-2 font-display text-3xl sm:text-4xl text-ink-bark">{stats.totalPlanted.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-field-parchment-dark rounded-tag p-5 flex flex-col justify-between shadow-sm">
            <span className="font-sans text-xs font-medium text-slate-bark uppercase tracking-wide">Active Escalations</span>
            <span className="mt-2 font-display text-3xl sm:text-4xl text-turmeric-ochre">{stats.activeIncidents.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Three-Tier Leaderboard */}
      <div>
        <div className="mb-4">
          <h3 className="font-display text-xl sm:text-2xl text-ink-bark">Organization Leaderboard</h3>
          <p className="font-sans text-xs sm:text-sm text-slate-bark mt-1">
            Ranked by Survival Rate and Stewardship — not raw planting volume.
          </p>
        </div>

        {/* ── Mobile cards ───────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:hidden">
          {leaderboard.map((org, index) => (
            <div key={org.id} className="bg-white rounded-tag p-4 border border-field-parchment-dark shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </span>
                <span className="font-mono text-lg font-bold text-moss-canopy-dark">{org.survivalRate}%</span>
              </div>
              <p className="font-sans text-sm font-semibold text-ink-bark">{org.name}</p>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="font-sans text-[10px] uppercase text-slate-bark tracking-wide">Stewardship</p>
                  <p className="font-mono text-sm text-ink-bark">{org.stewardshipScore}%</p>
                </div>
                <div>
                  <p className="font-sans text-[10px] uppercase text-slate-bark tracking-wide">Planted</p>
                  <p className="font-mono text-sm text-ink-bark">{org.totalPlanted.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Desktop table ───────────────────────────────────────── */}
        <div className="hidden sm:block bg-white rounded-tag shadow-sm border border-field-parchment-dark overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-field-parchment border-b border-field-parchment-dark text-slate-bark font-sans text-xs uppercase tracking-wider">
                <th className="p-4 font-medium w-16 text-center">Rank</th>
                <th className="p-4 font-medium">Organization</th>
                <th className="p-4 font-medium text-right text-moss-canopy-dark">Survival %</th>
                <th className="p-4 font-medium text-right">Stewardship</th>
                <th className="p-4 font-medium text-right text-slate-bark/70 text-[10px]">Total Planted</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((org, index) => (
                <tr key={org.id} className="border-b border-field-parchment-dark hover:bg-field-parchment/30 transition-colors">
                  <td className="p-4 font-display text-lg text-ink-bark text-center">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                  </td>
                  <td className="p-4 font-sans text-base text-ink-bark font-medium">{org.name}</td>
                  <td className="p-4 font-mono text-lg text-right text-moss-canopy-dark font-medium">{org.survivalRate}%</td>
                  <td className="p-4 font-mono text-sm text-right text-ink-bark">{org.stewardshipScore}%</td>
                  <td className="p-4 font-mono text-xs text-right text-slate-bark/70">{org.totalPlanted.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
