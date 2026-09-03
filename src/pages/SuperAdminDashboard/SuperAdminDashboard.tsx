import { Routes, Route, Navigate } from "react-router-dom";
import { SuperAdminLayout } from "./SuperAdminLayout";
import { SuperAdminUsers } from "./SuperAdminUsers";
import { SuperAdminTrees } from "./SuperAdminTrees";
import { SuperAdminReports } from "./SuperAdminReports";
import { SuperAdminAnalytics } from "./SuperAdminAnalytics";

export default function SuperAdminDashboard() {
  return (
    <Routes>
      <Route element={<SuperAdminLayout />}>
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="trees" element={<SuperAdminTrees />} />
        <Route path="reports" element={<SuperAdminReports />} />
        <Route path="analytics" element={<SuperAdminAnalytics />} />
        {/* Fallback to users */}
        <Route path="*" element={<Navigate to="/super-admin/users" replace />} />
      </Route>
    </Routes>
  );
}
