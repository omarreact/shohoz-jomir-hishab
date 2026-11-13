# Interactive browser QA

The single LandBD release PR runs Chromium against a locally started production build so browser QA does not depend on a Vercel preview URL.

Covered viewports:
- 390 × 844 mobile
- 768 × 1024 tablet
- 1024 × 768 desktop
- 1440 × 900 desktop

Covered behaviors:
- Mobile-only sidebar and Escape close behavior
- Tablet/desktop horizontal navigation and dropdown activation
- GIS workspace open/close behavior on mobile
- GIS toolbar suppression while the mobile workspace is open
- Desktop GIS panel/toolbox non-overlap geometry
- Four GIS workspace tabs
- Local runtime checks for retained canonical pages and retired public routes

The workflow is read-only and starts only a local Next.js server on the GitHub runner. It does not deploy, mutate production, write Firestore data, or use privileged user credentials.
