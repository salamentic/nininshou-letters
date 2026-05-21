# 二人称 (Nininshou)

An interactive web reader for the *二人称* letter correspondence — 32 envelopes containing letters and poems exchanged between a boy and his sensei, presented as a physical letter-reading experience.

## What it does

- 32 envelopes in a scrollable card stack; click to flip and open
- Letters rendered as paginated stacks with page-flip animations
- Per-envelope Spotify embed and background art
- Burger menu for jumping directly to any envelope or page
- Hover annotations for translations and notes

## Running

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Project structure

```
src/
├── App.tsx                          # Root — owns envelope state, keyboard nav, arrows
├── styles.css                       # Global CSS + letter content classes
│
├── assets/
│   ├── nininshou.json               # Envelope metadata (no longer stores body text)
│   └── spotify_embeds.json          # Spotify URLs keyed by envelope index
│
├── components/
│   ├── Envelope.tsx                 # Single envelope: flip + open + modal
│   ├── EnvelopeStackScrollable.tsx  # Scrollable card stack
│   ├── LetterStack.tsx              # Modal letter reader
│   ├── BurgerMenu.tsx               # Slide-in nav drawer
│   └── SpotifyPlayer.tsx            # Floating Spotify embed
│
└── lib/
    └── parseLetters.ts              # Data access over nininshou.json

public/
└── letters/
    ├── 1-1.html                     # One HTML file per letter page
    ├── 1-3.html
    └── ...                          # 167 pages total

scripts/
└── generate-html-pages.mjs          # Regenerates HTML from nininshou.json
```

## Letter pages (HTML)

Each page is a standalone HTML fragment at `public/letters/{page-id}.html`. The renderer fetches it at runtime and injects it into the modal. You can use any HTML — the following classes are styled:

```html
<!-- Author voices -->
<p class="boy">boy's handwriting — Caveat, dark brown</p>
<p class="sensei">sensei's handwriting — La Belle Aurore, red</p>

<!-- Inline styles -->
<span class="strikethrough">crossed out</span>
<span class="underline">underlined</span>
<span class="scribble">tilted, faded — like a margin note</span>

<!-- Block elements -->
<span class="annotation">* footnote or correction</span>
<img src="/letters/images/sketch.png" alt="" />

<!-- Hover annotation (translation tooltip) -->
<span class="note" data-note="translation or gloss here">日本語</span>
```

To regenerate all pages from the JSON (resets edits):
```bash
node scripts/generate-html-pages.mjs
```

## Page types

Controlled by `pagetype` in `nininshou.json`:

| Type | Background |
|---|---|
| `manuscript` | Warm parchment with paper grain texture and sepia ruled lines |
| `lined` | White with blue ruled lines |

Ruled lines are aligned to the font baseline using Canvas `measureText` for pixel accuracy.

## Envelope metadata (`nininshou.json`)

```ts
interface Envelope {
  envelope:      number;        // 1-based
  spotify_embed: string;
  pages:         Letter[];
}

interface Letter {
  page:     string;             // page ID + display label, e.g. "1-1"
  date:     string | null;
  author:   'boy' | 'sensei';  // used for font baseline measurement
  pagetype: 'lined' | 'manuscript';
  stamp:    boolean;
  translated_by: string;
  body:     string;             // fallback if HTML file is missing
}
```

## Adding content

**New envelope:**
1. Add an entry to `nininshou.json`
2. Add `public/nininshou_table_N.png` (N = 0-based index)
3. Add a Spotify URL to `spotify_embeds.json` (key = 0-based index, or `""`)
4. Bump `ENVELOPE_COUNT` in `src/App.tsx`
5. Create `public/letters/{page-id}.html` for each page

**New page in an existing envelope:**
1. Add a `Letter` entry to `nininshou.json`
2. Create `public/letters/{page-id}.html`

## Tech stack

| Library | Use |
|---|---|
| React 19 | UI |
| Vite | Build + dev server |
| TypeScript | Types |
| `motion/react` | All animations |
| `use-sound` | Sound effects |
| `@chenglou/pretext` | Font baseline measurement for line alignment |
| Tailwind CSS | Utility classes |
