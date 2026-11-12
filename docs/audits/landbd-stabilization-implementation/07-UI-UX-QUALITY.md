# 07 — UI/UX, Accessibility, and Quality

## Targeted approach

The pass avoided a broad redesign. Only high-value correctness/accessibility warnings in affected areas were changed.

Changes include:
- map workspaces no longer receive the global AI overlay;
- command-center search now exposes proper combobox/listbox semantics;
- blog comment loading uses stable callback/effect dependencies;
- mouza browser loading uses stable callbacks;
- Rajuk location cascade resets happen from user actions instead of state-reset effects;
- internal 403 navigation uses the Next router;
- stale map/admin variables were removed;
- NID address normalization no longer emits a duplicate object key in the bundled output.

## Lint result

Historical audit baseline: 136 warnings, 0 errors.  
Validated branch: 118 warnings, 0 errors.  
Reduction: 18 warnings.

Remaining warnings are not hidden with blanket eslint disables. They are mostly legacy typing/image/dependency-quality work and should be reduced incrementally with behavior-preserving patches.

## Root layout review

Root layout remains server-rendered and wraps client providers/effects intentionally. No speculative provider rewrite was performed.

The primary Bengali/Latin font setup was simplified only where build evidence showed a Cloudflare failure.

## Status

DONE for the stabilization scope: zero lint errors and measurable high-value warning reduction. Remaining legacy warnings are documented technical debt.
