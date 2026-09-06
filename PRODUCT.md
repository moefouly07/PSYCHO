# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two Arabic-speaking adults in a serious romantic relationship or engagement (خطوبة), in the period before marriage. They use the product privately, each on their own device, usually alone in a quiet moment — not in front of family or an outside authority. Arabic is the only language; the interface is RTL.

## Product Purpose

A private, self-guided space for a couple to understand themselves and each other more clearly before marriage: individual self-assessments, neutral preference-alignment maps, a library of conversation-starting questions, and a lightweight "how well do you know your partner" game. Success is a clearer, calmer conversation between the two of them — never a verdict, score, or recommendation about the relationship itself.

## Positioning

Refuses the thing every competing "compatibility" product sells: it will not produce a compatibility score, will not predict whether the relationship or marriage will succeed, will not diagnose either person, and will not verify religious identity or suitability. Where most tools turn intimacy into a number, بيننا turns it into a documented, private conversation. Runs entirely client-side — no accounts, no server storage of answers, nothing uploaded — which is a product claim, not just an implementation detail, given how sensitive the content is.

## Operating Context

Used at home, on a phone or laptop, typically in the run-up to an engagement or wedding — alongside (not instead of) the other rituals Arab/Muslim couples already go through before marriage: family meetings, a premarital sit-down with an imam or elder, and practical joint tasks like drawing up the household/furniture list (قائمة الجهاز) together. The product is a private supplement to that process, used by the couple alone, not administered by a third party.

## Capabilities and Constraints

- Four content engines, deliberately kept distinct in the UI: scored behavioral assessments (20, six dimensions each), unscored neutral alignment maps (same/close/different/not-yet-discussed), a conversation-question library, and a same-session partner-knowledge challenge.
- No backend: static HTML/CSS/JS, hash-based routing, `localStorage`/`sessionStorage` only, deployed to Vercel/GitHub Pages.
- Safety gating on sensitive assessments (jealousy, anger, narcissistic traits, cruelty indicators) and a quick-exit mechanism (Escape twice) on sensitive views.
- Comparison between partners happens via a share code that carries only aggregated results, never raw answers, and same-device comparison purges from `sessionStorage` when the session ends.
- These are evidence-informed original self-assessments, not validated clinical instruments — the product must never imply otherwise.

## Brand Commitments

None fixed. The current name "بيننا" (Baynana), its two-overlapping-circles mark, and its current visual system are all open to reconsideration as part of this redesign; nothing here is a locked brand asset. Preserve the underlying product truth above regardless of what name or visual identity the redesign lands on.

## Evidence on Hand

No real customer photography, testimonials, logos, or case studies exist or should be fabricated — this is a solo-built, personal, unreleased project with no user base yet. Redesign work must stay abstract/iconographic: no real people's photos, no invented user quotes or usage statistics. Existing written content (assessment items, conversation questions, safety and privacy copy) is real product content and should be treated as authentic material to carry forward, not placeholder text.

## Product Principles

1. Privacy and non-judgment are the product, not a feature — every visual and interaction decision should read as protective rather than performative.
2. Never imply a score, verdict, or prediction about the relationship, even ambiently (no "compatibility meter" visual language).
3. Warm and dignified over cute or clinical — the subject (a couple preparing for marriage) is emotionally significant, not gamified.
4. Arabic-first, RTL-native: typography, iconography, and layout should feel authored for Arabic, not translated from an English template.
5. Calm pacing: this is a private, unhurried tool used in a quiet moment, not a conversion-optimized funnel.

## Accessibility & Inclusion

Existing accessibility work is documented in `docs/ACCESSIBILITY_QA.md` (one H1 per view, accessible names on every control, ARIA state on progress/meter widgets, no color-only signaling) — preserve this bar through the redesign.
