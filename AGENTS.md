# Baynana repository guide

- Application root: `site/`. Static Arabic RTL HTML/CSS/ES modules, no backend or runtime dependencies.
- Read `PRODUCT.md`, `site/README.md`, and `site/docs/{SAFETY_MODEL,PRIVACY_DATA_MAP,ACCESSIBILITY_QA}.md` before changing core flows.
- Four separate engines: `scoring.js`, `alignment.js`, `conversation.js`, `knowledge.js`; view dispatch lives in `app.js` and hash routes in `router.js`.
- Storage access belongs in `storage.js`. Same-device answers and private safety state are session-only. Share codecs must allowlist aggregates; never encode raw answers or notes.
- Preserve authentic data under `site/data/` and the legacy assessment fingerprint. No relationship score, diagnosis, suitability verdict, invented claims, or traffic-light preference grading.
- Preserve double-Escape quick exit, sensitive gates, one H1 per view, keyboard focus, labelled controls, RTL and reduced motion. Build DOM with `dom.js`, never user-controlled HTML.
- CSS uses semantic tokens and logical properties. Fonts are self-hosted. No inline styles in markup; CSP forbids third-party requests and connections.
- Run `npm test` in `site/` before and after changes. See README for build, browser tests and static deployment commands.
- Keep design prototypes separate from production output. Never publish personal test artifacts or browser state.
