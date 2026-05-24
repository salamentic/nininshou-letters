import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

interface Props {
  onClose: () => void;
}

export default function CreditsModal({ onClose }: Props) {
  return createPortal(
    <motion.div
      style={styles.overlay}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        style={styles.modal}
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div style={styles.header}>
          <span style={styles.title}>Credits</span>
          <button onClick={onClose} style={styles.closeBtn} className="btn-close">✕</button>
        </div>

        <div style={styles.body}>
          <div style={styles.column}>
            <p style={styles.colHeading}>Translation</p>
            <p style={styles.entry}><strong>Cyo</strong></p>
            <p style={styles.note}>Letters &amp; lyrics from 二人称 by Yorushika</p>
          </div>

          <div style={styles.divider} />

          <div style={styles.column}>
            <p style={styles.colHeading}>Website</p>
            <p style={styles.entry}><strong>Cyo</strong></p>
            <p style={styles.note}>React · TypeScript · Vite · Framer Motion</p>
            <p style={{ ...styles.note, marginTop: 16 }}>
              <a
                href="https://github.com/salamentic/nininshou-letters"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                Source on GitHub ↗
              </a>
            </p>
          </div>
        </div>

        <p style={styles.footer}>
          All original content belongs to Yorushika / ソニーミュージックレーベルズ
        </p>
      </motion.div>
    </motion.div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300,
  },
  modal: {
    background: '#f5e6c8',
    borderRadius: 14,
    width: 'min(560px, 90vw)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(90,74,58,0.15)',
  },
  title: {
    fontFamily: "'Caveat', cursive",
    fontSize: 26,
    color: '#5a4a3a',
    fontWeight: 600,
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: '50%',
    border: '1px solid #ddd',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#888',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  } as React.CSSProperties,
  body: {
    display: 'flex',
    gap: 0,
    padding: '24px 0',
  },
  column: {
    flex: 1,
    padding: '0 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  divider: {
    width: 1,
    background: 'rgba(90,74,58,0.15)',
    margin: '0 0',
    alignSelf: 'stretch',
  },
  colHeading: {
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#999',
    marginBottom: 10,
    fontFamily: 'sans-serif',
  },
  entry: {
    fontFamily: "'Caveat', cursive",
    fontSize: 20,
    color: '#3a2e22',
    margin: 0,
  },
  note: {
    fontFamily: "'Caveat', cursive",
    fontSize: 15,
    color: '#7a6a5a',
    margin: 0,
    lineHeight: 1.4,
  },
  link: {
    color: '#5a4a3a',
    fontFamily: "'Caveat', cursive",
    fontSize: 15,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  footer: {
    fontSize: 12,
    fontFamily: 'sans-serif',
    color: '#aaa',
    textAlign: 'center',
    padding: '12px 20px 16px',
    borderTop: '1px solid rgba(90,74,58,0.1)',
    margin: 0,
  },
};
