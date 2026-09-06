import type { FullKhatian } from "../full-khatian";
import { SURVEY_KEY_BY_ID } from "../types";
import { fetchPublicKhatianTracking } from "./dlrms-public-extras";
import { getFullKhatian } from "./full-khatian-service";
import { providers } from "./provider";

/**
 * Resolve a printed DLRMS verification UUID into the public indexed khatian.
 * The tracking KHATIAN_ID is an application/tracking identifier and is not
 * assumed to be the same ID used by /public/index-khatian/{survey}/{id}.
 * Instead we use the verified survey + JL + khatian number to locate the
 * public index row, then build the unified FullKhatian response from that ID.
 */
export async function getFullKhatianByVerificationUuid(
  uuid: string,
  signal?: AbortSignal,
): Promise<FullKhatian> {
  const tracking = await fetchPublicKhatianTracking(uuid, undefined, signal);
  if (!tracking.surveyId) throw new Error("DLRMS verification did not return a survey ID");
  if (!tracking.khatianNo) throw new Error("DLRMS verification did not return a khatian number");
  if (!tracking.jlNumberId) throw new Error("DLRMS verification did not return a JL number ID");

  const surveyKey = SURVEY_KEY_BY_ID[tracking.surveyId];
  if (!surveyKey) throw new Error(`Unsupported DLRMS survey ID: ${tracking.surveyId}`);

  const page = await providers.landRecords.listKhatians({
    surveyKey,
    jlNumberId: tracking.jlNumberId,
    page: 1,
    pageSize: 100,
    khatianNo: tracking.khatianNo,
  }, signal);

  const exact = page.items.find((row) => row.KHATIAN_NO.trim() === tracking.khatianNo?.trim());
  if (!exact) {
    throw new Error("The verified khatian could not be resolved in the public DLRMS index");
  }

  return getFullKhatian({
    surveyKey,
    id: exact.ID,
    jlNumberId: tracking.jlNumberId,
    mouzaId: tracking.mouzaId,
    verificationUuid: uuid,
    tracking,
    divisionBbsCode: tracking.divisionBbsCode,
    districtBbsCode: tracking.districtBbsCode,
    upazilaBbsCode: tracking.upazilaBbsCode,
  }, signal);
}
