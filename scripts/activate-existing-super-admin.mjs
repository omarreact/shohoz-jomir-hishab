#!/usr/bin/env node
/**
 * One-time, interactive recovery for an EXISTING Firebase Email/Password user.
 *
 * This script never runs in a request handler, CI, or deployment.
 * It requires the operator's Google Application Default Credentials and the
 * Firebase project's privileged IAM permissions. Firestore alone NEVER
 * authorizes a Super Admin: verified Firebase Auth custom claims do.
 *
 * Usage (from the repository root, in an interactive trusted terminal):
 *   node scripts/activate-existing-super-admin.mjs inspect --email=EMAIL --uid=UID
 *   node scripts/activate-existing-super-admin.mjs verification-link --email=EMAIL --uid=UID
 *   node scripts/activate-existing-super-admin.mjs activate --email=EMAIL --uid=UID
 */
import { readFile } from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "smart-khotiyan";
const ORIGINAL_OWNER_UID = "408LTqriBAPIMIe37pXPVehfPIe2";
const RECOVERY_TOOL = "existing-user-super-admin-recovery-v1";
const AUDIT_COLLECTION = "adminAuditLog";

function parseArgs(argv) {
  const [action, ...arguments_] = argv;
  const flags = {};
  for (const arg of arguments_) {
    const match = /^--(email|uid)=(.+)$/.exec(arg);
    if (!match || flags[match[1]]) {
      throw new Error("Use exactly --email=EMAIL and --uid=UID");
    }
    flags[match[1]] = match[2].trim();
  }
  const email = (flags.email || "").toLowerCase();
  const uid = flags.uid || "";
  if (!["inspect", "verification-link", "activate"].includes(action) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^[A-Za-z0-9_-]{10,128}$/.test(uid)) {
    throw new Error("Usage: node scripts/activate-existing-super-admin.mjs <inspect|verification-link|activate> --email=EMAIL --uid=UID");
  }
  if (uid === ORIGINAL_OWNER_UID) {
    throw new Error("Refusing to modify the original administrator account.");
  }
  return { action, email, uid };
}

async function assertTrustedTerminal() {
  if (!input.isTTY || !output.isTTY || process.env.CI ||
      process.env.VERCEL || process.env.GITHUB_ACTIONS) {
    throw new Error("Run in your own interactive terminal, never in CI or Vercel.");
  }
  for (const env of ["GOOGLE_CLOUD_PROJECT", "GCLOUD_PROJECT", "FIREBASE_PROJECT_ID"]) {
    if (process.env[env] && process.env[env] !== PROJECT_ID) {
      throw new Error(env + " does not match the expected Firebase project.");
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const file = JSON.parse(await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
    if (file.project_id && file.project_id !== PROJECT_ID) {
      throw new Error("Credential file belongs to a different project.");
    }
  }
}

async function confirm(action, email, uid) {
  const expected = `${action.toUpperCase()} ${email} ${uid} ${PROJECT_ID}`;
  const rl = createInterface({ input, output });
  try {
    const reply = await rl.question("Confirm this authorized operation.\nType exactly: " + expected + "\n> ");
    if (reply.trim() !== expected) {
      throw new Error("Confirmation did not match. No changes made.");
    }
  } finally {
    rl.close();
  }
}

async function audit(db, action, uid, email) {
  await db.collection(AUDIT_COLLECTION).add({
    actorId: "interactive-authorized-operator",
    actorEmail: null,
    actorRole: "offline-recovery",
    action: `auth.recovery.existing.${action}`,
    targetType: "user",
    targetId: uid,
    requestId: null,
    metadata: { email, tool: RECOVERY_TOOL },
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function main() {
  const { action, email, uid } = parseArgs(process.argv.slice(2));
  await assertTrustedTerminal();

  initializeApp({ projectId: PROJECT_ID, credential: applicationDefault() });
  const auth = getAuth();
  const db = getFirestore();
  const account = await auth.getUserByEmail(email);
  if (account.uid !== uid || account.email?.toLowerCase() !== email) {
    throw new Error("UID and email do not identify the same Firebase Authentication account.");
  }
  const profileRef = db.collection("users").doc(uid);
  const profile = await profileRef.get();
  if (!profile.exists) {
    throw new Error("Firestore users/{uid} is missing. Save the profile with the Auth UID first.");
  }
  const data = profile.data() || {};
  if (String(data.email || "").trim().toLowerCase() !== email) {
    throw new Error("Firestore users/{uid} email does not match Firebase Authentication.");
  }
  if (account.disabled || data.status !== "active") {
    throw new Error("Authentication or Firestore account is disabled/inactive.");
  }
  if (data.lockedUntil) {
    const lock = typeof data.lockedUntil.toDate === "function"
      ? data.lockedUntil.toDate() : new Date(data.lockedUntil);
    if (Number.isFinite(lock.getTime()) && lock.getTime() > Date.now()) {
      throw new Error("Account is currently locked.");
    }
  }

  const claims = account.customClaims || {};
  const alreadyElevated = claims.role === "Super Admin" && claims.admin === true;
  console.log("Project:", PROJECT_ID, "| Account UID:", uid);
  console.log("Email verified in Firebase Auth:", account.emailVerified);
  console.log("Existing signed Super Admin claims:", alreadyElevated);

  if (action === "inspect") {
    console.log("No changes made. An email-verified account can be activated.");
    return;
  }
  if (action === "verification-link") {
    if (account.emailVerified) {
      console.log("Already email verified; continue with activate.");
      return;
    }
    await confirm(action, email, uid);
    const url = await auth.generateEmailVerificationLink(email);
    console.log("PRIVATE one-time verification URL; open it only as the mailbox owner:");
    console.log(url);
    console.log("Never put this URL in GitHub, messages, screenshots, or logs.");
    return;
  }

  if (!account.emailVerified) {
    throw new Error("Email is not verified in Firebase Auth. Use verification-link first.");
  }
  if (alreadyElevated) {
    console.log("Already activated; sign out and back in to refresh the ID token.");
    return;
  }
  if (claims.admin === true || ["Admin", "Super Admin"].includes(claims.role)) {
    throw new Error("Inconsistent or pre-existing privileged claims; review manually.");
  }

  console.log("Original owner UID will not be changed.");
  await confirm(action, email, uid);
  const previousRole = data.role;
  const previousVerified = data.isVerified;
  const elevatedClaims = { ...claims, role: "Super Admin", admin: true };

  // Record the authorized request before issuing any elevation.
  await audit(db, "activate.requested", uid, email);
  await auth.setCustomUserClaims(uid, elevatedClaims);

  try {
    await profileRef.update({
      role: "Super Admin",
      isVerified: true,
      updatedAt: new Date().toISOString(),
    });
    await audit(db, "activate.completed", uid, email);
  } catch (error) {
    // Revert rather than leave an unaudited or partly configured elevation.
    try {
      await auth.setCustomUserClaims(uid, claims);
    } catch (rollbackError) {
      console.error("CRITICAL: unable to revert custom claims.", rollbackError?.code || "unknown");
    }
    try {
      await profileRef.update({
        role: previousRole === undefined ? "User" : previousRole,
        isVerified: previousVerified === true,
        updatedAt: new Date().toISOString(),
      });
    } catch (rollbackError) {
      console.error("CRITICAL: unable to restore profile.", rollbackError?.code || "unknown");
    }
    throw error;
  }
  console.log("SUCCESS: verified Firebase UID now has Super Admin custom claims.");
  console.log("Original administrator preserved. Sign out and sign back in.");
}

main().catch(error => {
  console.error("Stopped:", error?.code || error?.message || "Unknown error");
  process.exitCode = 1;
});
