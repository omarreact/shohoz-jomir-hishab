/**
 * LandBD exclusive administrator:
 * Verified Firebase GitHub OAuth identity 91119648 (@omarreact).
 *
 * This is deliberately independent of Firestore user profile, display name,
 * email, existing Firebase custom claims, and any username supplied by clients.
 * Must be called ONLY with cryptographically verified Firebase ID-token claims.
 */
export const SOLE_ADMIN_GITHUB_ID = "91119648";
export const SOLE_ADMIN_GITHUB_LOGIN = "omarreact";

export function isSoleAdminFirebaseIdentity(claims:Record<string,unknown>):boolean {
  const firebase=claims.firebase;
  if(!firebase||typeof firebase!=="object"||Array.isArray(firebase))return false;
  const info=firebase as Record<string,unknown>;
  if(info.sign_in_provider!=="github.com")return false;
  const identities=info.identities;
  if(!identities||typeof identities!=="object"||Array.isArray(identities))return false;
  const ids=(identities as Record<string,unknown>)["github.com"];
  return Array.isArray(ids)&&ids.some(id=>id===SOLE_ADMIN_GITHUB_ID||id===91119648);
}

export function soleAdminRoleFromClaims(claims:Record<string,unknown>):"Super Admin"|"User" {
  return isSoleAdminFirebaseIdentity(claims)?"Super Admin":"User";
}
