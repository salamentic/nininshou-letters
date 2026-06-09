import { BrowserRouter, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
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
import LetterStack from './components/LetterStack';
import spotifyData from './assets/spotify_embeds.json';
import { getCookie, setCookie } from './lib/cookies';
import CreditsModal from './components/CreditsModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ENVELOPE_COUNT = 32;
const BG_IMAGES = new Set([0, 1, 2, 3, 4, 5, 6, 11, 12, 13, 15, 16, 17, 18, 19, 21, 22, 24, 25, 31]);
const bgImage = (i: number) => `/nininshou_table_${BG_IMAGES.has(i) ? i : 0}.png`;

function AppContent() {
  const { num } = useParams<{ num?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const letterNumber = num ? (parseInt(num) || null) : null;
  const isLetterOpen = letterNumber !== null && letterNumber >= 1 && letterNumber <= ENVELOPE_COUNT;
  const pageParam = new URLSearchParams(location.search).get('page');
  const initialPage = pageParam !== null ? (parseInt(pageParam) || 0) : null;

  // Current envelope in the stack — local state, URL plays no role here
  const [currentEnvelope, setCurrentEnvelope] = useState(() => {
    if (letterNumber) return Math.max(0, Math.min(ENVELOPE_COUNT - 1, letterNumber - 1));
    const saved = parseInt(getCookie('lastEnvelope') ?? '');
    return Number.isFinite(saved) && saved >= 0 && saved < ENVELOPE_COUNT ? saved : 0;
  });

  const spotifyLink = useMemo(
    () => (spotifyData as Record<string, string>)[currentEnvelope] ?? null,
    [currentEnvelope]
  );

  const envelopeRefs = useRef<(EnvelopeHandle | null)[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [env29Unlocked, setEnv29Unlocked] = useState(() => getCookie('env29Unlocked') === '1');

  useEffect(() => {
    if (letterNumber === 29 && !env29Unlocked) {
      setEnv29Unlocked(true);
      setCookie('env29Unlocked', '1');
      toast("Sensei's letters have been added to their original envelopes");
    }
  }, [letterNumber]); // eslint-disable-line react-hooks/exhaustive-deps
  const [playEnvelopeSound] = useSound(envelopeSound, { volume: 0.5 });
  useSound(flipSound, { volume: 0.05 });
  const playEnvelopeSoundRef = useRef(playEnvelopeSound);
  useEffect(() => { playEnvelopeSoundRef.current = playEnvelopeSound; }, [playEnvelopeSound]);
  const [ready, setReady] = useState(false);

  const stateRef = useRef({ currentEnvelope, isLetterOpen, menuOpen, creditsOpen });
  useEffect(() => { stateRef.current = { currentEnvelope, isLetterOpen, menuOpen, creditsOpen }; }, [currentEnvelope, isLetterOpen, menuOpen, creditsOpen]);

  useEffect(() => { setCookie('lastEnvelope', String(currentEnvelope)); }, [currentEnvelope]);

  useEffect(() => {
    const img = new Image();
    img.src = '/nininshou_table_0.png';
    Promise.all([document.fonts.ready, img.decode()]).then(() => setReady(true));
  }, []);

  const openLetter = useCallback((envelopeNumber: number, page = 0) => {
    playEnvelopeSoundRef.current();
    navigate(`/envelope/${envelopeNumber}?page=${page}`);
  }, [navigate]);

  const closeLetter = useCallback(() => {
    playEnvelopeSoundRef.current();
    navigate('/', { replace: true });
  }, [navigate]);

  const handlePageSelect = useCallback(({ envelopeIndex, pageIndex }: { envelopeIndex: number; pageIndex: number }) => {
    setCurrentEnvelope(envelopeIndex);
    openLetter(envelopeIndex + 1, pageIndex);
  }, [openLetter]);

  // Tab + Space only (EnvelopeStackScrollable owns arrow keys + scroll)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { currentEnvelope: ce, isLetterOpen: ilo, menuOpen: mo, creditsOpen: co } = stateRef.current;
      if (e.key === 'Escape') {
        if (co) { setCreditsOpen(false); return; }
        if (ilo) { closeLetter(); return; }
        if (mo) { setMenuOpen(false); return; }
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setMenuOpen(m => !m);
        return;
      }
      if (ilo) return;
      if (e.key === ' ') {
        e.preventDefault();
        envelopeRefs.current[ce]?.pressSpace();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: '#f5e6c8', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Cookie", cursive', fontSize: 32, color: '#5a4a3a',
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
            position: 'fixed', inset: 0, zIndex: -1,
            backgroundImage: `url(${bgImage(currentEnvelope)})`,
            backgroundRepeat: 'no-repeat', backgroundSize: 'auto', backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>

      <BurgerMenu
        currentEnvelope={currentEnvelope}
        onSelect={setCurrentEnvelope}
        onPageSelect={handlePageSelect}
        onOpen={() => setMenuOpen(true)}
        envelopeCount={ENVELOPE_COUNT}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        unlocked={env29Unlocked}
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
            isLetterOpen={isLetterOpen && letterNumber === i + 1}
            onOpenLetter={openLetter}
            onCloseLetter={closeLetter}
          />
        ))}
      </EnvelopeStackScrollable>

      <SpotifyPlayer link={spotifyLink} />

      <div style={{ position: 'fixed', bottom: 80, left: 28, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        <div className="desktop-only" style={{ ...styles.buyLink }}>
          <div style={styles.instructions}>
            <span><kbd style={styles.kbd}>←</kbd> <kbd style={styles.kbd}>→</kbd> navigate</span>
            <span><kbd style={styles.kbd}>space</kbd> open envelope</span>
            <span><kbd style={styles.kbd}>tab</kbd> menu</span>
            <span><kbd style={styles.kbd}>esc</kbd> close</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', top: 28, right: 28, zIndex: 50, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          style={{ ...styles.buyLink, fontSize: 16, padding: '6px 14px' }}
          className="btn-buy"
          onClick={() => setCreditsOpen(true)}
        >
          Credits
        </button>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          style={styles.langSelect}
        >
          <option value="en">EN</option>
        </select>
      </div>

      <AnimatePresence>
        {creditsOpen && <CreditsModal onClose={() => setCreditsOpen(false)} />}
      </AnimatePresence>

      <ToastContainer position="bottom-center" autoClose={4000} theme="dark" />

      <nav style={styles.tabs}>
        {currentEnvelope > 1 && (
          <button style={{ ...styles.tabEllipsis, background: 'none', border: 'none', cursor: 'pointer' }} className="btn-ellipsis" onClick={() => setMenuOpen(true)}>…</button>
        )}
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
        {currentEnvelope < ENVELOPE_COUNT - 2 && (
          <button style={{ ...styles.tabEllipsis, background: 'none', border: 'none', cursor: 'pointer' }} className="btn-ellipsis" onClick={() => setMenuOpen(true)}>…</button>
        )}
      </nav>

      <div className="desktop-only" style={{ position: 'fixed', bottom: 80, right: 28, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
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

      {currentEnvelope > 0 && (
        <button
          onClick={() => setCurrentEnvelope(c => Math.max(0, c - 1))}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(245,230,200,0.7)] hover:bg-[rgba(245,230,200,0.95)] text-[#5a4a3a] text-xl shadow-md hover:shadow-lg backdrop-blur-sm transition-all duration-200 border border-[#c4a882]/40"
          aria-label="Previous envelope"
        >‹</button>
      )}
      {currentEnvelope < ENVELOPE_COUNT - 1 && (
        <button
          onClick={() => setCurrentEnvelope(c => Math.min(ENVELOPE_COUNT - 1, c + 1))}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(245,230,200,0.7)] hover:bg-[rgba(245,230,200,0.95)] text-[#5a4a3a] text-xl shadow-md hover:shadow-lg backdrop-blur-sm transition-all duration-200 border border-[#c4a882]/40"
          aria-label="Next envelope"
        >›</button>
      )}

      <AnimatePresence>
        {isLetterOpen && (
          <LetterStack
            key="letter-stack"
            number={letterNumber!}
            onClose={closeLetter}
            initialPage={initialPage}
            language={language}
            unlocked={env29Unlocked}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/envelope/:num" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabs: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 6, background: 'rgba(245,230,200,0.75)',
    backdropFilter: 'blur(8px)', borderRadius: 999, padding: '6px 10px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)', zIndex: 50,
  },
  tab: {
    width: 36, height: 36, borderRadius: '50%', border: 'none',
    background: 'transparent', cursor: 'pointer', fontSize: 16,
    fontFamily: "'Caveat', cursive", color: '#000', transition: 'all 0.2s',
  },
  tabActive: { background: '#000', color: '#fff' },
  buyLink: {
    fontSize: 20, fontFamily: "'Caveat', cursive", color: '#3a2e22',
    textDecoration: 'none', background: 'rgba(245, 230, 200, 0.45)',
    backdropFilter: 'blur(6px)', border: '1px solid rgba(180,150,100,0.4)',
    borderRadius: 10, padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
    letterSpacing: '0.01em', lineHeight: 1.3, transition: 'all 0.2s',
  },
  kbd: {
    display: 'inline-block', background: 'rgba(90,74,58,0.12)',
    border: '1px solid rgba(90,74,58,0.3)', borderRadius: 4,
    padding: '0px 5px', fontSize: 14, fontFamily: 'monospace',
    lineHeight: '20px', verticalAlign: 'middle',
  },
  instructions: {
    display: 'flex', flexDirection: 'column', gap: 2,
    fontFamily: "'Caveat', cursive", fontSize: 18, color: '#000',
    opacity: 0.7, pointerEvents: 'none', userSelect: 'none',
  },
  langSelect: {
    fontFamily: "'Caveat', cursive", fontSize: 16, color: '#3a2e22',
    background: 'rgba(245, 230, 200, 0.45)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(180,150,100,0.4)', borderRadius: 10,
    padding: '6px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
    minWidth: 64, cursor: 'pointer', transition: 'all 0.2s',
  } as React.CSSProperties,
  tabEllipsis: { fontSize: 16, color: '#000', lineHeight: '36px', padding: '0 2px', userSelect: 'none' },
};
