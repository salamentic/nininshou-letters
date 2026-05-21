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
import { getCookie, setCookie } from './lib/cookies';

const ENVELOPE_COUNT = 32;

export default function App() {
  const [currentEnvelope, setCurrentEnvelope] = useState(() => {
    const saved = parseInt(getCookie('lastEnvelope') ?? '');
    return Number.isFinite(saved) && saved >= 0 && saved < ENVELOPE_COUNT ? saved : 0;
  });
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

  useEffect(() => { setCookie('lastEnvelope', String(currentEnvelope)); }, [currentEnvelope]);

  useEffect(() => {
    const img = new Image();
    img.src = '/nininshou_table_0.png';
    Promise.all([document.fonts.ready, img.decode()]).then(() => setReady(true));
  }, []);

  const handlePageSelect = ({ envelopeIndex, pageIndex }: { envelopeIndex: number; pageIndex: number }) => {
    setCurrentEnvelope(envelopeIndex);
    setTriggerPage({ envelopeIndex, pageIndex, ts: Date.now() });
  };

  const navigate = (direction: 'previous' | 'next') => {
    setCurrentEnvelope(prev => {
      if (direction === 'previous') return Math.max(0, prev - 1);
      if (direction === 'next') return Math.min(ENVELOPE_COUNT - 1, prev + 1);
      return prev;
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === 'ArrowLeft')  navigate('previous');
      if (e.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // navigate is stable since it only calls setCurrentEnvelope

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
        {currentEnvelope > 1 && <span style={styles.tabEllipsis}>…</span>}
        {[-1, 0, 1].map(offset => {
          const i = currentEnvelope + offset;
          if (i < 0 || i >= ENVELOPE_COUNT) return null;
          return (
            <button
              key={i}
              style={{ ...styles.tab, ...(i === currentEnvelope ? styles.tabActive : {}) }}
              onClick={() => setCurrentEnvelope(i)}
            >
              {i + 1}
            </button>
          );
        })}
        {currentEnvelope < ENVELOPE_COUNT - 2 && <span style={styles.tabEllipsis}>…</span>}
      </nav>
        {/* Left Arrow */}
        {currentEnvelope > 0 && (
          <button
            onClick={() => navigate('previous')}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50
                      w-10 h-10 flex items-center justify-center
                      rounded-full
                      bg-[rgba(255,255,255,0.92)]/70 hover:bg-[rgba(255,255,255,0.92)]
                      text-[#5a4a3a] text-xl
                      shadow-md hover:shadow-lg
                      backdrop-blur-sm
                      transition-all duration-200
                      border border-[#c4a882]/40"
            aria-label="Previous envelope"
          >
            ‹
          </button>
        )}
         {/* Right Arrow */}
        {currentEnvelope < ENVELOPE_COUNT - 1 && (
          <button
            onClick={() => navigate('next')}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50
                      w-10 h-10 flex items-center justify-center
                      rounded-full
                      bg-[rgba(255,255,255,0.92)]/70 hover:bg-[rgba(255,255,255,0.92)]
                      text-[#5a4a3a] text-xl
                      shadow-md hover:shadow-lg
                      backdrop-blur-sm
                      transition-all duration-200
                      border border-[#c4a882]/40"
            aria-label="Next envelope"
          >
            ›
          </button>
        )}
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
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 16,
    fontFamily: "'Caveat', cursive",
    color: '#000',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#000',
    color: '#fff',
  },
  tabEllipsis: {
    fontSize: 16,
    color: '#000',
    lineHeight: '36px',
    padding: '0 2px',
    userSelect: 'none',
  },
};
