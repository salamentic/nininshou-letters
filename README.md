# 二人称 (Nininshou)

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white&labelColor=20232a)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)

→ [How to write letter pages](LETTERS.md)

An interactive web reader for 二人称.

## Running

```bash
npm install        # install dependencies
npm run dev        # start dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

> Requires Node 18+. Deploy `dist/` to any static host.

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
| `motion/react` | Animations |
| `use-sound` | Sound effects |
| Tailwind CSS | Utility classes |
