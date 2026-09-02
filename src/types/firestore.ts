/**
 * TREE-LIFE — Firestore data model types (§3 of spec).
 *
 * These interfaces mirror the Firestore document shapes exactly.
 * Timestamps are typed as `Date` here; the Firestore SDK converts
 * them when reading. When writing, always use `serverTimestamp()`.
 */

// ─────────────────────────────────────────────────────────────────
// Enumerations
// ─────────────────────────────────────────────────────────────────

export type OrgType =
  | "NGO"
  | "SCHOOL"
  | "MUNICIPALITY"
  | "CORPORATE"
  | "PANCHAYAT";

export type TreeStatus =
  | "HEALTHY"
  | "NEEDS_ATTENTION"
  | "DEAD"
  | "REPLACED";

export type CustodianRole =
  | "INDIVIDUAL"
  | "SCHOOL_ECO_CLUB"
  | "VILLAGE_COMMITTEE"
  | "CORPORATE_TEAM"
  | "WARD_OFFICER";

export type ReportedVia = "TAP" | "PHOTO" | "VOICE";

export type IncidentCategory =
  | "WATER"
  | "DAMAGE"
  | "GRAZING"
  | "PEST"
  | "GUARD_BROKEN"
  | "OTHER";

export type IncidentStatus = "PENDING" | "RESOLVED" | "ESCALATED";

export type CheckpointMilestone =
  | "MONTH_1"
  | "MONTH_6"
  | "YEAR_1"
  | "YEAR_3";

export type MortalityCause =
  | "ENVIRONMENTAL"
  | "BIOLOGICAL"
  | "HUMAN"
  | "PLANTATION_FAILURE"
  | "UNKNOWN";

// ─────────────────────────────────────────────────────────────────
// /organizations/{orgId}
// ─────────────────────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  contact: {
    name: string;
    email?: string;
    phone?: string;
  };
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────
// /trees/{treeId}   — human-readable ID e.g. "MYS-W14-0247"
// ─────────────────────────────────────────────────────────────────
export interface Tree {
  id: string; // the document ID
  species: string;
  plantedDate: Date;
  location: {
    lat: number;
    lng: number;
    landmark: string;
    ward: string;
  };
  registrarOrgId: string; // ref to /organizations
  custodianId: string;    // REQUIRED — no tree without a custodian
  status: TreeStatus;
  viabilityScore?: number; // 0–100, optional pre-plant assessment
  lastVerifiedAt: Date;
  qrCodeUrl: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────
// /custodians/{custodianId}
// ─────────────────────────────────────────────────────────────────
export interface Custodian {
  id: string;
  name: string;
  phone: string;
  email?: string;
  orgId?: string; // ref to /organizations (if institutional)
  role: CustodianRole;
  assignedTreeIds: string[];
  responseStats: {
    totalIncidents: number;
    resolvedOnTime: number;
    avgResponseHours: number;
  };
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────
// /incidents/{incidentId}
// ─────────────────────────────────────────────────────────────────
export interface EscalationEntry {
  escalatedAt: Date;
  escalatedTo: string; // orgId or "WARD_ADMIN"
  reason: string;
}

/** Per-category deadline overrides. Default 48h. */
export const INCIDENT_DEADLINE_HOURS: Record<IncidentCategory, number> = {
  DAMAGE:       24,
  WATER:        72,
  GRAZING:      24,
  PEST:         72,
  GUARD_BROKEN: 48,
  OTHER:        48,
};

export interface Incident {
  id: string;
  treeId: string;
  reportedAt: Date;
  reportedVia: ReportedVia;
  category: IncidentCategory;
  /** Language code of the submitting citizen, e.g. "kn", "hi", "en" */
  languageCode: string;
  aiHealthSignal?: string | null;
  photoUrl?: string | null;
  voiceUrl?: string | null;
  status: IncidentStatus;
  /**
   * deadline = reportedAt + INCIDENT_DEADLINE_HOURS[category].
   * Stored explicitly so the escalation scheduler can query it directly
   * without recomputing per document.
   */
  deadline: Date;
  assignedTo: string; // custodianId (escalates to orgId → "WARD_ADMIN")
  resolvedAt?: Date | null;
  resolutionPhotoUrl?: string | null;
  hasEvidence: boolean;
  freeTextSummary?: string;
  escalationHistory: EscalationEntry[];
}

// ─────────────────────────────────────────────────────────────────
// /checkpoints/{checkpointId}
// ─────────────────────────────────────────────────────────────────
export interface Checkpoint {
  id: string;
  treeId: string;
  milestone: CheckpointMilestone;
  dueDate: Date;
  completedAt?: Date | null;
  survived?: boolean | null;
  notes?: string;
  photoUrl?: string;
}

// ─────────────────────────────────────────────────────────────────
// /mortality_records/{recordId}
// ─────────────────────────────────────────────────────────────────
export interface MortalityRecord {
  id: string;
  treeId: string;
  causeTag: MortalityCause;
  subCause: string; // e.g. "drought", "grazing", "wrong species for soil"
  confirmedBy: string; // custodianId or registrarId (uid)
  confirmedAt: Date;
}

// ─────────────────────────────────────────────────────────────────
// /insights/{weekId}  — AI pattern analysis output (Phase 8)
// ─────────────────────────────────────────────────────────────────
export interface PatternInsight {
  id: string; // weekId e.g. "2026-W35"
  generatedAt: Date;
  insights: {
    type: "MORTALITY_CLUSTER" | "RESPONSE_DEGRADATION" | "SPECIES_RISK";
    plain: string;   // human-readable callout text
    ward?: string;
    species?: string;
    severity: "INFO" | "WARNING";
  }[];
}

// ─────────────────────────────────────────────────────────────────
// Firebase Auth custom claims (set by Cloud Function, not client)
// ─────────────────────────────────────────────────────────────────
export interface AuthClaims {
  role: "registrar" | "custodian" | "ward_admin";
  orgId?: string;      // for registrars
  custodianId?: string; // for custodians
}

// ─────────────────────────────────────────────────────────────────
// Supported languages — voice-to-incident (§6.2)
// ─────────────────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  { code: "en",    label: "English",    nativeName: "English",      font: null },
  { code: "hi",    label: "Hindi",      nativeName: "हिन्दी",        font: "Noto Sans Devanagari" },
  { code: "kn",    label: "Kannada",    nativeName: "ಕನ್ನಡ",         font: "Noto Sans Kannada" },
  { code: "ta",    label: "Tamil",      nativeName: "தமிழ்",          font: "Noto Sans Tamil" },
  { code: "te",    label: "Telugu",     nativeName: "తెలుగు",         font: "Noto Sans Telugu" },
  { code: "mr",    label: "Marathi",    nativeName: "मराठी",          font: "Noto Sans Devanagari" },
  { code: "bn",    label: "Bengali",    nativeName: "বাংলা",          font: "Noto Sans Bengali" },
  { code: "gu",    label: "Gujarati",   nativeName: "ગુજરાતી",        font: "Noto Sans Gujarati" },
  { code: "ml",    label: "Malayalam",  nativeName: "മലയാളം",         font: "Noto Sans Malayalam" },
  { code: "pa",    label: "Punjabi",    nativeName: "ਪੰਜਾਬੀ",         font: "Noto Sans Gurmukhi" },
  { code: "or",    label: "Odia",       nativeName: "ଓଡ଼ିଆ",           font: "Noto Sans Oriya" },
  { code: "ur",    label: "Urdu",       nativeName: "اُردُو",          font: "Noto Sans Arabic" },
  { code: "as",    label: "Assamese",   nativeName: "অসমীয়া",         font: "Noto Sans Bengali" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
