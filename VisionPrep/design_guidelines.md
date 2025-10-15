# Design Guidelines: AI Image Preparation Tool

## Design Approach

**Selected Approach:** Design System (Utility-Focused)

**Justification:** This is a productivity tool for batch image processing with information-dense interfaces (metadata, status indicators, results tables). The focus is on efficiency, clarity, and learnability. Drawing inspiration from Linear's clean minimalism and Material Design's data-rich components.

**Key Design Principles:**
- Clarity over decoration: Every element serves a functional purpose
- Scannable information hierarchy: Users should quickly understand processing status
- Efficient workflows: Minimal clicks to complete tasks
- Data density without clutter: Present rich information without overwhelming

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background Base: 220 15% 8% (deep slate, almost black)
- Surface Elevated: 220 12% 12% (cards, dropzone)
- Surface Interactive: 220 10% 16% (hover states)
- Border Subtle: 220 8% 20%
- Border Strong: 220 6% 28%

**Light Mode:**
- Background Base: 0 0% 100% (pure white)
- Surface Elevated: 220 10% 98%
- Surface Interactive: 220 15% 95%
- Border Subtle: 220 8% 88%
- Border Strong: 220 6% 75%

**Semantic Colors (Both Modes):**
- Primary Action: 217 91% 60% (vibrant blue)
- Primary Hover: 217 91% 55%
- Success: 142 71% 45% (green for completed)
- Warning: 38 92% 50% (amber for processing)
- Error: 0 84% 60% (red for failed)
- Text Primary: 220 9% 95% (dark) / 220 9% 15% (light)
- Text Secondary: 220 5% 65% (dark) / 220 5% 45% (light)
- Text Tertiary: 220 4% 50% (dark) / 220 4% 60% (light)

### B. Typography

**Font Families:**
- Interface: 'Inter', system-ui, sans-serif
- Monospace: 'JetBrains Mono', 'Fira Code', monospace (for filenames, SHA256)

**Type Scale:**
- Display: 32px/1.2, weight 600 (page title)
- Heading: 20px/1.3, weight 600 (section headers)
- Body Large: 16px/1.5, weight 400 (primary content)
- Body: 14px/1.5, weight 400 (default)
- Body Small: 13px/1.4, weight 400 (metadata)
- Caption: 12px/1.3, weight 500 (labels, status badges)
- Code: 13px/1.4, weight 400, monospace (technical data)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 3, 4, 6, 8, 12, 16, 24
- Micro spacing (gaps, padding): p-2, p-3, gap-2
- Component spacing: p-4, p-6, gap-4
- Section spacing: p-8, p-12, gap-8
- Major layout: p-16, p-24, mt-12

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-6
- Sidebar: fixed width 320px (lg screens), full-width drawer (mobile)
- Main area: flex-1 with internal max-width constraints
- Image cards grid: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4

### D. Component Library

**1. Dropzone:**
- Bordered dashed area (2px dashed border)
- Height: 280px on desktop, 200px on mobile
- Centered icon (upload cloud, 48px) and instructional text
- Drag-over state: Primary border color, slight background tint
- File count badge: top-right corner showing X/10 limit

**2. Sidebar (Input Panel):**
- Fixed/drawer layout with subtle elevated surface
- Grouped form sections with 16px vertical spacing
- Language selector: Radio buttons, pill-style active state
- SEO keywords: Multi-line textarea (3 rows), monospace font
- Tone selector: Segmented control (3 options)
- Primary CTA button: Full-width, 44px height for touch-friendly

**3. Image Item Cards:**
- Elevated surface with 12px rounded corners
- 4-section layout (top to bottom):
  - Thumbnail area: 16:9 aspect ratio, 160px width, object-cover
  - Status badge: Absolute positioned top-right on thumbnail
  - Metadata row: filename (truncated), dimensions, size
  - Results section: ALT text, tags (pills), placement hint (badge)
- Action buttons row: "Copy" (outline), "Regenerate" (ghost)

**4. Status Indicators:**
- Queued: Neutral gray dot + label
- Processing: Animated pulse amber dot + label
- Complete: Success green checkmark + label  
- Failed: Error red X + label with error message below
- Progress: Linear progress bar below status

**5. Results Display:**
- ALT text: Full-width text with language indicator
- Keywords used: Small pills with primary tint (0-2 max)
- Tags: Wrapped pill layout, neutral gray, max 10
- Placement hint: Larger badge with icon, distinct color per type

**6. Data Table (Optional CSV Preview):**
- Sticky header with sort indicators
- Alternating row backgrounds (subtle)
- Monospace for technical columns (SHA256, dimensions)
- Truncated cells with tooltip on hover

**7. Action Buttons:**
- Primary: Solid fill with primary color
- Secondary: Outline variant with 1px border
- Ghost: No background, hover shows surface color
- Icon buttons: 36px square, rounded-lg
- Button heights: 36px (small), 44px (default), 52px (large/CTA)

**8. Global Controls:**
- Top bar: "Generate" (primary, large), "Cancel" (ghost), progress counter
- Download section: Two outline buttons side-by-side (CSV, JSON)
- Sticky positioning for controls during scroll

### E. Animations (Minimal)

**Permitted Animations:**
- Status transitions: 200ms ease-in-out color/opacity changes
- Loading spinner: Subtle rotation for processing state
- Progress bar: Smooth width transition 300ms
- Hover states: 150ms ease background/border changes
- Dropdown/drawer: 250ms slide/fade entrance
- Success feedback: 500ms scale pulse on completion (subtle)

**Forbidden:**
- Scroll-triggered animations
- Complex transitions between sections
- Parallax effects
- Decorative motion

---

## Implementation Notes

**Interactions:**
- Copy button: Shows "Copied!" toast for 2s
- Regenerate: Replaces current result, shows loading state inline
- Batch generate: Disables controls, shows overall progress
- Error retry: Automatic with exponential backoff, shows attempt count

**Responsive Behavior:**
- Mobile (<768px): Sidebar becomes bottom drawer, single-column cards
- Tablet (768-1024px): 2-column card grid, sidebar slides over
- Desktop (>1024px): Fixed sidebar, 2-3 column cards based on width

**Accessibility:**
- Form inputs: Consistent dark mode styling (no white backgrounds)
- Focus indicators: 2px offset ring with primary color
- Status badges: Include text labels, not just colors
- Keyboard navigation: Logical tab order, escape to close modals
- Screen reader: Descriptive aria-labels for all interactive elements

**Key Differentiation:**
This design prioritizes information density and processing clarity over visual flair. The aesthetic is clean, technical, and purpose-built for batch workflows—similar to developer tools and productivity apps rather than consumer-facing products.