import { Routes, Route, Navigate } from "react-router-dom";
import { RegistrarLayout } from "./RegistrarLayout";
import { Overview } from "./Overview";
import { RegisterTreeForm } from "./RegisterTreeForm";
import { TreeList } from "./TreeList";
import { CustodianInvites } from "./CustodianInvites";
import { EscalationInbox } from "./EscalationInbox";
import { useOutletContext } from "react-router-dom";

// Wrapper for RegisterTreeForm to pass orgId from context
function RegisterWrapper() {
  const { orgId } = useOutletContext<{ orgId: string }>();
  return <RegisterTreeForm orgId={orgId} />;
}

export default function RegistrarDashboard() {
  return (
    <Routes>
      <Route element={<RegistrarLayout />}>
        <Route index element={<Overview />} />
        <Route path="register" element={<RegisterWrapper />} />
        <Route path="trees" element={<TreeList />} />
        <Route path="custodians" element={<Navigate to="new" replace />} />
        <Route path="custodians/new" element={<CustodianInvites />} />
        <Route path="inbox" element={<EscalationInbox />} />
      </Route>
    </Routes>
  );
}
