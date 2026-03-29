import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { ArenaEngine } from './game/Arena';
import { CHARACTER_DATA, ITEM_DATA } from './game/Data';
import type { CharacterDef, ItemDef } from './game/Data';
import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, SignIn, UserButton, useUser } from '@clerk/clerk-react';
import { Filter } from 'bad-words';

const filter = new Filter();

const getPlayerTitle = (username: string, maxScore: number) => {
  if (!username) return null;
  const name = username.toLowerCase();

  // Hardcoded Roles
  if (name === 'helenkiller' || name === 'schmalaa') {
    return { title: 'DEV', color: '#ff4757', glow: '0 0 10px #ff4757', bg: 'rgba(255, 71, 87, 0.15)', border: '1px solid #ff4757' };
  }

  const vips = ['vip_player', 'supporter'];
  if (vips.includes(name)) {
    return { title: 'VIP', color: '#ffa502', glow: '0 0 10px #ffa502', bg: 'rgba(255, 165, 2, 0.15)', border: '1px solid #ffa502' };
  }

  // Progression Roles
  if (maxScore >= 100) return { title: 'DEMI-GOD', color: '#ff7f50', glow: '0 0 8px #ff7f50', bg: 'rgba(255, 127, 80, 0.15)', border: '1px solid rgba(255, 127, 80, 0.5)' };
  if (maxScore >= 50) return { title: 'GRANDMASTER', color: '#9b59b6', glow: '0 0 8px #9b59b6', bg: 'rgba(155, 89, 182, 0.15)', border: '1px solid rgba(155, 89, 182, 0.5)' };
  if (maxScore >= 20) return { title: 'VETERAN', color: '#3498db', glow: 'none', bg: 'rgba(52, 152, 219, 0.15)', border: '1px solid rgba(52, 152, 219, 0.5)' };

  return null;
};

const GamertagModal = ({ user }: { user: any }) => {
  const [tag, setTag] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = tag.trim();
    if (trimmed.length < 3 || trimmed.length > 15) {
      return setError('Gamertag must be 3-15 characters long.');
    }
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
      return setError('Gamertag must be alphanumeric.');
    }
    if (filter.isProfane(trimmed)) {
      return setError('That name is inappropriate.');
    }
    setLoading(true);
    try {
      await user.update({ username: trimmed });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to set Gamertag. It might be taken!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay modal-overlay-dark">
      <form onSubmit={handleSubmit} className="glass-panel gamertag-form flex-col items-center gap-3">
        <h2 className="title mb-0" style={{ fontSize: '2.5rem' }}>CHOOSE GAMERTAG</h2>
        <p className="text-muted">This name will represent you on the leaderboards.</p>
        <input
          autoFocus
          type="text"
          value={tag}
          onChange={e => setTag(e.target.value)}
          placeholder="Enter Gamertag..."
          className="gamertag-input"
        />
        {error && <div className="font-bold" style={{ color: '#ff4757' }}>{error}</div>}
        <button type="submit" disabled={loading} className="btn w-full">
          {loading ? 'SAVING...' : 'CONFIRM UNIQUE TAG'}
        </button>
      </form>
    </div>
  )
}


type Phase = 'START' | 'SHOP' | 'ARENA' | 'ITEM_SELECT' | 'COMPENDIUM' | 'GAME_OVER' | 'LEADERBOARD';

const HeroIcon = ({ hero, size = 60 }: { hero: CharacterDef, size?: number }) => {
  const S = hero.shape;
  const W = hero.weapon;
  const gradientId = `grad-${hero.id}`;
  const isHighTier = hero.tier >= 3;

  return (
    <div style={{ width: size, height: size, display: 'inline-block', filter: `drop-shadow(0 0 10px ${hero.color}${isHighTier ? 'aa' : '66'})` }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="40%" stopColor={hero.color} stopOpacity="1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
          </linearGradient>
          <filter id="innerGlow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
            <feFlood floodColor="#ffffff" floodOpacity="0.5" />
            <feComposite in2="shadowDiff" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
        </defs>

        {/* Background Shape */}
        <g fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.9)" strokeWidth={isHighTier ? "4" : "2"} strokeLinejoin="round" filter="url(#innerGlow)">
          {S === 'circle' && <circle cx="50" cy="50" r="45" />}
          {S === 'square' && <rect x="8" y="8" width="84" height="84" rx="20" />}
          {S === 'triangle' && <polygon points="50,10 95,85 5,85" strokeLinejoin="miter" />}
          {S === 'diamond' && <polygon points="50,5 95,50 50,95 5,50" />}
          {S === 'hexagon' && <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />}
          {S === 'cross' && <polygon points="35,10 65,10 65,35 90,35 90,65 65,65 65,90 35,90 35,65 10,65 10,35 35,35" rx="5" />}
        </g>

        {/* Accent Rings for high tier */}
        {isHighTier && (
          <g fill="none" stroke="rgba(255,215,0,0.6)" strokeWidth="2">
            <circle cx="50" cy="50" r="38" strokeDasharray="4 4" />
          </g>
        )}

        {/* Inner Weapon Icon */}
        <g stroke="#fff" fill="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ transformOrigin: '50% 50%', transform: S === 'triangle' ? 'scale(0.60) translateY(15px)' : 'scale(0.65)' }}>
          {W === 'sword' && (
            <g>
              {/* Blade */}
              <path d="M 50 10 L 60 25 L 55 70 L 45 70 L 40 25 Z" fill="#e0e0e0" stroke="#ccc" />
              {/* Crossguard */}
              <rect x="25" y="65" width="50" height="8" fill="#ffd700" stroke="#b8860b" rx="3" />
              {/* Hilt */}
              <rect x="42" y="73" width="16" height="20" fill="#8b4513" stroke="#5c3a21" />
              {/* Pommel */}
              <circle cx="50" cy="95" r="6" fill="#ffd700" stroke="#b8860b" />
              {/* Edge line */}
              <line x1="50" y1="15" x2="50" y2="70" stroke="#fff" strokeWidth="2" />
            </g>
          )}

          {W === 'arrow' && (
            <g>
              {/* Shaft */}
              <line x1="50" y1="10" x2="50" y2="90" stroke="#8b4513" strokeWidth="6" />
              {/* Arrowhead */}
              <polygon points="50,5 65,25 50,18 35,25" fill="#e0e0e0" stroke="#ccc" />
              {/* Fletching */}
              <path d="M 50 75 L 65 90 L 50 90 M 50 75 L 35 90 L 50 90 M 50 65 L 65 80 L 50 80 M 50 65 L 35 80 L 50 80" fill="none" stroke="#e0e0e0" strokeWidth="4" />
            </g>
          )}

          {W === 'orb' && (
            <g>
              {/* Outer ring */}
              <circle cx="50" cy="50" r="35" fill="none" stroke="#a29bfe" strokeWidth="6" strokeDasharray="15 10" style={{ transformOrigin: '50% 50%', animation: 'spin 10s linear infinite' }} />
              {/* Inner core */}
              <circle cx="50" cy="50" r="22" fill="#6c5ce7" stroke="#fff" strokeWidth="3" />
              {/* Core highlight */}
              <circle cx="43" cy="43" r="6" fill="#fff" stroke="none" opacity="0.8" />
            </g>
          )}

          {W === 'dagger' && (
            <g>
              {/* Blade */}
              <path d="M 50 15 L 62 40 L 53 75 L 47 75 L 38 40 Z" fill="#cfd8dc" stroke="#90a4ae" strokeWidth="3" />
              {/* Guard */}
              <line x1="30" y1="75" x2="70" y2="71" stroke="#455a64" strokeWidth="6" strokeLinecap="round" />
              {/* Handle */}
              <rect x="44" y="75" width="12" height="20" fill="#3e2723" stroke="none" />
              {/* Edge */}
              <line x1="50" y1="20" x2="50" y2="75" stroke="#fff" strokeWidth="2" />
            </g>
          )}

          {W === 'shield' && (
            <g>
              {/* Shield Body */}
              <path d="M 20 20 L 80 20 L 80 50 Q 50 100 20 50 Z" fill="#78909c" stroke="#cfd8dc" strokeWidth="6" strokeLinejoin="round" />
              {/* Shield Cross/Crest */}
              <path d="M 50 20 L 50 85 M 20 40 L 80 40" fill="none" stroke="#fff" strokeWidth="8" opacity="0.6" />
              {/* Rivets */}
              <circle cx="30" cy="30" r="3" fill="#fff" stroke="none" />
              <circle cx="70" cy="30" r="3" fill="#fff" stroke="none" />
              <circle cx="50" cy="80" r="3" fill="#fff" stroke="none" />
            </g>
          )}

          {W === 'lightning' && (
            <g>
              {/* Bolt */}
              <polygon points="65,5 30,55 50,55 35,95 80,45 55,45" fill="#ffeaa7" stroke="#fdcb6e" strokeWidth="4" strokeLinejoin="miter" />
              <polygon points="60,15 38,50 55,50 42,80 68,48 50,48" fill="#fff" stroke="none" />
            </g>
          )}

          {W === 'gun' && (
            <g>
              {/* Barrel */}
              <rect x="55" y="35" width="35" height="15" fill="#636e72" stroke="#2d3436" strokeWidth="4" rx="2" />
              {/* Body */}
              <rect x="20" y="30" width="40" height="25" fill="#b2bec3" stroke="#2d3436" strokeWidth="4" rx="4" />
              {/* Handle */}
              <path d="M 25 55 L 40 55 L 35 85 L 15 85 Z" fill="#8b4513" stroke="#2d3436" strokeWidth="4" strokeLinejoin="round" />
              {/* Trigger */}
              <path d="M 40 55 L 45 65 L 40 70" fill="none" stroke="#2d3436" strokeWidth="3" />
              {/* Detail */}
              <line x1="25" y1="40" x2="55" y2="40" stroke="#2d3436" strokeWidth="2" />
            </g>
          )}

          {/* Fallback */}
          {!['sword', 'arrow', 'orb', 'dagger', 'shield', 'lightning', 'gun'].includes(W) && (
            <circle cx="50" cy="50" r="20" fill="#fff" />
          )}
        </g>
      </svg>
    </div>
  );
};

function App() {
  const [phase, setPhase] = useState<Phase>('START');
  const [gold, setGold] = useState(3);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [maxSnakeLength, setMaxSnakeLength] = useState(3);
  const [snake, setSnake] = useState<CharacterDef[]>([]);
  const [shopItems, setShopItems] = useState<CharacterDef[]>([]);
  const [inventory, setInventory] = useState<ItemDef[]>([]);
  const [itemChoices, setItemChoices] = useState<ItemDef[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{ username: string, score: number }[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const { user, isLoaded } = useUser();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArenaEngine | null>(null);

  // Generate 3 random shop items using scaling tier logic
  const generateShop = () => {
    let weights = [0, 0, 0, 0]; // Indices 0-3 map to Tier 1-4 probabilities
    if (round < 4) weights = [0.90, 0.10, 0.00, 0.00];
    else if (round < 8) weights = [0.70, 0.25, 0.05, 0.00];
    else if (round < 14) weights = [0.50, 0.30, 0.15, 0.05];
    else weights = [0.30, 0.30, 0.25, 0.15];

    const pickHeroByTier = () => {
      const roll = Math.random();
      let cum = 0;
      let selectedTier = 1;
      for (let i = 0; i < 4; i++) {
        cum += weights[i];
        if (roll <= cum) {
          selectedTier = i + 1;
          break;
        }
      }
      // Strictly grab pool of selected tier. If empty fallback to random.
      const pool = CHARACTER_DATA.filter(c => c.tier === selectedTier);
      if (pool.length === 0) return CHARACTER_DATA[Math.floor(Math.random() * CHARACTER_DATA.length)];
      return pool[Math.floor(Math.random() * pool.length)];
    };

    setShopItems([pickHeroByTier(), pickHeroByTier(), pickHeroByTier()]);
  };

  const generateItems = () => {
    const sorted = [...ITEM_DATA].sort(() => 0.5 - Math.random());
    setItemChoices(sorted.slice(0, 3));
  };

  const buyHero = (hero: CharacterDef) => {
    if (gold >= hero.tier && snake.length < maxSnakeLength) {
      setGold(prev => prev - hero.tier);
      setSnake(prev => [...prev, { ...hero, id: hero.id + Math.random() }]); // give unique instance id
    }
  };

  const startArena = () => {
    setPhase('ARENA');
  };

  const handleGameOver = async () => {
    setPhase('GAME_OVER');
    setScore(round);
    engineRef.current?.destroy();
    engineRef.current = null;

    if (user?.username) {
      try {
        await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, score: round })
        });
      } catch (err) {
        console.error("Failed to post high score", err);
      }
    }
  };

  const handleVictory = (finalScore: number) => {
    setScore(finalScore);

    if (round % 3 === 0) {
      generateItems();
      setMaxSnakeLength(m => m + 1);
      setPhase('ITEM_SELECT');
    } else {
      setRound(r => r + 1);
      setGold(g => g + 4 + Math.floor(round / 3));
      generateShop();
      setPhase('SHOP');
    }
  };

  const [currentHealth, setCurrentHealth] = useState(100);

  const classCounts = snake.reduce((acc, s) => {
    s.classes.forEach(c => {
      acc[c] = (acc[c] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    setPhase('LEADERBOARD');
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboardData(data);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (phase === 'ARENA' && canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;

      engineRef.current = new ArenaEngine(
        canvasRef.current,
        snake,
        classCounts,
        round,
        handleGameOver,
        handleVictory,
        inventory
      );
      engineRef.current.start();
      setCurrentHealth(100);

      const interval = setInterval(() => {
        if (engineRef.current) {
          setCurrentHealth(engineRef.current.health);
        }
      }, 100);
      return () => {
        clearInterval(interval);
        engineRef.current?.destroy();
      };
    }

    return () => {
      engineRef.current?.destroy();
    }
  }, [phase]);

  // Handle window resize dynamically to adjust canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && phase === 'ARENA') {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        if (engineRef.current) {
          engineRef.current.width = window.innerWidth;
          engineRef.current.height = window.innerHeight;
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [phase]);

  return (
    <div className="app-container">
      <SignedOut>
        <div className="overlay" style={{ background: 'radial-gradient(circle at center, rgba(13, 15, 18, 0.8) 0%, rgba(13, 15, 18, 1) 100%)', zIndex: 2000 }}>
          <h1 className="title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>SYNAPSE SNAKE</h1>
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      <SignedIn>
        {isLoaded && user && (!user.username || filter.isProfane(user.username)) ? (
          <GamertagModal user={user} />
        ) : (
          <>
            {/* GLOBAL HEADER */}
            {phase !== 'ARENA' && (
              <div className="global-header">
                <div className="flex items-center gap-10px">
                  <UserButton afterSignOutUrl="/" />
                  {user && (
                    <div className="flex items-center gap-10px">
                      <span className="text-white font-semibold" style={{ fontSize: '1.2rem' }}>{user.username || user.firstName}</span>
                      {(() => {
                        // We don't have their max score loaded locally yet, but static VIP/DEV lookup works!
                        const b = getPlayerTitle(user.username || '', 0);
                        if (!b) return null;
                        return (
                          <span className="font-bold" style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: b.bg, color: b.color, textShadow: b.glow, border: b.border }}>
                            {b.title}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
                {phase !== 'START' && phase !== 'LEADERBOARD' && phase !== 'COMPENDIUM' && (
                  <div className="gold-display absolute-center">
                    💰 {gold} GOLD
                  </div>
                )}
                <div className="flex items-center gap-20px">
                  {phase !== 'START' && phase !== 'LEADERBOARD' && phase !== 'COMPENDIUM' && (
                    <div className="round-display font-bold">ROUND {round}</div>
                  )}
                  {user?.primaryEmailAddress?.emailAddress === 'schmalaa@gmail.com' && (
                    <button onClick={() => setShowDev(!showDev)} className="dev-badge-btn" style={{ opacity: showDev ? 1 : 0.7 }}>
                      💻 DEV
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Canvas Layer - Always mounted but hidden unless ARENA */}
            <canvas
              ref={canvasRef}
              className="game-canvas"
              style={{ display: phase === 'ARENA' ? 'block' : 'none' }}
            />

            {phase === 'ARENA' && (
              <>
                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{ width: `${Math.max(0, currentHealth)}%` }}
                  />
                </div>

                <div className="build-indicator glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '2px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {snake.map((s, idx) => (
                    <HeroIcon key={idx} hero={s} size={24} />
                  ))}
                </div>
              </>
            )}

            <AnimatePresence>
              {phase === 'START' && (
                <motion.div
                  className="overlay flex-col items-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                >
                  <motion.img
                    src="/logo.png"
                    alt="Synapse Snake Logo"
                    style={{ width: '300px', filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.5))' }}
                    initial={{ scale: 0.8, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, type: 'spring' }}
                  />
                  <h1 className="title text-center mb-1 tracking-wide" style={{ fontSize: '4.5rem', textShadow: '0 0 20px var(--accent)' }}>SYNAPSE SNAKE</h1>
                  <p className="text-muted mb-6 text-lg tracking-wide">A REACT + ECS SURVIVAL ENGINE</p>
                  {score > 0 && <p className="text-accent-secondary mb-4 font-bold">Latest Score: {score}</p>}
                  <div className="flex gap-2 justify-center">
                    <button className="btn" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem' }} onClick={() => {
                      setSnake([{ ...CHARACTER_DATA[0], id: 'h1_initial' }]); // Start with Vagrant
                      setGold(3);
                      setMaxSnakeLength(3);
                      setRound(1);
                      setInventory([]);
                      generateShop();
                      setPhase('SHOP');
                    }}>
                      PLAY GAME
                    </button>
                    <button className="btn" style={{ padding: '1.5rem 2rem', fontSize: '1.5rem', background: '#333' }} onClick={fetchLeaderboard}>
                      🏆 LEADERBOARD
                    </button>
                    <button className="btn" style={{ padding: '1.5rem 2rem', fontSize: '1.5rem' }} onClick={() => setShowHelp(true)}>
                      HOW TO PLAY
                    </button>
                    <button className="btn" style={{ padding: '1.5rem 2rem', fontSize: '1.5rem' }} onClick={() => setPhase('COMPENDIUM')}>
                      WIKI
                    </button>
                  </div>

                  <div className="text-muted text-center w-full" style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.9rem' }}>
                    Made with ❤️ by <a href="https://alexschmaltz.com" target="_blank" rel="noreferrer" className="text-accent" style={{ textDecoration: 'none' }}>Alex</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showHelp && (
                <motion.div className="overlay glass-panel z-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="title text-3xl mb-4">HOW TO PLAY</h2>
                  <div className="text-left text-lg text-white" style={{ maxWidth: '600px', lineHeight: '1.8' }}>
                    <p className="mb-3"><strong>1. Build Your Snake:</strong> Use gold in the Tavern to hire specialized heroes. Heroes have unique weapons and classes.</p>
                    <p className="mb-3"><strong>2. Class Synergies:</strong> Hiring multiple heroes of the SAME class unlocks massive passive buffs (e.g. 3 Warriors gain +50% damage).</p>
                    <p className="mb-3"><strong>3. Combat:</strong> Steer your snake using the mouse. Heroes automatically attack nearby enemies based on distance and cooldowns.</p>
                    <p className="mb-3"><strong>4. Relics:</strong> Defeat the Elite Boss every 3 rounds to draft permanent passive Relic upgrades that alter your run!</p>
                  </div>
                  <button className="btn mt-6" style={{ padding: '1rem 3rem' }} onClick={() => setShowHelp(false)}>BACK</button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === 'COMPENDIUM' && (
                <motion.div className="overlay glass-panel wiki-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="title text-3xl mb-2">SNAKE WIKI</h2>
                  <div className="flex gap-4 flex-wrap justify-center mb-4">
                    <div className="wiki-card">
                      <h3 className="text-accent mb-2" style={{ borderBottom: '1px solid #555', paddingBottom: '0.5rem' }}>Classes & Synergies</h3>
                      <ul className="wiki-list">
                        <li><strong className="text-white">Warrior (3+):</strong> +50% Global Damage. Frontline bruisers.</li>
                        <li><strong className="text-white">Mage (3+):</strong> +50% Global Damage. Heavy AoE magic.</li>
                        <li><strong className="text-white">Enchanter (2+):</strong> +25% Global Damage. Elemental chaining attacks.</li>
                        <li><strong className="text-white">Psyker:</strong> Manipulates time and space.</li>
                        <li><strong className="text-white">Ranger:</strong> Piercing, high single-target physical projectiles.</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-accent-secondary text-2xl mb-4">Hero Roster</h3>
                  <div className="hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {CHARACTER_DATA.map(hero => (
                      <div key={hero.id} className="hero-card flex-col" style={{ height: '100%', borderColor: '#444' }}>
                        <div className="flex justify-center mb-2">
                          <HeroIcon hero={hero} size={60} />
                        </div>
                        <div className="flex-col text-center flex-grow">
                          <div className="hero-name text-lg">{hero.name}</div>
                          <div className="hero-class text-sm mb-1">{hero.classes.join(', ')}</div>
                          <div className="text-sm mb-1" style={{ color: '#ffb142' }}>Cost: {Array(hero.tier).fill('⭐').join('')}</div>
                          <div className="hero-description text-sm mb-2">{hero.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-6 mb-4">
                    <button className="btn" style={{ padding: '1rem 3rem' }} onClick={() => setPhase('START')}>RETURN TO MENU</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === 'LEADERBOARD' && (
                <motion.div className="overlay glass-panel z-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="title text-center text-3xl mb-4" style={{ color: '#ffea00', textShadow: '0 0 30px rgba(255, 234, 0, 0.5)' }}>GLOBAL LEADERBOARD</h2>
                  <div className="leaderboard-panel">
                    {loadingLeaderboard ? (
                      <div className="text-center text-muted p-4 text-xl">Synchronizing records...</div>
                    ) : leaderboardData.length === 0 ? (
                      <div className="text-center text-muted p-4 text-xl">No runs recorded yet. The frontier is empty.</div>
                    ) : (
                      <div className="flex-col gap-10px">
                        {leaderboardData.map((entry, idx) => {
                          const badge = getPlayerTitle(entry.username, entry.score);
                          return (
                            <div key={idx} className="flex justify-between items-center p-3" style={{ background: idx === 0 ? 'rgba(255, 234, 0, 0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', border: idx === 0 ? '1px solid rgba(255, 234, 0, 0.4)' : '1px solid rgba(255,255,255,0.05)' }}>
                              <div className="flex gap-20px items-center">
                                <span className="font-bold" style={{ fontSize: '1.4rem', color: idx === 0 ? '#ffea00' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : '#888', width: '40px' }}>
                                  #{idx + 1}
                                </span>
                                <span className="flex items-center gap-10px" style={{ fontSize: '1.4rem', color: user?.username === entry.username ? 'var(--accent)' : '#fff', fontWeight: user?.username === entry.username ? 'bold' : 'normal' }}>
                                  {entry.username} {user?.username === entry.username && '(You)'}
                                  {badge && (
                                    <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: badge.bg, color: badge.color, textShadow: badge.glow, border: badge.border }}>
                                      {badge.title}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span className="font-bold text-accent-secondary text-xl">
                                Round {entry.score}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <button className="btn mt-6" style={{ padding: '1rem 3rem' }} onClick={() => setPhase('START')}>RETURN TO MENU</button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === 'SHOP' && (
                <motion.div
                  className="overlay shop-phase"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                >
                  {/* Header handled globally */}
                  
                  <div className="text-center mb-6">
                    <h2 className="title text-4xl mb-1" style={{ textShadow: '0 0 20px var(--accent-glow)' }}>
                      THE ARMORY
                    </h2>
                    <p className="text-muted text-xl tracking-wide">
                      RECRUIT HEROES FOR YOUR SNAKE
                    </p>
                  </div>

                  {/* Main Shop Layout: 2 Columns */}
                  <div className="flex flex-wrap justify-center w-full" style={{ gap: '2rem', margin: '0 auto', maxWidth: '1200px' }}>
                    
                    {/* LEFT COLUMN: Recruitment */}
                    <div className="flex-col gap-4 flex-grow" style={{ flexBasis: '600px', maxWidth: '800px' }}>
                      <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-accent-secondary text-2xl m-0 font-bold" style={{ color: 'var(--accent-secondary)' }}>Available Recruits</h3>
                        <div className="flex items-center justify-center gap-3 text-sm text-muted rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}>
                          <span className="font-bold text-white mr-1">Cost:</span>
                          <span>⭐ Common</span>
                          <span style={{ color: '#555' }}>|</span>
                          <span>⭐⭐ Uncommon</span>
                          <span style={{ color: '#555' }}>|</span>
                          <span>⭐⭐⭐ Rare</span>
                          <span style={{ color: '#555' }}>|</span>
                          <span>⭐⭐⭐⭐ Epic</span>
                        </div>
                      </div>
                      
                      <div className="hero-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        {shopItems.map((item, idx) => (
                          <div key={idx} className="hero-card flex-col" style={{ height: '100%', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="flex justify-center mb-4">
                              <HeroIcon hero={item} size={90} />
                            </div>
                            <div className="flex-col text-center flex-grow">
                              <div className="hero-name text-xl mb-1">{item.name}</div>
                              <div className="hero-class text-sm mb-2 font-bold" style={{ color: '#aaa' }}>{item.classes.join(', ')}</div>
                              <div className="hero-description text-sm mb-4 text-muted flex-grow" style={{ lineHeight: '1.4' }}>{item.description}</div>
                            </div>
                            <button
                              className="btn flex justify-between items-center w-full p-3 mt-2"
                              disabled={gold < item.tier || snake.length >= maxSnakeLength}
                              style={{
                                opacity: (gold < item.tier || snake.length >= maxSnakeLength) ? 0.5 : 1,
                                cursor: (gold < item.tier || snake.length >= maxSnakeLength) ? 'not-allowed' : 'pointer',
                              }}
                              onClick={() => buyHero(item)}
                            >
                              <span className="font-bold text-lg">HIRE</span>
                              <span className="hero-price text-lg">⭐ {item.tier}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Party Management */}
                    <div className="flex-col gap-4 flex-shrink-0" style={{ width: '400px' }}>
                      
                      {/* Party Status Panel */}
                      <div className="glass-panel p-4 flex-col gap-3">
                        <div className="flex-col gap-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="flex justify-between items-end px-1">
                            <h3 className="text-xl text-white m-0 font-bold">Party Size</h3>
                            <span className="text-muted text-sm">{snake.length} / {maxSnakeLength} Slots Filled</span>
                          </div>
                          <button
                            className="btn flex justify-between items-center w-full p-2"
                            disabled={gold < (3 + (maxSnakeLength - 3) * 3)}
                            style={{ opacity: gold < (3 + (maxSnakeLength - 3) * 3) ? 0.5 : 1, cursor: gold < (3 + (maxSnakeLength - 3) * 3) ? 'not-allowed' : 'pointer', padding: '0.6rem 1rem' }}
                            onClick={() => {
                              setGold(g => g - (3 + (maxSnakeLength - 3) * 3));
                              setMaxSnakeLength(m => m + 1);
                            }}
                          >
                            <span className="font-bold tracking-wide">UPGRADE CAPACITY</span>
                            <span className="text-accent font-bold" style={{ background: 'rgba(0,0,0,0.3)', padding: '3px 10px', borderRadius: '5px' }}>💰 {3 + (maxSnakeLength - 3) * 3}</span>
                          </button>
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-sm text-muted mb-3 font-bold">CURRENT SNAKE</div>
                          <div className="flex flex-wrap gap-10px">
                            {snake.length === 0 && <span className="text-muted p-2">No heroes recruited yet.</span>}
                            {snake.map((s) => (
                              <motion.div key={s.id} initial={{ scale: 0 }} animate={{ scale: 1 }} title={s.name}>
                                <HeroIcon hero={s} size={42} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Active Synergies Panel */}
                      <div className="glass-panel p-4 flex-col">
                        <h3 className="text-xl text-white m-0 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Active Synergies</h3>
                        {Object.keys(classCounts).length === 0 ? (
                          <div className="text-muted text-sm text-center py-4">Hire at least 2 heroes of the same class to activate synergy buffs.</div>
                        ) : (
                          <div className="flex-col gap-2">
                            {Object.entries(classCounts).map(([cName, count]) => {
                              const isActive = count >= 2;
                              const SYNERGY_DESC: Record<string, string> = {
                                Warrior: '+50 HP, +50% Damage',
                                Ranger: 'Double Attack Speed',
                                Mage: '+50% Dmg, Huge AoE',
                                Rogue: '+2 Extra Projectiles',
                                Healer: 'Doubled Healing',
                                Enchanter: '+25% Dmg, Chain Lightning'
                              };
                              return (
                                <div key={cName} className="flex justify-between items-center p-2" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: isActive ? '1px solid rgba(0,255,255,0.3)' : '1px solid transparent' }}>
                                  <div className="flex-col">
                                    <span style={{ fontWeight: isActive ? 800 : 400, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                                      {cName} ({count}/2) {isActive && '★'}
                                    </span>
                                    <span className="text-sm mt-1" style={{ color: isActive ? '#ddd' : '#666' }}>
                                      {SYNERGY_DESC[cName] || 'Unknown buff'}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex justify-center mt-6">
                    <button
                      className="btn font-bold p-4 text-2xl"
                      style={{ background: 'var(--accent)', color: '#000', padding: '1.5rem 6rem', borderRadius: '50px', boxShadow: '0 0 20px var(--accent-glow)' }}
                      onClick={startArena}
                    >
                      START ROUND {round}
                    </button>
                  </div>
                  <div className="w-full flex-shrink-0" style={{ height: '4rem' }} />
                </motion.div>
              )}

              {/* ITEM SELECTION PHASE */}
              {phase === 'ITEM_SELECT' && (
                <motion.div
                  className="overlay glass-panel z-100"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key="item-modal"
                  style={{ background: 'rgba(20, 0, 10, 0.95)', border: '2px solid var(--accent-secondary)' }}
                >
                  <h2 className="title text-5xl" style={{ color: 'var(--accent-secondary)', textShadow: '0 0 30px var(--accent-secondary)' }}>BOSS DEFEATED</h2>
                  <p className="text-lg text-muted mb-1">You survived Round {round}! Choose a passive relic to permanently augment your snake.</p>
                  <p className="text-accent text-xl font-bold mb-4" style={{ textShadow: '0 0 10px var(--accent)' }}>
                    🐍 BONUS: Maximum Snake Capacity increased by 1!
                  </p>

                  <div className="card-container flex gap-4 mt-4" style={{ maxWidth: '1000px' }}>
                    {itemChoices.map((item) => (
                      <div key={item.id} className="relic-card">
                        <div className="flex-col text-center flex-grow">
                          <div className="text-4xl mb-2">💎</div>
                          <div className="hero-name text-3xl" style={{ color: 'var(--accent-secondary)' }}>{item.name}</div>
                          <div className="hero-description text-lg flex-grow mt-3 mb-3 text-white" style={{ lineHeight: '1.5' }}>{item.description}</div>
                        </div>
                        <button
                          className="btn w-full mt-6 font-bold p-2"
                          style={{ backgroundColor: 'var(--accent-secondary)', color: '#000' }}
                          onClick={() => {
                            setInventory(prev => [...prev, item]);
                            setRound(r => r + 1);
                            setGold(g => g + 5 + Math.floor(round / 2));
                            generateShop();
                            setPhase('SHOP');
                          }}
                        >
                          SELECT RELIC
                        </button>
                      </div>
                    ))}
                  </div>

                  <InventoryDisplay inventory={inventory} />
                </motion.div>
              )}

            </AnimatePresence>

            <AnimatePresence>
              {phase === 'GAME_OVER' && (
                <motion.div className="overlay glass-panel z-100 flex-col items-center justify-center p-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="title text-5xl mb-2" style={{ background: 'linear-gradient(to right, #ff4757, #ff6b81)', WebkitBackgroundClip: 'text' }}>GAME OVER</h2>
                  <p className="text-xl mb-6 text-muted">The snake succumbed to the swarm on Round {score}.</p>
                  <div className="flex gap-2 justify-center">
                    <button className="btn p-3 text-xl" onClick={() => {
                      setSnake([]);
                      setGold(3);
                      setMaxSnakeLength(3);
                      setRound(1);
                      setInventory([]);
                      setPhase('START');
                    }}>
                      MAIN MENU
                    </button>
                    <button className="btn p-3 text-xl" style={{ background: '#333' }} onClick={fetchLeaderboard}>
                      🏆 LEADERBOARD
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DEV TOOLS - ADMIN ONLY */}
            {user?.primaryEmailAddress?.emailAddress === 'schmalaa@gmail.com' && (
              <>
                {showDev && (
                  <div className="dev-panel">
                    <h3 className="mb-2 pb-1" style={{ color: 'var(--accent)', borderBottom: '1px solid #444' }}>DEV MENU</h3>
                    <button className="w-full mb-3 p-1 font-bold" style={{ background: '#fff', color: '#000', cursor: 'pointer' }} onClick={() => setGold(g => g + 999)}>+999 GOLD</button>

                    <div className="flex gap-10px mb-3">
                      <span className="text-sm text-muted items-center flex">Set Round:</span>
                      <input type="number" min="1" value={round} onChange={(e) => setRound(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '60px', background: '#333', color: '#fff', border: '1px solid #555', padding: '5px', borderRadius: '3px' }} />
                    </div>

                    <div className="text-sm mb-1 text-muted">ADD DIRECTLY TO SNAKE:</div>
                    <div className="flex-col gap-1">
                      {CHARACTER_DATA.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-1" style={{ background: '#222', borderRadius: '5px' }}>
                          <div className="flex items-center gap-10px">
                            <HeroIcon hero={c} size={20} />
                            <span className="text-sm">{c.name}</span>
                          </div>
                          <button onClick={() => setSnake(s => [...s, { ...c, id: Math.random().toString() }])} className="font-bold" style={{ background: 'var(--accent)', border: 'none', width: '25px', height: '25px', cursor: 'pointer', borderRadius: '3px' }}>+</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </SignedIn>
    </div>
  );
}

const InventoryDisplay = ({ inventory }: { inventory: ItemDef[] }) => {
  if (inventory.length === 0) return null;
  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
      <h3 style={{ color: '#888', marginBottom: '1rem' }}>ACTIVE RELICS</h3>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {inventory.map((item, i) => (
          <div key={i} title={item.description} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>
            💎 {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
