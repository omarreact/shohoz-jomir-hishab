# LandBD 2.0 Roadmap: Bangladesh Land Intelligence Platform

This document serves as the living record of the LandBD architecture, phases, and vision. It tracks our evolution from a standard CRUD map application to a comprehensive, scalable GIS decision-support platform.

## Architecture

**Stack:**
- **Framework:** Next.js 16.1 (App Router, Turbopack)
- **Language:** TypeScript
- **State Management:** Zustand, React Context (Providers)
- **GIS Engine:** Leaflet, Esri-Leaflet
- **Styling:** Bootstrap 5, Custom CSS Modules, Glassmorphism UI
- **Backend Services:** Firebase (Auth, Firestore), Rajuk ArcGIS REST API

**Core Principles:**
1. **Feature-Based Module Design:** Code is grouped by feature (`map`, `search`, `admin`) containing its own components, hooks, services, and types.
2. **Unified API Gateway:** All external data sources (ArcGIS, Firebase, etc.) are abstracted behind a unified `/api` layer returning standard `UnifiedFeature` payloads.
3. **Robust GIS Engine:** Decoupled map providers (MapProvider, LayerProvider) ensuring UI does not mutate the map directly.
4. **Resilient Data Structures:** Widespread use of `Zod` validation ensuring no `any` types propagate to the client.

## Completed Phases

- **[x] Phase 1: Context & Architecture** 
  - Comprehensive project analysis and feature-based folder planning.
- **[x] Phase 2: Feature Architecture & File Migration** 
  - Restructured `src/features/*` isolating responsibilities.
- **[x] Phase 3: API & State Refactor** 
  - Introduced Unified API with Zod validation. Eradicated `any` types.
- **[x] Phase 4: GIS Core Architecture & Map Engine** 
  - Modularized Leaflet map into discrete context providers and implemented the Layer Registry.
- **[x] Phase 5: LandBD 2.0 UI/UX Redesign** 
  - Professional GIS workspace with floating panels, glass-morphism, and responsive drawer UI.
- **[x] Phase 6: Smart Search & GIS Intelligence** (Phase 6A)
  - Implemented `SmartSearchPalette` (Cmd+K), intent parser, local history, and map interaction integration.

## Current Phase

- **[ ] Phase 6B: Unified Search Engine Architecture**
  - **Goal:** Transform the search parser into a parallel-processing Search Engine orchestrator.
  - **Features:** Parallel providers (Plot, NID, Khatian), Result Ranker, Deduplication, and Search Actions.

## Remaining Phases

- **[ ] Phase 7: Admin Platform**
  - Transform the admin area into a data control center.
- **[ ] Phase 8: GIS Intelligence**
  - Parcel/Buffer/Area intelligence tools, dynamic reporting.
- **[ ] Phase 9: Document Management**
  - Integration of Khatian, Porcha, and Mutation documents directly linked to spatial features.
- **[ ] Phase 10: Performance Optimization**
  - PWA support, Lighthouse metrics, caching strategies.
- **[ ] Phase 11: Production Hardening**
  - Security audits, Monitoring (Sentry/Datadog), CI/CD pipelines.
- **[ ] Phase 12: AI Features**
  - Natural language geospatial search ("Show me residential plots over 5 katha near Gulshan").

## Known Limitations & Technical Debt

- **Data Availability:** Ownership, NID, and Khatian data may require robust Firebase integration to overlay onto Rajuk's spatial data.
- **Client/Server Search Delegation:** Currently transitioning search orchestration from client hooks to robust server-side unified APIs.
- **Layer Synchronization:** Complex custom layers (Flood, DAP) require ongoing synchronization with external ArcGIS server schemas.

---
*This document is updated dynamically as the platform evolves.*
