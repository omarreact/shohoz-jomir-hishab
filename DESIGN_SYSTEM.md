# LandBD 2.0 Design System

This document outlines the core UI/UX primitives, patterns, and component APIs used in the LandBD 2.0 application. This ensures a consistent, premium user experience.

## 1. Typography

We use consistent Bengali typography across the application, standardized to ensure readability.

- **Primary Font**: `Tiro Bangla` (or system serif fallback) / `Geist` (for Latin text).
- **Line Heights**:
  - Headings (`h1` - `h6`): `1.2` to `1.3`.
  - Body text (`p`, `span`): `1.6` for long-form reading, `1.5` for UI labels.
- **Letter Spacing**: Minimal letter-spacing for Bengali to avoid breaking conjuncts (Juktakkhor).

## 2. Color System & Themes

The application supports 10 distinct color themes, seamlessly adapting to both Light and Dark modes.

### CSS Variables
- `--background`, `--foreground`: Base colors for the layout.
- `--card-bg`: Slightly elevated background color for cards and panels.
- `--border-color`: Subtle borders to separate content zones.
- `--bs-primary`, `--bs-success`: Dynamic accent colors controlled via `data-color-theme` attribute on the HTML root.

## 3. UI Components (`components/ui`)

### `Button`
Reusable button primitive.
**Variants**:
- `primary`: Solid fill, main call to action.
- `secondary`: Tonal fill, secondary action.
- `outline`: Border only, subtle action.
- `ghost`: Transparent, hover background.
- `danger`: Red fill/outline for destructive actions.

**Props**: `variant`, `size`, `isLoading`, `leftIcon`, `rightIcon`.

### `Card`
Standard surface component for grouping related information.
**Features**:
- Consistent padding (`p-4` or `p-3`).
- Glassmorphism effect (semi-transparent background with backdrop blur).
- Smooth hover elevation.

### `Forms` (`Input`, `Select`, `Textarea`)
Consistent form inputs.
**Features**:
- Focus rings (box-shadow) tied to the active primary color.
- Integrated validation states (`isInvalid`).
- Standardized labels and helper text spacing.

### `Skeleton`
Loading placeholder. Used for skeleton screens while data is fetching. Avoids Layout Shift (CLS).

### `EmptyState`
Standard fallback UI.
**Props**: `title`, `description`, `icon`, `actionButton`.

### `Toast` (Notification)
Non-blocking user feedback system. Appears at the bottom right.
**Variants**: `success`, `error`, `info`, `warning`.

## 4. Spacing & Layout

- **Spacing Scale**: We use a consistent spacing scale (based on Bootstrap's utility classes `0-5`).
- **Section Gaps**: Use consistent vertical rhythm (e.g., `py-5` for major sections, `gap-4` for grid items).

## 5. Micro-interactions

- **Buttons/Cards**: `transition: all 0.2s ease`. Buttons have subtle `transform: scale(0.98)` on active. Cards have subtle upward lift `transform: translateY(-2px)` on hover.
- **Focus States**: Clearly visible focus rings for keyboard navigation.

## 6. Accessibility (a11y)

- All interactive elements must have `aria-label` if they lack text.
- Form inputs must be linked to labels via `id` and `htmlFor`.
- Contrast ratios must pass WCAG AA standards (checked via Dark/Light mode tests).
