import { Routes, Route, Navigate } from "react-router-dom";
import { WardLayout } from "./WardLayout";
import { WardOverview } from "./WardOverview";
import { WardInsights } from "./WardInsights";
import { WardEscalations } from "./WardEscalations";

export default function WardDashboard() {
  return (
    <Routes>
      <Route element={<WardLayout />}>
        <Route index element={<WardOverview />} />
        <Route path="insights" element={<WardInsights />} />
        <Route path="escalations" element={<WardEscalations />} />
        {/* Fallback to index */}
        <Route path="*" element={<Navigate to="/ward" replace />} />
      </Route>
    </Routes>
  );
}
