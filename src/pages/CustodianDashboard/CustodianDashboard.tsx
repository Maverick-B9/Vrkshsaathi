import { Routes, Route } from "react-router-dom";
import { CustodianLayout } from "./CustodianLayout";
import { MyTrees } from "./MyTrees";
import { IncidentQueue } from "./IncidentQueue";
import { MortalityGate } from "./MortalityGate";

export default function CustodianDashboard() {
  return (
    <Routes>
      <Route element={<CustodianLayout />}>
        <Route index element={<MyTrees />} />
        <Route path="incidents" element={<IncidentQueue />} />
        <Route path="mortality" element={<MortalityGate />} />
      </Route>
    </Routes>
  );
}
