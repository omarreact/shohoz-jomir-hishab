# LandBD 13 selected pages — retirement manifest (2026-11-13)

Original source of truth: `omarreact/shohoz-jomir-hishab` @ `bf28f9100c0c205381abdd286f5b2a0107403cf4`

**Preserved in GitHub archive branch:** [archive/landbd-13-retired-pages-20261113](https://github.com/omarreact/shohoz-jomir-hishab/tree/archive/landbd-13-retired-pages-20261113). This archive references the intact pre-removal commit and therefore retains every route, its code, imported libraries, images, and history. **It is in the same GitHub repository, NOT a separate archive repository.** Moving into a new GitHub repository requires creating/identifying that repository first.

The user selected these numbered routes from the 64-page inventory:

| No. | Removed page |
| --- | --- |
| 9 | `/dap-map` |
| 14 | `/history` |
| 15 | `/khatian` |
| 18 | `/map` |
| 21 | `/mouza-porcha-report` |
| 23 | `/my-purchases` |
| 24 | `/namjari-khatian` |
| 25 | `/nid-copy` |
| 26 | `/nid_dob` |
| 30 | `/settlement-khatian` |
| 37 | `/warish` |
| 38 | `/warishsanad` |
| 40 | `/admin/ai-assistant` |

**Still available:** `/mouza-khatian-book` is the canonical Mouza book/PDF builder; `/dlrms-khatian`, `/geospatial-map`, `/mouza-map`, `/rajuk-test`, `/khatiyan`, and payment checkout/results stay intact.

Removed paths are no longer linked in navigation, sitemap, access registry, admin menu or checkout UI. Where necessary, users are directed to a valid retained page (Mouza book, Explore, Contact). Old QR target `mouza-porcha-report` resolves to `/mouza-khatian-book` to avoid breaking issued QR links.

**Important tradeoff:** Removing `/my-purchases` also removes the member-facing payment/order history. Transaction records, payment APIs, admin order management, and service entitlements must not be deleted. Payment UI now directs customers to support; restoring a customer receipt viewer requires a separate user-approved feature.

**Verification required before merge/deploy:** run `npm ci`, `npm run typecheck`, `npm test -- --runInBand`, `npm run build`, audit sidebar/mobile/footer links, verify 13 removed pages do not render, verify `/mouza-khatian-book` PDF and report QR, test PinPay payment and receipt behavior, check Cloudflare staging and mobile browsers.

No DNS, production deployment, secrets, Firestore records or payment endpoints should be changed as part of this cleanup.
