# 二人称 (Nininshou)

An interactive web reader for the *二人称* letter correspondence — 32 envelopes containing letters and poems exchanged between a boy and his sensei, presented as a physical letter-reading experience.

## What it does

- Displays 32 envelopes in a scrollable card stack
- Click an envelope to flip it over, then open it to read its letters
- Each letter is displayed as a paginated stack with scroll-progress tracking
- A per-envelope Spotify embed plays music associated with each letter set
- Background art changes to match the selected envelope
- A burger menu lets you jump directly to any envelope or specific page

## Running the project

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## Project structure

```
src/
├── App.tsx                          # Root component — owns all shared state
├── main.tsx                         # React entry point
├── styles.css                       # Global CSS (envelope card, flap, layout)
├── index.css                        # Body/root baseline styles
├── global.d.ts                      # Asset type declarations (wav, png, svg)
│
├── assets/
│   ├── nininshou.json               # All letter content (source of truth)
│   ├── spotify_embeds.json          # Spotify embed URLs keyed by envelope number
│   ├── sample_envelope.png          # Envelope front image
│   ├── sample_envelope_back.png     # Envelope back image
│   ├── envelope.wav                 # Sound for opening an envelope
│   └── flip.wav                     # Sound for flipping a letter page
│
├── components/
│   ├── Envelope.tsx                 # Single envelope card with flip + open animation
│   ├── EnvelopeStackScrollable.tsx  # Scrollable card stack that holds all envelopes
│   ├── LetterStack.tsx              # Modal letter reader with page-flip animation
│   ├── BurgerMenu.tsx               # Slide-in nav drawer (envelope + page links)
│   └── SpotifyPlayer.tsx            # Floating Spotify iframe embed
│
└── lib/
    ├── parseLetters.ts              # Data access layer over nininshou.json
    └── utils.ts                     # `cn()` — Tailwind class merge helper
```

## Data format (`nininshou.json`)

The entire letter corpus lives in `src/assets/nininshou.json` as an array of `Envelope` objects:

```ts
interface Envelope {
  envelope:      number;        // 1-based envelope number
  date?:         string | null;
  spotify_embed: string;        // Spotify embed URL (or "" if none)
  pages:         Letter[];
}

interface Letter {
  page:          string;        // Label shown in the UI, e.g. "1-1"
  date:          string | null;
  author:        'boy' | 'sensei' | 'mixed';
  pagetype:      'lined' | 'manuscript'; // Controls page background style
  stamp:         boolean;
  translated_by: string;
  body:          string;        // Full text (used when segments is absent)
  paired_with?:  string;        // Optional pairing with another page
  segments?:     Segment[];     // Used for mixed-author pages
}

interface Segment {
  author: 'boy' | 'sensei';
  text:   string;
}
```

**Author styles:**
- `boy` — dark brown ink (`#5a4a3a`), Indie Flower font, 14px
- `sensei` — red ink (`#c0392b`), Cookie font, 18px
- `mixed` — rendered as a list of `Segment` objects, each styled by their own author

**Page types:**
- `manuscript` — warm parchment background (radial gradient on `#f5e6c8`)
- `lined` — white background with blue horizontal rule lines

## Component guide

### `App.tsx`
The root. Owns `currentEnvelope` (0-indexed), splash screen logic, and `closeSignal` (a counter that tells all envelopes to close simultaneously when the burger menu opens). Renders the background image, tab bar, and all major children.

**Key state:**
| State | Purpose |
|---|---|
| `currentEnvelope` | Which envelope is active (0-indexed) |
| `triggerPage` | Deep-link a specific page in a specific envelope from the burger menu |
| `closeSignal` | Incremented to broadcast "close everything" to all Envelope instances |
| `ready` | Splash screen — waits for fonts + background image to load |

---

### `EnvelopeStackScrollable.tsx`
A generic scrollable card stack. Accepts any `children` array. The active card sits at center; cards below are offset slightly upward to peek. Supports mouse wheel, keyboard arrows, Home/End, and touch swipe.

**Key constants** (tweak to adjust feel):
```ts
CARD_HEIGHT = 300          // px height of each card slot
FRAME_OFFSET = -9          // px each card peeks above the one in front
FRAMES_VISIBLE_LENGTH = 4  // how many cards peek
SCROLL_THRESHOLD = 20      // min wheel deltaY to trigger a scroll
TOUCH_SCROLL_THRESHOLD = 100 // min touch drag distance
```

---

### `Envelope.tsx`
A single envelope card. Three visual states:

1. **Front** — shows envelope number and date; clicking flips the card
2. **Back** — shows the envelope back; clicking opens the flap and launches the letter modal
3. **Modal open** — renders `LetterStack` as a portal

Animation is coordinated through props:
- `triggerPage` — non-null value triggers a flip + open + jump to a specific page (from burger menu)
- `closeSignal` — when it changes, immediately resets all state to closed

---

### `LetterStack.tsx`
The letter reading modal. Renders as a `createPortal` onto `document.body`.

Pages are laid out as absolutely-positioned divs stacked on top of each other. The `current` index controls which page is "on top" — pages before `current` animate off to the upper-left (simulating being flipped away). See `pageAnimate()` for the exact transform values.

**Scroll handling:** The modal intercepts `wheel` events. If the active page has scrollable content and isn't at its end, scrolling scrolls the page text. Once the page reaches its end, continued scrolling flips to the next page. An accumulator + 700ms debounce prevents accidental rapid flips.

**Navigation:**
- Mouse wheel (with scroll-to-end → page-flip behavior)
- `←` / `→` arrow keys
- Prev/Next buttons in the footer
- `Escape` closes the modal

---

### `BurgerMenu.tsx`
A slide-in panel from the left. Lists all envelopes; clicking an envelope expands it to show its individual pages. Clicking a page fires `onPageSelect`, which updates `currentEnvelope` in App and sets `triggerPage` to open that letter directly.

Opening the menu also fires `onOpen` → plays the envelope sound and increments `closeSignal` to collapse any open envelope.

---

### `SpotifyPlayer.tsx`
A fixed-position Spotify iframe anchored above the tab bar. Fades in/out when `link` changes. The link comes from `spotify_embeds.json`, keyed by envelope number.

---

### `lib/parseLetters.ts`
The only file that imports `nininshou.json`. Exports two helpers:

```ts
getEnvelopePages(number: number): Letter[]   // 1-indexed
getEnvelopeDate(number: number): string      // first non-null date in the envelope
```

---

## Adding content

**New envelope:**
1. Add an entry to `src/assets/nininshou.json` with the next `envelope` number and its `pages`
2. Add a background image `public/nininshou_table_N.png` where N is the new envelope index (0-based)
3. Optionally add a Spotify embed URL to `src/assets/spotify_embeds.json` with the key `"N"` (0-based)
4. Bump `ENVELOPE_COUNT` in `src/App.tsx`

**New page in an existing envelope:**
Add a `Letter` object to the `pages` array of the relevant envelope in `nininshou.json`. The `page` field is the display label (e.g. `"3-7"`).

## Tech stack

| Library | Use |
|---|---|
| React 19 | UI framework |
| Vite | Build tool and dev server |
| TypeScript | Type safety |
| `motion/react` (Framer Motion) | All animations |
| `use-sound` | Envelope and page-flip sound effects |
| Tailwind CSS | Utility classes (via `cn()` helper) |
