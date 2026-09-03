import { useState } from "react";
import { Button, Input, Select, Toast, ToastContainer } from "../../components/ui";
import { useRegisterTree } from "./useRegisterTree";

import { QRCodeSVG } from 'qrcode.react';

// Use QRCodeSVG directly instead of placeholder

type Step = 1 | 2 | 3 | 4;

export function RegisterTreeForm({ orgId }: { orgId: string }) {
  const { registerTree, isSubmitting } = useRegisterTree();
  
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  
  // Form Data
  const [species, setSpecies] = useState("");
  const [road, setRoad] = useState("");
  const [landmark, setLandmark] = useState("");
  const [ward, setWard] = useState("");
  const [cityOrVillage, setCityOrVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  
  // Viability Data
  const [speciesFit, setSpeciesFit] = useState("medium"); // low, medium, high
  const [waterAccess, setWaterAccess] = useState("medium");
  const [grazingRisk, setGrazingRisk] = useState("medium");
  const [protection, setProtection] = useState("none"); // none, tree_guard, fenced
  
  // Assignment
  const [custodianId, setCustodianId] = useState("");
  
  // Result
  const [createdTreeId, setCreatedTreeId] = useState<string | null>(null);



  // Compute Viability Score (0-100)
  const computeViability = () => {
    let score = 0;
    
    // Fit
    if (speciesFit === "high") score += 30;
    else if (speciesFit === "medium") score += 15;
    
    // Water
    if (waterAccess === "high") score += 30;
    else if (waterAccess === "medium") score += 15;
    
    // Grazing
    if (grazingRisk === "low") score += 20;
    else if (grazingRisk === "medium") score += 10;
    
    // Protection
    if (protection === "fenced") score += 20;
    else if (protection === "tree_guard") score += 10;
    
    return score;
  };

  const score = computeViability();

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!species || !ward) {
        setError("Species and Ward are required.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Non-blocking warning is handled in UI, just proceed
      setStep(3);
    } else if (step === 3) {
      if (!custodianId) {
        setError("You must select a Custodian.");
        return;
      }
      submitForm();
    }
  };

  const submitForm = async () => {
    const res = await registerTree({
      species,
      road,
      landmark,
      ward,
      cityOrVillage,
      district,
      state,
      country,
      pincode,
      custodianId,
      registrarOrgId: orgId,
      viabilityScore: score,
    });

    if (res.success && res.treeId) {
      setCreatedTreeId(res.treeId);
      setStep(4);
    } else {
      setError(res.error || "Failed to create tree.");
    }
  };

  return (
    <div className="bg-white rounded-tag shadow-tag p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6 border-b border-field-parchment-dark pb-4">
        <h2 className="font-display text-2xl text-ink-bark">Register New Tree</h2>
        {step < 4 && <p className="font-sans text-sm text-slate-bark">Step {step} of 3</p>}
      </div>

      {/* STEP 1: Details */}
      {step === 1 && (
        <div className="flex flex-col gap-4 animate-fade-up">
          <Input 
            label="Species" 
            placeholder="e.g. Neem (Azadirachta indica)" 
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Road / Street" 
              placeholder="e.g. MG Road" 
              value={road}
              onChange={(e) => setRoad(e.target.value)}
            />
            <Input 
              label="Landmark" 
              placeholder="e.g. Near Post Office" 
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
            <Input 
              label="Ward / Zone" 
              placeholder="e.g. Ward 14" 
              value={ward}
              onChange={(e) => setWard(e.target.value)}
            />
            <Input 
              label="City / Village" 
              placeholder="e.g. Mysore" 
              value={cityOrVillage}
              onChange={(e) => setCityOrVillage(e.target.value)}
            />
            <Input 
              label="District" 
              placeholder="e.g. Mysore District" 
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
            <Input 
              label="State" 
              placeholder="e.g. Karnataka" 
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
            <Input 
              label="Country" 
              placeholder="e.g. India" 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Input 
              label="Pincode" 
              placeholder="e.g. 570001" 
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleNext}>Next: Viability Check</Button>
          </div>
        </div>
      )}

      {/* STEP 2: Viability Check */}
      {step === 2 && (
        <div className="flex flex-col gap-4 animate-fade-up">
          <Select 
            label="Species Fit for Soil/Climate"
            value={speciesFit}
            onChange={(e) => setSpeciesFit(e.target.value)}
            options={[
              { value: "high", label: "Excellent" },
              { value: "medium", label: "Moderate" },
              { value: "low", label: "Poor" },
            ]}
          />
          <Select 
            label="Water Availability"
            value={waterAccess}
            onChange={(e) => setWaterAccess(e.target.value)}
            options={[
              { value: "high", label: "Reliable / Close" },
              { value: "medium", label: "Occasional" },
              { value: "low", label: "Scarce" },
            ]}
          />
          <Select 
            label="Grazing Risk"
            value={grazingRisk}
            onChange={(e) => setGrazingRisk(e.target.value)}
            options={[
              { value: "low", label: "Low (Safe)" },
              { value: "medium", label: "Moderate" },
              { value: "high", label: "High Risk" },
            ]}
          />
          <Select 
            label="Physical Protection"
            value={protection}
            onChange={(e) => setProtection(e.target.value)}
            options={[
              { value: "fenced", label: "Compound / Fenced" },
              { value: "tree_guard", label: "Tree Guard Installed" },
              { value: "none", label: "Open / Unprotected" },
            ]}
          />

          <div className={`mt-4 p-4 rounded-tag-inner border ${score < 60 ? 'bg-turmeric-ochre/10 border-turmeric-ochre/40' : 'bg-moss-canopy/10 border-moss-canopy/40'}`}>
            <p className="font-sans text-sm font-medium text-ink-bark">Computed Viability Score: <span className="text-lg tabular-nums">{score}</span>/100</p>
            {score < 60 && (
              <p className="font-sans text-sm text-turmeric-ochre-light mt-1">
                ⚠️ Low viability. Proceed anyway?
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleNext}>Next: Assign Custodian</Button>
          </div>
        </div>
      )}

      {/* STEP 3: Assignment & Submit */}
      {step === 3 && (
        <div className="flex flex-col gap-4 animate-fade-up">
          <p className="font-sans text-sm text-slate-bark mb-2">
            Every tree must have an assigned Custodian. This is a strict requirement.
          </p>
          <Select 
            label="Assign Custodian"
            value={custodianId}
            onChange={(e) => setCustodianId(e.target.value)}
            options={availableCustodians}
          />
          <div className="mt-2 text-right">
            <button className="text-ui-focus-ring font-sans text-sm font-medium hover:underline">
              + Invite new Custodian (Phone)
            </button>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={handleNext} loading={isSubmitting}>Submit & Create Tree</Button>
          </div>
        </div>
      )}

      {/* STEP 4: Success & QR Code */}
      {step === 4 && createdTreeId && (
        <div className="flex flex-col items-center gap-6 animate-fade-up py-4">
          <div className="w-12 h-12 rounded-full bg-moss-canopy/10 flex items-center justify-center text-moss-canopy text-2xl">
            ✓
          </div>
          <div className="text-center">
            <h3 className="font-display text-xl text-ink-bark mb-1">Tree Registered Successfully</h3>
            <p className="font-sans text-sm text-slate-bark">ID: {createdTreeId}</p>
          </div>

          <div className="p-4 bg-white border border-field-parchment-dark shadow-sm rounded-tag-inner">
            <QRCodeSVG 
              value={`${window.location.origin}/tree/${createdTreeId}`} 
              size={200}
              level="H"
              imageSettings={{
                src: "/logo.jpg",
                x: undefined,
                y: undefined,
                height: 48,
                width: 48,
                excavate: true,
              }}
            />
          </div>
          <p className="font-sans text-xs text-slate-bark max-w-xs text-center">
            This QR code is for immediate printing. A permanent copy will be generated in the background.
          </p>

          <Button onClick={() => window.location.reload()} fullWidth>Register Another Tree</Button>
        </div>
      )}

      <ToastContainer>
        {error && <Toast variant="error" message={error} onDismiss={() => setError(null)} />}
      </ToastContainer>
    </div>
  );
}
