# VrkshSaathi 🌱

VrkshSaathi converts one-day plantation drives into accountable, community-supported three-year survival programmes. Every planted tree has an accountable custodian, transparent lifecycle tracking, and proactive intervention protocols.

## Key Features

- **Public Citizen Portal (Scan to Save)**: Any citizen can scan a tree's physical QR code to view its life record (planting date, viability score, health history) and report incidents (water shortage, grazing risk, etc.) using simple forms or vernacular voice notes.
- **AI-Powered Insights**:
  - **Voice Notes**: Citizens can report issues using voice notes in their native languages. Google Gemini transcribes and categorizes these automatically.
  - **Photo Analysis**: Uploaded photos of incidents are analyzed by Gemini Vision to detect early signs of wilting, pest damage, or physical trauma.
- **Hierarchical Accountability System**:
  - **Custodians**: Frontline caretakers assigned to specific trees. They receive alerts and deadlines for resolving incidents.
  - **Registrars (NGOs/Orgs)**: Oversee custodians and tree registrations in their assigned zones.
  - **Ward Admins**: Municipal officers who handle escalated issues that NGOs/Custodians fail to resolve within SLAs.
  - **Super Admins**: Platform administrators who manage roles, invite ward admins, and oversee the entire system.
- **Strict Data Invariants**: A tree's status can only transition to "DEAD" after strict verification through a Cloud Function, ensuring no self-serving manipulation of survival metrics.
- **Automated Escalations**: Cloud Functions run hourly to automatically escalate unresolved incidents from Custodians to Registrars, and eventually to Ward Admins if SLAs are breached.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Firebase Firestore, Firebase Authentication, Cloud Functions (Node.js)
- **AI Integrations**: Google Gemini (1.5 Flash) for multimodal processing (Voice to Text, Image Analysis, Pattern Recognition).
- **Offline Capability**: IndexedDB integration for offline queuing (ensuring field workers can update data without internet).

## Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase CLI installed globally (`npm i -g firebase-tools`)

### Setup
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd vrkshsaathi
   ```
2. Install dependencies:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```
3. Create a `.env.local` file with your Firebase configuration and Gemini API Key:
   ```env
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   ...
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Deploying to Firebase
1. Login to Firebase:
   ```bash
   firebase login
   ```
2. Deploy Firestore Rules and Indexes:
   ```bash
   firebase deploy --only firestore
   ```
3. Deploy Cloud Functions:
   ```bash
   firebase deploy --only functions
   ```
4. Build and Deploy Web App:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Roles & Access
Access is governed by Firebase Custom Claims (`role`, `orgId`, `custodianId`).
- `super_admin`: Full system access, can assign roles.
- `ward_admin`: Can manage organizations and handle top-tier escalations.
- `registrar`: Can register trees and invite custodians.
- `custodian`: Can update checkpoints and resolve incidents for assigned trees.
- `Citizen (Unauthenticated)`: Can view public QR landing pages and submit incidents.

---
*Built to ensure every planted sapling survives to become a tree.*
