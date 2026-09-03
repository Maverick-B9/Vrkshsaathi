import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";

interface Insight {
  id: string;
  title: string;
  description: string;
  type: "MORTALITY_CLUSTER" | "RESPONSE_TIME" | "GENERAL";
  severity: "HIGH" | "MEDIUM" | "LOW";
}

type Timeframe = "daily" | "weekly" | "monthly" | "yearly";

export function SuperAdminAnalytics() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "insights"),
          where("timeframe", "==", timeframe),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => {
          const docData = doc.data();
          return { id: doc.id, ...docData } as Insight;
        });

        // The Cloud Function generates an array of insights in a single document
        if (data.length > 0 && Array.isArray((data[0] as any).insights)) {
           setInsights((data[0] as any).insights);
        } else {
           setInsights([]);
        }
      } catch (err) {
        console.error("Failed to load AI insights", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [timeframe]);

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <div>
        <h2 className="font-display text-3xl text-ink-bark mb-4">Global AI Pattern Insights</h2>
        <p className="font-sans text-sm text-slate-bark mb-6">
          AI-generated plain-language summaries analyzing mortality records, incident clusters, and response times across the entire VrkshSaathi platform.
        </p>

        <div className="flex gap-2 mb-6">
          {(['daily', 'weekly', 'monthly', 'yearly'] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded font-sans text-sm font-medium transition-colors ${
                timeframe === tf 
                  ? "bg-moss-canopy text-white" 
                  : "bg-white text-slate-bark border border-field-parchment-dark hover:bg-field-parchment"
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-bark animate-pulse">Running AI Pattern Analysis...</div>
        ) : (
          <div className="flex flex-col gap-4">
          {insights.length === 0 ? (
            <div className="bg-white rounded-tag border border-field-parchment-dark p-12 text-center shadow-sm">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="font-display text-xl text-ink-bark">No Insights Generated Yet</h3>
              <p className="font-sans text-sm text-slate-bark mt-1">
                The weekly AI analysis will appear here once sufficient tree data is collected.
              </p>
            </div>
          ) : (
            insights.map(insight => {
              let borderClass = "border-field-parchment-dark";
              let bgClass = "bg-white";
              let icon = "💡";

              if (insight.severity === "HIGH") {
                borderClass = "border-laterite-clay/30";
                bgClass = "bg-laterite-clay/5";
                icon = "⚠️";
              } else if (insight.severity === "MEDIUM") {
                borderClass = "border-turmeric-ochre/30";
                bgClass = "bg-turmeric-ochre/5";
                icon = "📊";
              } else {
                borderClass = "border-moss-canopy/30";
                bgClass = "bg-moss-canopy/5";
                icon = "✨";
              }

              return (
                <div key={insight.id} className={`p-6 rounded-tag border ${borderClass} ${bgClass} flex gap-4 items-start`}>
                  <div className="text-2xl mt-1">{icon}</div>
                  <div>
                    <h3 className="font-sans text-lg font-medium text-ink-bark">{insight.title}</h3>
                    <p className="font-sans text-base text-slate-bark mt-2 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        )}
      </div>
    </div>
  );
}
