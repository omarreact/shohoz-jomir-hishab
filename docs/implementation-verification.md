# Implementation verification

Before merging this refactor:

- lint and TypeScript must pass
- land-record regression tests and full tests must pass
- production Next.js build must pass
- `/geospatial-map` must remain the only route without global Navbar/Footer
- RS/MS API/source configuration must remain unchanged
- live location watch must clean up on unmount
- all migrated result PDFs must use the shared A4 renderer and shared watermark
- `/admin/page-access` must remain Super Admin-only and cover the centralized route registry
