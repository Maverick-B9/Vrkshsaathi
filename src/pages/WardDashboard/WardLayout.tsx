import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { Button } from "../../components/ui";

export function WardLayout() {
  const { user, claims } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/ward", label: "Overview" },
    { path: "/ward/insights", label: "AI Insights" },
    { path: "/ward/escalations", label: "Escalations" },
  ];

  return (
    <div className="min-h-screen bg-field-parchment flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-field-parchment-dark flex flex-col shrink-0">
        <div className="p-6 border-b border-field-parchment-dark">
          <h1 className="font-display text-2xl text-ink-bark uppercase tracking-wide">TREE-LIFE</h1>
          <p className="font-sans text-sm text-slate-bark mt-1">Ward Control Center</p>
        </div>
        
        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/ward");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-4 py-3 rounded-tag-inner font-sans text-sm font-medium transition-colors whitespace-nowrap
                  ${active 
                    ? "bg-moss-canopy/10 text-moss-canopy-dark" 
                    : "text-slate-bark hover:bg-field-parchment hover:text-ink-bark"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-field-parchment-dark hidden md:block">
          <div className="flex flex-col gap-1 mb-4">
            <span className="font-sans text-xs text-slate-bark tracking-wide uppercase">Admin Profile</span>
            <span className="font-sans text-sm font-medium text-ink-bark truncate">{user?.phoneNumber || user?.email}</span>
            <span className="font-mono text-xs text-slate-bark truncate">{claims?.orgId}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => signOut(auth)} fullWidth>
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-field-parchment">
        <div className="p-6 lg:p-12 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
