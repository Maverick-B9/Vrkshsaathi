import { useState } from "react";
import { auth, functions } from "@/firebase/config";
import { httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui";

export default function SuperAdminDashboard() {
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<"super_admin" | "ward_admin" | "registrar" | "custodian">("ward_admin");
  const [orgId, setOrgId] = useState("");
  const [custodianId, setCustodianId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const setUserClaims = httpsCallable(functions, "setUserClaims");
      
      const payload: any = { uid, role };
      if (role === "registrar") payload.orgId = orgId;
      if (role === "custodian") payload.custodianId = custodianId;

      await setUserClaims(payload);
      setMessage(`Successfully assigned role '${role}' to user ${uid}`);
      setUid("");
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-field-parchment flex flex-col">
      {/* Header */}
      <header className="bg-moss-canopy text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <h1 className="font-display text-xl tracking-wide uppercase">Super Admin Portal</h1>
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => auth.signOut()}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 animate-fade-up">
        <h2 className="text-3xl font-display text-ink-bark mb-2">Role Management</h2>
        <p className="text-slate-bark mb-8">
          Assign roles to registered users across the entire system.
        </p>

        <div className="bg-white p-6 rounded-tag shadow-tag border border-field-parchment-dark">
          <form onSubmit={handleAssignRole} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-ink-bark mb-1">User UID</label>
              <input 
                type="text"
                required
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                placeholder="Paste Firebase UID here"
              />
              <p className="text-xs text-slate-bark mt-1">
                <strong>How to fetch:</strong> Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-moss-canopy underline">Firebase Console</a> → Authentication → Users tab, and copy the "User UID" for the desired user.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-bark mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
              >
                <option value="super_admin">Super Admin</option>
                <option value="ward_admin">Ward Admin</option>
                <option value="registrar">Registrar</option>
                <option value="custodian">Custodian</option>
              </select>
            </div>

            {role === "registrar" && (
              <div className="animate-fade-up">
                <label className="block text-sm font-medium text-ink-bark mb-1">Organization ID</label>
                <input 
                  type="text"
                  required
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                  placeholder="e.g. org-123"
                />
              </div>
            )}

            {role === "custodian" && (
              <div className="animate-fade-up">
                <label className="block text-sm font-medium text-ink-bark mb-1">Custodian Document ID</label>
                <input 
                  type="text"
                  required
                  value={custodianId}
                  onChange={(e) => setCustodianId(e.target.value)}
                  className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                  placeholder="e.g. cust-456"
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="mt-4">
              {loading ? "Assigning..." : "Assign Role"}
            </Button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-tag-inner text-sm ${message.startsWith("Error") ? "bg-laterite-clay/10 text-laterite-clay border border-laterite-clay/30" : "bg-moss-canopy/10 text-moss-canopy border border-moss-canopy/30"}`}>
              {message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
