import { memo, useState, useEffect, useImperativeHandle, forwardRef, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import envelopeImg from '@/assets/sample_envelope.png';
import envelopeImgBack from '@/assets/sample_envelope_back.png';
import { getEnvelopeDate } from '@/lib/parseLetters';

export interface EnvelopeHandle {
  pressSpace: () => void;
}

interface Props {
  number: number;
  isLetterOpen: boolean;
  onOpenLetter: (envelopeNumber: number, page?: number) => void;
  onCloseLetter: () => void;
}

const Envelope = forwardRef<EnvelopeHandle, Props>(({
  number, isLetterOpen, onOpenLetter, onCloseLetter,
}, ref) => {
  const [flipped, setFlipped] = useState(false);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (isLetterOpen) {
      animatingRef.current = true;
      const t = setTimeout(() => { animatingRef.current = false; }, 200);
      return () => clearTimeout(t);
    } else {
      animatingRef.current = true;
      setFlipped(false);
      const t = setTimeout(() => { animatingRef.current = false; }, 200);
      return () => clearTimeout(t);
    }
  }, [isLetterOpen]);

  useImperativeHandle(ref, () => ({
    pressSpace: () => {
      if (animatingRef.current) return;
      if (!isLetterOpen) {
        setFlipped(true);
        setTimeout(() => onOpenLetter(number), 200);
      } else {
        onCloseLetter();
      }
    },
  }), [number, isLetterOpen, onOpenLetter, onCloseLetter]);

  const handleClick = useCallback(() => {
    if (animatingRef.current || isLetterOpen) return;
    setFlipped(true);
    setTimeout(() => onOpenLetter(number), 200);
  }, [number, isLetterOpen, onOpenLetter]);

  return (
    <div className="wrapper">
      <motion.div
        className="card"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
        onClick={handleClick}
      >
        <div className="face front">
          <div className="envelope" style={{ backgroundImage: `url(${envelopeImg})` }} />
          <span className="envelope-number">{number}</span>
          <span className="envelope-date">{getEnvelopeDate(number)}</span>
        </div>
        <div className="face back">
          <div className="envelope" style={{ backgroundImage: `url(${envelopeImgBack})` }}>
            <motion.div
              className="flap"
              animate={{ rotateX: isLetterOpen ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default memo(Envelope);
