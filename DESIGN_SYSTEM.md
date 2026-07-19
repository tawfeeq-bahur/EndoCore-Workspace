# EndoCore Mobile Design System
**Authored by**: Senior Product Designer (Apple & Linear)

This design system establishes a premium, developer-focused, obsidian-dark aesthetic. It pairs the typographic clarity and physical weight of **Apple iOS (SF Pro & New York)** with the technical density, sub-pixel borders, and keyboard-first minimalism of **Linear**.

---

## 1. Typography

We use a tri-font hierarchy to communicate brand class, interface hierarchy, and workspace telemetry:
- **Brand Serif**: *New York* (Apple's editorial serif) for headings and high-fidelity titles.
- **Interface Sans**: *SF Pro* for general UI, buttons, and navigation.
- **Telemetry Mono**: *SF Mono* (or JetBrains Mono) for status indicators, pipeline telemetry, and numbers.

### Font Scale & Line Heights

| Level | Font Family | Size (px) | Weight | Line Height | Tracking (Letter Spacing) | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | New York | `32px` | Semibold | `40px` (1.25) | `-0.5px` | Main headers, large stats |
| **Heading** | New York | `24px` | Medium | `32px` (1.33) | `-0.2px` | Screen sub-headers |
| **Title** | SF Pro | `18px` | Semibold | `24px` (1.33) | `0px` | Card headers, list section headers |
| **Body Large** | SF Pro | `15px` | Regular | `22px` (1.46) | `0px` | Conversational text, messages |
| **Body Regular** | SF Pro | `13px` | Regular | `18px` (1.38) | `+0.1px` | Paragraphs, detail values |
| **Caption** | SF Mono | `11px` | Medium | `16px` (1.45) | `+0.2px` | Code blocks, status logs, metadata |
| **Label** | SF Mono | `9px` | Bold (Caps)| `12px` (1.33) | `+1.5px` | Overheads, sub-tags, field descriptors |

### Font Weights
- **Bold**: `700` (Used for system-level actions/errors)
- **Semibold**: `600` (Standard focus state emphasis)
- **Medium**: `500` (Neutral UI labels and navigation items)
- **Regular**: `400` (Body copy and static labels)

---

## 2. Spacing System

We utilize a strict **8-point grid** for layout alignment and hierarchical spacing:
- **Grid Increment**: `8px` (`dp` on native Android).

### Padding & Margins
- **Screen Margins**: `24px` (Left and right safe boundaries for edge alignment).
- **Section Spacing**: `32px` (Vertical gap between core functional areas).
- **Card Padding**: `20px` (Inner padding for metrics and group details).
- **Button Padding**: `12px` vertical, `20px` horizontal.
- **List Item Padding**: `16px` vertical, `12px` horizontal.

---

## 3. Border Radius (Corner Treatment)

Following Apple's **Squircle** (continuous curvature) approach, we use graduated radiuses to establish nested containment rules (smaller elements inside larger elements should have smaller radiuses):

* **Bottom Sheets**: `28px` (Top-left, top-right only).
* **Cards & Containers**: `20px` (All corners).
* **Buttons**: `12px` (Standardized interaction shape).
* **Inputs & Form Fields**: `12px` (Ensures alignment with buttons).
* **Chips & Badges**: `999px` (Fully pill-shaped for distinct classification tags).
* **Floating Action Buttons (FAB)**: `28px` (Perfect circular shape).

---

## 4. Icon System

* **Icon Library**: **Lucide** (for vector path precision and modern stroke consistency).
* **Stroke Width**: `1.75px` (Provides optimal visual balance at standard sizes, preventing icons from appearing too heavy or too thin).
* **Icon Sizes**:
  * **System (Large)**: `24px` (Main navigation, header actions).
  * **Component (Standard)**: `20px` (Card icons, input adornments).
  * **Inline (Small)**: `14px` (Status markers, adjacent metadata indicators).
* **Icon Spacing**: Maintain `8px` buffer from accompanying text label.

---

## 5. Color System

Our color system leverages highly curated HSL values to provide deep contrast, glowing status highlights, and a premium developer environment.

### Core Palette

| Palette Role | Color Name | Hex Code | HSL Representation | Intent / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary (Accent)** | Chamber Gold | `#D4AF37` | `hsl(46, 65%, 52%)` | Key actions, focus states, brand highlights |
| **Background** | Obsidian | `#09090B` | `hsl(240, 10%, 4%)` | Pure app canvas background |
| **Surface** | Dark Slate | `#121215` | `hsl(240, 8%, 8%)` | Standard cards and containers |
| **Surface Elevated** | Coal | `#1E1E24` | `hsl(240, 9%, 13%)` | Floating dialogs, active text field inputs |
| **Text Primary** | Pure White | `#FFFFFF` | `hsl(0, 0%, 100%)` | Main headings and critical data |
| **Text Secondary** | Muted Silver | `#A1A1AA` | `hsl(240, 5%, 65%)` | Subtitles, labels, secondary options |
| **Text Muted** | Charcoal | `#62626E` | `hsl(240, 6%, 41%)` | Placeholders, inactive stats, metadata |
| **Border** | Midnight Rule| `#222227` | `hsl(240, 7%, 15%)` | Sub-pixel micro-borders |
| **Success** | Emerald | `#10B981` | `hsl(162, 76%, 41%)` | Active, connected, synced states |
| **Warning** | Amber | `#F59E0B` | `hsl(38, 92%, 50%)` | Idle, paused, offline warnings |
| **Error** | Coral Red | `#EF4444` | `hsl(0, 84%, 60%)` | Disconnected, API failures, error logs |

---

## 6. Component Specs

### 1. Primary Action Button
- **Height**: `48px`
- **Background**: `Chamber Gold (#D4AF37)`
- **Content**: `Text (Obsidian #09090B)` (Size: `15px`, Weight: `Bold`)
- **Border**: None
- **Corner Radius**: `12px`
- **Active State Scale**: `0.98` scale down on press.

### 2. Secondary Outline Button
- **Height**: `48px`
- **Background**: Transparent
- **Content**: `Text (Pure White #FFFFFF)` (Size: `15px`, Weight: `Regular`)
- **Border**: `1px` solid `Midnight Rule (#222227)`
- **Corner Radius**: `12px`

### 3. Metric Card
- **Background**: `Dark Slate (#121215)`
- **Border**: `1px` solid `Midnight Rule (#222227)`
- **Inner Padding**: `20px`
- **Content Flow**: 
  - Sub-tag: `9px SF Mono` (Charcoal) uppercase (Top-left)
  - Display Number: `24px New York` (White)
  - Detail/Goal status: `11px SF Mono` (Muted Silver)

### 4. Text Input Field
- **Height**: `52px`
- **Background**: `Obsidian (#09090B)`
- **Border**: `1px` solid `Midnight Rule (#222227)` (transitions to `Chamber Gold` on active focus).
- **Text**: `15px SF Pro` (White)
- **Placeholder**: `15px SF Pro` (Charcoal)

---

## 7. Elevation & Material Depth

We avoid heavy physical dropshadows to maintain a sleek, modern, flat-obsidian aesthetic. Instead, we establish depth using **layers, borders, and glass effects**:

* **Shadow Levels**:
  * **Standard Card**: None (rely on `1px` borders for separation).
  * **Bottom Sheets / Popups**: `Shadow Y: 8dp, Blur: 24dp, Color: rgba(0, 0, 0, 0.6)`.
* **Glassmorphic Overlays (Apple Blur)**:
  * Used for top navigation headers and action sheet overlays.
  * CSS representation: `background: rgba(9, 9, 11, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.05)`.

---

## 8. Animation & Motion Choreography

All transition animations model real-world physics (mass and spring tension) to avoid stiff, linear movements.

* **Transitions (Tab Switching / Panel entry)**:
  * **Duration**: `250ms`
  * **Easing**: Cubic-bezier `(0.16, 1, 0.3, 1)` (Ultra-smooth deceleration).
* **Spring Dynamics (Mobile Drawer Toggle)**:
  * **Stiffness**: `200`
  * **Damping**: `25`
  * **Mass**: `1.0`
* **Micro-Interactions (Button press / Toggle click)**:
  * **Duration**: `100ms`
  * **Scale Shift**: `0.97` compression on press.

---

## 9. Accessibility (A11y)

* **Touch Targets**: Minimum **`48px` x `48px`** for all interactive buttons, inputs, and tab bars (per iOS Human Interface Guidelines).
* **Contrast Ratios**:
  * Text (Primary / Secondary) on Obsidian background maintains at least **`4.5:1`** contrast ratio (meeting WCAG AA standards).
  * Chamber Gold accent elements exceed **`3:1`** contrast ratio.
* **Text Scaling**: Supported dynamically via system font size preferences (Auto-wrapping container cards to ensure text is never clipped).

---

## 10. Responsive Design Rules

### Breakpoints & Adaptive Scaling
- **Small Screens (W: 320px - 375px)**:
  * Margin: Reduce to `16px`.
  * Grid: 2-column stats cards stack vertically. Font scaling shifts down by `-1px`.
- **Medium Screens (W: 376px - 420px)**:
  * Default specifications (Margin: `24px`, Card padding: `20px`).
- **Large Screens / Tablets (W: > 420px)**:
  * Expand card padding to `24px`.
  * Display stats card grid in 3-column configuration.
