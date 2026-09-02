import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp();

async function promote() {
  const email = "ballubalaram2003@gmail.com";
  try {
    const user = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(user.uid, { role: "ward_admin" });
    console.log(`Successfully made ${email} a ward_admin!`);
  } catch (error) {
    console.error("Error setting claim:", error);
  }
}

promote();
