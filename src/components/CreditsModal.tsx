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
          <span style={styles.note}>Letters &amp; lyrics from 二人称 (Second Person) by Yorushika</span>
          <button onClick={onClose} style={styles.closeBtn} className="btn-close">✕</button>
        </div>

        <div style={styles.body}>
          <div style={styles.column}>
            <p style={styles.colHeading}>EN Translation</p>
            <p style={styles.note}> Cyorter, Dinosousuke, Eru Subaru, punkass, SakuraWindsS, Salamentic, Yuujin</p>
            <p style={{ ...styles.note, marginTop: 8 }}> Anemone, catfly, Loafer, Sukebar312</p>
            <p style={{ ...styles.note, marginTop: 8 }}>Suggestion blurb for who to reach out for TL stuff to Cyo/Whoever wishes to take the hit :^]</p>
          </div>

          <div style={styles.divider} />

          <div style={styles.column}>
            <p style={styles.colHeading}>Website</p>
            <p style={{ ...styles.note}}>
            Salamentic, Cyorter, Eru Subaru, sleepyhydra
            </p>
            <p style={{ ...styles.note, marginTop: 8 }}>
            For questions, bugs, suggestions etc, reach out to Salamentic on Reddit/@andy_yoru on Twitter!
            If you would like to contribute and add a translation in your language, also reach out.
            </p>
          </div>
        </div>

        <p style={styles.footer}>
          All original content belongs to n-buna, ヨルシカ, ポリドール・レコード, 講談社 and ユニバーサル ミュージック.
          This is a fan-made TL and website made to allow overseas fans to experience the magic of the epistolary novel ”Second Person”.
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
    width: 'min(900px, 90vw)',
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
    fontSize: 36,
    color: '#000',
    fontWeight: 600,
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: '50%',
    border: '1.5px solid #000',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#000',
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
    fontSize: 18,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#000',
    marginBottom: 10,
    fontFamily: 'sans-serif',
  },
  note: {
    fontFamily: "'Caveat', cursive",
    fontSize: 22,
    color: '#000',
    margin: 0,
    lineHeight: 1.4,
  },
  footer: {
    fontSize: 16,
    fontFamily: 'sans-serif',
    color: '#000',
    textAlign: 'center',
    padding: '12px 20px 16px',
    borderTop: '1px solid rgba(90,74,58,0.1)',
    margin: 0,
  },
};
