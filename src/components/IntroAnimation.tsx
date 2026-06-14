import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TegakiRenderer } from 'tegaki/react';
import kleeOne from '@/assets/klee_one_nininsho/bundle';

interface Props {
  onDone: () => void;
}

export default function IntroAnimation({ onDone }: Props) {
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => setVisible(false), []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onClick={dismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: '#f5e6c8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <TegakiRenderer
            font={kleeOne}
            onComplete={() => setTimeout(dismiss, 1000)}
            style={{
              fontSize: '96px',
              color: '#3a2e22',
              lineHeight: 1.2,
            }}
          >
            二人称
          </TegakiRenderer>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 1.5, duration: 1 }}
            style={{
              marginTop: 32,
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
