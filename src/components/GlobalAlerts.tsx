import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { Modal, Button } from "./ui";
import { Bell } from "lucide-react";

export function GlobalAlerts() {
  const { claims } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // Listen to global URGENT alerts
    const q = query(
      collection(db, "alerts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlerts(data);
      // For MVP, just show unread badge if there are alerts and panel is closed
      if (!isOpen) {
        setUnread(data.length);
      }
    });

    return () => unsubscribe();
  }, [claims, isOpen]); // isOpen dependency so we can reset unread when opened

  if (alerts.length === 0) return null;

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); setUnread(0); }}
        className="fixed bottom-6 right-6 bg-laterite-clay text-white p-4 rounded-full shadow-tag hover:bg-laterite-clay-light transition-colors z-50 flex items-center justify-center animate-bounce"
        aria-label="Alerts"
      >
        <Bell size={24} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-ui-error text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unread}
          </span>
        )}
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="System Alerts">
        <div className="flex flex-col gap-4 mt-2 max-h-[60vh] overflow-y-auto pr-2">
          {alerts.map(a => (
            <div key={a.id} className="bg-field-parchment/50 border-l-4 border-laterite-clay p-4 rounded-r-tag">
              <h4 className="font-sans font-bold text-ink-bark">{a.title}</h4>
              <p className="font-sans text-sm text-slate-bark mt-1 whitespace-pre-wrap">{a.message}</p>
              <div className="text-[10px] text-slate-bark mt-2 uppercase tracking-wide">
                {new Date(a.createdAt).toLocaleString()}
              </div>
              {a.treeId && (
                 <a href={`/tree/${a.treeId}/history`} className="text-moss-canopy text-sm font-bold block mt-2 hover:underline">View Tree Details</a>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </Modal>
    </>
  );
}
