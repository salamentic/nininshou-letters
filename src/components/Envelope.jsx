import { useState, useEffect } from 'react';
import { motion } from "motion/react";
import useSound from 'use-sound';
import envelopeImg from "@/assets/sample_envelope.png";
import envelopeImgBack from "@/assets/sample_envelope_back.png";
import envelopeSound from "@/assets/envelope.wav";
import LetterStack from "@/components/LetterStack";

const Envelope = ({ number, triggerPage, closeSignal }) => {
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialPage, setInitialPage] = useState(0);
  const [play, { stop }] = useSound(envelopeSound, { volume: 0.5 });

  useEffect(() => {
    if (!closeSignal) return;
    play();
    setModalOpen(false);
    setOpen(false);
    setFlipped(false);
  }, [closeSignal]);

  // Auto-open at a specific page when triggered externally
  useEffect(() => {
    if (triggerPage == null) return;
    play();
    setInitialPage(triggerPage.pageIndex);
    setFlipped(true);
    setOpen(true);
    setTimeout(() => setModalOpen(true), 500);
  }, [triggerPage]);

  const flipEnvelope = () => {
    if (!flipped || open) setFlipped(!flipped);
  };

  const openLetterModal = () => {
    if (flipped && !open) {
      play();
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
        style={{ transformStyle: "preserve-3d" }}
        onClick={flipEnvelope}
      >
        <div className="face front">
          <div className="envelope" style={{ backgroundImage: `url(${envelopeImg})` }} />
          <span className="envelope-number">{number}</span>
        </div>
        <div className="face back" onClick={openLetterModal}>
          <div className="envelope" style={{ backgroundImage: `url(${envelopeImgBack})` }}>
            <motion.div
              className="flap"
              animate={{ rotateX: open ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ transformOrigin: "top center", transformStyle: "preserve-3d" }}
            />
          </div>
        </div>
        {modalOpen && <LetterStack open={modalOpen} onClose={() => { setModalOpen(false); setOpen(false); setTimeout(() => setFlipped(false), 300); }} number={number} initialPage={initialPage} />}
      </motion.div>
    </div>
  );
};

export default Envelope;
