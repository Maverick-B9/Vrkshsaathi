const { getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

if (!getApps().length) {
  initializeApp({ projectId: 'vrkshsaathi-cec57' });
}

async function runSeed() {
  const db = getFirestore();
  const auth = getAuth();

  const deleteCollection = async (collectionPath) => {
    const collectionRef = db.collection(collectionPath);
    try {
      const docs = await collectionRef.listDocuments();
      for (const doc of docs) {
        await doc.delete();
      }
      console.log(`Cleared ${collectionPath}`);
    } catch (err) {
      console.error(`Failed to clear ${collectionPath}`, err);
    }
  };

  const createAuthUser = async (uid, phone, claims) => {
    try {
      await auth.getUser(uid);
      await auth.deleteUser(uid);
    } catch (e) { }
    await auth.createUser({ uid, phoneNumber: phone });
    await auth.setCustomUserClaims(uid, claims);
    console.log(`Created auth user: ${uid}`);
  };

  console.log("Starting DB clear...");
  
  await deleteCollection('organizations');
  await deleteCollection('custodians');
  await deleteCollection('trees');
  await deleteCollection('incidents');
  await deleteCollection('checkpoints');
  await deleteCollection('mortality_records');
  await deleteCollection('insights');

  console.log("Seeding Auth Accounts & Orgs...");

  await createAuthUser("admin-1", "+919999999999", { role: "ward_admin" });

  const org1 = db.collection("organizations").doc("org-ngo");
  await org1.set({ name: "Green Earth NGO", ward: "Ward 42", createdAt: new Date().toISOString() });

  const org2 = db.collection("organizations").doc("org-school");
  await org2.set({ name: "City School District", ward: "Ward 17", createdAt: new Date().toISOString() });

  await createAuthUser("reg-ngo", "+918888888888", { role: "registrar", orgId: "org-ngo" });
  await createAuthUser("reg-school", "+917777777777", { role: "registrar", orgId: "org-school" });

  const custodians = [
    { id: "cust-1", phone: "+916666666661", name: "Ravi K.", orgId: "org-ngo" },
    { id: "cust-2", phone: "+916666666662", name: "Sunita M.", orgId: "org-ngo" },
    { id: "cust-3", phone: "+916666666663", name: "Priya S.", orgId: "org-school" },
    { id: "cust-4", phone: "+916666666664", name: "Amit B. (Struggling)", orgId: "org-ngo" },
    { id: "cust-5", phone: "+916666666665", name: "Kiran R. (Struggling)", orgId: "org-school" },
    { id: "cust-6", phone: "+919449114920", name: "Aarav Sharma", orgId: "org-ngo" },
  ];

  for (const c of custodians) {
    const uid = `uid-${c.id}`;
    await createAuthUser(uid, c.phone, { role: "custodian", orgId: c.orgId, custodianId: c.id });
    
    await db.collection("custodians").doc(c.id).set({
      name: c.name,
      phone: c.phone,
      orgId: c.orgId,
      authUid: uid,
      stats: { assigned: 0, survivalRate: 0, avgResponseHours: 0 }
    });
  }

  console.log("Seeding Demo Tree (MYS-W14-0247)...");
  const demoTreeId = "MYS-W14-0247";
  const plantedTime = Date.now() - 180 * 24 * 60 * 60 * 1000;
  
  await db.collection("trees").doc(demoTreeId).set({
    species: "Neem (Azadirachta indica)", ward: "Ward 14", location: { lat: 12.2958, lng: 76.6394 },
    registrarOrgId: "org-ngo", custodianId: "cust-1", status: "HEALTHY",
    plantedDate: new Date(plantedTime).toISOString(), createdAt: new Date(plantedTime).toISOString(),
    viabilityScore: 85,
  });

  const chk1Time = plantedTime + 30 * 24 * 60 * 60 * 1000;
  await db.collection("checkpoints").doc(`chk-1-${demoTreeId}`).set({
    treeId: demoTreeId, name: "Month 1 Survival", status: "COMPLETED",
    dueDate: new Date(chk1Time).toISOString(), completedAt: new Date(chk1Time + 24 * 60 * 60 * 1000).toISOString(), notes: "Tree is establishing well."
  });

  const demoIncId = `inc-grazing-${demoTreeId}`;
  const incTime = plantedTime + 120 * 24 * 60 * 60 * 1000;
  await db.collection("incidents").doc(demoIncId).set({
    treeId: demoTreeId, category: "GRAZING_DAMAGE", severity: "MEDIUM", status: "RESOLVED",
    createdAt: new Date(incTime).toISOString(), resolvedAt: new Date(incTime + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: "cust-1", custodianName: "Ravi K.", orgId: "org-ngo", resolutionNotes: "Installed bamboo tree guard.", aiHealthSignal: "Visible bite marks on lower leaves"
  });

  const chk2Time = plantedTime + 180 * 24 * 60 * 60 * 1000;
  await db.collection("checkpoints").doc(`chk-2-${demoTreeId}`).set({
    treeId: demoTreeId, name: "Month 6 Survival", status: "PENDING", dueDate: new Date(chk2Time).toISOString(),
  });

  console.log("Seeding other generic trees...");
  const genericPlantedTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  for (let i = 1; i <= 29; i++) {
    const isDead = i <= 2;
    let custodianId = i <= 15 ? "cust-4" : "cust-5";
    if (i === 14 || i === 15) custodianId = "cust-6";
    const orgId = i <= 15 ? "org-ngo" : "org-school";
    
    await db.collection("trees").doc(`tree-${i}`).set({
      species: i % 2 === 0 ? "Banyan (Ficus benghalensis)" : "Peepal (Ficus religiosa)",
      ward: i % 2 === 0 ? "Ward 42" : "Ward 17", location: { lat: 12.3 + (i * 0.001), lng: 76.6 + (i * 0.001) },
      registrarOrgId: orgId, custodianId: custodianId, status: isDead ? "DEAD" : "HEALTHY",
      plantedDate: genericPlantedTime, createdAt: genericPlantedTime, viabilityScore: 70 + (i % 20),
    });

    if (isDead) {
      const cause = i === 1 ? "DROUGHT" : "VANDALISM";
      await db.collection("mortality_records").doc(`mort-${i}`).set({
        treeId: `tree-${i}`, causeTag: cause, notes: `Tree died due to ${cause.toLowerCase()}`, recordedBy: custodianId, createdAt: new Date().toISOString()
      });
    }
  }

  console.log("Seeding Escalated & Pending Incidents...");
  for (let i = 1; i <= 2; i++) {
    const custId = i === 1 ? "cust-4" : "cust-5";
    const orgId = i === 1 ? "org-ngo" : "org-school";
    await db.collection("incidents").doc(`esc-inc-${i}`).set({
      treeId: `tree-${i + 10}`, category: "WATER_NEEDED", severity: "HIGH", status: "ESCALATED", 
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), assignedTo: "ward_admin",
      custodianName: custId, orgId: orgId, aiHealthSignal: "Signs of severe wilting",
      escalationHistory: [
        { tier: "CUSTODIAN", deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { tier: "REGISTRAR", deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
      ]
    });
  }

  console.log("Seeding AI Insights...");
  await db.collection("insights").doc("week-42").set({
    createdAt: new Date().toISOString(),
    insights: [
      { id: "ins-drought", title: "Mortality Cluster Detected", description: "A 15% spike in DROUGHT-related mortality was detected in Ward 42.", type: "MORTALITY_CLUSTER", severity: "HIGH" },
      { id: "ins-steward", title: "Stewardship Bottleneck", description: "Custodian response times for WATER_NEEDED incidents degraded.", type: "RESPONSE_TIME", severity: "MEDIUM" }
    ]
  });

  console.log("Seeding complete!");
}

module.exports = runSeed;
