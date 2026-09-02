import { useState } from "react";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { EmptyState, Button, CountdownTimer, AIHealthBadge } from "../../components/ui";

// Mock data for escalations
const mockEscalations = [
  {
    id: "esc-1",
    treeId: "tree-abc",
    custodianId: "cust-1",
    custodianName: "Ravi K.",
    incidentCategory: "WATER_NEEDED",
    category: "WATER_NEEDED",
    breachedAt: "2026-08-28T10:00:00Z",
    status: "OPEN",
    aiHealthSignal: "CRITICAL"
  },
  {
    id: "esc-2",
    treeId: "tree-xyz",
    custodianId: "cust-2",
    custodianName: "Sunita M.",
    incidentCategory: "PHYSICAL_DAMAGE",
    category: "PHYSICAL_DAMAGE",
    breachedAt: "2026-08-29T14:30:00Z",
    status: "OPEN"
  }
];

export function EscalationInbox() {
  const [escalations, setEscalations] = useState(mockEscalations);

  const resolveEscalation = (id: string) => {
    // In real app: Update the escalation doc status to RESOLVED
    setEscalations(prev => prev.filter(e => e.id !== id));
  };

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
              </div>
              
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => resolveEscalation(esc.id)}>
                  Mark Resolved
                </Button>
                <Button onClick={() => window.location.href = `/tree/${esc.treeId}`}>
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
