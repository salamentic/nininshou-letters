import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TegakiRenderer } from 'tegaki/react';
import caveat from 'tegaki/fonts/caveat';

const PARAGRAPHS = [
  'In front of your eyes lies a brown manila envelope.',
  'You open the seal and peer inside, finding a number of Genkouyoushi (manuscripts) neatly folded.',
  'Suddenly, you are struck by an impulse.',
  'An impulse to put your eyes on these many letters that now lie in front of you.',
];

interface Props {
  onDone: () => void;
  onStartExit?: () => void;
}

export default function FirstVisitIntro({ onDone, onStartExit }: Props) {
  const [visible, setVisible] = useState(true);
  const [currentPara, setCurrentPara] = useState(0);

  const dismiss = useCallback(() => {
    onStartExit?.();
    setVisible(false);
  }, [onStartExit]);

  const nextPara = useCallback(() => {
    setCurrentPara(p => p + 1);
  }, []);

  useEffect(() => {
    if (currentPara >= PARAGRAPHS.length) dismiss();
  }, [currentPara, dismiss]);

  const paraStyle: React.CSSProperties = {
    fontSize: '26px',
    color: '#3a2e22',
    lineHeight: 1.7,
    textAlign: 'left',
  };

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="first-visit"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onClick={dismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: '#f5e6c8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '15vh 10vw 0',
            overflow: 'hidden',
          }}
        >
          <img
            src="/letters/landing.png"
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '25%',
              height: 'auto',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 720, width: '100%' }}>
            {PARAGRAPHS.map((text, i) => (
              currentPara >= i && (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <TegakiRenderer
                    font={caveat}
                    onComplete={i < PARAGRAPHS.length - 1 ? () => setTimeout(nextPara, 1000) : () => setTimeout(dismiss, 3000)}
                    timing={{ glyphGap: 0, wordGap: 0, lineGap: 0, stagger: { advance: 0.06, duration: 0.12 } }}
                    style={paraStyle}
                  >
                    {text}
                  </TegakiRenderer>
                </motion.div>
              )
            ))}
          </div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 1.5, duration: 1 }}
            style={{
              position: 'absolute',
              bottom: '6vh',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Caveat', cursive",
              fontSize: 16,
              color: '#5a4a3a',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            click anywhere to skip
            (also, we recommend playing Kumo Ni Naru or Souchou, Yuubinuke here :)) 
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
