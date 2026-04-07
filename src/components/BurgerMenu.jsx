import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getEnvelopePages } from '@/lib/parseLetters';

export default function BurgerMenu({ currentEnvelope, onSelect, onPageSelect, onOpen, envelopeCount }) {
  const [open, setOpen] = useState(false);
  const [expandedEnvelope, setExpandedEnvelope] = useState(null);

  const handleEnvelopeClick = (i) => {
    onSelect(i);
    setExpandedEnvelope(expandedEnvelope === i ? null : i);
  };

  const handlePageClick = (envelopeIndex, pageIndex) => {
    onPageSelect({ envelopeIndex, pageIndex });
    setOpen(false);
  };

  return (
    <>
      <button style={styles.burger} onClick={() => { setOpen(o => { if (!o) onOpen?.(); return !o; }); }} aria-label="Menu">
        <motion.span animate={{ rotate: open ? 45 : 0, y: open ? 7 : 0 }} style={styles.bar} />
        <motion.span animate={{ opacity: open ? 0 : 1 }} style={styles.bar} />
        <motion.span animate={{ rotate: open ? -45 : 0, y: open ? -7 : 0 }} style={styles.bar} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              style={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              style={styles.panel}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
            >
              <p style={styles.heading}>Envelopes</p>
              {Array.from({ length: envelopeCount }, (_, i) => {
                const pages = getEnvelopePages(i + 1);
                const isExpanded = expandedEnvelope === i;

                return (
                  <div key={i}>
                    <button
                      style={{ ...styles.item, ...(i === currentEnvelope ? styles.itemActive : {}) }}
                      onClick={() => handleEnvelopeClick(i)}
                    >
                      <span>{i + 1}</span>
                      {pages.length > 0 && (
                        <motion.span
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          style={styles.chevron}
                        >›</motion.span>
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          {pages.map((page, j) => (
                            <button
                              key={page.page}
                              style={styles.subItem}
                              onClick={() => handlePageClick(i, j)}
                            >
                              {page.page}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const styles = {
  burger: {
    position: 'fixed',
    top: 20,
    left: 20,
    zIndex: 200,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(8px)',
    border: 'none',
    borderRadius: 8,
    width: 40,
    height: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    padding: 0,
  },
  bar: {
    display: 'block',
    width: 18,
    height: 2,
    background: '#5a4a3a',
    borderRadius: 2,
    transformOrigin: 'center',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 201,
  },
  panel: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 200,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    zIndex: 202,
    padding: '72px 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
    overflowY: 'auto',
  },
  heading: {
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#999',
    marginBottom: 8,
  },
  item: {
    background: 'none',
    border: 'none',
    textAlign: 'left',
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: "'Caveat', cursive",
    color: '#3a3a3a',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemActive: {
    background: '#5a4a3a',
    color: '#fff',
  },
  chevron: {
    display: 'inline-block',
    fontSize: 16,
    lineHeight: 1,
  },
  subItem: {
    background: 'none',
    border: 'none',
    textAlign: 'left',
    padding: '5px 12px 5px 24px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: "'Caveat', cursive",
    color: '#666',
    width: '100%',
    display: 'block',
  },
};
