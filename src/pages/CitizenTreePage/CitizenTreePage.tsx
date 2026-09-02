import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import type { TreeStatus } from "../../types/firestore";
import { LivingTag } from "../../components/LivingTag/LivingTag";
import { ReportForm } from "./ReportForm";
import { Spinner, EmptyState, Toast, ToastContainer } from "../../components/ui";
import { STRINGS, SUPPORTED_LANGUAGES } from "../../i18n/strings";
import type { LanguageCode } from "../../i18n/strings";
import { loadLanguageFont } from "../../i18n/fonts";

export default function CitizenTreePage() {
  const { treeId } = useParams<{ treeId: string }>();
  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<LanguageCode>("en");
  const [showToast, setShowToast] = useState(false);

  // Initial language detection
  useEffect(() => {
    const browserLang = navigator.language.split("-")[0] as LanguageCode;
    if (SUPPORTED_LANGUAGES.some(l => l.code === browserLang)) {
      setLang(browserLang);
      loadLanguageFont(browserLang);
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as LanguageCode;
    setLang(newLang);
    loadLanguageFont(newLang); // Fetches the required Noto font lazily
  };

  useEffect(() => {
    async function fetchTree() {
      if (!treeId) return;
      try {
        // Fetch from Firestore
        const docSnap = await getDoc(doc(db, "trees", treeId));
        if (docSnap.exists()) {
          setTree(docSnap.data());
        }
      } catch (err) {
        console.error("Failed to fetch tree", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTree();
  }, [treeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-field-parchment">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-field-parchment">
        <EmptyState 
          title="Tree Not Found" 
          description="We couldn't find a record for this tree ID." 
        />
      </div>
    );
  }

  const strings = STRINGS[lang];

  return (
    <main className="min-h-screen bg-field-parchment p-4 pb-24">
      {/* Top Header: Language Switcher */}
      <div className="flex justify-end mb-6">
        <select 
          value={lang} 
          onChange={handleLanguageChange}
          className="bg-white border border-field-parchment-dark text-ink-bark font-sans text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ui-focus-ring"
          aria-label="Select Language"
        >
          {SUPPORTED_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="max-w-lg mx-auto flex flex-col gap-8">
        
        {/* Tag-as-page Layout: Reuses LivingTag completely */}
        <section aria-labelledby="tree-info-title">
          <h2 id="tree-info-title" className="sr-only">{strings.pageTitle}</h2>
          <LivingTag 
            treeId={treeId!} 
            species={tree.species || "Unknown Species"} 
            ward={tree.ward || "Unknown Ward"} 
            status={tree.status as TreeStatus} 
            custodianName={tree.custodianName}
            lastVerifiedAt={tree.lastVerifiedAt ? new Date(tree.lastVerifiedAt.toMillis()) : null}
            size="lg"
            noAnimate
          />
          {/* AI Health Signal Chip could go here if present on tree doc */}
          {tree.aiHealthSignal && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-moss-canopy/10 border border-moss-canopy/20 text-moss-canopy-dark font-sans text-xs font-medium">
              ✨ AI noted: {tree.aiHealthSignal}
            </div>
          )}
        </section>

        <hr className="border-field-parchment-dark border-t-2 border-dashed" />

        {/* Report Form */}
        <section className="bg-white rounded-tag p-5 shadow-tag">
          <div className="mb-6">
            <h2 className="font-display text-xl text-ink-bark mb-1">{strings.reportTitle}</h2>
            <p className="font-sans text-sm text-slate-bark">{strings.reportDesc}</p>
          </div>
          <ReportForm 
            treeId={treeId!} 
            lang={lang} 
            onSuccess={() => setShowToast(true)} 
          />
        </section>
      </div>

      <ToastContainer>
        {showToast && (
          <Toast 
            variant="success" 
            message={navigator.onLine ? strings.successToast : strings.offlineToast} 
            onDismiss={() => setShowToast(false)} 
          />
        )}
      </ToastContainer>
    </main>
  );
}
