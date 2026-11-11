# LandBD clean header + local archive result UI

Branch: feat/clean-header-archive-results-20261111
Scope: public site chrome, /dlrms-khatian result rendering, /mouza-porcha-report result document.

## Source evidence

The user's LandBD.zip was inspected directly. It contains:
- src/shared/components/Navbar.tsx (old site navigation)
- src/features/land-records/components/AuthoritativeKhatianDetailsView.tsx (original official-style long table)
- src/features/land-records/components/KhatianDetailsView.tsx
- src/features/land-records/components/MouzaPorchaDocument.tsx (separate A4 cover/page sequence)
- src/features/land-records/components/MouzaPorchaReportBuilder.tsx (embedded PDF preview)

The current main branch had a separate desktop/mobile shell and a right-side sidebar plus bottom tabs. The two report components had subsequently been refactored. The new patch restores the distinctive document presentation while using the current, source-safe data model and PDF actions.

## Changes

- Unified header for public pages at all viewport widths, with grouped links in sticky top navigation, hover/focus/click desktop dropdowns, inline full-width mobile accordions, search (Ctrl+K), safe CMS link grouping and authenticated account/admin controls.
- Removed off-canvas sidebar and duplicate mobile bottom tabbar from public site; kept all original destination routes via NAV_SECTIONS. Removed redundant floating History button (History remains in Records submenu).
- Added scoped, low-noise light visual styles under .landbd-clean-shell; GIS immersive and admin layouts are independent.
- Restored the local archive's official-style DLRMS result sheet: title centered, original source metadata, one table with owners, source-linked guardians, owner shares and dag data, QR, ribbon, explicit partial information, orientation-specific widths. No names or guardian relationships are fabricated.
- Restored the local archive's standalone A4 Mouza Porcha cover sheet with location grid, report ID, QR, collection completeness notes, followed by numbered table pages.
- Existing report search/request flow, government API boundaries, authentication, Firestore, payment gating, PDF preview/download, manual print, orientation selection, ReportTable, and Hal/Sabek mapping logic are unchanged.

## Safety and constraints

No merge, production deployment, DNS changes, Firebase writes or credentials updates.
The source ZIP includes dotenv files. No secrets or any ZIP file bytes are committed.
Both reports continue to warn that the output is informational rather than government-certified. Existing current buildFullKhatianDisplayModel prevents duplicate-owner/guardian joins from being guessed. The archive visual styling is restored without reverting recent source validation and PDF safety patches.

## QA checklist (before merge)

Automated:
1. npm run typecheck
2. npm run lint
3. npm test -- --runTestsByPath src/features/land-records/components/ArchiveKhatianResult.test.tsx src/features/land-records/components/MouzaPorchaDocument.test.tsx src/features/land-records/lib/full-khatian-display.test.ts src/features/land-records/reports/mouza-porcha-report.test.ts src/shared/config/navigation.test.ts
4. npm run build

Manual staging, authenticated and anonymous:
- Verify header groups and all original destinations at 1440, 1280, 1024, 768, 390 and 360 px.
- Desktop dropdown hover, keyboard focus/click, Escape, outside click, and tab focus.
- Mobile header menu accordion click, nested route change and mobile keyboard input; confirm no right-side drawer or bottom nav.
- Staff/admin-only map QA link is hidden from anonymous and regular members; the server still enforces authorization.
- Ctrl+K command search and account login/logout links.
- DLRMS: BRS/SA landscape, RS/CS portrait; owner duplicates and full guardian/dag data; partial source warnings; PDF preview/download and printed tables.
- Mouza report: cover page plus source table pages; QR, report ID, latest row count, partial collection warning and mapped/unmapped Hal/Sabek; pdf preview/download and printed A4 orientation.
- Review landscape/portrait print pagination, QR images and Bangla typography.
- Confirm other public routes and all admin, login, map and Warish pages remain unchanged.
- Check actual data against government sources; a healthy build does not verify DLRMS data or legal correctness.

Automatic branch previews may be triggered by GitHub integrations. Do not promote or merge without approval.
