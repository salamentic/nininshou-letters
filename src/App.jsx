import { useState, useMemo } from 'react';
import "./styles.css";
import Envelope from './components/Envelope.jsx';
import EnvelopeStackScrollable from './components/EnvelopeStackScrollable.jsx';
import BurgerMenu from './components/BurgerMenu.jsx';
import SpotifyPlayer from './components/SpotifyPlayer.jsx';
import data from './assets/nininshou.json';

const ENVELOPE_COUNT = 32;

export default function App() {
  const [currentEnvelope, setCurrentEnvelope] = useState(0);
  const spotifyLink = useMemo(() => data[currentEnvelope]?.spotify_embed || null, [currentEnvelope]);
  const [triggerPage, setTriggerPage] = useState(null);
  const [closeSignal, setCloseSignal] = useState(0);

  const handlePageSelect = ({ envelopeIndex, pageIndex }) => {
    setCurrentEnvelope(envelopeIndex);
    setTriggerPage({ envelopeIndex, pageIndex, ts: Date.now() });
  };

  return (
    <div>
      <BurgerMenu
        currentEnvelope={currentEnvelope}
        onSelect={setCurrentEnvelope}
        onPageSelect={handlePageSelect}
        onOpen={() => setCloseSignal(s => s + 1)}
        envelopeCount={ENVELOPE_COUNT}
      />
      <EnvelopeStackScrollable
        selectedIndex={currentEnvelope}
        onIndexChange={setCurrentEnvelope}
      >
        {Array.from({ length: ENVELOPE_COUNT }, (_, i) => (
          <Envelope
            key={i}
            number={i + 1}
            triggerPage={triggerPage?.envelopeIndex === i ? triggerPage : null}
            closeSignal={closeSignal}
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
    </div>
  );
}

const styles = {
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
