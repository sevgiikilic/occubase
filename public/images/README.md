# OccuBase Design System

A modernized design system for **OccuBase** — an *iş yeri hekimliği* (occupational
medicine / workplace health) clinical decision-support web app. Helps Turkish
occupational physicians evaluate worker fitness given diagnoses + workplace hazard
class, and returns combined work-capacity reports, restrictions, periodic-exam
intervals, and follow-up plans.

> Brief from the team: **daha modern, daha şık, daha temiz, daha user-friendly** —
> so this system intentionally moves the app off generic blue + slate toward a
> calmer, more clinical, warmer surface that reads as medical-but-not-corporate.

## Source

- **Codebase:** `sevgiikilic/occubase` (GitHub) — React + Vite + Tailwind, AI-assisted assessment via Groq.
- No Figma or slide deck was provided.

## Index

| File / folder | What it is |
| --- | --- |
| `README.md` | This file — context, content + visual foundations, iconography. |
| `SKILL.md` | Agent-Skills front-matter so this folder is portable to Claude Code. |
| `colors_and_type.css` | Base + semantic CSS variables for color, type, spacing, radius, shadow, motion. |
| `fonts/` | Webfont reference — currently sourced from Google Fonts CDN (see Visual Foundations). |
| `assets/` | Logos (`logo-mark.svg`, `logo-lockup.svg`), favicon, hero illustration, icon sprite (`icons.svg`). |
| `preview/` | Per-token specimen HTML cards rendered in the Design System tab. |
| `ui_kits/occubase-app/` | Hi-fi click-through recreation of the modernized web app. |
| `src/` | Selected files imported from the source repo for reference. |

---

## Content fundamentals

The product is in **Turkish**. Copy is short, declarative, and clinical, not
chatty. There is no first-person "I"; second-person "siz/seninle" is rare. Most
labels are nouns or nominalized verbs ("Yeni değerlendirme", "Hastalık
Kütüphanesi", "Periyodik muayene").

**Conventions:**

- **Title case** for navigation + section titles ("Genel Bakış", "Hastalık Kütüphanesi"); **sentence case** for body and descriptions.
- **All-caps eyebrows** are reserved for tiny meta labels ("İŞ YERİ HEKİMLİĞİ" under the logo lockup, "ÇALIŞMA KAPASİTESİ" above a result).
- **Numbers + units stay together** with non-breaking space-like behaviour: `12 ay`, `130/85 mmHg`, `GOLD 2`. ICD-10 codes are presented in monospace badges (`I10`, `E11.9`).
- **No emoji.** Icons do that job. Status is communicated by a coloured dot + label, never by a single emoji.
- **Capacity verdicts** read as nouns: "Tam Uygun", "Kısıtla Uygun", "Geçici Uygun Değil", "Kalıcı Uygun Değil" — short enough to fit a chip.
- **Disclaimers** are direct ("OccuBase klinik karar destek aracıdır. Sunulan bilgiler bağlayıcı tıbbi tavsiye değildir.") and live inside a soft warn-tinted box on auth + report screens.
- **Tone:** professional, calm, never marketing-cute. No exclamation marks. Errors and acute warnings are factual ("Acil önlem", "Yasal sınır aşıldı"), not apologetic.

---

## Visual foundations

### Colors

- **Pulse Teal** (`--pulse-600 #0F7A74`) is the primary. Replaces the original
  generic blue. Teal reads as medical and calmer, sits well next to warm
  neutrals, and is distinctive vs. Turkish health-tech category norms.
- **Clinic Ink** (`--ink-900 #0B1428`) is a deep almost-navy reserved for
  headings + high-contrast UI. Not pure black — keeps the page warm.
- **Warm paper** (`--paper #FBFAF7`) is the canvas. Off-white-with-a-hint-of-cream;
  borders use `--line #ECE9E1` so cards float gently rather than ruling hard.
- **Semantic:** mint `--ok`, amber `--warn`, vermillion `--risk`, sky `--info`.
  Each has a 50/100/500/600/700 ramp so we get tinted backgrounds without
  re-tinting. **Always pair the dot + label** — never colour alone.
- **Disease-category accents** (8) — cardio, endocrine, respiratory, neuro,
  musculoskeletal, psych, gi, derm — used as tile tints + icon backgrounds at
  ~12% opacity, never as full fills.

### Type

- **Display:** `Inter Tight` 600/700/800 — used for page titles, big numbers,
  stat values. Letter-spacing tightened to `-0.02em` so headings feel
  intentional, not default.
- **Body:** `Inter` 400/500/600 — UI labels, paragraphs, lists.
- **Mono:** `JetBrains Mono` 400/500 — ICD-10 codes, dates, numeric meta.
- Body baseline is **13.5 px**; pages 28 px; stat numbers 30 px. The original
  used a flatter scale; we widen it so the dashboard reads at a glance.

### Spacing, radius, shadow

- **Spacing scale** `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40` px. The default gap
  between sibling cards is **14 px**, between sections **20 px**.
- **Radii** — `10 / 11 / 12 / 14 / 16 / 18` px. Inputs 12. Cards 18. Pills 99.
  Avoid the trope of square buttons + rounded cards; everything is gently
  rounded but the *amount* changes per scale.
- **Shadows** — three flavours: `--shadow-xs` (1 px hairline for cards),
  `--shadow-sm` (8 px lift on hover), `--shadow-brand` (16 px teal-tinted lift
  on the gradient brand card only).

### Backgrounds, gradients, imagery

- Pages are **flat paper**. No textures, no patterns, no big hero images inside
  the app.
- The **only** gradient in-app is the brand card on the dashboard
  (`linear-gradient(135deg, --pulse-600, --pulse-800)`) and the login screen
  background (two soft radials of pulse-50 / pulse-200).
- Imagery, if used, should be **clinical and warm** — natural light, real
  workplaces, no stock cliché of doctors-pointing-at-tablets. The current
  `assets/hero.png` is a placeholder.

### Motion + interaction

- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`; `--t-fast: 140ms`; `--t-slow: 320ms`.
- **Hover:** background tints (e.g. button goes pulse-700; nav item picks up
  paper-deep). No scale, no glow.
- **Press:** colour deepens one step. Never shrink.
- **Focus:** 4 px `--pulse-50` ring + 1 px `--pulse-500` border. Always visible.
- **Card hover (clickable cards only):** translateY(-1px) + `--shadow-sm`.
  Static cards don't lift.
- Coverage bars in the dashboard animate width with `--t-slow`. No bounces, no
  spring physics.

### Borders, dividers, transparency

- Outer borders use `--line`; in-card dividers use `--line-soft` (~50% lighter).
- Transparency + blur are **not** part of the system. Avoid `backdrop-filter`,
  glass cards, etc. The vibe is paper, not glass.

---

## Iconography

- **Custom icon set** lives at `assets/icons.svg` — a single SVG sprite with 30+
  domain glyphs (dashboard, clipboard, stethoscope, alert-triangle, lock, eye,
  flask, lungs, brain, joint, bone, heart-pulse…). All glyphs share a **1.5 px
  stroke, rounded caps + joins, 20×20 viewport**, designed to sit on a 24 px
  hit target.
- The same set is mirrored as inline JSX in `ui_kits/occubase-app/Icons.jsx`
  so React components can render them without a fetch.
- **No emoji.** No unicode glyph hacks (no `✓`, `▲`, `→` as icon
  substitutes — those are reserved for math/copy content only).
- **No third-party icon library** is required. If a glyph is missing, add it to
  the sprite using the same stroke / corner spec — do **not** mix in Lucide,
  Heroicons, FontAwesome, etc. (those have subtly different geometry and break
  the rhythm of the rail).
- Disease-category icons are also part of the custom set (heart, lungs, brain,
  joint, etc.) so the category tiles feel intentional rather than emoji-tagged.

---

## Caveats / known substitutions

- **Fonts:** the source repo used Tailwind's default `font-sans` stack (mostly
  Inter via system). We've upgraded display to **Inter Tight** and kept body as
  Inter; both are pulled from Google Fonts at runtime. If the team has bespoke
  webfonts they'd like to standardize on (e.g. a Turkish-aware geometric),
  drop the `.woff2` files into `fonts/` and we'll wire them in.
- **Hero illustration** (`assets/hero.png`) is a placeholder — replace with a
  real workplace photo when available.
- **No Figma / slide template** was attached, so there are no sample slides
  generated under `slides/`.
