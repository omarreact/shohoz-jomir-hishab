#!/usr/bin/env node
/**
 * One-time LOCAL Firebase Super Admin account recovery.
 *
 * Usage:
 *   node scripts/bootstrap-super-admin.mjs prepare --email=you@example.com --name="Name"
 *   node scripts/bootstrap-super-admin.mjs verification-link --email=you@example.com
 *   node scripts/bootstrap-super-admin.mjs activate --email=you@example.com
 *
 * Never run as a hosted route, API, CI job, or Vercel build step.
 * Uses only the operator's authenticated Google Application Default Credentials.
 */
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "smart-khotiyan";
const EXISTING_OWNER_UID = "408LTqriBAPIMIe37pXPVehfPIe2";
const AUDIT_COLLECTION = "adminAuditLog";
const PREPARED_MARKER = "local-verified-email-recovery-v1";

function parseArgs(argv) {
  const [action, ...rest] = argv;
  const flags = {};
  for (const arg of rest) {
    const match = /^--([a-z-]+)=(.*)$/.exec(arg);
    if (!match) throw new Error("Use only --email=... and --name=...");
    if (match[1] !== "email" && match[1] !== "name") {
      throw new Error("Unknown option: --" + match[1]);
    }
    flags[match[1]] = match[2];
  }
  return { action, email: (flags.email || "").trim().toLowerCase(), name: (flags.name || "").trim() };
}

async function assertOperatorEnvironment() {
  if (!input.isTTY || !output.isTTY || process.env.CI ||
      process.env.VERCEL || process.env.GITHUB_ACTIONS) {
    throw new Error("Run interactively in your own trusted terminal, never in CI/Vercel.");
  }
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath) {
    const credentials = JSON.parse(await readFile(credsPath, "utf8"));
    if (credentials.project_id && credentials.project_id !== PROJECT_ID) {
      throw new Error("Credential belongs to a different Firebase project. Aborting.");
    }
  }
  for (const envName of ["GOOGLE_CLOUD_PROJECT", "GCLOUD_PROJECT", "FIREBASE_PROJECT_ID"]) {
    if (process.env[envName] && process.env[envName] !== PROJECT_ID) {
      throw new Error(envName + " disagrees with " + PROJECT_ID + ". Aborting.");
    }
  }
}

async function confirm(prompt, expected) {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(prompt + "\nType exactly " + expected + " to proceed: ");
    if (answer.trim() !== expected) throw new Error("Confirmation did not match. No changes made.");
  } finally {
    rl.close();
  }
}

function isMissingUser(error) {
  return error && error.code === "auth/user-not-found";
}

async function audit(db, action, uid, email) {
  await db.collection(AUDIT_COLLECTION).add({
    actorId: "local-bootstrap-operator",
    actorEmail: null,
    actorRole: "offline-recovery",
    action,
    targetType: "user",
    targetId: uid,
    requestId: null,
    metadata: { email, tool: PREPARED_MARKER },
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function main() {
  const { action, email, name } = parseArgs(process.argv.slice(2));
  if (!["prepare", "verification-link", "activate"].includes(action) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: node scripts/bootstrap-super-admin.mjs <prepare|verification-link|activate> --email=you@example.com [--name=\"Name\"]");
  }
  if (name.length > 100) throw new Error("Name is too long.");
  await assertOperatorEnvironment();

  console.log("Target Firebase project: " + PROJECT_ID);
  console.log("Recovery account: " + email);
  console.log("Existing administrator: preserved, no changes.");
  const confirmText = action.toUpperCase() + " " + email + " " + PROJECT_ID;
  await confirm("One-time offline recovery operation.", confirmText);

  initializeApp({ projectId: PROJECT_ID, credential: applicationDefault() });
  const auth = getAuth();
  const db = getFirestore();

  if (action === "prepare") {
    let exists;
    try {
      exists = await auth.getUserByEmail(email);
    } catch (error) {
      if (!isMissingUser(error)) throw error;
    }
    if (exists) {
      throw new Error("Account already exists; no changes made. Use a NEW recovery email.");
    }

    // A randomly generated, unrevealed password prevents login until the
    // mailbox owner establishes a password with LandBD's Forgot Password form.
    const record = await auth.createUser({
      email,
      emailVerified: false,
      ...(name ? { displayName: name } : {}),
      password: randomBytes(48).toString("base64url"),
      disabled: false,
    });

    try {
      const now = new Date().toISOString();
      await db.collection("users").doc(record.uid).create({
        email, name: name || null, role: "Basic User",
        status: "active", isVerified: false, lockedUntil: null,
        failedAttempts: 0, lastLogin: null,
        recoveryBootstrapMarker: PREPARED_MARKER,
        createdAt: now, updatedAt: now,
      });
      await audit(db, "auth.bootstrap.prepare", record.uid, email);
    } catch (error) {
      // Only a user freshly created by this invocation may be rolled back.
      await auth.deleteUser(record.uid).catch(() => undefined);
      throw error;
    }

    console.log("Created unprivileged Firebase account. UID: " + record.uid);
    console.log("No Super Admin claim has been issued.");
    console.log("Next: use verification-link, verify the mailbox, then activate.");
    console.log("Set a password via https://landbd.pincodeit.com/login -> Forgot Password.");
    return;
  }

  const account = await auth.getUserByEmail(email);
  if (account.uid === EXISTING_OWNER_UID) {
    throw new Error("Cannot operate on the original administrator account.");
  }
  const profileRef = db.collection("users").doc(account.uid);
  const profile = await profileRef.get();
  if (!profile.exists || profile.data()?.recoveryBootstrapMarker !== PREPARED_MARKER) {
    throw new Error("Account was not prepared by this recovery tool; refusing to elevate.");
  }
  if (account.disabled || profile.data()?.status !== "active") {
    throw new Error("Recovery account is disabled or not active.");
  }

  if (action === "verification-link") {
    if (account.emailVerified) {
      console.log("Email is already verified. Run activate.");
      return;
    }
    const url = await auth.generateEmailVerificationLink(email);
    // This one-time URL is a secret. Never print it in CI or paste into chat.
    console.log("\nONE-TIME PRIVATE VERIFICATION LINK (keep secret):\n" + url);
    console.log("\nDeliver ONLY to the account mailbox owner; do not publish it.");
    return;
  }

  if (!account.emailVerified) {
    throw new Error("Email is not verified. Run verification-link and complete verification first.");
  }
  const currentClaims = account.customClaims || {};
  if (currentClaims.role === "Super Admin" && currentClaims.admin === true) {
    console.log("This recovery account already has verified Super Admin claims.");
    return;
  }
  if (currentClaims.admin === true || currentClaims.role === "Admin") {
    throw new Error("Existing privileged claim found. Refusing to overwrite.");
  }

  // Audit the authorized intention before issuing any elevation.
  await audit(db, "auth.bootstrap.activate.requested", account.uid, email);
  const updatedClaims = { ...currentClaims, role: "Super Admin", admin: true };
  await auth.setCustomUserClaims(account.uid, updatedClaims);
  try {
    await profileRef.update({
      role: "Super Admin",
      isVerified: true,
      recoveryBootstrapActivatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await audit(db, "auth.bootstrap.activate.completed", account.uid, email);
  } catch (error) {
    // If the Firestore profile or audit update fails, attempt to remove the
    // elevation. Surface errors for manual review rather than claiming success.
    try {
      await auth.setCustomUserClaims(account.uid, currentClaims);
    } catch (rollbackError) {
      console.error("CRITICAL: claim rollback failed; revoke manually.", rollbackError?.code || "unknown");
    }
    throw error;
  }

  console.log("Super Admin custom claims granted to verified UID: " + account.uid);
  console.log("Original Super Admin account was not modified.");
  console.log("Sign in again with the new account to get a refreshed ID token.");
}

main().catch(error => {
  console.error("Recovery stopped:", error?.code || error?.message || "Unknown error");
  process.exitCode = 1;
});
