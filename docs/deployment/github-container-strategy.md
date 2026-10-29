# GitHub-first LandBD build and hosting

**Scope:** staged container image build and release automation. This does not deploy, bill Cloudflare, change DNS, or affect Vercel.

## Platform responsibilities

- **GitHub repository/Actions:** versioned source, review, lint/test, Next.js Node Docker build, optionally publish a version-tagged image to GitHub Container Registry (GHCR) from the protected `main` branch after manual dispatch.
- **Cloudflare Workers + Containers:** future HTTP ingress and full Linux/Node server runtime. Cloudflare Containers requires Workers Paid; GitHub Actions does not make it free.
- **Vercel:** existing independent Next.js deployment and rollback fallback; do not disable Git import or delete projects.
- **Firebase:** Auth, Firestore, Firebase Admin remain authoritative.

## Before any production deployment

1. Review this PR and make sure the container build passes. `LANDBD_CONTAINER_BUILD=1` selects `next.config.ts` standalone output **only while building the container image**.
2. Set these repository **variables** (public Firebase browser config only): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`.
3. The Dockerfile must never contain `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, service-account JSON, or other runtime secrets. Configure them only as protected Cloudflare runtime secrets.
4. After merging, optionally run `LandBD Node container image (GitHub)` on `main` with `publish_image=true` to publish `ghcr.io/omarreact/landbd-app:sha-<commit>`. The normal PR workflow **never publishes**.
   - **GHCR is optional image storage, not a directly supported Cloudflare Containers pull source.** Cloudflare currently supports the managed Cloudflare registry, Docker Hub, Amazon ECR, and Google Artifact Registry for registry-referenced images. For an actual Cloudflare Container release, use GitHub Actions + Wrangler to build from `Dockerfile.landbd` and push to the Cloudflare-managed registry, or explicitly re-tag/push a reviewed image to that registry. Do not set `ghcr.io/...` directly as the `containers.image` field.
5. Enable Cloudflare Workers Paid only with owner's explicit approval. Configure the Cloudflare Container service and appropriate image deployment credentials. Deploy to staging first. Confirm login, Firebase Admin, protected APIs, maintenance policy, session cookies, PDF storage, and data integrity before moving production DNS.

## GitHub Pages and domains

GitHub Pages can serve **static-only** landing pages, documentation, or status sites on a custom domain under `pincodeit.com`. It cannot run this app's SSR, Next.js `proxy.ts`, Firebase Admin APIs, or a persistent Node process.

For a separate Pages site, add the custom hostname in that repository's **Settings → Pages** first, verify domain ownership, and then create a Cloudflare DNS CNAME from that hostname to `omarreact.github.io`. Never connect `landbd.pincodeit.com` to Pages. Avoid wildcard DNS. Keep the existing Vercel and Cloudflare production records untouched until migration signoff.

Official docs: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
