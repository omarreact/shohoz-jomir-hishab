# 01 — Baseline, Source of Truth, and Scope

## Source of truth

GitHub repository `omarreact/shohoz-jomir-hishab` is the implementation source of truth.

The stabilization branch was created from:
- base SHA `de70cf0db299598db20f708bcd90cf1da8337bca`
- production repository state after PR #163 and owner-approved Vercel auto-deploy configuration.

The older local ZIP/audit was used as a defect inventory only. Newer GitHub routing, API security, DLRMS recovery, owner-row, dag-row, total-land, and deployment changes were preserved.

## Safety boundaries

No branch work:
- changed production secrets;
- printed or committed `.env` values;
- modified DNS;
- wrote Firebase/Firestore production data;
- changed users or authentication records;
- replayed citizen DLRMS credentials or payment requests;
- merged PR #164;
- deployed PR #164.

Tracked-secret review found only `.env.example` among environment-like repository paths; `.gitignore` excludes `.env*`, service-account JSON, credentials directories, HAR/PCAP captures, and local databases.

## Runtime baseline

- Node target: 22.x.
- Next.js: 16.3.8.
- React: 19.2.3.
- Build command: `next build --webpack`.
- Cloudflare compatibility: `opennextjs-cloudflare build`.

## Scope resolution

Items already correctly implemented on current main were verified and preserved rather than duplicated. Items still mismatched with the audit were changed with the smallest compatible patch and covered by tests where practical.
