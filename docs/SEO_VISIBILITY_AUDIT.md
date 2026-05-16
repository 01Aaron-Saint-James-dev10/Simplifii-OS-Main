# SEO and AI Visibility Stress Test
**Date:** 2026-05-16
**Status:** Logged. Not yet implemented.

---

## Current State: Zero Visibility

The app lives at simplifii-os-main.vercel.app with no meta tags, no structured data, no public content pages, no blog, no sitemap. Google cannot index a React SPA that requires login. Everything is behind auth. There is nothing for Google to crawl.

---

## Five Layers of Visibility Required

### Layer 1: Technical SEO (foundation, currently missing)
- Public marketing site at simplifii.com.au (separate from app)
- Proper title and meta description tags per page
- Open Graph tags for social sharing
- sitemap.xml listing all public pages
- robots.txt allowing crawling of public pages
- Page load under 3 seconds
- Mobile-first confirmed

### Layer 2: AI Visibility (2026 battleground)
- llms.txt file at simplifii.com.au/llms.txt
- Public content pages AI models can read and index
- JSON-LD schema markup (EducationalSoftware product)
- Semantic relevance for queries like "best study tool for neurodiverse students"

### Layer 3: Content SEO (long game)
Target pages needed:
- "How to decode a university rubric"
- "Study help for ADHD students Australia"
- "HSC study planner free"
- "How to write a literature review step by step"
- "AI study tool that does not do the work for you"
- "Best study app for dyslexic students"
- "Free homework help app for Year 10"

### Layer 4: Trust Signals
- Privacy policy page (exists at /privacy)
- Terms of service page (exists at /terms)
- Student data protection statement
- About page (founder story, UNSW, awards)
- Press/recognition mentions

### Layer 5: Directory Listings
- eLearning Industry directory
- Product Hunt launch
- AlternativeTo (alternative to Notion, Google Docs for studying)
- Australian EdTech directories
- G2/Capterra (when reviews exist)
- Reddit communities (r/ADHD, r/auslaw, r/unimelb, r/unsw)

---

## Compliance and Safety (Not Yet Addressed)

### Legal
- Australian Privacy Act 1988 compliance
- Children under 13: parental consent flow needed
- GDPR for EU users
- AI disclosure requirements
- Disability Discrimination Act (WCAG 2.2 AA legally required)

### Security
- No penetration testing done
- Rate limiting in-memory (resets on cold start)
- No security headers (CSP, X-Frame-Options)
- API key never rotated

### Performance
- No load testing (100 concurrent users?)
- No caching for repeated AURA calls on same document
- WebGL context loss on mobile (GPU memory pressure)

### Business Continuity
- Single AI provider (Anthropic). No fallback.
- Single hosting (Vercel). No backup.
- No offline mode tested

### Accessibility
- WCAG 2.2 AA never audited by screen reader
- Keyboard navigation never end-to-end tested
- Colour contrast unverified on dark theme
- WebGL orb inaccessible to screen readers

### User Safety
- Crisis detection never tested with real distress
- Under-18 safeguarding flow untested
- No content moderation on user text sent to AI
- No abuse prevention

### Operational
- No error monitoring (Sentry)
- No analytics (no dropout visibility)
- No feature flags
- zod/v3 hook error fires every session (unfixed)

---

## Priority Sequence (for a solo founder with CFS)

1. Technical SEO (2 hours: meta tags, sitemap, OG tags)
2. llms.txt + JSON-LD schema (1 hour)
3. Privacy/Terms pages verified working (30 min)
4. About page with founder story (2 hours)
5. 3 content SEO pages (6 hours)
6. Product Hunt prep (4 hours)
7. Everything else: after tester validation

---

**End of SEO audit. Saved for future session.**
