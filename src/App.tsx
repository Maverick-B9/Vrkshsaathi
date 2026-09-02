import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/firebase/config";

// Lazy-loaded pages for code splitting
import { lazy, Suspense, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/config";

const CitizenTreePage    = lazy(() => import("@/pages/CitizenTreePage/CitizenTreePage"));
const TreeLifeRecord     = lazy(() => import("@/pages/TreeLifeRecord/TreeLifeRecord"));
const LoginPage          = lazy(() => import("@/pages/Auth/LoginPage"));
const RegistrarDashboard = lazy(() => import("@/pages/RegistrarDashboard/RegistrarDashboard"));
const CustodianDashboard = lazy(() => import("@/pages/CustodianDashboard/CustodianDashboard"));
const WardDashboard      = lazy(() => import("@/pages/WardDashboard/WardDashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-field-parchment flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        {/* Animated trunk stub */}
        <svg width="24" height="48" viewBox="0 0 24 48" fill="none">
          <line
            x1="12" y1="0" x2="12" y2="48"
            stroke="#4B6B3A" strokeWidth="3"
            strokeLinecap="round"
            className="trunk-line"
          />
        </svg>
        <span className="font-sans text-sm text-slate-bark">Loading…</span>
      </div>
    </div>
  );
}

function UnassignedRole() {
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    // If the user has a phone number but no role, attempt to automatically link them to a custodian record
    if (user?.phoneNumber) {
      setVerifying(true);
      setVerifyError(null);
      const verify = httpsCallable(functions, "verifyCustodianPhone");
      verify()
        .then(() => {
          // If successful, forcefully refresh the ID token so the UI picks up the new claims
          return user.getIdToken(true);
        })
        .then(() => {
          window.location.reload();
        })
        .catch((err) => {
          console.error("Verification failed:", err);
          // Only show error if it's not simply "not found"
          if (err.code !== "not-found") {
            setVerifyError("An error occurred while verifying your phone number.");
          }
          setVerifying(false);
        });
    }
  }, [user]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-field-parchment flex items-center justify-center p-6">
        <p className="text-slate-bark animate-pulse">Checking for pending assignments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-field-parchment flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-tag shadow-tag p-8 text-center border border-field-parchment-dark">
        <h1 className="text-2xl font-display text-ink-bark mb-4">
          Account Not Fully Set Up
        </h1>
        <p className="text-slate-bark mb-6">
          You are signed in with <strong>{user?.phoneNumber || user?.email}</strong>, but your account doesn't have a designated role (Registrar, Custodian, or Ward Admin).
        </p>
        {verifyError && <p className="text-laterite-clay mb-4 text-sm">{verifyError}</p>}
        <p className="text-slate-bark text-sm bg-field-parchment p-4 rounded-tag-inner border border-field-parchment-dark">
          Please contact your organization administrator to link your account to a role.
        </p>
        <button 
          onClick={() => auth.signOut()}
          className="mt-6 text-sm text-laterite-clay hover:underline"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

/** Guard: redirects to /login if unauthenticated */
function RequireAuth({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, claims, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  if (allowedRoles && claims && !allowedRoles.includes(claims.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { user, claims } = useAuth();

  // Default redirect for authenticated users
  function defaultDashboard() {
    if (!user) return "/login";
    if (claims?.role === "registrar")  return "/registrar";
    if (claims?.role === "custodian")  return "/custodian";
    if (claims?.role === "ward_admin") return "/ward";
    return "/unassigned";
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ── */}
        <Route path="/tree/:treeId"         element={<CitizenTreePage />} />
        <Route path="/tree/:treeId/history" element={<TreeLifeRecord />} />
        <Route path="/login"                element={<LoginPage />} />
        <Route path="/unassigned"           element={<UnassignedRole />} />

        {/* ── Registrar ── */}
        <Route
          path="/registrar/*"
          element={
            <RequireAuth allowedRoles={["registrar", "ward_admin"]}>
              <RegistrarDashboard />
            </RequireAuth>
          }
        />

        {/* ── Custodian ── */}
        <Route
          path="/custodian/*"
          element={
            <RequireAuth allowedRoles={["custodian", "ward_admin"]}>
              <CustodianDashboard />
            </RequireAuth>
          }
        />

        {/* ── Ward Admin ── */}
        <Route
          path="/ward/*"
          element={
            <RequireAuth allowedRoles={["ward_admin"]}>
              <WardDashboard />
            </RequireAuth>
          }
        />

        {/* ── Root redirect ── */}
        <Route
          path="/"
          element={<Navigate to={defaultDashboard()} replace />}
        />

        {/* ── 404 ── */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-field-parchment flex items-center justify-center p-6">
              <div className="text-center">
                <p className="font-display text-4xl text-moss-canopy mb-2">404</p>
                <p className="font-sans text-ink-bark">Page not found.</p>
              </div>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
