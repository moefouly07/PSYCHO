---
name: "بيننا — Baynana"
description: "Modern Arabic Editorial: a private reading space for two perspectives."
colors:
  canvas: "#f4f0e8"
  surface: "#fffcf6"
  elevated: "#eae3d8"
  ink: "#29251f"
  ink-soft: "#514a42"
  muted: "#655d54"
  border: "#d8cebf"
  border-strong: "#877a69"
  primary: "#6c2944"
  primary-hover: "#542037"
  primary-soft: "#f1e2e7"
  on-primary: "#ffffff"
  accent: "#505d49"
  accent-soft: "#e9eddf"
  danger: "#952f36"
  danger-soft: "#fae8e6"
  warning: "#79511b"
  warning-soft: "#f5e9d6"
  dark-canvas: "#1b1916"
  dark-surface: "#25211d"
  dark-elevated: "#302a24"
  dark-ink: "#f4ecdf"
  dark-ink-soft: "#ddd0bf"
  dark-muted: "#c0b3a1"
  dark-border: "#50463b"
  dark-border-strong: "#978977"
  dark-primary: "#e5a6bc"
  dark-primary-hover: "#f6c4d5"
  dark-primary-soft: "#3b2931"
  dark-on-primary: "#291720"
  dark-accent: "#bac9a8"
  dark-accent-soft: "#2b3326"
  dark-danger: "#ffafb0"
  dark-danger-soft: "#45292a"
  dark-warning: "#edc285"
  dark-warning-soft: "#3d3020"
typography:
  display:
    fontFamily: "Markazi Text, Georgia, serif"
    fontSize: "clamp(2.8rem, 2rem + 3vw, 4.8rem)"
    fontWeight: 500
    lineHeight: 1.16
  headline:
    fontFamily: "Markazi Text, Georgia, serif"
    fontSize: "clamp(2.1rem, 1.7rem + 1.4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Markazi Text, Georgia, serif"
    fontSize: "clamp(1.65rem, 1.5rem + .5vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans Arabic, Segoe UI, Tahoma, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "IBM Plex Sans Arabic, Segoe UI, Tahoma, sans-serif"
    fontSize: ".9375rem"
    fontWeight: 800
    lineHeight: 1.65
rounded:
  sm: "5px"
  md: "8px"
  lg: "12px"
  pill: "6px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "72px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-soft:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: ".7rem .95rem"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: ".55rem .95rem"
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "clamp(20px, 3vw, 32px)"
---

# Design System: بيننا — Baynana

## Overview

**Creative North Star: "Modern Arabic Editorial"**

A warm Arabic reading space, paced through display typography, paper surfaces, fine rules, and clear text. Plum carries actions and editorial emphasis; olive supplies a restrained second voice. The application distinguishes assessments, neutral alignment maps, conversation questions, and partner knowledge through their content and reading structures.

This records the built static RTL application in `site/`, principally its four stylesheets and the rendered DOM assembled by its ES modules. It records the actual palette and modestly rounded controls, rather than copying the provisional brief's different hex values or stricter radius range. The homepage uses an asymmetric opening, a ruled directory, a neutral alignment section, and a typographic conversation excerpt; its particular composition is not mandatory for every view.

**Key Characteristics:**

- Arabic display serif paired with a practical Arabic sans serif.
- Warm paper, plum actions, and restrained olive supporting color in light and dark themes.
- Rules and spacing organize reading; numeric data remains local to its content engine.
- Text labels preserve meaning across themes, states, and mobile layouts.

## Colors

The palette combines warm paper and ink with muted plum, olive, and ochre.

### Primary

**Editorial plum** is the primary action, link, focus, and selected-state family. Primary soft supplies quiet emphasis behind selected answers and result surfaces. Dark mode uses a lighter plum and dark text on filled primary controls.

### Secondary

**Restrained olive** supports secondary content, individual dimension bars, and the second series in assessment comparisons. It is not a favorable relationship verdict.

### Tertiary

**Ochre** supports caution messaging. **Muted red** marks destructive actions, invalid fields, and safety notices. These meanings must not migrate into preference grading.

### Neutral

**Warm canvas**, **paper surface**, and **elevated paper** distinguish page, content, and supporting areas. Ink, soft ink, and muted ink form the text hierarchy. Border and strong border divide and outline content. Dark mode swaps the same semantic CSS properties; `dark-` frontmatter entries document those existing overrides, not additional UI roles.

**The Neutral Comparison Rule.** Alignment statuses use written descriptions and neutral borders; same, close, different, unsure, and skipped are not traffic-light grades. Dashed and dotted borders supplement selected status labels.

## Typography

**Display Font:** Markazi Text, with Georgia and serif fallbacks, self-hosted as a variable font.

**Body Font:** IBM Plex Sans Arabic, with Segoe UI, Tahoma, and sans-serif fallbacks, self-hosted in regular, medium, and semibold files.

The broad display serif gives headings an editorial voice. The sans serif keeps questions, controls, and long explanations readable. Sizes are fluid where the source uses clamps; there is no single geometric type ratio.

### Hierarchy

- **Display:** the large opening headline uses the frontmatter display role; chapter headings also use the lighter display weight.
- **Headline:** page H1 and major section headings use the headline scale.
- **Title:** ordinary H2 uses the smaller display title scale.
- **Body:** regular reading text uses the body role. H3 switches to the body family; question prompts also use the body family with generous leading.
- **Label:** compact control text uses the label role. Fine print is regular weight; smaller badges and chips use the existing extra-small size token.

**The Reading Order Rule.** In the shared assessment comparison header, the H1 precedes partner metadata and explanation. Reuse that meaningful hierarchy when extending this comparison surface.

## Layout

The page is Arabic and RTL. Use logical padding, margins, borders, and positions. The shell is capped at 1200px with fluid side gutters (`clamp(20px, 4vw, 40px)`); narrow reading content uses a 720px content cap and results use 980px, with gutters added by their container rules. Stack spacing follows the frontmatter scale.

The opening has a 2:1 grid, while editorial chapters use equal columns. At 784px these layouts stack; result sidebars also become vertical. Alignment comparison tables are replaced at this breakpoint by one article per item, with a question heading and a definition list for each person's answer and the classification. This preserves the same item-level information on mobile.

The navigation collapses at 960px. The secondary privacy header link hides at 900px. At 620px many grids collapse and buttons generally fill their available width, with local quiz-navigation exceptions. Secondary catalog grids also have a 992px adjustment. Preserve component-specific breakpoints rather than treating the stale breakpoint comment in the token file as exhaustive.

## Elevation & Depth

Depth comes primarily from paper tones and borders. Shared cards have no ambient shadow, and primary buttons have no shadow. A single soft lift is used by transient layers such as the mobile menu, confirmation dialog, and focused skip link. Dialogs also dim and blur the page behind them. Selected answer controls use an inset outline to reinforce state.

**The Paper Surface Rule.** Keep ordinary reading surfaces flat; use the existing lift only for the transient layers that already need separation from the document.

Motion is short and functional: fast state changes and a gentle view opacity entrance. Reduced-motion preferences suppress animation and shorten transitions; do not add movement as a reading requirement.

## Shapes

Controls have small corners; the token named `pill` is a modest radius, not a capsule. General containers retain larger soft corners, while questions and shared comparison insights use square, open rows with a single top rule. The built system therefore includes both contained task panels and unboxed editorial lists.

The two-circle SVG mark is an existing identity motif. Functional icons use SVG or CSS construction. Imagery is not required to establish the visual hierarchy.

## Components

### Buttons

Compact, deliberate actions. Primary is plum with contrasting text; secondary is paper with a strong outline; soft uses the pale plum surface; destructive uses the danger family. Standard buttons have a 44px minimum height. Hover changes fill or border, visible keyboard focus uses a three-pixel outline with a three-pixel offset, and disabled controls reduce opacity. Preserve labels and visible focus.

### Chips

Small outlined filters with written labels. Hover and pressed states invert to ink and paper. Actual interactive chips preserve a 44px minimum target. Alignment status badges remain separate neutral descriptions, not selectable filters.

### Cards / Containers

Paper panels use a border, the larger radius, fluid padding, and no shadow. Soft panels mix paper with pale plum. Questions and shared comparison insights use open ruled rows instead of nested colored cards.

### Inputs / Fields

Inputs and textareas use paper fill, strong borders, the small radius, and explicit labels. Placeholders use muted text; invalid fields change border color and rely on accompanying application feedback. Shared global focus remains visible. Share-code blocks isolate left-to-right text without changing the surrounding Arabic reading direction.

### Navigation

The sticky masthead is opaque canvas with a fine lower border. Display typography names the product. Desktop navigation uses sans-serif labels and an underline for hover/current state. Smaller screens expose a labelled menu button and a vertically ruled menu; active links retain text and state attributes.

### Comparison Reading Rows

Assessment comparisons pair plum and olive series by dimension with labels and descriptive gaps. They do not produce an overall relationship score. Shared insights use a top rule, transparent background, no corner treatment, and vertical spacing. Alignment comparisons instead use neutral classifications, a desktop table, and mobile item articles; their counts are counts of classifications, not scores.

## Do's and Don'ts

### Do:

- **Do** use the semantic CSS properties so light and dark themes preserve the same roles.
- **Do** preserve Arabic reading order, one H1 per view, labelled controls, keyboard focus, and reduced motion.
- **Do** keep alignment descriptions explicit and neutral on desktop and mobile.
- **Do** keep display typography for editorial hierarchy and body typography for questions and controls.
- **Do** preserve sensitive gates and the double-Escape quick exit when extending a flow.

### Don't:

- **Don't** introduce an overall relationship score, diagnosis, suitability verdict, or traffic-light preference grading.
- **Don't** invent testimonials, user counts, photography, or scientific validation.
- **Don't** load third-party fonts or assets, add inline markup styles, or insert user-controlled HTML.
- **Don't** promote leftover eyebrow labels or the old favicon palette into the editorial system.

Not canonized: legacy eyebrow usages, a glyph breadcrumb separator, and the old purple favicon remain source residue outside the reviewed fixes; they are not patterns to inherit. This documentation does not expand the scoped finish review into a claim that every route is free of visual defects.