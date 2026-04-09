import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { getEnvelopePages, getEnvelopeDate } from '@/lib/parseLetters';
import type { Letter } from '@/lib/parseLetters';
import boopSfx from '@/assets/flip.wav';
import useSound from 'use-sound';

interface Props {
  onClose: () => void;
  number: number;
  initialPage?: number;
}

function LetterPage({ page, i, current, total, setPageRef, onFlip }: {
  page: Letter;
  i: number;
  current: number;
  total: number;
  setPageRef: (el: HTMLDivElement | null) => void;
  onFlip: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });

  const pageStyle: React.CSSProperties = {
    ...styles.page,
    zIndex: total - i,
    ...(page.pagetype === 'manuscript' ? styles.manuscript : {}),
  };

  const bodyStyle: React.CSSProperties = {
    ...styles.body,
    color: page.author === 'sensei' ? '#c0392b' : '#5a4a3a',
    fontFamily: page.author !== 'sensei' ? '"Indie Flower", cursive' : '"Cookie", cursive',
    fontSize: page.author === 'sensei' ? 18 : 14,
    lineHeight: page.author === 'sensei' ? '26px' : 1.85,
    ...(page.pagetype === 'lined' ? styles.linedBody : {}),
  };

  return (
    <motion.div
      ref={el => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        setPageRef(el);
      }}
      animate={pageAnimate(i, current, onFlip)}
      transition={{ type: 'tween', duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
      style={pageStyle}
    >
      <motion.div style={{ ...styles.progressBar, scaleX: scrollYProgress }} />
      <p style={styles.label}>{page.page}</p>
      {page.segments
        ? page.segments.map((seg, j) => (
            <p key={j} style={{ ...styles.body, color: seg.author === 'sensei' ? '#c0392b' : '#5a4a3a', ...(page.pagetype === 'lined' ? styles.linedBody : {}) }}>
              {seg.text}
            </p>
          ))
        : <p style={bodyStyle}>{page.body}</p>
      }
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

export default function LetterStack({ onClose, number, initialPage = 0 }: Props) {
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

  useEffect(() => { setCurrent(initialPage); }, [initialPage]);
  useEffect(() => { modalRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        dirRef.current = 1;
        setCurrent(c => Math.min(c + 1, pages.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dirRef.current = -1;
        setCurrent(c => Math.max(c - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pages.length]);

  // Scroll the incoming page to the correct end based on navigation direction
  useEffect(() => {
    const pageEl = pageRefs.current[current];
    if (!pageEl) return;
    pageEl.scrollTop = dirRef.current === 1 ? 0 : pageEl.scrollHeight;
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
            <span>Envelope {number} {envelopeDate}</span>
            <button onClick={onClose}>✕</button>
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
              />
            ))}
          </div>

          <img src="/flower.png" alt="" style={styles.cornerIcon} />
          <div style={styles.footer}>
            <button style={styles.navBtn} onClick={() => { dirRef.current = -1; setCurrent(c => Math.max(c - 1, 0)); }} disabled={current === 0}>‹</button>
            {pages.map((_, i) => (
              <div key={i} style={{ ...styles.dot, opacity: i === current ? 1 : 0.25 }} />
            ))}
            <button style={styles.navBtn} onClick={() => { dirRef.current = 1; setCurrent(c => Math.min(c + 1, pages.length - 1)); }} disabled={current === pages.length - 1}>›</button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:       { background: '#fff', borderRadius: 12, width: '80vw', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header:      { padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, fontWeight: 500 },
  stack:       { position: 'relative', flex: 1, overflow: 'hidden' },
  page:        { position: 'absolute', inset: 0, padding: '0 32px 28px', transformOrigin: 'top left', overflowY: 'auto', background: '#fff' },
  manuscript:  { background: 'radial-gradient(ellipse at 20% 30%, #c8a96e22 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, #a0784422 0%, transparent 50%), #f5e6c8' } as React.CSSProperties,
  linedBody:   { backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 25px, #b8cfe8 25px, #b8cfe8 26px)', backgroundSize: '100% 26px', backgroundClip: 'padding-box' } as React.CSSProperties,
  progressBar: { position: 'sticky', top: 0, left: '-32px', right: '-32px', height: 3, background: '#333', transformOrigin: 'left', marginBottom: 28 } as React.CSSProperties,
  label:       { fontSize: 12, color: '#999', marginBottom: 16 },
  body:        { fontFamily: 'Indie Flower, cursive', fontSize: 14, lineHeight: 1.85, whiteSpace: 'pre-line' },
  footer:      { padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' },
  cornerIcon:  { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, pointerEvents: 'none' },
  navBtn:      { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#555', padding: '0 8px', lineHeight: 1 } as React.CSSProperties,
  dot:         { width: 6, height: 6, borderRadius: '50%', background: '#333', transition: 'opacity 0.2s' },
};
