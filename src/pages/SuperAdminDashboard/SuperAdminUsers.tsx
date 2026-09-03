import { useState, useEffect } from "react";
import { auth, functions } from "@/firebase/config";
import { httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui";
import { Edit2, Trash2, X } from "lucide-react";

interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: string;
  orgId?: string;
  custodianId?: string;
}

export function SuperAdminUsers() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"super_admin" | "ward_admin" | "registrar" | "custodian">("ward_admin");
  const [orgId, setOrgId] = useState("");
  const [custodianId, setCustodianId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Edit Modal State
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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
      if (phone) payload.phoneNumber = phone.startsWith("+") ? phone : `+91${phone}`;
      if (role === "registrar" || role === "custodian") payload.orgId = orgId;
      if (role === "custodian") payload.custodianId = custodianId;

      await adminCreateUser(payload);
      setMessage(`Successfully created ${role} account for ${name} (${email})! They can now log in.`);
      
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      
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

  const openEditModal = (user: AdminUser) => {
    setEditTarget(user);
    setEditName(user.displayName || "");
    setEditPhone(user.phoneNumber || "");
    setEditPassword("");
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setEditLoading(true);
    try {
      const adminUpdateUser = httpsCallable(functions, "adminUpdateUser");
      const payload: any = { targetUid: editTarget.uid };
      if (editName && editName !== editTarget.displayName) payload.displayName = editName;
      if (editPassword) payload.password = editPassword;
      if (editPhone !== editTarget.phoneNumber) {
        payload.phoneNumber = editPhone ? (editPhone.startsWith("+") ? editPhone : `+91${editPhone}`) : null; // Send null to remove phone
      }

      await adminUpdateUser(payload);
      
      setUsers((prev) => prev.map((u) => {
        if (u.uid === editTarget.uid) {
          return { 
            ...u, 
            displayName: editName || u.displayName,
            phoneNumber: editPhone || u.phoneNumber
          };
        }
        return u;
      }));
      
      setEditTarget(null);
      alert("User updated successfully.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update user.");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-ink-bark/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-tag shadow-tag p-6 max-w-md w-full relative">
            <button onClick={() => setEditTarget(null)} className="absolute top-4 right-4 text-slate-bark hover:text-ink-bark">
              <X size={20} />
            </button>
            <h3 className="text-xl font-display text-ink-bark mb-4">Edit {editTarget.email}</h3>
            <form onSubmit={handleUpdateUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-bark mb-1">Display Name</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-bark mb-1">Phone Number (Optional)</label>
                <input 
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-bark mb-1">New Password (Optional)</label>
                <input 
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                  placeholder="Leave blank to keep unchanged"
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={editLoading} className="mt-2">
                {editLoading ? "Updating..." : "Save Changes"}
              </Button>
            </form>
          </div>
        </div>
      )}

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
                <label className="block text-sm font-medium text-ink-bark mb-1">Phone Number (Optional)</label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                  placeholder="+91 98765 43210"
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

            {(role === "registrar" || role === "custodian") && (
              <div className="bg-field-parchment/50 p-4 rounded border border-field-parchment-dark mt-2">
                <label className="block text-sm font-medium text-ink-bark mb-1">Organization ID</label>
                <input 
                  type="text"
                  required
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                  placeholder="e.g. ORG-GREEN-BLR"
                />
                <p className="text-xs text-slate-bark mt-1">
                  Required. Groups {role}s under a specific organization for assigning trees.
                </p>
              </div>
            )}

            {role === "custodian" && (
              <div className="bg-field-parchment/50 p-4 rounded border border-field-parchment-dark mt-2">
                <label className="block text-sm font-medium text-ink-bark mb-1">Custodian Reference ID (Optional)</label>
                <input 
                  type="text"
                  value={custodianId}
                  onChange={(e) => setCustodianId(e.target.value)}
                  className="w-full border border-slate-bark/30 rounded px-3 py-2 text-ink-bark focus:ring-2 focus:ring-moss-canopy/50 outline-none"
                  placeholder="e.g. CUST-1042"
                />
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
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-slate-bark hover:text-ink-bark font-medium transition-colors"
                              title="Edit User"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              disabled={isSelf}
                              onClick={() => handleDeleteUser(user.uid, user.email)}
                              className="text-laterite-clay hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors"
                              title={isSelf ? "Cannot delete yourself" : "Delete user"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
    </div>
  );
}
