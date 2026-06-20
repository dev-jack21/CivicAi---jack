# CivicAI — UI/UX Design Specification

**Version:** 1.0  
**Date:** June 2026

---

## 1. Design Principles

1. **Accessible First** — WCAG 2.1 AA as a baseline, not an afterthought
2. **Mobile First** — majority of Kenyan users access via mobile
3. **Low Bandwidth Friendly** — no heavy animations, lazy-loaded images
4. **Clear Language** — UI text in plain English; avoid legal/technical jargon
5. **Trustworthy** — government platform aesthetic: clean, formal, professional

---

## 2. Design System

### 2.1 Color Palette

```
Primary:       #1B6CA8  (Kenyan civic blue)
Primary Dark:  #0D4F80
Accent:        #078930  (Kenyan green — sparingly for CTAs)
Background:    #F9FAFB
Surface:       #FFFFFF
Border:        #E5E7EB
Text Primary:  #111827
Text Secondary:#6B7280
Text Muted:    #9CA3AF
Error:         #DC2626
Success:       #16A34A
Warning:       #D97706

High Contrast Mode:
  Background:  #000000
  Text:        #FFFFFF
  Primary:     #60A5FA
```

### 2.2 Typography

```
Font Family:   Inter (system fallback: -apple-system, sans-serif)
Base Size:     16px (1rem)

Scale:
  H1:  2rem   / 700 weight  — Page titles
  H2:  1.5rem / 700 weight  — Section headings
  H3:  1.25rem/ 600 weight  — Card headings
  H4:  1rem   / 600 weight  — Sub-sections
  Body:1rem   / 400 weight  — Default text
  Small:0.875rem/ 400       — Captions, labels
  XS:  0.75rem / 400        — Meta info

Line Height:   1.6 (body), 1.3 (headings)
```

### 2.3 Spacing Scale (Tailwind)

```
4px  = space-1   (tiny gaps)
8px  = space-2   (icon padding)
12px = space-3
16px = space-4   (component padding)
24px = space-6   (section gaps)
32px = space-8
48px = space-12  (large section gaps)
64px = space-16  (page sections)
```

### 2.4 Component Guidelines

**Buttons**
```
Primary:   bg-blue-700 text-white hover:bg-blue-800 focus:ring-2 focus:ring-blue-500
Secondary: border border-blue-700 text-blue-700 hover:bg-blue-50
Danger:    bg-red-600 text-white hover:bg-red-700
Disabled:  opacity-50 cursor-not-allowed

Size: py-2 px-4 rounded-md text-sm font-medium
Focus ring: Always visible (accessibility requirement)
```

**Form Inputs**
```
border border-gray-300 rounded-md p-2 w-full
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
Error state: border-red-500 + error message below (role="alert")
```

---

## 3. Page Layouts

### 3.1 Site Structure / Navigation

```
Header
├── Logo: "CivicAI" + Kenya flag favicon
├── Nav: Home | Policies | About | Submit Feedback
└── CTA: Login / Register  (or user avatar dropdown)

Skip Navigation Link (hidden, shown on focus):
"Skip to main content" → #main-content

Footer
├── About CivicAI
├── Links: Privacy Policy | Accessibility Statement | Contact
└── Built for INTE 324 | Kabarak University 2026
```

### 3.2 Page Map

```
/                    → Landing page (hero + featured policies)
/policies            → All policies (search + filter)
/policies/:id        → Single policy (summary + audio + feedback)
/login               → Login
/register            → Register
/profile             → User profile + my feedback

/admin               → Admin dashboard (stats)
/admin/upload        → Upload new policy
/admin/policies      → Manage policies
/admin/feedback      → Review citizen feedback
```

---

## 4. Key Page Wireframes (Text Description)

### 4.1 Home Page `/`

```
┌────────────────────────────────────────────────────────┐
│  [NAVBAR]  CivicAI     Home  Policies  About  [Login]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│        HERO SECTION                                    │
│   "Understand Kenya's Policies. Make Your Voice Heard" │
│   Subtext: "AI simplifies government documents..."     │
│   [Browse Policies]  [How It Works]                    │
│                                                        │
├────────────────────────────────────────────────────────┤
│   HOW IT WORKS (3 steps)                               │
│   📄 Upload → 🤖 AI Summarizes → 🗣️ Listen & Respond  │
├────────────────────────────────────────────────────────┤
│   RECENT POLICIES (grid of 3-6 cards)                  │
│   [View All Policies →]                                │
└────────────────────────────────────────────────────────┘
```

### 4.2 Policy Listing `/policies`

```
┌────────────────────────────────────────────────────────┐
│  [Search bar: "Search policies..."]                    │
│  Filters: [All Categories ▼]  [All Ministries ▼]      │
├────────────────────────────────────────────────────────┤
│  Policy Card                                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │  [Health Badge]  Ministry of Health              │ │
│  │  National Health Policy 2024                     │ │
│  │  Uploaded: 15 Jun 2026                           │ │
│  │  "AI Summary: This policy focuses on..."         │ │
│  │  🔊 Audio available    💬 12 responses           │ │
│  │  [Read Summary]                    [Listen →]    │ │
│  └──────────────────────────────────────────────────┘ │
│  (repeat for each policy)                              │
│  [< Prev]  Page 1 of 3  [Next >]                       │
└────────────────────────────────────────────────────────┘
```

### 4.3 Policy Detail `/policies/:id`

```
┌────────────────────────────────────────────────────────┐
│  ← Back to Policies                                    │
│  [Health]  Ministry of Health                          │
│  # National Health Policy 2024                         │
│  Effective: January 2025  |  12 citizen responses      │
├────────────────────────────────────────────────────────┤
│  [📥 Download Original] [🔊 Listen to Summary]         │
│                                                        │
│  ─── AUDIO PLAYER ────────────────────────────────    │
│  ▶ ━━━━━━━━━━━━━━━━━━━━━━━━  2:34 / 5:12   ⬇          │
│  [◄10s] [▶/‖] [10s►]  Speed: [1x ▼]  Vol: [━━]       │
│  ─────────────────────────────────────────────────    │
│                                                        │
│  AI SUMMARY                                            │
│  **Key Points**                                        │
│  • Universal health coverage by 2027                   │
│  • Free maternity services at all public facilities    │
│  • Community health worker training...                 │
│                                                        │
│  **What This Means for You**                           │
│  You can now access free services at your nearest...   │
│                                                        │
│  **Next Steps / Deadlines**                            │
│  Public comment period closes 30 Aug 2026              │
├────────────────────────────────────────────────────────┤
│  CITIZEN FEEDBACK (12 responses)                       │
│  [Login to submit your feedback]                       │
│                                                        │
│  ─ John M., Nairobi ─ Jun 12, 2026                     │
│  "I appreciate the free maternity clause but..."       │
│  ─ ─ ─                                                 │
└────────────────────────────────────────────────────────┘
```

### 4.4 Admin Upload `/admin/upload`

```
┌────────────────────────────────────────────────────────┐
│  Upload New Policy Document                            │
│                                                        │
│  Policy Title *          [                           ] │
│  Ministry *              [Ministry of Health       ▼] │
│  Category *              [Health                   ▼] │
│  Description             [                           ] │
│  Effective Date          [  /  /    ]                  │
│                                                        │
│  Upload Document *                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │   📄 Drop PDF or DOCX here, or click to browse   │ │
│  │         Max 20MB  |  PDF and DOCX only            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [Cancel]                      [Upload & Process →]   │
└────────────────────────────────────────────────────────┘
```

---

## 5. Accessibility Requirements

### 5.1 WCAG 2.1 AA Checklist

| Criterion | Implementation |
|---|---|
| 1.1.1 Non-text Content | Alt text on all images, icons have aria-label |
| 1.3.1 Info and Relationships | Semantic HTML (nav, main, aside, footer) |
| 1.4.3 Contrast (Minimum) | 4.5:1 for body text, 3:1 for large text |
| 2.1.1 Keyboard | All interactions operable by keyboard only |
| 2.4.1 Bypass Blocks | Skip navigation link provided |
| 2.4.3 Focus Order | Logical tab order throughout all pages |
| 2.4.7 Focus Visible | Focus ring always visible on all interactive elements |
| 3.1.1 Language of Page | `<html lang="en">` set |
| 3.3.1 Error Identification | Form errors clearly identified with role="alert" |
| 4.1.2 Name, Role, Value | All custom UI components have proper ARIA attributes |

### 5.2 Audio Player Keyboard Controls

| Key | Action |
|---|---|
| Space | Play / Pause |
| ← → Arrow Keys | Seek ±5 seconds |
| ↑ ↓ Arrow Keys | Volume up/down |
| M | Mute/unmute |
| Home | Restart |
| End | Jump to end |

### 5.3 Screen Reader Considerations

```html
<!-- Skip nav -->
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>

<!-- Audio player -->
<button aria-label="Play audio narration of National Health Policy 2024">
  <PlayIcon aria-hidden="true" />
</button>

<!-- Policy status badge -->
<span aria-label="Category: Health" class="badge">Health</span>

<!-- Feedback count -->
<span aria-label="12 citizen responses">
  💬 12
</span>
```

---

## 6. Mobile Responsiveness

| Breakpoint | Target |
|---|---|
| Mobile (`< 640px`) | Single column, full-width cards, stacked nav |
| Tablet (`640px – 1024px`) | 2-column grid, collapsible filters |
| Desktop (`> 1024px`) | 3-column grid, sidebar filters |

- Touch targets minimum 44×44px (Apple HIG / WCAG 2.5.5)
- No horizontal scroll on any breakpoint
- Audio player full-width on mobile with large touch controls
- Hamburger menu on mobile (keyboard accessible)

---

## 7. Loading & Empty States

```
Loading:  Skeleton loaders (not spinners) for policy cards
Empty:    "No policies found. Try a different search."
Error:    "Something went wrong. Please try again." + retry button
Offline:  "You appear to be offline. Some features may not work."
Processing: "Your document is being processed. This may take up to 2 minutes."
```
