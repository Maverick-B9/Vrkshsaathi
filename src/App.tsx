import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Lazy-loaded pages for code splitting
import { lazy, Suspense } from "react";

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
    if (!user || !claims) return "/login";
    switch (claims.role) {
      case "registrar":  return "/registrar";
      case "custodian":  return "/custodian";
      case "ward_admin": return "/ward";
      default:           return "/login";
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ── */}
        <Route path="/tree/:treeId"         element={<CitizenTreePage />} />
        <Route path="/tree/:treeId/history" element={<TreeLifeRecord />} />
        <Route path="/login"                element={<LoginPage />} />

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
