# LandBD integration QA gates

This file defines automated gates for the single release PR.

## Enforced in CI
- Exactly 51 application page routes after the approved 13-page retirement.
- Retired routes absent from page access, route registry, desktop/mobile navigation, home shortcuts, payment links, admin navigation, and request-boundary PDF handling.
- DLRMS, Mouza Khatian Book, Mouza Dag Book, GIS, Mouza Map, RAJUK QA, checkout result, and admin orders remain present.
- Legacy QR target `mouza-porcha-report` resolves to the retained `/mouza-khatian-book` page.
- Responsive navigation and GIS control regression suites run under the normal Jest suite.\n- Chromium browser QA verifies the approved retired routes, responsive navigation, and GIS panel/toolbox geometry at 390×844, 768×1024, 1024×768, and 1440×900.\n- Historical imagery QA verifies UI switching and read-only reachability of EOxCloudless 2016 plus NASA MODIS 2003/2010/2020/2025 sample tiles.
- Official DLRMS source-coverage workflow runs whenever land-record code changes and requires the known BRS 349 / ID 7940305 sample to be readable from the official public source.
- DLRMS source checks never use citizen credentials and never log owner/guardian names, land values, tokens, or response bodies.

## Interactive browser release gates
Visual overlap, touch gestures, browser print dialogs, PDF rendering fidelity, and authenticated staging flows require an interactive browser-capable environment. They are not certified by source tests alone and remain release gates until executed.

No production mutation is part of these gates.
