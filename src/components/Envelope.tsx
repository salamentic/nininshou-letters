import { memo, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import envelopeImg from '@/assets/sample_envelope.png';
import envelopeImgBack from '@/assets/sample_envelope_back.png';
import LetterStack from '@/components/LetterStack';
import { getEnvelopeDate } from '@/lib/parseLetters';

export interface EnvelopeHandle {
  pressSpace: () => void;
}

interface Props {
  number: number;
  triggerPage: { envelopeIndex: number; pageIndex: number; ts: number } | null;
  closeSignal: number;
  onPlaySound: () => void;
}

const Envelope = forwardRef<EnvelopeHandle, Props>(({ number, triggerPage, closeSignal, onPlaySound }, ref) => {
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialPage, setInitialPage] = useState(0);

  const openModal = useCallback((page = 0) => {
    onPlaySound();
    setInitialPage(page);
    setOpen(true);
    setTimeout(() => setModalOpen(true), 500);
  }, [onPlaySound]);

  useImperativeHandle(ref, () => ({
    pressSpace: () => {
      if (!flipped) { onPlaySound(); setFlipped(true); }
      else if (!open) { openModal(); }
      else { onPlaySound(); setModalOpen(false); setOpen(false); setTimeout(() => setFlipped(false), 700); }
    },
  }), [flipped, open, onPlaySound, openModal]);

  useEffect(() => {
    if (!closeSignal) return;
    setModalOpen(false);
    setOpen(false);
    setFlipped(false);
  }, [closeSignal]);

  useEffect(() => {
    if (triggerPage == null) return;
    setFlipped(true);
    openModal(triggerPage.pageIndex);
  }, [triggerPage, openModal]);

  const flipEnvelope = useCallback(() => {
    if (!flipped || open) setFlipped(f => !f);
  }, [flipped, open]);

  const openLetterModal = useCallback(() => {
    if (flipped && !open) openModal();
  }, [flipped, open, openModal]);

  const closeLetterModal = useCallback(() => {
    if (flipped && open) {
      onPlaySound();
      setModalOpen(false);
      setOpen(false);
      setTimeout(() => setFlipped(false), 700);
    }
  }, [flipped, open, onPlaySound]);

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
              onClose={closeLetterModal}
              number={number}
              initialPage={initialPage}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

export default memo(Envelope);
