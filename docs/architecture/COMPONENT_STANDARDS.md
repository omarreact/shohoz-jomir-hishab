# LandBD feature-based module conventions

The owner requires **reusable, comprehensible architecture** for every Next.js, React, JavaScript, TypeScript, and Node.js change. Follow [AGENTS.md](../../AGENTS.md) for mandatory platform constraints (Firebase Auth + Firestore remain authoritative).

## Where logic belongs

```text
app/(public)/feature/page.tsx        # compose page; no business algorithms
src/features/feature/
  components/                       # focused, accessible presentational pieces
  hooks/                            # UI state and user interactions
  lib/                              # pure parsing, formatting, calculations
  server/                           # Firebase Admin, upstream adapters, auth
  schemas/                          # Zod request and response validation
  types.ts                          # shared domain types
  *.test.ts(x)                      # edge-case and regression tests
src/shared/                          # only genuinely cross-feature primitives
```

Use a flatter structure where simpler, without sacrificing separation of concerns.

## Rendering and report/PDF standards

- **Do not mix** 1000-line CSS, record parsing, pagination, API fetching, and JSX in one component.
- A report component should compose a brand header, report-specific table, verification/disclaimer block, and footer. CSS belongs in a named stylesheet.
- Preserve legal/source record strings exactly. Do not silently change or guess owner names, plot identifiers, land shares, or areas.
- Use existing site Bengali fonts, no third-party font request at export time. Tables must accommodate multi-line Bangla text, and screenshots alone cannot prove content quality.
- Prefer DOM/native selectable text for long term PDF design; current image-based exports require explicit QA until replaced.
- Test empty, long, multiline, missing, paginated, landscape/portrait, and multi-page documents. Avoid fake empty columns and clipped rows.
- Keep the document's official/non-official verification status accurate; a QR link is not proof of official government certification.

## Pull-request checks

- [ ] All new UI/business/data access pieces have one clear responsibility.
- [ ] Shared functionality is reused, not duplicated.
- [ ] Client/server split and security constraints are preserved.
- [ ] Tests cover edited logic and representative user-visible outputs.
- [ ] Lint, typecheck, unit tests, production build pass.
- [ ] Screens and PDFs are visually reviewed for mobile, A4 and dataset edge cases.
- [ ] Rollout/deployment only after independent release QA approval.

## Mouza Porcha report modularization

- `MouzaPorchaDocument.tsx` — orchestrates report data and page composition
- `components/mouza-report/ReportHeader.tsx` — repeated page header
- `components/mouza-report/ReportTable.tsx` — table columns, owners, dags and history
- `components/mouza-report/LegalDisclaimer.tsx` — source-use limitations
- `components/mouza-report/report-document.css` — all print and on-screen report styles
- `reports/mouza-porcha-report.ts` — pure report rows and pagination
- `ReportTable.test.tsx` — data rendering and dynamic-column behavior

The refactor deliberately preserves HTML structure and CSS rules to reduce regression risk. Further report improvements should target smaller independent modules.
