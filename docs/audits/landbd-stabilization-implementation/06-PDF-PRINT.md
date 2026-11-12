# 06 — PDF, Print, and Report Fidelity

## Preserved behavior

The stabilization work deliberately preserves existing DLRMS Khatian, Mouza Porcha, Warish and Warishsanad report behavior rather than redesigning it.

Existing automated coverage verifies:
- A4 page geometry and pagination;
- owner/guardian/dag visibility;
- duplicate owner rows;
- distinct land-class/area rows under the same dag number;
- total land as a dedicated row;
- report data completeness constraints;
- QR/report verification helpers;
- incomplete-source safeguards.

## Data integrity rules

The report path continues to follow the same source model as the screen:
- official data remains official;
- optional mirror data remains labeled non-official;
- guardian relationships are not invented;
- missing data is not filled from samples;
- total land is preserved from verified source aliases/reconstruction.

## Fonts

All root/route `next/font/google` dependencies were removed from the build path. The app now uses the repository's existing local Nikosh Bengali font asset plus system fallbacks, while Kalpurush/Nirmala remain explicit report fallbacks where already configured. This removes Cloudflare build-time dependency on Google Font network responses.

## Status

Automated PDF/report fidelity tests pass. Pixel-perfect browser print preview on the unmerged branch was not claimed because no branch deployment was authorized.
