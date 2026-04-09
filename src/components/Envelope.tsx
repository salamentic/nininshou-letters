import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import envelopeImg from '@/assets/sample_envelope.png';
import envelopeImgBack from '@/assets/sample_envelope_back.png';
import LetterStack from '@/components/LetterStack';
import { getEnvelopeDate } from '@/lib/parseLetters';

interface Props {
  number: number;
  triggerPage: { envelopeIndex: number; pageIndex: number; ts: number } | null;
  closeSignal: number;
  onPlaySound: () => void;
}

const Envelope = ({ number, triggerPage, closeSignal, onPlaySound }: Props) => {
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialPage, setInitialPage] = useState(0);

  useEffect(() => {
    if (!closeSignal) return;
    setModalOpen(false);
    setOpen(false);
    setFlipped(false);
  }, [closeSignal]);

  useEffect(() => {
    if (triggerPage == null) return;
    onPlaySound();
    setInitialPage(triggerPage.pageIndex);
    setFlipped(true);
    setOpen(true);
    setTimeout(() => setModalOpen(true), 500);
  }, [triggerPage]);

  const flipEnvelope = () => {
    if (!flipped || open) setFlipped(f => !f);
  };

  const openLetterModal = () => {
    if (flipped && !open) {
      onPlaySound();
      setInitialPage(0);
      setOpen(true);
      setTimeout(() => setModalOpen(true), 500);
    }
  };

  return (
    <div className="wrapper">
      <motion.div
        className="card"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
        onClick={flipEnvelope}
      >
        <div className="face front">
          <div className="envelope" style={{ backgroundImage: `url(${envelopeImg})` }} />
          <span className="envelope-number">{number}</span>
          <span className="envelope-date">{getEnvelopeDate(number)}</span>
        </div>
        <div className="face back" onClick={openLetterModal}>
          <div className="envelope" style={{ backgroundImage: `url(${envelopeImgBack})` }}>
            <motion.div
              className="flap"
              animate={{ rotateX: open ? 180 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
            />
          </div>
        </div>
        <AnimatePresence>
          {modalOpen && (
            <LetterStack
              onClose={() => {
                setModalOpen(false);
                setOpen(false);
                setTimeout(() => setFlipped(false), 700);
              }}
              number={number}
              initialPage={initialPage}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default memo(Envelope);
