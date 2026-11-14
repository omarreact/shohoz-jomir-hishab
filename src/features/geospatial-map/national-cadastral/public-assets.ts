import {
  nationalCadastralCatalog,
  type NationalCadastralAsset,
  type NationalCadastralSurvey,
} from "./catalog";

export type PublicCadastralAsset = {
  id: string;
  survey: NationalCadastralSurvey;
  districtBbsCode: string;
  upazilaBbsCode?: string;
  mouza?: string;
  jlNumber?: string;
  sheet?: string;
  format: string;
  mimeType: string;
  sha256: string;
  size: number;
  url: string;
};

export function isPublicCadastralAsset(asset: NationalCadastralAsset): boolean {
  return (
    asset.stage === "published" &&
    asset.storageAuthorized === true &&
    asset.redistributionAllowed === true
  );
}

export function toPublicCadastralAsset(asset: NationalCadastralAsset): PublicCadastralAsset {
  return {
    id: asset.id,
    survey: asset.survey,
    districtBbsCode: asset.districtBbsCode,
    ...(asset.upazilaBbsCode ? { upazilaBbsCode: asset.upazilaBbsCode } : {}),
    ...(asset.mouza ? { mouza: asset.mouza } : {}),
    ...(asset.jlNumber ? { jlNumber: asset.jlNumber } : {}),
    ...(asset.sheet ? { sheet: asset.sheet } : {}),
    format: asset.format,
    mimeType: asset.mimeType,
    sha256: asset.sha256,
    size: asset.size,
    url: `/api/cadastral/assets/${encodeURIComponent(asset.id)}`,
  };
}

export function listPublicCadastralAssets(filters: {
  districtBbsCode?: string;
  survey?: NationalCadastralSurvey;
} = {}): PublicCadastralAsset[] {
  return nationalCadastralCatalog.assets
    .filter(isPublicCadastralAsset)
    .filter((asset) =>
      filters.districtBbsCode ? asset.districtBbsCode === filters.districtBbsCode : true
    )
    .filter((asset) => (filters.survey ? asset.survey === filters.survey : true))
    .map(toPublicCadastralAsset);
}

export function findPublicCadastralAsset(id: string): NationalCadastralAsset | null {
  const asset = nationalCadastralCatalog.assets.find((item) => item.id === id);
  return asset && isPublicCadastralAsset(asset) ? asset : null;
}
