import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
// In a real app, this would use a Firebase Auth hook that includes the custom claims
// For now, we mock the auth state to allow UI development
const useAuth = () => {
  return {
    user: { uid: "mock-registrar", email: "admin@ngo.org" },
    claims: { role: "registrar", orgId: "org-1" },
    loading: false,
  };
};

export function RegistrarLayout() {
  const { user, claims, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Protect route
  if (!user || claims.role !== "registrar" || !claims.orgId) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: "/registrar", label: "Overview" },
    { path: "/registrar/trees", label: "Trees" },
    { path: "/registrar/custodians", label: "Custodians" },
    { path: "/registrar/inbox", label: "Escalation Inbox" },
  ];

  return (
    <div className="min-h-screen bg-field-parchment flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-field-parchment-dark flex flex-col">
        <div className="p-6 border-b border-field-parchment-dark">
          <h1 className="font-display text-xl text-ink-bark tracking-wide uppercase">TREE-LIFE</h1>
          <p className="font-sans text-sm text-slate-bark mt-1">Registrar Portal</p>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-tag-inner font-sans text-sm font-medium transition-colors ${
                  active 
                    ? "bg-moss-canopy/10 text-moss-canopy-dark" 
                    : "text-slate-bark hover:bg-field-parchment hover:text-ink-bark"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-field-parchment-dark text-xs text-slate-bark">
          Logged in as: {user.email} <br/> Org: {claims.orgId}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet context={{ orgId: claims.orgId }} />
        </div>
      </main>
    </div>
  );
}
