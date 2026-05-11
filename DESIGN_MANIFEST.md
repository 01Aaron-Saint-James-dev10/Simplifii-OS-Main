Here's the Design Manifest pulled straight from the shipped `calm.css` + `calm.jsx`. Two important truth-checks before the table:

1. The system as built is dark-theme (zinc-950 ground). It does not currently ship a light-theme background. If you need one for the Manifest, I've included the recommended light-theme token mapping at the bottom, it is not yet in the code.
2. The system is hand-written CSS, not Tailwind utility classes. It uses CSS custom properties + semantic class names (BEM-ish), not Tailwind. The Tailwind-equivalent column below is what you'd write if porting to a Tailwind/shadcn codebase. Both are valid; the Dev agents need to know which they're consuming.

```yaml
# ============================================================
# SIMPLIFII-OS · CALM DASHBOARD · DESIGN MANIFEST v1.0
# Source of truth: simplifii-studio/calm/calm.css + calm.jsx
# Stack as-shipped: vanilla CSS custom properties + React 18
# ============================================================

system:
  audience: neurodivergent university students (ADHD-first)
  doctrine: UDL 3.0 · shallow nav · one primary action · no nested tiers
  font_stack:
    sans: '"Geist", "Inter", system-ui, -apple-system, sans-serif'
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace'

# ------------------------------------------------------------
# REACT COMPONENTS · mandatory surface
# ------------------------------------------------------------
react_components:
  shell:
    - App              # root, screen switcher, keyboard handler (1-6 jumps screens)
    - Nav              # left rail, 240px, single-tier, aria-label="Primary"

  screens:
    - Onboarding       # 4 single-question steps
    - Login            # one input, one primary
    - CourseSelection  # 5 course cards + 1 dashed add card
    - Dashboard        # 3 horizontal bands: Today / This Week / This Course
    - Roadmap          # 3 anchors: NOW / NEXT / LATER
    - Rules            # accessibility doctrine page

  primitives:
    - Band             # dashboard section wrapper (head + count + body)
    - Task             # flat row · check + body + due chip
    - Anchor           # roadmap row · label + name + body

# ------------------------------------------------------------
# CSS CLASSES · mandatory
# ------------------------------------------------------------
css_classes:

  shell_and_nav:
    - .shell                    # 240px grid + 1fr
    - .skip-link                # keyboard-first skip-to-main
    - .nav, .nav-brand, .nav-brand-mark, .nav-brand-name
    - .nav-group, .nav-group-label
    - .nav-item                 # aria-current="page" drives active state
    - .nav-footer, .nav-context

  page_layout:
    - .main                     # scroll container
    - .page                     # 920px max
    - .page-narrow              # 560px max (auth/onboarding)
    - .page-eyebrow             # mono micro-label above title
    - .page-title               # 40px display
    - .page-lede                # 18px ink-soft sub

  primitives:
    - .btn, .btn-primary, .btn-secondary, .btn-tertiary, .btn-arrow
    - .input, .label, .help
    - .card, .card-title, .card-text

  onboarding:
    - .steps                    # progress segments
    - .onboard-q                # 28px question
    - .choice-list, .choice, .choice-mark, .choice-body
    - .onboard-actions

  course_selection:
    - .course-grid              # auto-fill minmax(240px, 1fr)
    - .course-card, .course-card-add
    - .course-code, .course-name, .course-meta

  dashboard:
    - .dash-head
    - .band, .band-head, .band-title, .band-count, .band-body
    - .task                     # data-done="true" drives strike-through
    - .task-check, .task-body, .task-name, .task-meta
    - .due                      # data-when="today|soon|overdue|later"
    - .due .icon-dot

  roadmap:
    - .roadmap
    - .anchor, .anchor-now, .anchor-head, .anchor-label, .anchor-name, .anchor-body

  rules:
    - .rules-grid, .rule
    - .compare, .compare-row, .col-head, .col-tw, .col-mui, .verdict
    - .hidden-list

# ------------------------------------------------------------
# FOCUS RING · the non-negotiable
# ------------------------------------------------------------
focus_ring:
  spec: 3px solid emerald · 2px offset · never suppressed

  as_shipped_css: |
    :focus-visible {
      outline: 3px solid var(--signal);   /* #10B981 */
      outline-offset: 2px;
      border-radius: 3px;
    }

  tailwind_equivalent: |
    focus-visible:outline-none
    focus-visible:ring-[3px]
    focus-visible:ring-emerald-500
    focus-visible:ring-offset-2
    focus-visible:ring-offset-zinc-950   /* swap to white for light theme */

  rule: applies globally via :focus-visible · NEVER use outline:none without
        re-providing an equivalent or stronger ring.

# ------------------------------------------------------------
# COLOUR TOKENS · as-shipped (DARK)
# ------------------------------------------------------------
tokens_dark:                    # current Calm.html ground truth
  surfaces:
    --bg:          '#0B0B0E'    # zinc-950-ish
    --surface:     '#111114'
    --surface-2:   '#16161B'
    --surface-3:   '#1C1C22'
    --line:        '#25252C'
    --line-strong: '#35353D'
  ink:
    --ink:         '#ECECEE'
    --ink-soft:    '#C0C0C6'
    --ink-mute:    '#8A8A92'
    --ink-faint:   '#5A5A62'
  signal:
    --signal:      '#10B981'    # emerald-500 · sole accent
    --signal-soft: 'rgba(16,185,129,0.16)'
    --signal-line: 'rgba(16,185,129,0.30)'
  warm:                         # deadline anchor · ALWAYS paired with word "due"
    --warm:        '#E7A24A'
    --warm-soft:   'rgba(231,162,74,0.14)'

# ------------------------------------------------------------
# COLOUR TOKENS · LIGHT THEME (RECOMMENDED · not yet in code)
# ------------------------------------------------------------
tokens_light:                   # proposed Calm-Light mapping
  surfaces:
    --bg:          '#FAFAF9'    # stone-50 · warmer than pure white
    --surface:     '#FFFFFF'
    --surface-2:   '#F4F4F5'    # zinc-100
    --surface-3:   '#E4E4E7'    # zinc-200
    --line:        '#E4E4E7'
    --line-strong: '#D4D4D8'
  ink:
    --ink:         '#18181B'    # zinc-900
    --ink-soft:    '#3F3F46'    # zinc-700
    --ink-mute:    '#71717A'    # zinc-500
    --ink-faint:   '#A1A1AA'    # zinc-400
  signal:
    --signal:      '#059669'    # emerald-600 · stronger for AA contrast on white
    --signal-soft: 'rgba(5,150,105,0.10)'
    --signal-line: 'rgba(5,150,105,0.28)'
  warm:
    --warm:        '#B45309'    # amber-700 · contrast-bumped for white ground
    --warm-soft:   'rgba(180,83,9,0.10)'

  tailwind_background_classes:
    page:          bg-stone-50
    surface:       bg-white
    raised:        bg-zinc-100
    line:          border-zinc-200

# ------------------------------------------------------------
# TYPE SCALE
# ------------------------------------------------------------
type_scale:
  --fs-meta:     0.75rem    # 12px  mono labels, chips
  --fs-label:    0.875rem   # 14px  form labels, nav items
  --fs-body:     1rem       # 16px  body
  --fs-lead:     1.125rem   # 18px  lede, large inputs
  --fs-h3:       1.375rem   # 22px  card / band title
  --fs-h2:       1.75rem    # 28px  onboarding question, section
  --fs-h1:       2.5rem     # 40px  page title
  --fs-display:  3.5rem     # 56px  reserved for hero moments

# ------------------------------------------------------------
# SPACING SPINE · 8pt
# ------------------------------------------------------------
spacing:
  --s1: 8px   --s2: 16px   --s3: 24px   --s4: 32px
  --s5: 48px  --s6: 64px   --s7: 96px

# ------------------------------------------------------------
# MOTION
# ------------------------------------------------------------
motion:
  --t: 180ms cubic-bezier(.2,.7,.2,1)
  global_reduced_motion: |
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }

# ------------------------------------------------------------
# DATA ATTRIBUTES · semantic state hooks
# ------------------------------------------------------------
data_attrs:
  task[data-done]:   "true|false"          # strike-through + tick
  due[data-when]:    "today|soon|overdue|later"
  nav-item[aria-current]: "page"           # ARIA, not data-*
  choice[aria-pressed]:   "true|false"
  task-check[role]:       "checkbox"
  task-check[aria-checked]: "true|false"

# ------------------------------------------------------------
# THE 8 CALM RULES (enforced)
# ------------------------------------------------------------
rules:
  01: Shallow navigation, single tier left rail, no hamburger
  02: Explicit labels, icons beside text, never instead of
  03: Visible focus, 3px emerald ring, never suppressed
  04: Keyboard-first, Tab=reading order, Space=toggle, Esc=close
  05: prefers-reduced-motion respected globally + asked in onboarding
  06: Colour never carries meaning alone, "due" pairs warm+word
  07: One primary action per screen, never two emerald buttons
  08: No nested tiers, cards do not contain cards
```
