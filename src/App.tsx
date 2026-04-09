import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import useSound from 'use-sound';
import envelopeSound from './assets/envelope.wav';
import flipSound from './assets/flip.wav';
import './styles.css';
import Envelope from './components/Envelope';
import EnvelopeStackScrollable from './components/EnvelopeStackScrollable';
import BurgerMenu from './components/BurgerMenu';
import SpotifyPlayer from './components/SpotifyPlayer';
import spotifyData from './assets/spotify_embeds.json';

const ENVELOPE_COUNT = 32;

export default function App() {
  const [currentEnvelope, setCurrentEnvelope] = useState(0);
  const spotifyLink = useMemo(
    () => (spotifyData as Record<string, string>)[currentEnvelope] ?? null,
    [currentEnvelope]
  );
  const [triggerPage, setTriggerPage] = useState<{
    envelopeIndex: number;
    pageIndex: number;
    ts: number;
  } | null>(null);
  const [closeSignal, setCloseSignal] = useState(0);
  const [playEnvelopeSound] = useSound(envelopeSound, { volume: 0.5 });
  // Preload flip sound so it's cached before any letter is opened
  useSound(flipSound, { volume: 0.05 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/nininshou_table_0.png';
    Promise.all([document.fonts.ready, img.decode()]).then(() => setReady(true));
  }, []);

  const handlePageSelect = ({ envelopeIndex, pageIndex }: { envelopeIndex: number; pageIndex: number }) => {
    setCurrentEnvelope(envelopeIndex);
    setTriggerPage({ envelopeIndex, pageIndex, ts: Date.now() });
  };

  return (
    <>
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: '#f5e6c8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Cookie", cursive',
              fontSize: 32,
              color: '#5a4a3a',
            }}
          >
            二人称
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        <motion.div
          key={currentEnvelope}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            backgroundImage: `url(/nininshou_table_${currentEnvelope}.png)`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'auto',
            backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>
      <BurgerMenu
        currentEnvelope={currentEnvelope}
        onSelect={setCurrentEnvelope}
        onPageSelect={handlePageSelect}
        onOpen={() => { playEnvelopeSound(); setCloseSignal(s => s + 1); }}
        envelopeCount={ENVELOPE_COUNT}
      />
      <EnvelopeStackScrollable
        selectedIndex={currentEnvelope}
        onIndexChange={setCurrentEnvelope}
        className="translate-y-[9vh]"
      >
        {Array.from({ length: ENVELOPE_COUNT }, (_, i) => (
          <Envelope
            key={i}
            number={i + 1}
            triggerPage={triggerPage?.envelopeIndex === i ? triggerPage : null}
            closeSignal={closeSignal}
            onPlaySound={playEnvelopeSound}
          />
        ))}
      </EnvelopeStackScrollable>

      <SpotifyPlayer link={spotifyLink} />

      <nav style={styles.tabs}>
        {Array.from({ length: ENVELOPE_COUNT }, (_, i) => (
          <button
            key={i}
            style={{ ...styles.tab, ...(i === currentEnvelope ? styles.tabActive : {}) }}
            onClick={() => setCurrentEnvelope(i)}
          >
            {i + 1}
          </button>
        ))}
      </nav>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabs: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 6,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(8px)',
    borderRadius: 999,
    padding: '6px 10px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  },
  tab: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: "'Caveat', cursive",
    color: '#555',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#5a4a3a',
    color: '#fff',
  },
};
