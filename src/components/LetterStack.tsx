import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { annotate } from 'rough-notation';
import { getEnvelopePages, getEnvelopeDate } from '@/lib/parseLetters';
import type { Letter } from '@/lib/parseLetters';
import boopSfx from '@/assets/flip.wav';
import useSound from 'use-sound';

/** Hash a string to a stable integer seed. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

/** Deterministic value in [0, 1) from a seed + slot so stamp stays the same on re-open. */
function seededRand(seed: number, slot: number): number {
  const x = Math.sin(seed * 127.1 + slot * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function stampStyle(pageId: string): React.CSSProperties {
  const r = (slot: number) => seededRand(hashStr(pageId), slot);
  const rotation = r(0) * 36 - 18;        // –18° … +18°
  const offsetX  = r(1) * 12 - 6;         // –6 … +6 px from right edge
  const offsetY  = r(2) * 12 - 6;         // –6 … +6 px from bottom edge
  const opacity  = 0.45 + r(3) * 0.55;   // 0.45 … 1.0 (ink strength)
  const scale    = 0.85 + r(4) * 0.30;   // 0.85 … 1.15 (stamp size)
  return {
    position: 'absolute',
    bottom: offsetY,
    right: offsetX,
    width: 36,
    height: 36,
    pointerEvents: 'none',
    opacity,
    transform: `rotate(${rotation}deg) scale(${scale})`,
    transformOrigin: 'center',
  };
}

const htmlCache = new Map<string, string>();
const ruleOffsetCache = new Map<string, number>();
let sharedCanvas: HTMLCanvasElement | null = null;

const LINE_HEIGHT = 26;

function getRuleOffset(font: string): number {
  if (ruleOffsetCache.has(font)) return ruleOffsetCache.get(font)!;
  if (!sharedCanvas) sharedCanvas = document.createElement('canvas');
  const ctx = sharedCanvas.getContext('2d')!;
  ctx.font = font;
  const ascent = ctx.measureText('あMg').actualBoundingBoxAscent;
  const fontSize = parseFloat(font);
  const halfLeading = (LINE_HEIGHT - fontSize) / 2;
  const offset = halfLeading + ascent;
  ruleOffsetCache.set(font, offset);
  return offset;
}

interface Props {
  onClose: () => void;
  number: number;
  initialPage?: number;
  language: string;
}

function LetterPage({ page, i, current, total, setPageRef, onFlip, language }: {
  page: Letter;
  i: number;
  current: number;
  total: number;
  setPageRef: (el: HTMLDivElement | null) => void;
  onFlip: () => void;
  language: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cacheKey = `${language}/${page.page}`;
  const [html, setHtml] = useState<string | null>(htmlCache.get(cacheKey) ?? null);
  const [ruleOffset, setRuleOffset] = useState<number | null>(null);

  useEffect(() => {
    if (htmlCache.has(cacheKey)) { setHtml(htmlCache.get(cacheKey)!); return; }
    fetch(`/letters/${language}/${page.page}.html`)
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(text => { htmlCache.set(cacheKey, text); setHtml(text); })
      .catch(() => {
        const fallback = `<p class="annotation">(page not found: ${page.page})</p>`;
        htmlCache.set(cacheKey, fallback);
        setHtml(fallback);
      });
  }, [cacheKey]);

  useEffect(() => {
    const font = page.author === 'sensei' ? '18px "La Belle Aurore"' : '16px Caveat';
    document.fonts.ready.then(() => setRuleOffset(getRuleOffset(font)));
  }, [page.author]);

  // On initial modal open the page is already at its resting position so
  // onAnimationComplete never fires — handle that case with a timer instead.
  useEffect(() => {
    if (i !== current || !ref.current || !html) return;
    const container = ref.current;
    drawAnnotations(container);
  }, [html]); // eslint-disable-line react-hooks/exhaustive-deps

  function drawAnnotations(container: HTMLElement) {
    container.querySelectorAll('svg.rough-annotation').forEach(s => s.remove());
    container.querySelectorAll<HTMLElement>('.rn-circle').forEach(el =>
      annotate(el, { type: 'circle', color: '#c0392b', padding: 3, iterations: 2, animate: false }).show()
    );
    container.querySelectorAll<HTMLElement>('.rn-cross').forEach(el =>
      annotate(el, { type: 'crossed-off', color: '#2c2416', strokeWidth: 1.5, animate: false }).show()
    );
    container.querySelectorAll<HTMLElement>('.rn-underline').forEach(el =>
      annotate(el, { type: 'underline', color: '#2c2416', strokeWidth: 1.5, animate: false }).show()
    );
    container.querySelectorAll<HTMLElement>('.rn-underline-red').forEach(el =>
      annotate(el, { type: 'underline', color: '#c0392b', strokeWidth: 1.5, animate: false }).show()
    );
  }

  return (
    <motion.div
      ref={el => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        setPageRef(el);
      }}
      animate={pageAnimate(i, current, onFlip)}
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
      <img src="/flower.png" alt="" style={stampStyle(page.page)} />
      <p style={styles.label}>{page.page}</p>
      <div
        className={`letter-content ${page.pagetype}`}
        style={ruleOffset !== null ? { backgroundPositionY: `${ruleOffset + 4}px` } : undefined}
        dangerouslySetInnerHTML={{ __html: html ?? '' }}
      />
    </motion.div>
  );
}

function pageAnimate(i: number, current: number, soundFn: () => void) {
  if (i >= current) return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 };
  const off = current - i;
  soundFn();
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
  const [playFlip] = useSound(boopSfx, { volume: 0.05 });

  const modalRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dirRef = useRef<1 | -1>(1);
  const accumRef = useRef(0);
  const lastFlipTime = useRef(0);
  const prevCanScrollRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const envelopeDate = getEnvelopeDate(number);

  const navigatePage = useCallback((dir: 1 | -1) => {
    dirRef.current = dir;
    setCurrent(c => dir === 1 ? Math.min(c + 1, pages.length - 1) : Math.max(c - 1, 0));
  }, [pages.length]);

  useEffect(() => { setCurrent(initialPage); }, [initialPage]);
  useEffect(() => { modalRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigatePage(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); navigatePage(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, navigatePage]);

  // Scroll the incoming page to the correct end based on navigation direction
  useEffect(() => {
    const pageEl = pageRefs.current[current];
    if (!pageEl) return;
    pageEl.scrollTop = dirRef.current === 1 ? 0 : pageEl.scrollHeight;
    // On mobile, default to showing main text (left margin scrollable to the left)
    pageEl.scrollLeft = window.matchMedia('(max-width: 640px)').matches ? 110 : 0;
  }, [current]);

  useEffect(() => {
    const el = modalRef.current!;

    const onWheel = (e: WheelEvent) => {
      if (!modalRef.current?.contains(e.target as Node)) return;

      // If a scrollable child has room, let it scroll
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

      // Drain accumulator if scroll has been idle for 200ms
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => { accumRef.current = 0; }, 200);

      const now = Date.now();
      if (now - lastFlipTime.current < 700) return;

      accumRef.current += e.deltaY;

      if (accumRef.current > 150) {
        accumRef.current = -60;
        lastFlipTime.current = now;
        dirRef.current = 1;
        setCurrent(c => Math.min(c + 1, pages.length - 1));
      } else if (accumRef.current < -150) {
        accumRef.current = 60;
        lastFlipTime.current = now;
        dirRef.current = -1;
        setCurrent(c => Math.max(c - 1, 0));
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [pages.length]);

  return createPortal(
    <motion.div
      style={styles.overlay}
      onClick={onClose}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        tabIndex={-1}
        style={{ ...styles.modal, position: 'relative' }}
        onClick={e => e.stopPropagation()}
        initial={{ scaleX: 0, scaleY: 0.005 }}
        animate={{ scaleX: [0, 1, 1], scaleY: [0.005, 0.005, 1] }}
        exit={{ scaleX: [1, 1, 0], scaleY: [1, 0.005, 0.005] }}
        transition={{ duration: 0.6, times: [0, 0.5, 1], ease: [0.165, 0.84, 0.44, 1] }}
      >
        <motion.div
          style={{ display: 'contents' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, delay: 0.45 }}
        >
          <div style={styles.header}>
            <span>Envelope {number}{envelopeDate ? `, ${envelopeDate}` : ''}</span>
            <button
              onClick={onClose}
              style={styles.closeBtn}
              className="btn-close"
            >✕</button>
          </div>

          <div style={styles.stack}>
            {pages.map((page, i) => (
              <LetterPage
                key={page.page}
                page={page}
                i={i}
                current={current}
                total={pages.length}
                setPageRef={el => { pageRefs.current[i] = el; }}
                onFlip={playFlip}
                language={language}
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
        </motion.div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:       { background: '#f5e6c8', borderRadius: 12, width: '80vw', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header:      { padding: '14px 16px', borderBottom: '1px solid rgba(90,74,58,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, fontWeight: 500 },
  stack:       { position: 'relative', flex: 1, overflow: 'hidden' },
  page:        { position: 'absolute', inset: 0, transformOrigin: 'top left', overflowY: 'auto', background: '#f5e6c8' },
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
  dot:         { width: 6, height: 6, borderRadius: '50%', background: '#333', transition: 'opacity 0.2s' },
};
