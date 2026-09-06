import type { KhatianDetails } from "../types";
import type { FullKhatianDag, FullKhatianOwner, LisfEnrichment } from "../full-khatian";

export interface LisfProvider {
  enrichKhatian(base: KhatianDetails, signal?: AbortSignal): Promise<LisfEnrichment>;
}

function splitList(value: string): string[] {
  return value
    .split(/[,،;]+/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\.{3,}$/.test(part));
}

const disabledProvider: LisfProvider = {
  async enrichKhatian() {
    return {
      status: "disabled",
      message: "LISF authorized enrichment is disabled. Public DLRMS data remains available.",
      owners: [],
      dags: [],
      referenceKhatians: [],
      referenceDags: [],
      deeds: [],
    };
  },
};

/**
 * Development-only adapter. It mirrors the shape of LISF enrichment without
 * inventing legal shares, addresses, land classes, tax or deed information.
 * Every value is marked LISF_MOCK so it can never be mistaken for an official
 * government response.
 */
const mockProvider: LisfProvider = {
  async enrichKhatian(base) {
    const owners: FullKhatianOwner[] = splitList(base.OWNERS).map((name) => ({
      name,
      source: "LISF_MOCK",
    }));
    const dags: FullKhatianDag[] = splitList(base.DAGS).map((dagNo) => ({
      dagNo,
      source: "LISF_MOCK",
    }));
    return {
      status: "mock",
      message: "Development mock only; no private LISF request was made.",
      owners,
      dags,
      referenceKhatians: [],
      referenceDags: [],
      deeds: [],
    };
  },
};

/**
 * Live LISF access is intentionally fail-closed until LandBD has registered
 * credentials AND the current authority-issued signing contract is confirmed.
 * Older public integration examples are not consistent enough to safely guess
 * an HMAC canonical string/header contract. Private credentials must remain
 * server-only and must never be exposed through NEXT_PUBLIC_* variables.
 */
const authorizedProvider: LisfProvider = {
  async enrichKhatian() {
    const hasServiceId = Boolean(process.env.LISF_SERVICE_ID?.trim());
    const hasAccessCode = Boolean(process.env.LISF_ACCESS_CODE?.trim());
    const hasSigningSecret = Boolean(process.env.LISF_SIGNING_SECRET?.trim());

    if (!hasServiceId || !hasAccessCode) {
      return {
        status: "not-configured",
        message: "Authorized LISF credentials are not configured on the LandBD server.",
        owners: [],
        dags: [],
        referenceKhatians: [],
        referenceDags: [],
        deeds: [],
      };
    }

    return {
      status: "not-configured",
      message: hasSigningSecret
        ? "LISF credentials are present, but the authority-issued signing contract must be confirmed before live private requests are enabled."
        : "LISF service credentials are present, but an authorized signing secret/contract is not configured.",
      owners: [],
      dags: [],
      referenceKhatians: [],
      referenceDags: [],
      deeds: [],
    };
  },
};

export function getLisfProvider(): LisfProvider {
  if (process.env.LISF_ENABLED?.trim() !== "1") return disabledProvider;
  if (process.env.LISF_PROVIDER?.trim().toLowerCase() === "mock") return mockProvider;
  return authorizedProvider;
}
