import { motion, AnimatePresence } from 'motion/react';

export default function SpotifyPlayer({ link }) {
  return (
    <div style={styles.anchor}>
      <AnimatePresence>
        {link && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            style={styles.wrapper}
          >
            <iframe
              src={link}
              width="300"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={styles.iframe}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  anchor: {
    position: 'fixed',
    bottom: 72,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 50,
  },
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  iframe: {
    display: 'block',
    borderRadius: 12,
  },
};
