# 03 — Routing and API Security

## Route registry

The existing centralized route registry was verified and preserved.

Canonical/legacy behavior includes:
- `/khatian` -> `/khatiyan`
- `/survey-khatian` -> `/dlrms-khatian`
- `/map` -> `/geospatial-map`
- `/dap-map` -> `/geospatial-map`

`/geospatial-map` is the canonical MapLibre GIS workspace. `/mouza-map` and `/rajuk-test` remain independent specialized experiences.

## API registry

The centralized API route-policy registry and coverage tests were verified. Exact route/method classifications are used instead of a broad public `/api/*` exemption.

Unknown API routes default to member-protected behavior rather than public access. Protected handlers retain server-side verification and service guards.

## Admin routing

Admin pages remain excluded from configurable public page rules so a bad visibility rule cannot lock the control plane. They still require privileged Firebase verification and minimum-role checks.

## Documentation

`AGENTS.md`, `ARCHITECTURE.md`, `PROJECT-STATUS.md`, and the historical Phase-0 audit were updated so the documented GIS contract matches current code.

## Status

DONE; route/API registry tests are included in the full 574-test passing suite.
