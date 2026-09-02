import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Button, Select, Textarea, Toast, ToastContainer } from "../../components/ui";

export function MortalityGate() {
  const { custodianId } = useOutletContext<{ custodianId: string }>();
  const [trees, setTrees] = useState<{ id: string, species: string, ward: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTree, setSelectedTree] = useState("");
  const [causeTag, setCauseTag] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchTrees() {
      if (!custodianId) return;
      try {
        const q = query(
          collection(db, "trees"), 
          where("custodianId", "==", custodianId),
          where("status", "!=", "DEAD") // Can't kill it twice
        );
        const snap = await getDocs(q);
        setTrees(snap.docs.map(d => ({ 
          id: d.id, 
          species: d.data().species, 
          ward: d.data().ward 
        })));
      } catch (err) {
        console.error("Failed to fetch trees", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrees();
  }, [custodianId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTree || !causeTag) return;
    setIsSubmitting(true);

    try {
      // In a real app, this calls a Cloud Function (e.g. `confirmMortality`)
      // The function enforces the backend rule that a tree can only transition to DEAD
      // if accompanied by a mortality_record containing a valid causeTag.
      
      // const res = await httpsCallable(functions, "confirmMortality")({
      //   treeId: selectedTree,
      //   causeTag,
      //   notes
      // });
      
      console.log(`Mocking mortality confirmation for ${selectedTree} with cause: ${causeTag}`);
      
      setTimeout(() => {
        setSuccess(true);
        setIsSubmitting(false);
        setTrees(prev => prev.filter(t => t.id !== selectedTree));
        setSelectedTree("");
        setCauseTag("");
        setNotes("");
      }, 1000);
      
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert("Failed to confirm mortality.");
    }
  };

  const treeOptions = [
    { value: "", label: "-- Select a Tree --" },
    ...trees.map(t => ({ value: t.id, label: `${t.species} (${t.id}) - ${t.ward}` }))
  ];

  const causeOptions = [
    { value: "", label: "-- Select Cause of Death --" },
    { value: "DROUGHT", label: "Drought / Lack of Water" },
    { value: "GRAZING", label: "Grazing / Animal Damage" },
    { value: "VANDALISM", label: "Human Vandalism / Construction" },
    { value: "DISEASE", label: "Disease / Pest" },
    { value: "WEATHER", label: "Extreme Weather (Storm/Flood)" },
    { value: "UNKNOWN", label: "Unknown Cause" },
  ];

  return (
    <div className="max-w-lg bg-white rounded-tag p-6 shadow-tag animate-fade-up">
      <div className="mb-6 border-b border-field-parchment-dark pb-4">
        <h2 className="font-display text-2xl text-ink-bark">Confirm Mortality</h2>
        <p className="font-sans text-sm text-slate-bark mt-1">
          This is an irreversible action. The tree will be permanently marked as DEAD.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-bark">Loading your trees...</div>
      ) : trees.length === 0 ? (
        <div className="py-8 text-center text-slate-bark">No eligible trees to report.</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Select 
            label="Which tree has died?" 
            options={treeOptions}
            value={selectedTree}
            onChange={(e) => setSelectedTree(e.target.value)}
            required
          />

          <Select 
            label="Primary Cause" 
            options={causeOptions}
            value={causeTag}
            onChange={(e) => setCauseTag(e.target.value)}
            required
          />

          <Textarea 
            label="Additional Context" 
            placeholder="Provide any details about the circumstances..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="p-4 bg-ui-error/10 border border-ui-error/30 rounded-tag-inner">
            <p className="font-sans text-sm text-ui-error">
              <strong>Warning:</strong> By submitting this form, you acknowledge that you have physically verified the death of this tree.
            </p>
          </div>

          <Button type="submit" variant="danger" loading={isSubmitting} disabled={!selectedTree || !causeTag}>
            Confirm Mortality
          </Button>
        </form>
      )}

      <ToastContainer>
        {success && <Toast variant="success" message="Tree marked as DEAD." onDismiss={() => setSuccess(false)} />}
      </ToastContainer>
    </div>
  );
}
