/**
 * TREE-LIFE — Firestore Security Rules Unit Tests
 *
 * Run against the local Firebase Emulator Suite:
 *   firebase emulators:start --only firestore
 *   cd tests && npm test
 *
 * Covers the four invariants specified in §3 of the spec:
 *  1. Tree creation fails without custodianId
 *  2. Citizen cannot write mortality_records.causeTag
 *  3. Custodian cannot update an incident they're not assigned to
 *  4. Registrar cannot touch a tree outside their orgId
 */
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
  type RulesTestContext,
} from "@firebase/rules-unit-testing";
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

let testEnv: RulesTestEnvironment;

const RULES_PATH = path.resolve(__dirname, "../firestore.rules");

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId:  "demo-treelife",
    firestore:  {
      rules: fs.readFileSync(RULES_PATH, "utf8"),
      host:  "127.0.0.1",
      port:  8081,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ─────────────────────────────────────────────────────────────────
// Helpers — build authenticated contexts with custom claims
// ─────────────────────────────────────────────────────────────────
function citizenCtx() {
  return testEnv.unauthenticatedContext();
}

function registrarCtx(orgId: string) {
  return testEnv.authenticatedContext("registrar-uid-1", {
    role:  "registrar",
    orgId: orgId,
  });
}

function custodianCtx(custodianId: string) {
  return testEnv.authenticatedContext("custodian-uid-1", {
    role:        "custodian",
    custodianId: custodianId,
  });
}

function wardAdminCtx() {
  return testEnv.authenticatedContext("admin-uid-1", {
    role: "ward_admin",
  });
}

// ─────────────────────────────────────────────────────────────────
// Test 1: Tree creation fails without custodianId
// ─────────────────────────────────────────────────────────────────
describe("Tree creation — custodianId enforcement", () => {
  it("should SUCCEED when custodianId is present and orgId matches", async () => {
    const db = registrarCtx("org-green-mysuru").firestore();
    await assertSucceeds(
      db.collection("trees").doc("MYS-W14-XXXX").set({
        species:         "Neem",
        plantedDate:     new Date(),
        location:        { lat: 12.29, lng: 76.64, landmark: "Test road", ward: "Ward 14" },
        registrarOrgId:  "org-green-mysuru",
        custodianId:     "custodian-ravi-k",   // ✅ present
        status:          "HEALTHY",
        lastVerifiedAt:  new Date(),
        qrCodeUrl:       "",
        createdAt:       new Date(),
        updatedAt:       new Date(),
      })
    );
  });

  it("should FAIL when custodianId is null", async () => {
    const db = registrarCtx("org-green-mysuru").firestore();
    await assertFails(
      db.collection("trees").doc("MYS-W14-NULL").set({
        species:        "Neem",
        plantedDate:    new Date(),
        location:       { lat: 12.29, lng: 76.64, landmark: "Test road", ward: "Ward 14" },
        registrarOrgId: "org-green-mysuru",
        custodianId:    null,               // ❌ null
        status:         "HEALTHY",
        lastVerifiedAt: new Date(),
        qrCodeUrl:      "",
        createdAt:      new Date(),
        updatedAt:      new Date(),
      })
    );
  });

  it("should FAIL when custodianId is empty string", async () => {
    const db = registrarCtx("org-green-mysuru").firestore();
    await assertFails(
      db.collection("trees").doc("MYS-W14-EMPTY").set({
        species:        "Neem",
        plantedDate:    new Date(),
        location:       { lat: 12.29, lng: 76.64, landmark: "Test road", ward: "Ward 14" },
        registrarOrgId: "org-green-mysuru",
        custodianId:    "",                 // ❌ empty
        status:         "HEALTHY",
        lastVerifiedAt: new Date(),
        qrCodeUrl:      "",
        createdAt:      new Date(),
        updatedAt:      new Date(),
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// Test 2: Citizen cannot write mortality_records
// ─────────────────────────────────────────────────────────────────
describe("mortality_records — no client write path", () => {
  it("citizen: FAIL to create mortality_record", async () => {
    const db = citizenCtx().firestore();
    await assertFails(
      db.collection("mortality_records").doc("rec-1").set({
        treeId:      "MYS-W14-0247",
        causeTag:    "ENVIRONMENTAL",
        subCause:    "drought",
        confirmedBy: "anonymous",
        confirmedAt: new Date(),
      })
    );
  });

  it("custodian: FAIL to create mortality_record directly", async () => {
    const db = custodianCtx("custodian-ravi-k").firestore();
    await assertFails(
      db.collection("mortality_records").doc("rec-2").set({
        treeId:      "MYS-W14-0247",
        causeTag:    "HUMAN",
        subCause:    "vandalism",
        confirmedBy: "custodian-ravi-k",
        confirmedAt: new Date(),
      })
    );
  });

  it("registrar: FAIL to create mortality_record directly", async () => {
    const db = registrarCtx("org-green-mysuru").firestore();
    await assertFails(
      db.collection("mortality_records").doc("rec-3").set({
        treeId:      "MYS-W14-0247",
        causeTag:    "ENVIRONMENTAL",
        subCause:    "drought",
        confirmedBy: "registrar-uid-1",
        confirmedAt: new Date(),
      })
    );
  });

  it("ward_admin: FAIL to create mortality_record directly (must use Cloud Function)", async () => {
    const db = wardAdminCtx().firestore();
    await assertFails(
      db.collection("mortality_records").doc("rec-4").set({
        treeId:      "MYS-W14-0247",
        causeTag:    "UNKNOWN",
        subCause:    "unknown",
        confirmedBy: "admin-uid-1",
        confirmedAt: new Date(),
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// Test 3: Custodian cannot update an incident they're not assigned to
// ─────────────────────────────────────────────────────────────────
describe("Incident updates — assignment enforcement", () => {
  beforeEach(async () => {
    // Seed an incident assigned to custodian-ravi-k
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      const db = ctx.firestore();
      await db.collection("incidents").doc("incident-001").set({
        treeId:           "MYS-W14-0247",
        reportedAt:       new Date(),
        reportedVia:      "TAP",
        category:         "WATER",
        languageCode:     "en",
        status:           "PENDING",
        deadline:         new Date(Date.now() + 48 * 3600 * 1000),
        assignedTo:       "custodian-ravi-k",   // assigned to Ravi
        hasEvidence:      false,
        escalationHistory: [],
      });
    });
  });

  it("assigned custodian (ravi): SUCCEED to update their incident", async () => {
    const db = custodianCtx("custodian-ravi-k").firestore();
    await assertSucceeds(
      db.collection("incidents").doc("incident-001").update({
        status:      "RESOLVED",
        resolvedAt:  new Date(),
        hasEvidence: false,
      })
    );
  });

  it("different custodian (not-ravi): FAIL to update incident assigned to Ravi", async () => {
    const db = custodianCtx("custodian-not-ravi").firestore();
    await assertFails(
      db.collection("incidents").doc("incident-001").update({
        status:     "RESOLVED",
        resolvedAt: new Date(),
      })
    );
  });

  it("citizen: FAIL to update any incident", async () => {
    const db = citizenCtx().firestore();
    await assertFails(
      db.collection("incidents").doc("incident-001").update({
        status: "RESOLVED",
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// Test 4: Registrar cannot touch a tree outside their orgId
// ─────────────────────────────────────────────────────────────────
describe("Tree management — registrar orgId boundary", () => {
  beforeEach(async () => {
    // Seed trees for two orgs
    await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      const db = ctx.firestore();
      await db.collection("trees").doc("MYS-W14-ORG1").set({
        species:        "Neem",
        plantedDate:    new Date(),
        location:       { lat: 12.29, lng: 76.64, landmark: "Road A", ward: "Ward 14" },
        registrarOrgId: "org-green-mysuru",     // ← org 1
        custodianId:    "custodian-ravi-k",
        status:         "HEALTHY",
        lastVerifiedAt: new Date(),
        qrCodeUrl:      "",
        createdAt:      new Date(),
        updatedAt:      new Date(),
      });
      await db.collection("trees").doc("MYS-W07-ORG2").set({
        species:        "Peepal",
        plantedDate:    new Date(),
        location:       { lat: 12.31, lng: 76.67, landmark: "Road B", ward: "Ward 7" },
        registrarOrgId: "org-brindavan-school",  // ← org 2
        custodianId:    "custodian-priya-s",
        status:         "HEALTHY",
        lastVerifiedAt: new Date(),
        qrCodeUrl:      "",
        createdAt:      new Date(),
        updatedAt:      new Date(),
      });
    });
  });

  it("registrar of org1: SUCCEED to update their own tree", async () => {
    const db = registrarCtx("org-green-mysuru").firestore();
    await assertSucceeds(
      db.collection("trees").doc("MYS-W14-ORG1").update({
        lastVerifiedAt: new Date(),
        updatedAt:      new Date(),
      })
    );
  });

  it("registrar of org1: FAIL to update org2 tree", async () => {
    const db = registrarCtx("org-green-mysuru").firestore();
    await assertFails(
      db.collection("trees").doc("MYS-W07-ORG2").update({
        lastVerifiedAt: new Date(),
        updatedAt:      new Date(),
      })
    );
  });

  it("registrar of org1: FAIL to directly set tree status to DEAD", async () => {
    const db = registrarCtx("org-green-mysuru").firestore();
    await assertFails(
      db.collection("trees").doc("MYS-W14-ORG1").update({
        status:    "DEAD",    // ❌ must go through confirmMortality Cloud Function
        updatedAt: new Date(),
      })
    );
  });

  it("citizen: SUCCEED to read a single tree (QR landing page)", async () => {
    const db = citizenCtx().firestore();
    await assertSucceeds(
      db.collection("trees").doc("MYS-W14-ORG1").get()
    );
  });

  it("citizen: FAIL to list trees collection", async () => {
    const db = citizenCtx().firestore();
    await assertFails(
      db.collection("trees").get()
    );
  });
});
