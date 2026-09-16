# LandBD Brand System

## Core identity
LandBD is a Bangla-first land information and calculation platform. The identity combines a location pin, cadastral parcels and Bangladesh green/red cues without imitating an official government seal.

## Colors
- Primary green: `#006A3D`
- Secondary green: `#22A35A`
- Accent red: `#E10600`
- Light green: `#D9F2E3`
- Text: `#1F2937`
- Background: `#F3F4F6`

## Asset usage
- `public/brand/landbd-logo-horizontal.svg`: header, footer and wide surfaces.
- `public/brand/landbd-symbol.svg`: compact/mobile branding, favicon source and loading/empty states.
- `LandBDIcon`: domain-specific application concepts. Keep Lucide/Radix for generic controls such as close, chevron, check, menu and form primitives.

## Domain icon rules
Use custom icons for Khatian/records, Dag/plot, Mouza, measurement and GIS. New icons should use a 24×24 viewBox, rounded geometry, 1.8px primary strokes and brand green/red only as semantic accents.

## Accessibility
Never rely on red/green alone to communicate state. Decorative SVGs should be hidden from assistive technology; meaningful icons require accessible text or labels.

## Theme
LandBD is a single light-theme application. Prefer white/light-neutral surfaces, primary green navigation/action emphasis and restrained red for location/attention accents.
