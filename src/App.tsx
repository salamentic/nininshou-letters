import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import useSound from 'use-sound';
import envelopeSound from './assets/envelope.wav';
import flipSound from './assets/flip.wav';
import './styles.css';
import Envelope, { type EnvelopeHandle } from './components/Envelope';
import EnvelopeStackScrollable from './components/EnvelopeStackScrollable';
import BurgerMenu from './components/BurgerMenu';
import SpotifyPlayer from './components/SpotifyPlayer';
import spotifyData from './assets/spotify_embeds.json';
import { getCookie, setCookie } from './lib/cookies';
import CreditsModal from './components/CreditsModal';

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
  const envelopeRefs = useRef<(EnvelopeHandle | null)[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [playEnvelopeSound] = useSound(envelopeSound, { volume: 0.5 });
  useSound(flipSound, { volume: 0.05 }); // Preload flip sound
  const [ready, setReady] = useState(false);

  // Single ref for stale-closure-free keydown handler
  const handlerStateRef = useRef({ currentEnvelope, menuOpen });
  useEffect(() => { handlerStateRef.current = { currentEnvelope, menuOpen }; }, [currentEnvelope, menuOpen]);

  useEffect(() => { setCookie('lastEnvelope', String(currentEnvelope)); }, [currentEnvelope]);

  useEffect(() => {
    const img = new Image();
    img.src = '/nininshou_table_0.png';
    Promise.all([document.fonts.ready, img.decode()]).then(() => setReady(true));
  }, []);

  const openMenu = useCallback(() => {
    setCloseSignal(s => s + 1);
    setMenuOpen(true);
  }, []);

  const handlePageSelect = useCallback(({ envelopeIndex, pageIndex }: { envelopeIndex: number; pageIndex: number }) => {
    setCurrentEnvelope(envelopeIndex);
    setTriggerPage({ envelopeIndex, pageIndex, ts: Date.now() });
  }, []);

  const navigate = useCallback((direction: 'previous' | 'next') => {
    setCurrentEnvelope(prev =>
      direction === 'previous' ? Math.max(0, prev - 1) : Math.min(ENVELOPE_COUNT - 1, prev + 1)
    );
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (handlerStateRef.current.menuOpen) setMenuOpen(false);
        else openMenu();
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === ' ') {
        e.preventDefault();
        envelopeRefs.current[handlerStateRef.current.currentEnvelope]?.pressSpace();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openMenu]);

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
        onOpen={openMenu}
        envelopeCount={ENVELOPE_COUNT}
        open={menuOpen}
        onOpenChange={setMenuOpen}
      />
      <EnvelopeStackScrollable
        selectedIndex={currentEnvelope}
        onIndexChange={setCurrentEnvelope}
        className="translate-y-[9vh]"
      >
        {Array.from({ length: ENVELOPE_COUNT }, (_, i) => (
          <Envelope
            key={i}
            ref={el => { envelopeRefs.current[i] = el; }}
            number={i + 1}
            triggerPage={triggerPage?.envelopeIndex === i ? triggerPage : null}
            closeSignal={closeSignal}
            onPlaySound={playEnvelopeSound}
          />
        ))}
      </EnvelopeStackScrollable>

      <SpotifyPlayer link={spotifyLink} />

      <div className="desktop-only" style={{ position: 'fixed', bottom: 28, left: 28, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        <div style={styles.instructions}>
          <span><kbd style={styles.kbd}>←</kbd> <kbd style={styles.kbd}>→</kbd> navigate</span>
          <span><kbd style={styles.kbd}>space</kbd> open envelope</span>
          <span><kbd style={styles.kbd}>tab</kbd> menu</span>
          <span><kbd style={styles.kbd}>esc</kbd> close</span>
        </div>
        <button
          style={styles.creditsBtn}
          className="btn-buy"
          onClick={() => setCreditsOpen(true)}
        >
          Credits
        </button>
      </div>
      <AnimatePresence>
        {creditsOpen && <CreditsModal onClose={() => setCreditsOpen(false)} />}
      </AnimatePresence>

      <nav style={styles.tabs}>
        {currentEnvelope > 1 && <button style={{ ...styles.tabEllipsis, background: 'none', border: 'none', cursor: 'pointer' }} className="btn-ellipsis" onClick={openMenu}>…</button>}
        {[-1, 0, 1].map(offset => {
          const i = currentEnvelope + offset;
          if (i < 0 || i >= ENVELOPE_COUNT) return null;
          return (
            <button
              key={i}
              style={{ ...styles.tab, ...(i === currentEnvelope ? styles.tabActive : {}) }}
              className={i === currentEnvelope ? 'btn-tab btn-tab-active' : 'btn-tab'}
              onClick={() => setCurrentEnvelope(i)}
            >
              {i + 1}
            </button>
          );
        })}
        {currentEnvelope < ENVELOPE_COUNT - 2 && <button style={{ ...styles.tabEllipsis, background: 'none', border: 'none', cursor: 'pointer' }} className="btn-ellipsis" onClick={openMenu}>…</button>}
      </nav>
      <div className="desktop-only" style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <a href="https://sp.universal-music.co.jp/yorushika/nininshou/" target="_blank" rel="noopener noreferrer" style={styles.buyLink} className="btn-buy">
          Original site →
        </a>
        <a href="https://www.cdjapan.co.jp/product/NEOBK-3159512" target="_blank" rel="noopener noreferrer" style={styles.buyLink} className="btn-buy">
          Buy the original, physical copy here or on any other proxy site →
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <img src="https://st.cdjapan.co.jp/pictures/l/16/19/NEOBK-3159512.jpg?v=2" alt="二人称 physical copy" style={{ width: 80, borderRadius: 4 }} />
            <img src="https://sp.universal-music.co.jp/yorushika/nininshou/assets/images/product_image_01.jpg" alt="二人称 product" style={{ width: 80, borderRadius: 4 }} />
          </div>
        </a>
      </div>

        {/* Left Arrow */}
        {currentEnvelope > 0 && (
          <button
            onClick={() => navigate('previous')}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50
                      w-10 h-10 flex items-center justify-center
                      rounded-full
                      bg-[rgba(245,230,200,0.7)] hover:bg-[rgba(245,230,200,0.95)]
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
                      bg-[rgba(245,230,200,0.7)] hover:bg-[rgba(245,230,200,0.95)]
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
    background: 'rgba(245,230,200,0.75)',
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
  buyLink: {
    fontSize: 20,
    fontFamily: "'Caveat', cursive",
    color: '#3a2e22',
    textDecoration: 'none',
    background: 'rgba(245, 230, 200, 0.45)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(180,150,100,0.4)',
    borderRadius: 10,
    padding: '10px 16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
    letterSpacing: '0.01em',
    lineHeight: 1.3,
    transition: 'all 0.2s',
  },
  kbd: {
    display: 'inline-block',
    background: 'rgba(90,74,58,0.12)',
    border: '1px solid rgba(90,74,58,0.3)',
    borderRadius: 4,
    padding: '0px 5px',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: '20px',
    verticalAlign: 'middle',
  },
  instructions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontFamily: "'Caveat', cursive",
    fontSize: 18,
    color: '#000',
    opacity: 0.7,
    pointerEvents: 'none',
    userSelect: 'none',
  },
  creditsBtn: {
    fontSize: 16,
    padding: '6px 14px',
    alignSelf: 'flex-start',
  },
  tabEllipsis: {
    fontSize: 16,
    color: '#000',
    lineHeight: '36px',
    padding: '0 2px',
    userSelect: 'none',
  },
};
