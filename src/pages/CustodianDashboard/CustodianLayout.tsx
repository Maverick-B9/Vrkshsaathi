import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui";

// Mock Auth Hook simulating the verified phone number
const useAuth = () => {
  return {
    user: { uid: "auth-123", phoneNumber: "+919876543210" },
    loading: false,
    signOut: () => console.log("Signing out..."),
  };
};

export function CustodianLayout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  // States to handle the matching flow
  const [checkingIdentity, setCheckingIdentity] = useState(true);
  const [matchFound, setMatchFound] = useState(false);
  const [custodianClaims, setCustodianClaims] = useState<{ role: string; orgId: string; custodianId: string } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setCheckingIdentity(false);
      return;
    }

    // In a real app: call the Firebase HTTPS Callable function `verifyCustodianPhone`
    // const res = await httpsCallable(functions, "verifyCustodianPhone")();
    // For now, we mock the result of that callable based on the phone number.
    const mockCallable = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (user.phoneNumber === "+919876543210") {
            resolve({ success: true, role: "custodian", orgId: "org-1", custodianId: "cust-1" });
          } else {
            resolve({ success: false });
          }
        }, 800);
      });
    };

    mockCallable().then((res: any) => {
      if (res.success) {
        setMatchFound(true);
        setCustodianClaims({ role: res.role, orgId: res.orgId, custodianId: res.custodianId });
      } else {
        setMatchFound(false);
      }
      setCheckingIdentity(false);
    });
  }, [user, loading]);

  if (loading || checkingIdentity) {
    return (
      <div className="min-h-screen bg-field-parchment flex items-center justify-center">
        <p className="font-sans text-sm text-slate-bark animate-pulse">Verifying Identity...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Explicit "No Match" UI State
  if (!matchFound || !custodianClaims) {
    return (
      <div className="min-h-screen bg-field-parchment flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-tag shadow-tag p-8 max-w-sm border-t-4 border-t-turmeric-ochre">
          <div className="text-4xl mb-4">📵</div>
          <h2 className="font-display text-xl text-ink-bark mb-2">Profile Not Found</h2>
          <p className="font-sans text-sm text-slate-bark mb-6">
            No custodian profile was found matching <strong>{user.phoneNumber}</strong>.
            Please contact your organization Registrar to register your number.
          </p>
          <Button variant="secondary" onClick={signOut} fullWidth>
            Sign Out
          </Button>
        </div>
      </div>
    );
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
          <Outlet context={{ ...custodianClaims }} />
        </div>
      </main>
    </div>
  );
}
