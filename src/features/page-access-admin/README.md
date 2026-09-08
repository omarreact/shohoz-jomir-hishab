# Page access admin

- `usePageAccessManager.ts`: authentication, loading, filtering, dirty-state and persistence.
- `PageAccessHeader.tsx`: page metadata and audit summary.
- `PageAccessSummary.tsx`: access-level counts and quick filters.
- `PageAccessControls.tsx`: search, category/access filters and bulk updates.
- `PageAccessList.tsx`: independent route permission rows.
- `PageAccessSaveBar.tsx`: discard/save workflow.

The route registry and validation remain centralized in `src/shared/config/pageAccess.ts`.
