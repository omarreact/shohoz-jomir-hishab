# LandBD responsive design system audit

The application now follows one visual language across public pages, records, calculators, content, maps, login/control surfaces and mobile navigation.

## Core pattern

- Single light theme only.
- Warm gold is the primary interactive accent.
- White surfaces sit on a light neutral background.
- Deep ink typography carries primary hierarchy; muted gray carries supporting copy.
- Cards and panels use restrained borders, soft shadows and 14–20px radii.
- Shared focus rings, form controls, buttons, badges, loading, empty states and modals use the same tokens.

## Responsive pattern

- Mobile controls use touch-friendly targets and 16px form typography to avoid browser zoom.
- Page gutters and section spacing tighten progressively on tablets and phones.
- Mobile navigation preserves safe-area insets and uses a white/gold bottom bar.
- Modals become bottom sheets on phones and centered dialogs on larger screens.
- Data-heavy surfaces preserve horizontal scrolling instead of compressing columns beyond readability.
- GIS chrome uses safe-area-aware controls and mobile bottom-sheet consent.

## Functional boundary

This design pass does not change DLRMS, RAJUK/GIS data logic, Firebase/auth, calculations, role access, exports, PDF generation or print behavior.
