# Spec - Minimal Typographic Navbar Redesign

Provide a clean, editorial, text-only navigation layout for the KioskStar top navbar, replacing all emoji icons and background pills with modern typographic transitions.

---

## 1. Overview & Requirements
- **Goal:** Redesign the top navbar items to use pure text navigation without emojis, underlines, or background button shapes, adopting a modern minimalist editorial layout.
- **Audience:** Administrators and employees of the smart kiosk network.
- **Constraints:** Must be highly readable, fully responsive, and fit the existing glassmorphic header style.

## 2. Visual Specification

### Logo & Brand Presentation
- Remove any emoji/icon elements (`🌟`) from the branding box.
- The brand name **KioskStar** will be presented in styled text:
  - Weight: Bold/Extra-bold (`font-bold` or `font-extrabold`).
  - Color: A sleek gradient text effect (`bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-700`).

### Active Branch Pill
- Remove the map pin emoji (`📍`) from the branch container.
- Display the branch name cleanly inside the rounded container:
  - Padding: `px-3 py-1`
  - Style: Semi-transparent background with a subtle border (`bg-surface-100 text-surface-600 border border-surface-200/40 text-xs font-semibold`).

### Desktop Navigation Items
- Remove all emoji/icon indicators (`💰`, `📦`, `🏪`, `🗺️`) from the navigation list.
- **Default (Inactive) State:**
  - Color: Soft muted gray (`text-surface-500` or `text-surface-400`).
  - Typography: Medium weight (`font-medium`) and clean tracking (`tracking-wide text-sm`).
- **Active (Selected) State:**
  - Color: Vibrant text gradient (`bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600`).
  - Typography: Bold weight (`font-bold`).
  - No background shape, border, or underline.
- **Hover State:**
  - Transitions cleanly to active primary color (`hover:text-primary-600`).
  - Moves up slightly with a micro-transition (`transition-all duration-300 hover:-translate-y-[0.5px]`).

### Profile Dropdown Submenu
- Remove all emoji indicators (`📊`, `🏪`, `👤`) from the dropdown buttons.
- Styled as pure text menu items with clean padding, text-left alignment, and smooth hover backgrounds.
- Keep the red logout option styled in plain red text.

### Mobile Menu Dropdown
- Remove all emojis from the mobile submenu headers and list items.
- Ensure the quick access submenu (Dashboard, Mi Kiosco, Cuenta) matches the clean typographic styling.

---

## 3. Verification & Build
- Compile-check both backend and frontend to ensure no type errors.
- Confirm layout responsiveness on both desktop (hidden mobile navigation) and mobile views (collapsing hamburger menu).
