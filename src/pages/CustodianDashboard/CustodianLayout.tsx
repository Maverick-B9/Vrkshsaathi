import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function CustodianLayout() {
  const { user, claims, loading, signOut } = useAuth();
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
    <div className="min-h-screen bg-field-parchment flex flex-col md:flex-row">
      {/* Mobile-first bottom nav, adapts to sidebar on lg */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-field-parchment-dark flex flex-col fixed bottom-0 md:relative z-10">
        <div className="hidden md:block p-6 border-b border-field-parchment-dark">
          <h1 className="font-display text-xl text-ink-bark uppercase">TREE-LIFE</h1>
          <p className="font-sans text-sm text-slate-bark mt-1">Custodian Area</p>
        </div>
        
        <nav className="flex md:flex-col justify-around p-2 md:p-4 gap-2 bg-white w-full">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/custodian");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 md:flex-none flex md:block flex-col items-center text-center px-4 py-3 md:py-2 rounded-tag-inner font-sans text-xs md:text-sm font-medium transition-colors ${
                  active 
                    ? "bg-moss-canopy/10 text-moss-canopy-dark" 
                    : "text-slate-bark hover:bg-field-parchment hover:text-ink-bark"
                }`}
              >
                <span className="text-lg md:text-base md:mr-2 block md:inline">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          {/* We pass down the specific claims so children know whose trees to fetch */}
          <Outlet context={{ ...claims }} />
        </div>
      </main>
    </div>
  );
}
