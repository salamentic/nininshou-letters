import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Raphael from 'raphael';

(window as any).Raphael = Raphael;

let dmakLoaded = false;
async function loadDmak() {
  if (!dmakLoaded) {
    await import('dmak/dist/dmak.js');
    dmakLoaded = true;
  }
}

interface Props {
  onDone: () => void;
}

const DMAK_ID = 'dmak-nininshou';

export default function IntroAnimation({ onDone }: Props) {
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadDmak().then(() => {
      if (cancelled) return;

      let totalStrokes = 0;
      let drewCount = 0;
      let dmak: any;

      dmak = new (window as any).Dmak('二人称', {
        element: DMAK_ID,
        uri: '/kanjivg/',
        autoplay: false,
        width: 80,
        height: 80,
        step: 0.005,
        grid: { show: false },
        stroke: {
          animated: { drawing: true, erasing: false },
          attr: {
            stroke: '#3a2e22',
            'stroke-width': 6,
            'stroke-linecap': 'square',
            'stroke-linejoin': 'square',
            active: '#3a2e22',
          },
          order: { visible: false },
        },
        loaded(strokes: any[]) {
          totalStrokes = strokes.length;
          setReady(true);
          // Start drawing after the 0.3s fade-in completes
          setTimeout(() => dmak.render(), 350);
        },
        drew() {
          drewCount++;
          if (drewCount === totalStrokes) {
            setDone(true);
            setTimeout(() => setVisible(false), 2000);
          }
        },
      });
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onClick={() => setVisible(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: '#f5e6c8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ transform: 'translateX(-20px) scale(2.5)', transformOrigin: 'center' }}
          >
            <div id={DMAK_ID} />
          </motion.div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: done ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              left: 'calc(50% + 90px)',
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: "'Caveat'",
              fontSize: 25,
              textTransform: 'capitalize',
              color: '#3a2e22',
              letterSpacing: '0.08em',
            }}
          >
            nininshou
          </motion.span>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 1.5, duration: 1 }}
            style={{
              position: 'absolute',
              bottom: 32,
              fontFamily: "'Caveat', cursive",
              fontSize: 16,
              color: '#5a4a3a',
              letterSpacing: '0.08em',
            }}
          >
            click anywhere to skip
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
