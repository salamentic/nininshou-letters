import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from 'motion/react';
import 'vanilla-rough-notation';
import { prepare, layout } from '@chenglou/pretext';
import { getEnvelopePages, getEnvelopeDate } from '@/lib/parseLetters';
import type { Letter } from '@/lib/parseLetters';
import boopSfx from '@/assets/flip.wav';
import useSound from 'use-sound';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

function seededRand(seed: number, slot: number): number {
  const x = Math.sin(seed * 127.1 + slot * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function stampStyles(pageId: string): { wrapper: React.CSSProperties; img: React.CSSProperties } {
  const r = (slot: number) => seededRand(hashStr(pageId), slot);
  const rotation = r(0) * 36 - 18;
  const offsetX  = Math.round(r(1) * 8 + 4);
  const offsetY  = Math.round(r(2) * 8);
  const opacity  = 0.45 + r(3) * 0.55;
  const scale    = 0.85 + r(4) * 0.30;
  return {
    wrapper: {
      position: 'relative',
      height: 40,
      flexShrink: 0,
    },
    img: {
      position: 'absolute',
      bottom: 4 + offsetY,
      right: 4 + offsetX,
      width: 36,
      height: 36,
      pointerEvents: 'none',
      opacity,
      transform: `rotate(${rotation}deg) scale(${scale})`,
      transformOrigin: 'center',
    },
  };
}

const htmlCache = new Map<string, string>();

interface Props {
  onClose: () => void;
  number: number;
  initialPage?: number;
  language: string;
}

function LetterPage({ page, i, current, total, setPageRef, language, fontScale, onLineMeasure }: {
  page: Letter;
  i: number;
  current: number;
  total: number;
  setPageRef: (el: HTMLDivElement | null) => void;
  language: string;
  fontScale: number;
  onFlip?: () => void;
  onLineMeasure?: (lineCount: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cacheKey = `${language}/${page.paired_with || page.page}`;
  const [html, setHtml] = useState<string | null>(htmlCache.get(cacheKey) ?? null);

  useEffect(() => {
    if (htmlCache.has(cacheKey)) { setHtml(htmlCache.get(cacheKey)!); return; }
    fetch(`/letters/${language}/${page.paired_with || page.page}.html`)
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(text => { htmlCache.set(cacheKey, text); setHtml(text); })
      .catch(() => {
        const fallback = `<p class="annotation">(page not found: ${page.paired_with || page.page})</p>`;
        htmlCache.set(cacheKey, fallback);
        setHtml(fallback);
      });
  }, [cacheKey]);

  useEffect(() => {
    if (i !== current || !html || !ref.current) return;
    const containerWidth = ref.current.clientWidth;
    document.fonts.ready.then(async () => {
      const div = document.createElement('div');
      div.innerHTML = html;
      let totalLines = 0;
      for (const p of div.querySelectorAll<HTMLElement>('p.boy, p.sensei')) {
        const font = p.classList.contains('sensei') ? '18px "La Belle Aurore"' : '16px Caveat';
        const text = p.textContent ?? '';
        if (!text.trim()) continue;
        const { lineCount } = layout(await prepare(text, font), containerWidth, 26);
        totalLines += lineCount;
      }
      if (totalLines > 0) onLineMeasure?.(totalLines);
    });
  }, [html, i, current]); // eslint-disable-line react-hooks/exhaustive-deps

  // onAnimationComplete doesn't fire on initial open — draw after first paint instead.
  useEffect(() => {
    if (i !== current || !ref.current || !html) return;
    const container = ref.current;
    const raf = requestAnimationFrame(() => drawAnnotations(container));
    return () => cancelAnimationFrame(raf);
  }, [html]); // eslint-disable-line react-hooks/exhaustive-deps

  // SVG annotation positions are stale after font-scale reflow.
  useEffect(() => {
    if (i !== current || !ref.current || !html) return;
    const container = ref.current;
    const raf = requestAnimationFrame(() => drawAnnotations(container));
    return () => cancelAnimationFrame(raf);
  }, [fontScale]); // eslint-disable-line react-hooks/exhaustive-deps

  function drawAnnotations(container: HTMLElement) {
    container.querySelectorAll('rough-notation').forEach(el => (el as any).show());
  }

  return (
    <motion.div
      ref={el => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        setPageRef(el);
      }}
      animate={pageAnimate(i, current)}
      transition={{ type: 'tween', duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => {
        if (i === current && ref.current && html) drawAnnotations(ref.current);
      }}
      className="letter-page"
      style={{ ...styles.page, zIndex: total - i, ...(page.pagetype === 'manuscript' ? styles.manuscript : {}), ...(page.pagetype === 'lined' ? { background: '#fff' } : {}) }}
    >
      <motion.div
        className="letter-progress-bar"
        style={styles.progressBar}
        animate={{ scaleX: (current + 1) / total }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
      <p style={styles.label}>{page.paired_with || page.page}</p>
      <div
        className={`letter-content ${page.pagetype}`}
        style={{
          '--lc-scale': fontScale,
          flexGrow: 1,
        } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: html ?? '' }}
      />
      {(() => { const s = stampStyles(page.page); return <div className="stamp-wrapper" style={s.wrapper}><img src="/flower.png" alt="" style={s.img} /></div>; })()}
    </motion.div>
  );
}

function pageAnimate(i: number, current: number) {
  if (i >= current) return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 };
  const off = current - i;
  return {
    x: `${-82 - off * 2}%`,
    y: `${-78 - off * 2}%`,
    rotate: -14 - off * 2.5,
    scale: Math.max(0.52 - off * 0.04, 0.28),
    opacity: Math.max(0.55 - off * 0.15, 0.15),
  };
}

export default function LetterStack({ onClose, number, initialPage = 0, language }: Props) {
  const pages = useMemo(() => getEnvelopePages(number), [number]);
  const [current, setCurrent] = useState(initialPage);
  const [fontScale, setFontScale] = useState(1.0);
  const [playFlip] = useSound(boopSfx, { volume: 0.05 });
  const playFlipRef = useRef(playFlip);
  useEffect(() => { playFlipRef.current = playFlip; }, [playFlip]);

  const modalRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dirRef = useRef<1 | -1>(1);
  const accumRef = useRef(0);
  const lastFlipTime = useRef(0);
  const prevCanScrollRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const envelopeDate = getEnvelopeDate(number);

  const navigatePage = useCallback((dir: 1 | -1) => {
    setCurrent(c => {
      const next = dir === 1 ? Math.min(c + 1, pages.length - 1) : Math.max(c - 1, 0);
      if (next === c) return c;
      dirRef.current = dir;
      playFlipRef.current();
      return next;
    });
  }, [pages.length]);

  const scrollCurrentPage = useCallback((delta: number) => {
    const pageEl = pageRefs.current[current];
    if (!pageEl) return;
    const maxScrollTop = pageEl.scrollHeight - pageEl.clientHeight;
    const nextTop = Math.max(0, Math.min(pageEl.scrollTop + delta, maxScrollTop));
    if (nextTop !== pageEl.scrollTop) pageEl.scrollTo({ top: nextTop, behavior: 'smooth' });
  }, [current]);

  // progressBar(31) + label(38) + letter-content margin-top(60) + stamp(40) = 169px
  const OVERHEAD = 169;
  const handleLineMeasure = useCallback((lineCount: number) => {
    const available = (stackRef.current?.clientHeight ?? window.innerHeight) - OVERHEAD;
    // height ≈ lineCount × 26 × s² (font width and line-height both scale with s)
    const s = Math.sqrt(available / (lineCount * 26));
    setFontScale(Math.min(1.0, Math.max(0.5, s)));
  }, []);

  useEffect(() => { setCurrent(initialPage); }, [initialPage]);
  useEffect(() => { modalRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigatePage(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); navigatePage(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); scrollCurrentPage(180); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); scrollCurrentPage(-180); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, navigatePage, scrollCurrentPage]);

  useEffect(() => {
    const pageEl = pageRefs.current[current];
    if (!pageEl) return;
    pageEl.scrollTop = dirRef.current === 1 ? 0 : pageEl.scrollHeight;
    // Mobile: start scrolled right so main text is visible; left margin is off-screen.
    pageEl.scrollLeft = window.matchMedia('(max-width: 640px)').matches ? 110 : 0;
  }, [current]);

  useEffect(() => {
    const el = modalRef.current!;

    const onWheel = (e: WheelEvent) => {
      if (!modalRef.current?.contains(e.target as Node)) return;

      let node = e.target as HTMLElement | null;
      let childCanScroll = false;
      while (node && node !== el) {
        const oy = window.getComputedStyle(node).overflowY;
        if (oy === 'auto' || oy === 'scroll') {
          const scrollable = e.deltaY > 0
            ? node.scrollTop < node.scrollHeight - node.clientHeight - 1
            : node.scrollTop > 0;
          if (scrollable) { childCanScroll = true; break; }
        }
        node = node.parentElement;
      }

      if (childCanScroll) {
        prevCanScrollRef.current = true;
        accumRef.current = 0;
        return;
      }

      // Transitioning from scrollable → not-scrollable: absorb the carry-over momentum
      if (prevCanScrollRef.current) {
        prevCanScrollRef.current = false;
        accumRef.current = 0;
        return;
      }

      e.preventDefault();

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => { accumRef.current = 0; }, 200);

      const now = Date.now();
      if (now - lastFlipTime.current < 700) return;

      accumRef.current += e.deltaY;

      if (accumRef.current > 150) {
        accumRef.current = -60;
        lastFlipTime.current = now;
        navigatePage(1);
      } else if (accumRef.current < -150) {
        accumRef.current = 60;
        lastFlipTime.current = now;
        navigatePage(-1);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [navigatePage]);

  return createPortal(
    <motion.div
      ref={modalRef}
      role="dialog"
      tabIndex={-1}
      style={styles.fullPage}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'tween', duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
    >
      <div style={styles.header}>
        <span>Envelope {number}{envelopeDate ? `, ${envelopeDate}` : ''}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setFontScale(s => Math.max(0.75, +(s - 0.125).toFixed(3)))}
            style={styles.fontBtn}
            className="btn-nav desktop-only"
            disabled={fontScale <= 0.75}
          >A−</button>
          <button
            onClick={() => setFontScale(s => Math.min(1.5, +(s + 0.125).toFixed(3)))}
            style={styles.fontBtn}
            className="btn-nav desktop-only"
            disabled={fontScale >= 1.5}
          >A+</button>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            className="btn-close"
          >✕</button>
        </div>
      </div>

      <div ref={stackRef} style={styles.stack}>
        {pages.map((page, i) => (
          <LetterPage
            key={page.paired_with || page.page}
            page={page}
            i={i}
            current={current}
            total={pages.length}
            setPageRef={el => { pageRefs.current[i] = el; }}
            onFlip={playFlip}
            language={language}
            fontScale={fontScale}
            onLineMeasure={handleLineMeasure}
          />
        ))}
      </div>

      <div style={styles.footer}>
        <button className="btn-nav" style={styles.navBtn} onClick={() => navigatePage(-1)} disabled={current === 0}>‹</button>
        {pages.map((_, i) => (
          <div key={i} style={{ ...styles.dot, opacity: i === current ? 1 : 0.25 }} />
        ))}
        <button className="btn-nav" style={styles.navBtn} onClick={() => navigatePage(1)} disabled={current === pages.length - 1}>›</button>
      </div>
    </motion.div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  fullPage:    { position: 'fixed', inset: 0, background: '#f5e6c8', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100 },
  header:      { padding: '14px 16px 14px 72px', borderBottom: '1px solid rgba(90,74,58,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, fontWeight: 500 },
  stack:       { position: 'relative', flex: 1, overflow: 'hidden' },
  page:        { position: 'absolute', inset: 0, transformOrigin: 'top left', overflowY: 'auto', background: '#f5e6c8', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' },
  manuscript:  {
    backgroundImage: [
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.07'/></svg>\")",
      'radial-gradient(ellipse at 0% 0%, #b8864422 0%, transparent 50%)',
      'radial-gradient(ellipse at 100% 0%, #a07040' + '18 0%, transparent 45%)',
      'radial-gradient(ellipse at 50% 100%, #8b6030' + '22 0%, transparent 55%)',
      'radial-gradient(ellipse at 20% 40%, #c8a96e' + '18 0%, transparent 40%)',
      'radial-gradient(ellipse at 80% 60%, #d4aa6e' + '14 0%, transparent 40%)',
      'linear-gradient(160deg, #ede0c4 0%, #e8d5aa 40%, #dcc890 100%)',
    ].join(', '),
  } as React.CSSProperties,
  progressBar: { position: 'sticky', top: 0, height: 3, background: '#333', transformOrigin: 'left', marginBottom: 28 } as React.CSSProperties,
  label:       { fontSize: 18, color: '#5a4a3a', marginBottom: 16, fontFamily: "'Caveat', cursive", opacity: 0.6 },
  footer:      { padding: '12px 16px', borderTop: '1px solid rgba(90,74,58,0.2)', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' },
navBtn:      { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#555', padding: '0 8px', lineHeight: 1 } as React.CSSProperties,
  closeBtn:    { width: 32, height: 32, borderRadius: '50%', border: '1px solid #ddd', background: 'none', cursor: 'pointer', fontSize: 14, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' } as React.CSSProperties,
  fontBtn:     { background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#888', padding: '0 6px', lineHeight: 1, fontFamily: 'sans-serif', letterSpacing: '0.02em' } as React.CSSProperties,
  dot:         { width: 6, height: 6, borderRadius: '50%', background: '#333', transition: 'opacity 0.2s' },
};
