import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react";
import { Tooltip } from 'react-tooltip';
import { motion } from 'motion/react';
import 'vanilla-rough-notation';
import { getEnvelopePages, getEnvelopeDate } from '@/lib/parseLetters';
import type { Letter } from '@/lib/parseLetters';
import { getCookie, setCookie } from '@/lib/cookies';
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

export interface LetterStackHandle {
  goToPage: (index: number) => void;
}

interface Props {
  onClose: () => void;
  number: number;
  initialPage?: number | null;
  onPageConsumed?: () => void;
  language: string;
  unlocked?: boolean;
}

function LetterPage({ page, i, current, total, setPageRef, language, fontScale }: {
  page: Letter;
  i: number;
  current: number;
  total: number;
  setPageRef: (el: HTMLDivElement | null) => void;
  language: string;
  fontScale: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const annotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    const bust = (import.meta as any).env?.DEV ? `?t=${Date.now()}` : '';
    const controller = new AbortController();
    fetch(`/letters/${language}/${page.paired_with || page.page}.html${bust}`, { signal: controller.signal })
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(setHtml)
      .catch(err => { if (err.name !== 'AbortError') setHtml(`<p class="annotation">(page not found: ${page.paired_with || page.page})</p>`); });
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On mobile, scroll past the left margin once content is in the DOM.
  useEffect(() => {
    if (i !== current || !ref.current || !html) return;
    const el = ref.current;
    const raf = requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 640px)').matches) el.scrollLeft = el.scrollWidth;
    });
    return () => cancelAnimationFrame(raf);
  }, [i, current, html]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redraw annotations after first paint and after font-scale reflow.
  useEffect(() => {
    if (i !== current || !ref.current || !html) return;
    const container = ref.current;
    const raf = requestAnimationFrame(() => {
      drawAnnotations(container);
      alignImageLines(container, fontScale);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (annotationTimer.current) clearTimeout(annotationTimer.current);
    };
  }, [html, fontScale, current]); // eslint-disable-line react-hooks/exhaustive-deps

  function alignImageLines(container: HTMLElement, scale: number) {
    const lineH = Math.round(26 * scale);
    const content = container.querySelector('.letter-content') as HTMLElement | null;
    if (!content) return;
    const contentTop = content.getBoundingClientRect().top;
    content.querySelectorAll<HTMLElement>('a:has(img)').forEach(a => {
      const imgTop = a.getBoundingClientRect().top - contentTop;
      const offset = ((0.78 * lineH - imgTop % lineH) % lineH + lineH) % lineH;
      a.style.setProperty('--img-line-offset', `${offset}px`);
    });
  }

  function drawAnnotations(container: HTMLElement) {
    if (annotationTimer.current) clearTimeout(annotationTimer.current);
    annotationTimer.current = setTimeout(() => {
      container.querySelectorAll('rough-notation').forEach(el => (el as any).show());
    }, 100);
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
      style={{ ...styles.page, zIndex: total - i, ...(page.pagetype === 'manuscript' ? styles.manuscript : {}), ...(page.pagetype === 'lined' ? { background: '#fff' } : {}), ...(page.pagetype === 'flyer' ? { background: '#c9c3bb', justifyContent: 'center' } : {}) }}
    >
<p style={{ ...styles.label, fontSize: 22 * fontScale }}>{page.paired_with || page.page}</p>
      {html === null
        ? <div style={styles.loading}><img src="/flower.png" alt="" style={styles.loadingIcon} /></div>
        : <>
            <div
              className={`letter-content ${page.pagetype}`}
              style={{ '--lc-scale': fontScale, flexGrow: 1 } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <Tooltip
              anchorSelect=".letter-content .note"
              render={({ activeAnchor }) => {
                const text = activeAnchor?.getAttribute('data-note');
                const img = activeAnchor?.getAttribute('data-note-img');
                if (!img) return <span style={{ whiteSpace: 'pre-line' }}>{text}</span>;
                return (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <img src={img} style={{ width: 'auto', maxHeight: 120, objectFit: 'cover', flexShrink: 0, borderRadius: 2, alignSelf: 'center' }} />
                    {text && <span style={{ flex: 1, whiteSpace: 'pre-line' }}>{text}</span>}
                  </div>
                );
              }}
              place="top-start"
              style={{ width: 'clamp(220px, 25vw, 90vw)', fontFamily: "'Caveat', cursive", fontSize: 13 * fontScale, lineHeight: 1.4, zIndex: 9999, background: '#2c2416', color: '#f5e6c8', borderRadius: 4, padding: '6px 10px' }}
            />
            {page.pagetype !== 'flyer' && (() => {
              const s = stampStyles(page.page);
              return (
                <div className="stamp-wrapper" style={s.wrapper}>
                  <img src="/flower.png" alt="" style={s.img} />
                  {page.circle && (
                    <img src="/circle_mark.svg" alt="" style={{ ...s.img, right: (s.img.right as number) + 34, bottom: (s.img.bottom as number) + 2 }} />
                  )}
                </div>
              );
            })()}
          </>
      }
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

const snapScale = (s: number) => Math.round(s * 26) / 26;

const LetterStack = forwardRef<LetterStackHandle, Props>(function LetterStack({ onClose, number, initialPage = null, onPageConsumed, language, unlocked }, handle) {
  const pages = useMemo(() => getEnvelopePages(number, unlocked), [number, unlocked]);
  const [current, setCurrent] = useState(() => {
    if (initialPage !== null) return initialPage;
    return parseInt(getCookie(`lastPage_${number}`) ?? '0') || 0;
  });
  useImperativeHandle(handle, () => ({ goToPage: (i) => setCurrent(i) }));
  useEffect(() => { setCookie(`lastPage_${number}`, String(current)); }, [number, current]);
  const [fontScale, setFontScale] = useState(() => snapScale(parseFloat(getCookie('fontScale') ?? '') || 1.0));
  useEffect(() => { setCookie('fontScale', String(fontScale)); }, [fontScale]);
  const [playFlip] = useSound(boopSfx, { volume: 0.05 });
  const playFlipRef = useRef(playFlip);
  useEffect(() => { playFlipRef.current = playFlip; }, [playFlip]);
  const shouldPlayFlip = useRef(false);

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
    shouldPlayFlip.current = false;
    setCurrent(c => {
      const next = dir === 1 ? Math.min(c + 1, pages.length - 1) : Math.max(c - 1, 0);
      if (next === c) return c;
      dirRef.current = dir;
      shouldPlayFlip.current = true;
      return next;
    });
    if (shouldPlayFlip.current) playFlipRef.current();
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
  // On first open (no saved preference), fit the page to a consistent target line count.
  useEffect(() => {
    if (getCookie('fontScale')) return;
    const available = (stackRef.current?.clientHeight ?? window.innerHeight) - OVERHEAD;
    setFontScale(snapScale(Math.min(1.5, Math.max(0.5, available / (20 * 26)))));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialPage !== null) {
      setCurrent(initialPage);
      onPageConsumed?.();
      return;
    }
    setCurrent(parseInt(getCookie(`lastPage_${number}`) ?? '0') || 0);
  }, [number, initialPage]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { modalRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); navigatePage(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); navigatePage(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); scrollCurrentPage(180); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); scrollCurrentPage(-180); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigatePage, scrollCurrentPage]);

  useEffect(() => {
    const pageEl = pageRefs.current[current];
    if (!pageEl) return;
    pageEl.scrollTop = dirRef.current === 1 ? 0 : pageEl.scrollHeight;
    // Mobile: scroll past the left margin so text starts in view (caught by LetterPage on first load).
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
      <div style={styles.header} className="letter-header">
        <span>Envelope {number}{envelopeDate ? `, ${envelopeDate}` : ''}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setFontScale(s => snapScale(Math.max(0.5, s - 0.125)))}
            style={styles.fontBtn}
            className="btn-nav"
            disabled={fontScale <= snapScale(0.5)}
          >A−</button>
          <button
            onClick={() => setFontScale(s => snapScale(Math.min(1.5, s + 0.125)))}
            style={styles.fontBtn}
            className="btn-nav"
            disabled={fontScale >= 1.5}
          >A+</button>
          <button
            onClick={onClose}
            style={{ ...styles.closeBtn, marginLeft: 20 }}
            className="btn-close"
          >✕</button>
        </div>
      </div>

      <div ref={stackRef} style={styles.stack}>
        {pages.map((page, i) => (
          <LetterPage
            key={`${language}/${page.paired_with || page.page}`}
            page={page}
            i={i}
            current={current}
            total={pages.length}
            setPageRef={el => { pageRefs.current[i] = el; }}
            language={language}
            fontScale={fontScale}
          />
        ))}
      </div>

      <div style={styles.footer}>
        <button className="btn-nav" style={styles.navBtn} onClick={() => navigatePage(-1)} disabled={current === 0}>‹</button>
        {pages.map((page, i) => (
          <button
            key={i}
            className="btn-nav"
            style={{ ...styles.pageBtn, ...(i === current ? styles.pageBtnActive : {}), ...(page.hidden ? styles.pageBtnUnlocked : {}) }}
            onClick={() => { dirRef.current = i >= current ? 1 : -1; playFlipRef.current(); setCurrent(i); }}
          >{i + 1}</button>
        ))}
        <button className="btn-nav" style={styles.navBtn} onClick={() => navigatePage(1)} disabled={current === pages.length - 1}>›</button>
      </div>
    </motion.div>,
    document.body
  );
});

export default LetterStack;

const styles: Record<string, React.CSSProperties> = {
  fullPage:    { position: 'fixed', inset: 0, background: '#f5e6c8', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100 },
  header:      { padding: '20px 20px 16px 120px', borderBottom: '1px solid rgba(90,74,58,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 32, fontWeight: 500 },
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
  label:       { color: '#5a4a3a', marginTop: 28, marginBottom: 16, fontFamily: "'Caveat', cursive" },
  footer:      { padding: '12px 16px', borderTop: '1px solid rgba(90,74,58,0.2)', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' },
navBtn:      { width: 38, height: 38, borderRadius: '50%', border: '1.5px solid rgba(90,74,58,0.35)', background: 'rgba(245,230,200,0.6)', cursor: 'pointer', fontSize: 22, color: '#3a2e22', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0, transition: 'all 0.15s', flexShrink: 0 } as React.CSSProperties,
  closeBtn:    { width: 38, height: 38, borderRadius: '50%', border: '1.5px solid #000', background: 'none', cursor: 'pointer', fontSize: 16, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' } as React.CSSProperties,
  fontBtn:     { background: 'none', border: '1px solid #000', fontSize: 20, cursor: 'pointer', color: '#000', padding: '8px 16px', lineHeight: 1, fontFamily: 'sans-serif', letterSpacing: '0.02em', borderRadius: 6 } as React.CSSProperties,
  pageBtn:         { width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, fontFamily: "'Caveat', cursive", color: '#555', transition: 'all 0.2s' },
  pageBtnActive:   { background: '#333', color: '#fff' },
  pageBtnUnlocked: { outline: '1.5px solid #c0392b', outlineOffset: '2px' },
  loading:       { flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingIcon:   { width: 72, height: 72, opacity: 1, animation: 'pulse 1.4s ease-in-out infinite' },
};
