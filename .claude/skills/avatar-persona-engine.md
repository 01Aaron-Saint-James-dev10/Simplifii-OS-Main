---
name: avatar-persona-engine
description: Maps the 20 Sovereign avatar IDs to five archetype primitives + Grit-driven visual response.
---

# Sovereign Avatar Persona Engine

The face of the system. Twenty IDs grouped into five categories; each category resolves to a single archetype SVG primitive in `src/frontend/AvatarVault.js`. Variations within a category come from per-ID accent shifts (hue, animation phase) rather than five wholly distinct illustrations. This is the rule that keeps the avatars from sliding into AI slop: same skeleton, different stance.

## Mapping

| ID range | Stream | Archetype | Vibe |
|---|---|---|---|
| 01 to 05 | Primary (K-6) | **Mango** | Vibrant rounded geometric shape with expressive emerald eyes. Bouncy idle animation. |
| 06 to 10 | Secondary (Y7-10) | **Cipher** | Floating wireframe cube. Edges assemble as Section Health climbs; disassemble on regression. |
| 11 to 15 | Tertiary (Uni / MRes) | **Atlas** | Minimalist marble bust silhouette with emerald data-veins. Calm, professional, grounded. |
| 16 to 18 | Specialist | **Vera** | Sharp monocle / scanning lens graphic. Pulses during the Handshake portal scan phase. |
| 19 to 20 | Creative | **Loom** | Fluid silk-like light trail. Hue shifts with creative flow state. |

## Grit response

When `gritLevel === 'socratic'`, the active avatar pulses with a sharper Emerald glow to signal Deep Focus Mode. When `gritLevel === 'literal'`, the avatar holds a steady soft fill. This is a render-layer effect (CSS `filter` and `box-shadow` on the wrapping container); the SVG primitive does not change.

## Steps

1. **Resolve.** Call `getAvatarById(id, { gritLevel })` from `AvatarVault.js`. The function returns the React component for the matching archetype. Out-of-range IDs fall back to Atlas.
2. **Surface.** Use the returned component anywhere a student-facing identity is needed: top-nav avatar, Steering Drawer header, Authenticity Pulse indicator, IdleNudge avatar (replacing the current "M" letter for Primary).
3. **Accessibility.** Every avatar carries an `aria-label` like "Mango: Primary stream guide" so screen readers name the persona, not just "image".
4. **Constraint.** Never use complex gradients, photographic textures, or generated illustrations. Sovereign palette only: Jet Black `#0A0A0A`, Emerald `#50C878`, Cream `#FDFDFD`. Bold lines, geometric symmetry, single accent colour per archetype.

## Out of scope

- Twenty distinct hand-drawn SVGs. Five archetypes with per-ID accent variation is the supported design today; commissioning twenty bespoke illustrations is a design-pass, not a code task.
- Animated rigs (skeletal animation, lip-sync). Idle animations are CSS keyframes only.
