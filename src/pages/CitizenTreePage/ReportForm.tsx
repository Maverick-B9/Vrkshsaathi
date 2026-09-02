import { useState, useRef } from "react";
import { Button, Chip, Input, Textarea, Toast } from "../../components/ui";
import { STRINGS } from "../../i18n/strings";
import type { LanguageCode } from "../../i18n/strings";
import { useSubmitIncident } from "./useSubmitIncident";
import { Mic, Image as ImageIcon, X } from "lucide-react";

interface ReportFormProps {
  treeId: string;
  lang: LanguageCode;
  onSuccess: () => void;
}

export function ReportForm({ treeId, lang, onSuccess }: ReportFormProps) {
  const strings = STRINGS[lang];
  const { submitIncident, isSubmitting } = useSubmitIncident();
  
  const [category, setCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photoBlob, setPhotoBlob] = useState<File | null>(null);
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [parsedData, setParsedData] = useState<{ category: string; notes: string } | null>(null);

  const categories = [
    { value: "WATER_NEEDED", label: strings.categoryWater, icon: "💧" },
    { value: "PHYSICAL_DAMAGE", label: strings.categoryDamage, icon: "🪓" },
    { value: "DISEASED", label: strings.categoryDisease, icon: "🍂" },
    { value: "MISSING", label: strings.categoryMissing, icon: "❓" },
    { value: "OTHER", label: strings.categoryOther, icon: "📝" },
  ];

  // --- Voice Flow ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || "audio/mp4";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        
        // Mocking parseVoiceNote Cloud Function call for now
        // In real app: this triggers the Gemini STT pipeline passing the active UI language
        // const parsed = await callParseVoiceNote({ audioBlob: blob, langHint: lang });
        console.log(`Simulating parseVoiceNote call with langHint: ${lang}`);
        const parsed = { category: "WATER_NEEDED", notes: "They said the tree looks completely dry." };
        
        setParsedData(parsed);
        setCategory(parsed.category);
        setNotes(parsed.notes);
        setShowConfirm(true); // Mandatory confirmation screen
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Microphone access is required to use voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Submit Flow ---
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!category) return;

    const res = await submitIncident({
      treeId,
      category,
      notes,
      photoBlob,
      audioBlob,
    });

    if (res.success) {
      onSuccess(); // Triggers success toast in parent
    }
  };

  if (showConfirm && parsedData) {
    return (
      <div className="flex flex-col gap-4 bg-field-parchment/30 p-4 rounded-tag-inner border border-field-parchment-dark">
        <h3 className="font-display text-lg text-ink-bark">{strings.voiceConfirmTitle}</h3>
        <p className="font-sans text-sm text-slate-bark">{strings.voiceConfirmDesc}</p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map(c => (
            <Chip
              key={c.value}
              label={c.label}
              icon={c.icon}
              selected={category === c.value}
              onClick={() => setCategory(c.value)}
            />
          ))}
        </div>
        
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={() => setShowConfirm(false)} fullWidth>
            {strings.cancelBtn}
          </Button>
          <Button onClick={() => handleSubmit()} loading={isSubmitting} fullWidth>
            {strings.confirmBtn}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="font-sans text-sm text-ink-bark font-medium">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <Chip
              key={c.value}
              label={c.label}
              icon={c.icon}
              selected={category === c.value}
              onClick={() => setCategory(c.value)}
            />
          ))}
        </div>
      </div>

      <Textarea
        label={strings.notesLabel}
        placeholder={strings.notesPlaceholder}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex gap-4">
        {/* Photo Upload */}
        <label className="flex-1 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setPhotoBlob(e.target.files[0]);
            }}
          />
          <div className={`
            flex items-center justify-center gap-2 h-12 rounded-tag-inner border border-field-parchment-dark
            font-sans text-sm font-medium transition-colors
            ${photoBlob ? "bg-moss-canopy/10 text-moss-canopy border-moss-canopy/30" : "bg-white text-ink-bark hover:bg-field-parchment"}
          `}>
            <ImageIcon size={18} />
            {photoBlob ? "Photo Attached" : strings.photoLabel}
            {photoBlob && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setPhotoBlob(null); }}
                className="ml-2 text-slate-bark hover:text-ui-error"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </label>

        {/* Voice Note */}
        <Button
          type="button"
          variant="secondary"
          className={`flex-1 ${isRecording ? "bg-ui-error text-white border-ui-error animate-pulse" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          <Mic size={18} />
          {isRecording ? strings.voiceRecording : strings.voiceBtn}
        </Button>
      </div>

      <Button
        type="submit"
        disabled={!category}
        loading={isSubmitting}
        fullWidth
      >
        {strings.submitBtn}
      </Button>
    </form>
  );
}
