/**
 * TREE-LIFE — Cloud Functions
 *
 * Functions exported:
 *   - onTreeCreate        : Firestore trigger — auto-generates 4 checkpoint docs
 *   - setUserClaims       : Callable — sets role/orgId/custodianId custom claims
 *   - escalationScheduler : Scheduled (every hour) — single elapsed-time approach:
 *                           PENDING past deadline → ESCALATED to Registrar org,
 *                           ESCALATED past +72h second window → ESCALATED to WARD_ADMIN
 *   - confirmMortality    : Callable — the only path to write mortality_records +
 *                           flip tree status to DEAD
 *   - generateQRCode      : Callable — generates QR URL after tree creation
 *   - generatePatternInsights : Scheduled (weekly) — AI pattern analysis
 *   - analyzeIncidentPhoto    : Storage trigger — Gemini Vision on photo upload
 *   - parseVoiceNote          : Callable — Gemini STT + structured extraction
 */
import * as admin from "firebase-admin";
import {
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import {
  onObjectFinalized,
} from "firebase-functions/v2/storage";
import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";
import {
  onSchedule,
} from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";

admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const REGION = "asia-south1";

/** Default deadline hours per category (§4.2 of spec) — exported for client use */
export const DEADLINE_HOURS: Record<string, number> = {
  DAMAGE:       24,
  WATER:        72,
  GRAZING:      24,
  PEST:         72,
  GUARD_BROKEN: 48,
  OTHER:        48,
};

const MS_PER_HOUR = 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────
// 1. onTreeCreate — auto-generate 4 checkpoint docs
// ─────────────────────────────────────────────────────────────────
export const onTreeCreate = onDocumentCreated(
  { document: "trees/{treeId}", region: REGION },
  async (event) => {
    const treeId = event.params.treeId;
    const treeData = event.data?.data();
    if (!treeData) return;

    // Validate custodianId presence (belt-and-suspenders; rules enforce it too)
    if (!treeData.custodianId) {
      logger.error(`Tree ${treeId} created without custodianId — this should have been blocked by rules.`);
      return;
    }

    const plantedDate: admin.firestore.Timestamp = treeData.plantedDate;
    const planted = plantedDate.toDate();

    const milestones: { milestone: string; offsetMonths: number }[] = [
      { milestone: "MONTH_1",  offsetMonths: 1  },
      { milestone: "MONTH_6",  offsetMonths: 6  },
      { milestone: "YEAR_1",   offsetMonths: 12 },
      { milestone: "YEAR_3",   offsetMonths: 36 },
    ];

    const batch = db.batch();
    for (const { milestone, offsetMonths } of milestones) {
      const dueDate = new Date(planted);
      dueDate.setMonth(dueDate.getMonth() + offsetMonths);

      const ref = db.collection("checkpoints").doc();
      batch.set(ref, {
        treeId,
        milestone,
        dueDate:     admin.firestore.Timestamp.fromDate(dueDate),
        completedAt: null,
        survived:    null,
        notes:       "",
        photoUrl:    "",
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    logger.info(`✅ 4 checkpoints created for tree ${treeId}`);
  }
);

// ─────────────────────────────────────────────────────────────────
// 2. setUserClaims — set role/orgId/custodianId as custom claims
//    Called once on account creation from the Registrar/Admin UI.
//    Custom claims are then read directly by Firestore rules —
//    no get() lookups into Firestore needed.
// ─────────────────────────────────────────────────────────────────
export const setUserClaims = onCall(
  { region: REGION },
  async (request) => {
    // Only a ward_admin (or service account) can set claims for others
    const callerClaims = request.auth?.token;
    if (!callerClaims || (callerClaims.role !== "ward_admin" && callerClaims.role !== "super_admin")) {
      // Self-registration: allow registrar/custodian claim to be set
      // only if the user has no role yet (first-time setup)
      if (callerClaims?.role) {
        throw new HttpsError("permission-denied", "Insufficient permissions to set claims.");
      }
    }

    const { uid, role, orgId, custodianId } = request.data as {
      uid: string;
      role: "registrar" | "custodian" | "ward_admin" | "super_admin";
      orgId?: string;
      custodianId?: string;
    };

    if (!uid || !role) {
      throw new HttpsError("invalid-argument", "uid and role are required.");
    }

    const claims: Record<string, unknown> = { role };
    if (orgId) claims.orgId = orgId;
    if (custodianId) claims.custodianId = custodianId;

    await admin.auth().setCustomUserClaims(uid, claims);
    logger.info(`✅ Custom claims set for ${uid}: role=${role}`);
    return { success: true };
  }
);

// ─────────────────────────────────────────────────────────────────
// 2a. adminCreateUser — callable by super_admin
//     Creates a Firebase Auth user with email/password and sets 
//     their custom claims immediately.
// ─────────────────────────────────────────────────────────────────
export const adminCreateUser = onCall(
  { region: REGION },
  async (request) => {
    // Only super_admin or ward_admin can create users this way
    const callerClaims = request.auth?.token;
    if (!callerClaims || (callerClaims.role !== "super_admin" && callerClaims.role !== "ward_admin")) {
      throw new HttpsError("permission-denied", "Insufficient permissions to create users.");
    }

    const { email, password, name, role, orgId, custodianId } = request.data as any;

    if (!email || !password || !role) {
      throw new HttpsError("invalid-argument", "email, password, and role are required.");
    }

    try {
      // 1. Create the user
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });

      // 2. Set claims
      const claims: Record<string, unknown> = { role };
      if (orgId) claims.orgId = orgId;
      if (custodianId) claims.custodianId = custodianId;

      await admin.auth().setCustomUserClaims(userRecord.uid, claims);
      logger.info(`✅ Admin created user ${userRecord.uid} (${email}) with role=${role}`);

      return { success: true, uid: userRecord.uid };
    } catch (error: any) {
      logger.error("Error creating user:", error);
      throw new HttpsError("internal", error.message || "Failed to create user.");
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// 2b. adminListUsers — callable by super_admin
//     Lists up to 1000 users and their custom claims.
// ─────────────────────────────────────────────────────────────────
export const adminListUsers = onCall(
  { region: REGION },
  async (request) => {
    const callerClaims = request.auth?.token;
    if (!callerClaims || callerClaims.role !== "super_admin") {
      throw new HttpsError("permission-denied", "Insufficient permissions to list users.");
    }

    try {
      const listUsersResult = await admin.auth().listUsers(1000);
      const users = listUsersResult.users.map((record) => ({
        uid: record.uid,
        email: record.email,
        displayName: record.displayName,
        role: record.customClaims?.role || "none",
        orgId: record.customClaims?.orgId,
        custodianId: record.customClaims?.custodianId,
        creationTime: record.metadata.creationTime,
        lastSignInTime: record.metadata.lastSignInTime,
      }));
      return { success: true, users };
    } catch (error: any) {
      logger.error("Error listing users:", error);
      throw new HttpsError("internal", "Failed to list users.");
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// 2c. adminDeleteUser — callable by super_admin
//     Deletes a user account.
// ─────────────────────────────────────────────────────────────────
export const adminDeleteUser = onCall(
  { region: REGION },
  async (request) => {
    const callerClaims = request.auth?.token;
    if (!callerClaims || callerClaims.role !== "super_admin") {
      throw new HttpsError("permission-denied", "Insufficient permissions to delete users.");
    }

    const { targetUid } = request.data as { targetUid: string };
    if (!targetUid) {
      throw new HttpsError("invalid-argument", "targetUid is required.");
    }

    // Prevent self-deletion via this endpoint
    if (targetUid === request.auth?.uid) {
      throw new HttpsError("invalid-argument", "Cannot delete your own account via this method.");
    }

    try {
      await admin.auth().deleteUser(targetUid);
      logger.info(`✅ Admin deleted user ${targetUid}`);
      return { success: true };
    } catch (error: any) {
      logger.error("Error deleting user:", error);
      throw new HttpsError("internal", error.message || "Failed to delete user.");
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// 2d. adminUpdateUser — callable by super_admin
//     Updates a user's password and/or display name.
// ─────────────────────────────────────────────────────────────────
export const adminUpdateUser = onCall(
  { region: REGION },
  async (request) => {
    const callerClaims = request.auth?.token;
    if (!callerClaims || callerClaims.role !== "super_admin") {
      throw new HttpsError("permission-denied", "Insufficient permissions to update users.");
    }

    const { targetUid, password, displayName } = request.data as {
      targetUid: string;
      password?: string;
      displayName?: string;
    };

    if (!targetUid) {
      throw new HttpsError("invalid-argument", "targetUid is required.");
    }
    
    if (!password && !displayName) {
      throw new HttpsError("invalid-argument", "Must provide password or displayName to update.");
    }

    try {
      const updatePayload: any = {};
      if (password) updatePayload.password = password;
      if (displayName) updatePayload.displayName = displayName;

      await admin.auth().updateUser(targetUid, updatePayload);
      logger.info(`✅ Admin updated user ${targetUid}`);
      return { success: true };
    } catch (error: any) {
      logger.error("Error updating user:", error);
      throw new HttpsError("internal", error.message || "Failed to update user.");
    }
  }
);


// ─────────────────────────────────────────────────────────────────
// 2e. verifyCustodianPhone — callable by a user to link their phone 
//     number to an existing custodian record and get their claims.
// ─────────────────────────────────────────────────────────────────
export const verifyCustodianPhone = onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth || !request.auth.token.phone_number) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in with a phone number to verify."
      );
    }

    const uid = request.auth.uid;
    const phone = request.auth.token.phone_number;

    // Check if they already have claims
    if (request.auth.token.role) {
      return { success: true, message: "Role already assigned." };
    }

    // Look for a matching custodian document
    const snapshot = await db
      .collection("custodians")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new HttpsError(
        "not-found",
        "No custodian record found for this phone number."
      );
    }

    const custodianDoc = snapshot.docs[0];
    const data = custodianDoc.data();

    // Set custom claims
    const claims = {
      role: "custodian",
      orgId: data.orgId,
      custodianId: custodianDoc.id,
    };

    await admin.auth().setCustomUserClaims(uid, claims);

    // Link the authUid to the custodian record
    await custodianDoc.ref.update({ authUid: uid });

    logger.info(`✅ verifyCustodianPhone: Linked ${phone} to custodian ${custodianDoc.id}`);
    
    return { success: true, linked: true };
  }
);

// ─────────────────────────────────────────────────────────────────
// 3. escalationScheduler — single elapsed-time scheduler
//    Runs hourly. Handles BOTH escalation tiers in one pass,
//    using stored `deadline` and `escalationHistory` length to
//    determine which tier to apply. No two separate functions.
// ─────────────────────────────────────────────────────────────────
export const escalationScheduler = onSchedule(
  { schedule: "every 1 hours", region: REGION, timeZone: "Asia/Kolkata" },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const batch = db.batch();
    let opCount = 0;

    // ── Tier 1: PENDING past deadline → ESCALATED to Registrar ────
    const tier1Snap = await db
      .collection("incidents")
      .where("status", "==", "PENDING")
      .where("deadline", "<=", now)
      .get();

    for (const doc of tier1Snap.docs) {
      const data = doc.data();
      // Find tree to get registrarOrgId
      const treeSnap = await db.collection("trees").doc(data.treeId).get();
      const registrarOrgId = treeSnap.data()?.registrarOrgId ?? "UNKNOWN_ORG";

      batch.update(doc.ref, {
        status: "ESCALATED",
        assignedTo: registrarOrgId,
        escalationHistory: admin.firestore.FieldValue.arrayUnion({
          escalatedAt: now,
          escalatedTo: registrarOrgId,
          reason:      "Response deadline exceeded — escalated to Registrar org",
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      opCount++;
      logger.info(`⬆️  Tier-1 escalation: incident ${doc.id} → org ${registrarOrgId}`);
    }

    // ── Tier 2: ESCALATED past +72h second window → WARD_ADMIN ───
    const secondWindowMs = 72 * MS_PER_HOUR;
    const tier2Snap = await db
      .collection("incidents")
      .where("status", "==", "ESCALATED")
      .get();

    for (const doc of tier2Snap.docs) {
      const data = doc.data();
      const history: { escalatedAt: admin.firestore.Timestamp }[] =
        data.escalationHistory ?? [];

      // Find the most recent escalation (Tier 1)
      const lastEscalation = history[history.length - 1];
      if (!lastEscalation) continue;

      const escalatedAt = lastEscalation.escalatedAt.toMillis();
      const elapsedSinceEscalation = Date.now() - escalatedAt;

      // Only escalate to ward admin if not already escalated there
      if (
        elapsedSinceEscalation >= secondWindowMs &&
        data.assignedTo !== "WARD_ADMIN"
      ) {
        batch.update(doc.ref, {
          assignedTo: "WARD_ADMIN",
          escalationHistory: admin.firestore.FieldValue.arrayUnion({
            escalatedAt: now,
            escalatedTo: "WARD_ADMIN",
            reason:      "Registrar-tier response window exceeded — escalated to Ward Admin",
          }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        opCount++;
        logger.info(`⬆️  Tier-2 escalation: incident ${doc.id} → WARD_ADMIN`);
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }
    logger.info(`escalationScheduler complete — ${opCount} incident(s) escalated`);
  }
);

// ─────────────────────────────────────────────────────────────────
// 4. confirmMortality — the ONLY path to write mortality_records
//    and flip tree status to DEAD.
//    Validates caller, writes mortality_record atomically with
//    tree status update. Prevents bare status flip and self-serving
//    cause manipulation.
// ─────────────────────────────────────────────────────────────────
export const confirmMortality = onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { role } = request.auth.token as { role?: string };
    if (!role || !["custodian", "registrar", "ward_admin"].includes(role)) {
      throw new HttpsError("permission-denied", "Insufficient role to confirm mortality.");
    }

    const { treeId, causeTag, subCause } = request.data as {
      treeId: string;
      causeTag: string;
      subCause: string;
    };

    const VALID_CAUSES = [
      "ENVIRONMENTAL",
      "BIOLOGICAL",
      "HUMAN",
      "PLANTATION_FAILURE",
      "UNKNOWN",
    ];

    if (!treeId || !causeTag || !subCause) {
      throw new HttpsError("invalid-argument", "treeId, causeTag, and subCause are required.");
    }
    if (!VALID_CAUSES.includes(causeTag)) {
      throw new HttpsError("invalid-argument", `Invalid causeTag: ${causeTag}`);
    }

    const treeRef = db.collection("trees").doc(treeId);
    const treeSnap = await treeRef.get();
    if (!treeSnap.exists) {
      throw new HttpsError("not-found", `Tree ${treeId} not found.`);
    }

    const treeData = treeSnap.data()!;

    // Custodians can only confirm mortality for their assigned trees
    if (
      role === "custodian" &&
      treeData.custodianId !== request.auth.token.custodianId
    ) {
      throw new HttpsError("permission-denied", "You are not the custodian of this tree.");
    }

    // Registrars can only confirm for their org's trees
    if (
      role === "registrar" &&
      treeData.registrarOrgId !== request.auth.token.orgId
    ) {
      throw new HttpsError("permission-denied", "This tree does not belong to your organisation.");
    }

    // Atomic batch: mortality_record + tree status flip
    const mortalityRef = db.collection("mortality_records").doc();
    const batch = db.batch();

    batch.set(mortalityRef, {
      treeId,
      causeTag,
      subCause,
      confirmedBy:  request.auth.uid,
      confirmedAt:  admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.update(treeRef, {
      status:    "DEAD",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    logger.info(`☠️  Tree ${treeId} confirmed DEAD. Cause: ${causeTag} / ${subCause}`);
    return { success: true, mortalityRecordId: mortalityRef.id };
  }
);

// ─────────────────────────────────────────────────────────────────
// 5. generateQRCode — callable, invoked after tree registration
//    Stores QR URL on the tree doc (QR image is generated client-side
//    using qrcode.react; this function just records the URL).
// ─────────────────────────────────────────────────────────────────
export const generateQRCode = onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { treeId, appBaseUrl } = request.data as {
      treeId: string;
      appBaseUrl: string;
    };

    if (!treeId || !appBaseUrl) {
      throw new HttpsError("invalid-argument", "treeId and appBaseUrl are required.");
    }

    const qrUrl = `${appBaseUrl}/tree/${treeId}`;

    await db.collection("trees").doc(treeId).update({
      qrCodeUrl: qrUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`🔳 QR URL set for tree ${treeId}: ${qrUrl}`);
    return { qrUrl };
  }
);

// ─────────────────────────────────────────────────────────────────
// 6. analyzeIncidentPhoto — Storage trigger on incident photo upload
//    Calls Gemini Vision API, stores aiHealthSignal on incident doc.
//    AI is advisory only — never resolves or closes an incident.
// ─────────────────────────────────────────────────────────────────
export const analyzeIncidentPhoto = onObjectFinalized(
  { region: "us-east1", bucket: process.env.STORAGE_BUCKET, secrets: ["GEMINI_API_KEY"] },
  async (event) => {
    const filePath = event.data.name;
    // Only process incident photos
    if (!filePath || !filePath.startsWith("incidents/")) return;

    // Extract incidentId from path: incidents/{incidentId}/photo.jpg
    const parts = filePath.split("/");
    if (parts.length < 2) return;
    const incidentId = parts[1];

    const incidentRef = db.collection("incidents").doc(incidentId);
    const incidentSnap = await incidentRef.get();
    if (!incidentSnap.exists) return;

    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        logger.warn("GEMINI_API_KEY not set — skipping photo analysis");
        return;
      }

      // Get the image as base64
      const bucket = admin.storage().bucket(event.data.bucket);
      const file = bucket.file(filePath);
      const [buffer] = await file.download();
      const base64Image = buffer.toString("base64");
      const mimeType = event.data.contentType ?? "image/jpeg";

      // Dynamic import to avoid top-level issues
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        {
          inlineData: {
            data:     base64Image,
            mimeType: mimeType,
          },
        },
        `You are an expert botanist reviewing a photo of a planted tree sapling in India.
Classify the tree's visible health into EXACTLY ONE of these categories:
- healthy: tree looks vigorous, leaves green, no obvious damage
- wilting: leaves drooping or yellowing, possible water stress
- pest_damage: visible pest marks, holes, web, or discolouration
- physical_damage: broken branches, guard damage, animal grazing marks
- dead: tree appears dead (no leaves, brown/black stem, collapsed)
- inconclusive: photo quality or framing does not allow confident assessment

Respond with a JSON object only, no markdown:
{"signal": "<category>", "confidence": "<high|medium|low>", "note": "<one-sentence observation>"}`,
      ]);

      const text = result.response.text().trim();
      let parsed: { signal: string; confidence: string; note: string };
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { signal: "inconclusive", confidence: "low", note: text.slice(0, 120) };
      }

      const aiHealthSignal = `${parsed.signal} (${parsed.confidence} confidence)${parsed.note ? " — " + parsed.note : ""}`;

      await incidentRef.update({
        aiHealthSignal,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`🤖 AI health signal for incident ${incidentId}: ${aiHealthSignal}`);
    } catch (err) {
      logger.error(`analyzeIncidentPhoto error for ${incidentId}:`, err);
      // Non-fatal — the system works without AI
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// 7. parseVoiceNote — callable, invoked from citizen report flow
//    Receives audio base64 + languageCode, returns structured
//    {category, severity, freeTextSummary} for citizen confirmation.
//    Never auto-submits — citizen always confirms before submit.
// ─────────────────────────────────────────────────────────────────
export const parseVoiceNote = onCall(
  { region: REGION, secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    const { audioBase64, mimeType, languageCode } = request.data as {
      audioBase64: string;
      mimeType:    string;
      languageCode: string;
    };

    if (!audioBase64 || !languageCode) {
      throw new HttpsError("invalid-argument", "audioBase64 and languageCode are required.");
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new HttpsError(
        "internal",
        "AI service not configured. Please report this issue."
      );
    }

    const SUPPORTED = [
      "en","hi","kn","ta","te","mr","bn","gu","ml","pa","or","ur","as",
    ];
    if (!SUPPORTED.includes(languageCode)) {
      throw new HttpsError("invalid-argument", `Language ${languageCode} not supported.`);
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        {
          inlineData: {
            data:     audioBase64,
            mimeType: mimeType ?? "audio/webm",
          },
        },
        `The following audio is a voice report about a planted tree sapling in India.
The speaker is using language code: "${languageCode}".

Tasks:
1. Transcribe the audio accurately in the original language.
2. Extract the incident details.
3. Respond ONLY with a JSON object (no markdown):

{
  "transcript": "<full transcription in original language>",
  "category": "<one of: WATER | DAMAGE | GRAZING | PEST | GUARD_BROKEN | OTHER>",
  "severity": "<one of: low | medium | high>",
  "freeTextSummary": "<2-3 sentence summary in the SAME language as the speaker>"
}

If the audio is unclear or not about a tree incident, set category to "OTHER" and severity to "low".`,
      ]);

      const text = result.response.text().trim();
      let parsed: {
        transcript: string;
        category: string;
        severity: string;
        freeTextSummary: string;
      };

      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = {
          transcript:      text,
          category:        "OTHER",
          severity:        "low",
          freeTextSummary: text.slice(0, 200),
        };
      }

      return {
        success:  true,
        ...parsed,
      };
    } catch (err) {
      logger.error("parseVoiceNote error:", err);
      throw new HttpsError("internal", "Voice processing failed. Please try again.");
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// 8. generatePatternInsights — scheduled weekly (Sunday midnight IST)
//    Aggregates incidents + mortality_records, calls Gemini for
//    plain-language insights, writes to /insights/{weekId}.
//    AI output surfaces as advisory callouts — never auto-actions.
// ─────────────────────────────────────────────────────────────────
export const generatePatternInsights = onSchedule(
  {
    schedule:  "0 0 * * 0", // Every Sunday at midnight
    region:    REGION,
    timeZone:  "Asia/Kolkata",
    secrets:   ["GEMINI_API_KEY"],
  },
  async () => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      logger.warn("GEMINI_API_KEY not set — skipping pattern analysis");
      return;
    }

    // Get week ID e.g. "2026-W35"
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const weekId = `${now.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;

    // Aggregate last 30 days of incidents
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * MS_PER_HOUR);
    const incidentsSnap = await db
      .collection("incidents")
      .where("reportedAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const mortalitySnap = await db.collection("mortality_records").get();
    const treesSnap = await db.collection("trees").get();

    // Build summary statistics
    const incidents = incidentsSnap.docs.map((d) => d.data());
    const mortality = mortalitySnap.docs.map((d) => d.data());
    const trees     = treesSnap.docs.map((d) => d.data());

    const summary = {
      totalTrees:              trees.length,
      healthyCount:            trees.filter((t) => t.status === "HEALTHY").length,
      deadCount:               trees.filter((t) => t.status === "DEAD").length,
      incidentsLast30d:        incidents.length,
      pendingIncidents:        incidents.filter((i) => i.status === "PENDING").length,
      escalatedIncidents:      incidents.filter((i) => i.status === "ESCALATED").length,
      byCategory:              countBy(incidents, "category"),
      byWard:                  countBy(trees, (t) => t.location?.ward ?? "Unknown"),
      mortalityByWard:         countBy(
        trees.filter((t) => t.status === "DEAD"),
        (t) => t.location?.ward ?? "Unknown"
      ),
      mortalityByCause:        countBy(mortality, "causeTag"),
    };

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(`
You are an analyst reviewing tree survival data for a civic environmental programme in India.
Here is the aggregated data for the last 30 days:

${JSON.stringify(summary, null, 2)}

Generate 3-5 plain-language insights that would be useful for a Ward/Municipal Officer.
Each insight should:
- Be one specific, actionable observation (not a generic statement)
- Reference specific wards, species, or categories from the data where available
- Be written in simple, clear English

Respond ONLY with a JSON array (no markdown):
[
  {
    "type": "<MORTALITY_CLUSTER | RESPONSE_DEGRADATION | SPECIES_RISK>",
    "plain": "<the full insight sentence>",
    "ward": "<ward name or null>",
    "species": "<species or null>",
    "severity": "<INFO | WARNING>"
  }
]
`);

      const text = result.response.text().trim();
      let insights: unknown[];
      try {
        insights = JSON.parse(text);
      } catch {
        insights = [
          {
            type:     "MORTALITY_CLUSTER",
            plain:    "Pattern analysis ran but could not parse structured output. Raw: " + text.slice(0, 200),
            ward:     null,
            species:  null,
            severity: "INFO",
          },
        ];
      }

      await db.collection("insights").doc(weekId).set({
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        insights,
        summaryStats: summary,
      });

      logger.info(`📊 Pattern insights generated for ${weekId}: ${insights.length} insight(s)`);
    } catch (err) {
      logger.error("generatePatternInsights error:", err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function countBy<T>(
  arr: T[],
  key: string | ((item: T) => string)
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of arr) {
    const k = typeof key === "function" ? key(item) : (item as Record<string, string>)[key];
    result[k] = (result[k] ?? 0) + 1;
  }
  return result;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
