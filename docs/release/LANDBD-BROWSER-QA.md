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


## Local policy mode
The runner starts the temporary localhost server with `LANDBD_PUBLIC_ACCESS=true`. This is the application's existing public-access override and is scoped only to the ephemeral GitHub Actions process. It is required because CI intentionally has no production Firebase Admin credentials, which otherwise makes the fail-closed policy display maintenance mode. Production/staging environment settings are not modified.


The local QA server raises `PROXY_RATE_LIMIT_MAX` to 10000 only for the ephemeral runner because route smoke + Chromium together deliberately generate many requests from the single localhost IP. Production rate-limit settings are not changed.
