const admin = require("firebase-admin");
const serviceAccount = require("../vrkshsaathi-cec57-firebase-adminsdk-h18er-881c03bf47.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const users = [
  {
    email: "registar_greenearth@gmail.com",
    password: "123456",
    role: "registrar",
    orgId: "org-1"
  },
  {
    email: "custdian_ravi@gmail.com",
    password: "123456",
    role: "custodian",
    orgId: "org-1",
    custodianId: "cust-1"
  },
  {
    email: "ward_admin_ram_14@gmail.com",
    password: "123456",
    role: "ward_admin",
    orgId: "org-1"
  }
];

async function createUsers() {
  for (const u of users) {
    try {
      try {
        const existing = await admin.auth().getUserByEmail(u.email);
        await admin.auth().deleteUser(existing.uid);
      } catch (e) {
        // User might not exist
      }

      const userRecord = await admin.auth().createUser({
        email: u.email,
        password: u.password,
      });

      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: u.role,
        orgId: u.orgId,
        ...(u.custodianId ? { custodianId: u.custodianId } : {})
      });
      console.log("Created", u.email, "with role", u.role);
    } catch (e) {
      console.error("Error creating", u.email, e);
    }
  }
  process.exit(0);
}

createUsers();
