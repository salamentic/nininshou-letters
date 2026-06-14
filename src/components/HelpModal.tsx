import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export default function HelpModal({ onClose, children }: Props) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(245,230,200,0.97)', borderRadius: 16,
          padding: '28px 28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          border: '1px solid rgba(180,150,100,0.4)',
          display: 'flex', flexDirection: 'column', gap: 2,
          fontFamily: "'Caveat', cursive", fontSize: 20, color: '#000',
          minWidth: 220,
        }}
      >
        {children}
        <button
          onClick={onClose}
          style={{
            marginTop: 16, alignSelf: 'center',
            fontFamily: "'Caveat', cursive", fontSize: 18, color: '#3a2e22',
            background: 'transparent', border: '1px solid rgba(90,74,58,0.3)',
            borderRadius: 8, padding: '4px 20px', cursor: 'pointer',
          }}
        >
          close
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}
