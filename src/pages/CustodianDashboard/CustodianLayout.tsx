import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";

export function CustodianLayout() {
  const { user, claims, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-field-parchment flex items-center justify-center">
        <p className="font-sans text-sm text-slate-bark animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!user || !claims) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: "/custodian", label: "My Trees", icon: "🌳" },
    { path: "/custodian/incidents", label: "Incidents", icon: "⚠️" },
  ];

  return (
    <div className="min-h-[100dvh] bg-field-parchment flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-field-parchment-dark p-4 flex justify-between items-center z-10 sticky top-0">
        <div>
          <h1 className="font-display text-lg text-ink-bark tracking-wide uppercase">VrkshSaathi</h1>
          <p className="font-sans text-xs text-slate-bark">Custodian Area</p>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 text-slate-bark hover:bg-field-parchment rounded-full" aria-label="Sign Out">
          <LogOut size={20} />
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-t md:border-t-0 md:border-r border-field-parchment-dark flex flex-row md:flex-col fixed md:relative bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
        <div className="p-6 border-b border-field-parchment-dark hidden md:block">
          <h1 className="font-display text-2xl text-ink-bark uppercase tracking-wide">VrkshSaathi</h1>
          <p className="font-sans text-sm text-slate-bark mt-1">Custodian Area</p>
        </div>
        
        <nav className="flex-1 w-full flex flex-row md:flex-col justify-around p-2 md:p-4 gap-1 md:gap-2 overflow-x-auto bg-white">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/custodian");
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
            <span className="font-sans text-xs text-slate-bark tracking-wide uppercase">Profile</span>
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
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          {/* We pass down the specific claims so children know whose trees to fetch */}
          <Outlet context={{ ...claims }} />
        </div>
      </main>
    </div>
  );
}
