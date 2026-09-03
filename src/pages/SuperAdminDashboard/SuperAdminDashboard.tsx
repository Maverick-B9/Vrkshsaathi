import { useState, useEffect } from "react";
import { auth, functions } from "@/firebase/config";
import { httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui";

interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: string;
  orgId?: string;
  custodianId?: string;
}

export default function SuperAdminDashboard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"super_admin" | "ward_admin" | "registrar" | "custodian">("ward_admin");
  const [orgId, setOrgId] = useState("");
  const [custodianId, setCustodianId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const adminListUsers = httpsCallable(functions, "adminListUsers");
      const result = await adminListUsers();
      setUsers((result.data as any).users || []);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const adminCreateUser = httpsCallable(functions, "adminCreateUser");
      
      const payload: any = { name, email, password, role };
      if (role === "registrar") payload.orgId = orgId;
      if (role === "custodian") payload.custodianId = custodianId;

      await adminCreateUser(payload);
      setMessage(`Successfully created ${role} account for ${name} (${email})! They can now log in.`);
      
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      
      // Refresh list
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (targetUid: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to completely delete ${userEmail}? This cannot be undone.`)) return;
    
    try {
      const adminDeleteUser = httpsCallable(functions, "adminDeleteUser");
      await adminDeleteUser({ targetUid });
      setUsers((prev) => prev.filter((u) => u.uid !== targetUid));
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      alert(err.message || "Failed to delete user.");
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
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 animate-fade-up">
        
        {/* CREATE USER SECTION */}
        <div className="mb-12">
          <h2 className="text-3xl font-display text-ink-bark mb-2">Create User Account</h2>
          <p className="text-slate-bark mb-6">
            Quickly create accounts for Ward Admins, Registrars, or Custodians. They will be able to log in immediately with the credentials you set.
          </p>

          <div className="bg-white p-6 rounded-tag shadow-tag border border-field-parchment-dark">
            <form onSubmit={handleCreateUser} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-ink-bark mb-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-bark mb-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                    placeholder="e.g. ramesh@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-bark mb-1">Temporary Password</label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                    placeholder="At least 6 characters"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-bark mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none bg-white"
                  >
                    <option value="ward_admin">Ward Admin</option>
                    <option value="registrar">Registrar</option>
                    <option value="custodian">Custodian</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
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
                  <p className="text-xs text-slate-bark mt-1">Required so the registrar can manage this organization's trees.</p>
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
                  <p className="text-xs text-slate-bark mt-1">Required to link this account to an existing Custodian profile.</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="mt-4 self-start">
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {message && (
              <div className={`mt-6 p-4 rounded-tag-inner text-sm ${message.startsWith("Error") ? "bg-laterite-clay/10 text-laterite-clay border border-laterite-clay/30" : "bg-moss-canopy/10 text-moss-canopy border border-moss-canopy/30"}`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* LIST USERS SECTION */}
        <div>
          <h2 className="text-2xl font-display text-ink-bark mb-4">Existing Members</h2>
          <div className="bg-white rounded-tag shadow-tag border border-field-parchment-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead className="bg-field-parchment text-slate-bark uppercase tracking-wider text-xs border-b border-field-parchment-dark">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Extra Info</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-field-parchment-dark text-ink-bark">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-bark">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-bark">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isSelf = user.uid === auth.currentUser?.uid;
                      return (
                        <tr key={user.uid} className="hover:bg-moss-canopy/5 transition-colors">
                          <td className="px-6 py-4 font-medium">{user.displayName || "—"}</td>
                          <td className="px-6 py-4">{user.email || "—"}</td>
                          <td className="px-6 py-4">
                            <span className="bg-moss-canopy/10 text-moss-canopy px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-bark text-xs">
                            {user.orgId && <div>Org: {user.orgId}</div>}
                            {user.custodianId && <div>Cust: {user.custodianId}</div>}
                            {!user.orgId && !user.custodianId && "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={isSelf}
                              onClick={() => handleDeleteUser(user.uid, user.email)}
                              className="text-laterite-clay hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                              title={isSelf ? "Cannot delete yourself" : "Delete user"}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
