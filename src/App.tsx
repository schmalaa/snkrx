import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { ArenaEngine } from './game/Arena';
import { CHARACTER_DATA, ITEM_DATA } from './game/Data';
import type { CharacterDef, ItemDef } from './game/Data';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, UserButton, useUser } from '@clerk/clerk-react';
import { Filter } from 'bad-words';
import { getPlayerTitle } from './utils/getPlayerTitle';
import { HeroIcon } from './components/HeroIcon';
import { HowToPlay } from './pages/HowToPlay';
import { Wiki } from './pages/Wiki';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';

const filter = new Filter();

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
  const [showDev, setShowDev] = useState(false);
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
          body: JSON.stringify({ 
            username: user.username, 
            score: round,
            country: user.unsafeMetadata?.country as string | undefined
          })
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

  const location = useLocation();
  const isNonGameRoute = location.pathname !== '/';
  const isStartPhase = phase === 'START' || phase === 'GAME_OVER';
  const showNavLinks = isNonGameRoute || isStartPhase;

  return (
    <div className="app-container">
      <SignedOut>
        <div className="overlay" style={{ background: 'radial-gradient(circle at center, rgba(13, 15, 18, 0.8) 0%, rgba(13, 15, 18, 1) 100%)', zIndex: 2000 }}>
          <h1 className="title logo-title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>SYNAPSE SNAKE</h1>
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      <SignedIn>
        {isLoaded && user && (!user.username || filter.isProfane(user.username)) ? (
          <GamertagModal user={user} />
        ) : (
          <>
            {/* GLOBAL HEADER */}
            {(phase !== 'ARENA' || location.pathname !== '/') && (
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
                
                {showNavLinks ? (
                  <div className="nav-links absolute-center">
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setPhase('START')}>Home</Link>
                    <Link to="/how-to-play" className={`nav-link ${location.pathname === '/how-to-play' ? 'active' : ''}`}>How to Play</Link>
                    <Link to="/wiki" className={`nav-link ${location.pathname === '/wiki' ? 'active' : ''}`}>Wiki</Link>
                    <Link to="/leaderboard" className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>Leaderboard</Link>
                    <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</Link>
                  </div>
                ) : (
                  <div className="gold-display absolute-center">
                    💰 {gold} GOLD
                  </div>
                )}

                <div className="flex items-center gap-20px">
                  {!showNavLinks && (
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
              style={{ display: phase === 'ARENA' && location.pathname === '/' ? 'block' : 'none' }}
            />

            <Routes>
              <Route path="/how-to-play" element={<HowToPlay />} />
              <Route path="/wiki" element={<Wiki />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={
                <>
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
                  <h1 className="title logo-title text-center mb-1 tracking-wide" style={{ fontSize: '4.5rem' }}>SYNAPSE SNAKE</h1>
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
                  </div>

                  <div className="text-muted text-center w-full" style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.9rem' }}>
                    Made with ❤️ by <a href="https://alexschmaltz.com" target="_blank" rel="noreferrer" className="text-accent" style={{ textDecoration: 'none' }}>Alex</a>
                  </div>
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
                    <Link to="/leaderboard" className="btn p-3 text-xl" style={{ background: '#333', textDecoration: 'none' }}>
                      🏆 LEADERBOARD
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </>
           } />
          </Routes>

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
