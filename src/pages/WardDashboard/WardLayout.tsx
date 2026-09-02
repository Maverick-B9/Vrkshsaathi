import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";

export function WardLayout() {
  const { user, claims } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/ward", label: "Overview", icon: "📊" },
    { path: "/ward/insights", label: "AI Insights", icon: "✨" },
    { path: "/ward/escalations", label: "Escalations", icon: "⚠️" },
  ];

  return (
    <div className="min-h-screen bg-field-parchment flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-field-parchment-dark p-4 flex justify-between items-center z-10 sticky top-0">
        <div>
          <h1 className="font-display text-lg text-ink-bark tracking-wide uppercase">TREE-LIFE</h1>
          <p className="font-sans text-xs text-slate-bark">Ward Control Center</p>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 text-slate-bark hover:bg-field-parchment rounded-full" aria-label="Sign Out">
          <LogOut size={20} />
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-t md:border-t-0 md:border-r border-field-parchment-dark flex flex-row md:flex-col fixed md:relative bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
        <div className="p-6 border-b border-field-parchment-dark hidden md:block">
          <h1 className="font-display text-2xl text-ink-bark uppercase tracking-wide">TREE-LIFE</h1>
          <p className="font-sans text-sm text-slate-bark mt-1">Ward Control Center</p>
        </div>
        
        <nav className="flex-1 w-full flex flex-row md:flex-col justify-around p-2 md:p-4 gap-1 md:gap-2 overflow-x-auto bg-white">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/ward");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex-1 md:flex-none flex flex-col md:flex-row items-center md:justify-start px-2 py-3 md:px-4 md:py-3 rounded-tag-inner font-sans text-xs md:text-sm font-medium transition-colors whitespace-nowrap text-center md:text-left
                  ${active 
                    ? "bg-moss-canopy/10 text-moss-canopy-dark" 
                    : "text-slate-bark hover:bg-field-parchment hover:text-ink-bark"
                  }
                `}
              >
                <span className="text-xl md:text-base md:mr-3 block md:inline mb-1 md:mb-0">{item.icon}</span>
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
          <button 
            onClick={() => signOut(auth)}
            className="w-full bg-field-parchment hover:bg-slate-bark hover:text-white text-ink-bark font-sans font-medium py-2 rounded-tag-inner transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-field-parchment">
        <div className="p-4 md:p-6 lg:p-12 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
