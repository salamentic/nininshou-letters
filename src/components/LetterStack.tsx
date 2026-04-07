import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useScroll } from "framer-motion";
import { getEnvelopePages, getEnvelopeDate, Letter } from '@/lib/parseLetters';
import boopSfx from '@/assets/flip.wav';
import useSound from 'use-sound';

interface Props {
  open: boolean;
  onClose: () => void;
  number: number;
  initialPage?: number;
}

function LetterPage({ page, i, current, total, setPageRef }: {
  page: Letter;
  i: number;
  current: number;
  total: number;
  setPageRef: (el: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const [play] = useSound(boopSfx, { volume: 0.05 });

  const pageStyle: React.CSSProperties = {
    ...styles.page,
    zIndex: total - i,
    ...(page.pagetype === 'manuscript' ? styles.manuscript : {}),
  };

  const bodyStyle: React.CSSProperties = {
    ...styles.body,
    color: page.author === 'sensei' ? '#c0392b' : '#1a1a1a',
    ...(page.pagetype === 'lined' ? styles.linedBody : {}),
  };

  return (
    <motion.div
      ref={el => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        setPageRef(el);
      }}
      animate={pageAnimate(i, current, play)}
      transition={{ type: 'tween', duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
      style={pageStyle}
    >
      <motion.div style={{ ...styles.progressBar, scaleX: scrollYProgress }} />
      <p style={styles.label}>{page.page}</p>
      {page.segments
        ? page.segments.map((seg, j) => (
            <p key={j} style={{ ...styles.body, color: seg.author === 'sensei' ? '#c0392b' : '#1a1a1a', ...(page.pagetype === 'lined' ? styles.linedBody : {}) }}>
              {seg.text}
            </p>
          ))
        : <p style={bodyStyle}>{page.body}</p>
      }
    </motion.div>
  );
}

function pageAnimate(i: number, current: number, soundFn) {
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

export default function LetterStack({ open, onClose, number, initialPage = 0 }: Props) {
  const pages = useMemo(() => getEnvelopePages(number), [number]);
  const [current, setCurrent] = useState(initialPage);

  useEffect(() => { setCurrent(initialPage); }, [initialPage]);
  useEffect(() => {
        const close = (e) => {
          if(e.keyCode === 27){
            onClose();
          }
        }
        window.addEventListener('keydown', close)
      return () => window.removeEventListener('keydown', close)
    },[])

  const modalRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const accumRef = useRef(0);
  const lastFlipTime = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const envelopeDate = getEnvelopeDate(number);

  // Scroll the incoming page to the correct end based on navigation direction
  useEffect(() => {
    const pageEl = pageRefs.current[current];
    if (!pageEl) return;
    pageEl.scrollTop = dirRef.current === 1 ? 0 : pageEl.scrollHeight;
  }, [current]);

  useEffect(() => {
    if (!open) return;
    const el = modalRef.current!;

    const onWheel = (e: WheelEvent) => {
      if (!modalRef.current?.contains(e.target as Node)) return;

      // If a scrollable child has room, let it scroll and reset accumulation
      let node = e.target as HTMLElement | null;
      while (node && node !== el) {
        const oy = window.getComputedStyle(node).overflowY;
        if (oy === 'auto' || oy === 'scroll') {
          const canScroll = e.deltaY > 0
            ? node.scrollTop < node.scrollHeight - node.clientHeight
            : node.scrollTop > 0;
          if (canScroll) {
            accumRef.current = 0;
            return;
          }
        }
        node = node.parentElement;
      }

      e.preventDefault();

      const now = Date.now();
      if (now - lastFlipTime.current < 700) return;

      accumRef.current += e.deltaY;

      if (accumRef.current > 150) {
        accumRef.current = 0;
        lastFlipTime.current = now;
        dirRef.current = 1;
        setCurrent(c => Math.min(c + 1, pages.length - 1));
      } else if (accumRef.current < -150) {
        accumRef.current = 0;
        lastFlipTime.current = now;
        dirRef.current = -1;
        setCurrent(c => Math.max(c - 1, 0));
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open, pages.length]);

  if (!open) return null;

  return createPortal(
    <div style={styles.overlay} onClick={onClose}>
      <div ref={modalRef} style={styles.modal} onClick={e => e.stopPropagation()}>

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
            />
          ))}
        </div>

        <div style={styles.footer}>
          <button style={styles.navBtn} onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0}>‹</button>
          {pages.map((_, i) => (
            <div key={i} style={{ ...styles.dot, opacity: i === current ? 1 : 0.25 }} />
          ))}
          <button style={styles.navBtn} onClick={() => setCurrent(c => Math.min(c + 1, pages.length - 1))} disabled={current === pages.length - 1}>›</button>
        </div>

      </div>
    </div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:       { background: '#fff', borderRadius: 12, width: '80vw', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header:      { padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 500 },
  stack:       { position: 'relative', flex: 1, overflow: 'hidden' },
  page:        { position: 'absolute', inset: 0, padding: '0 32px 28px', transformOrigin: 'top left', overflowY: 'auto', background: '#fff' },
  manuscript:  { background: 'radial-gradient(ellipse at 20% 30%, #c8a96e22 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, #a0784422 0%, transparent 50%), #f5e6c8' } as React.CSSProperties,
  linedBody:   { backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 25px, #b8cfe8 25px, #b8cfe8 26px)', backgroundSize: '100% 26px', backgroundClip: 'padding-box' } as React.CSSProperties,
  progressBar: { position: 'sticky', top: 0, left: '-32px', right: '-32px', height: 3, background: '#333', transformOrigin: 'left', marginBottom: 28 } as React.CSSProperties,
  label:       { fontSize: 12, color: '#999', marginBottom: 16 },
  body:        { fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.85, whiteSpace: 'pre-line' },
  footer:      { padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' },
  navBtn:      { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#555', padding: '0 8px', lineHeight: 1 } as React.CSSProperties,
  dot:         { width: 6, height: 6, borderRadius: '50%', background: '#333', transition: 'opacity 0.2s' },
};
