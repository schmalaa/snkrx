import { useState, useEffect, useRef } from 'react';
import './App.css';
import { ArenaEngine } from './game/Arena';
import { CHARACTER_DATA, ITEM_DATA } from './game/Data';
import type { CharacterDef, ItemDef } from './game/Data';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'START' | 'SHOP' | 'ARENA' | 'ITEM_SELECT' | 'COMPENDIUM' | 'GAME_OVER';

const HeroIcon = ({ hero, size = 60 }: { hero: CharacterDef, size?: number }) => {
  const S = hero.shape;
  const W = hero.weapon;
  
  return (
    <div style={{ width: size, height: size, display: 'inline-block', filter: `drop-shadow(0 0 8px ${hero.color}88)` }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
         {/* Background Shape */}
         <g fill={hero.color} stroke="rgba(255,255,255,0.8)" strokeWidth="4" strokeLinejoin="round">
            {S === 'circle' && <circle cx="50" cy="50" r="45" />}
            {S === 'square' && <rect x="5" y="5" width="90" height="90" rx="15" />}
            {S === 'triangle' && <polygon points="50,10 95,90 5,90" />}
            {S === 'diamond' && <polygon points="50,5 95,50 50,95 5,50" />}
            {S === 'hexagon' && <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />}
            {S === 'cross' && <polygon points="35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35" />}
         </g>
         
         {/* Inner Weapon Icon */}
         <g stroke="#fff" fill="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" style={{ transformOrigin: '50% 50%', transform: 'scale(0.8)' }}>
            {W === 'sword' && <><line x1="50" y1="20" x2="50" y2="80" /><line x1="30" y1="65" x2="70" y2="65" /></>}
            {W === 'arrow' && <><line x1="50" y1="20" x2="50" y2="80" /><polyline points="30,40 50,20 70,40" fill="none" /></>}
            {W === 'orb' && <><circle cx="50" cy="50" r="20" /><circle cx="50" cy="50" r="8" fill="#000" /></>}
            {W === 'dagger' && <><polygon points="50,20 70,40 50,80 30,40" strokeWidth="2" /></>}
            {W === 'shield' && <><path d="M 25 30 L 75 30 L 75 60 Q 50 90 25 60 Z" strokeWidth="4" /></>}
            {W === 'lightning' && <><polyline points="70,25 40,55 55,55 30,85" fill="none" /></>}
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

  const handleGameOver = () => {
    setPhase('GAME_OVER');
    setScore(round);
    engineRef.current?.destroy();
    engineRef.current = null;
  };

  const handleVictory = (finalScore: number) => {
    setScore(finalScore);
    
    if (round % 3 === 0) {
      generateItems();
      setPhase('ITEM_SELECT');
    } else {
      setRound(r => r + 1);
      setGold(g => g + 2 + Math.floor(round / 4));
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

  return (
    <div className="app-container">
      
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
           
           <div className="build-indicator glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '2px', alignItems: 'center' }}>
             {snake.map((s, idx) => (
                <HeroIcon key={idx} hero={s} size={24} />
             ))}
           </div>
        </>
      )}

      <AnimatePresence>
        {phase === 'START' && (
          <motion.div 
            className="overlay"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          >
            <h1 className="title" style={{ fontSize: '5rem', marginBottom: '0.5rem', letterSpacing: '0.2em' }}>SYNAPSE SNAKE</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.2rem', letterSpacing: '0.2rem' }}>A REACT + ECS SURVIVAL ENGINE</p>
            {score > 0 && <p style={{ color: 'var(--accent-secondary)', marginBottom: '2rem' }}>Latest Score: {score}</p>}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
              <button className="btn" style={{ padding: '1.5rem 2rem', fontSize: '1.5rem' }} onClick={() => setShowHelp(true)}>
                HOW TO PLAY
              </button>
              <button className="btn" style={{ padding: '1.5rem 2rem', fontSize: '1.5rem' }} onClick={() => setPhase('COMPENDIUM')}>
                WIKI
              </button>
            </div>
            
            <div style={{ position: 'absolute', bottom: '1.5rem', width: '100%', left: 0, textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
              Made with ❤️ by <a href="https://alexschmaltz.com" target="_blank" rel="noreferrer" style={{color: 'var(--accent)', textDecoration: 'none'}}>Alex</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <motion.div className="overlay glass-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ zIndex: 100 }}>
             <h2 className="title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>HOW TO PLAY</h2>
             <div style={{ textAlign: 'left', maxWidth: '600px', fontSize: '1.2rem', lineHeight: '1.8', color: '#ddd' }}>
               <p style={{ marginBottom: '1.5rem' }}><strong>1. Build Your Snake:</strong> Use gold in the Tavern to hire specialized heroes. Heroes have unique weapons and classes.</p>
               <p style={{ marginBottom: '1.5rem' }}><strong>2. Class Synergies:</strong> Hiring multiple heroes of the SAME class unlocks massive passive buffs (e.g. 3 Warriors gain +50% damage).</p>
               <p style={{ marginBottom: '1.5rem' }}><strong>3. Combat:</strong> Steer your snake using the mouse. Heroes automatically attack nearby enemies based on distance and cooldowns.</p>
               <p style={{ marginBottom: '1.5rem' }}><strong>4. Relics:</strong> Defeat the Elite Boss every 3 rounds to draft permanent passive Relic upgrades that alter your run!</p>
             </div>
             <button className="btn" style={{ marginTop: '3rem', padding: '1rem 3rem' }} onClick={() => setShowHelp(false)}>BACK</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'COMPENDIUM' && (
          <motion.div className="overlay glass-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ zIndex: 100, overflowY: 'auto' }}>
             <h2 className="title" style={{ fontSize: '3rem', marginBottom: '1rem' }}>SNAKE WIKI</h2>
             <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
                <div style={{ flex: '1', minWidth: '300px', background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '20px' }}>
                   <h3 style={{ borderBottom: '1px solid #555', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>Classes & Synergies</h3>
                   <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', lineHeight: '1.8', color: '#ccc' }}>
                     <li><strong style={{ color: '#fff' }}>Warrior (3+):</strong> +50% Global Damage. Frontline bruisers.</li>
                     <li><strong style={{ color: '#fff' }}>Mage (3+):</strong> +50% Global Damage. Heavy AoE magic.</li>
                     <li><strong style={{ color: '#fff' }}>Enchanter (2+):</strong> +25% Global Damage. Elemental chaining attacks.</li>
                     <li><strong style={{ color: '#fff' }}>Psyker:</strong> Manipulates time and space.</li>
                     <li><strong style={{ color: '#fff' }}>Ranger:</strong> Piercing, high single-target physical projectiles.</li>
                   </ul>
                </div>
             </div>

             <h3 style={{ color: 'var(--accent-secondary)', fontSize: '2rem', marginBottom: '2rem' }}>Hero Roster</h3>
             <div className="hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
               {CHARACTER_DATA.map(hero => (
                <div key={hero.id} className="hero-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderColor: '#444' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <HeroIcon hero={hero} size={60} />
                  </div>
                  <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="hero-name" style={{ fontSize: '1.2rem' }}>{hero.name}</div>
                    <div className="hero-class" style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{hero.classes.join(', ')}</div>
                    <div style={{ color: '#ffb142', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Cost: {Array(hero.tier).fill('⭐').join('')}</div>
                    <div className="hero-description" style={{ marginBottom: '1rem', color: '#ccc', fontSize: '0.9rem' }}>{hero.description}</div>
                  </div>
                </div>
               ))}
             </div>
             <div style={{ textAlign: 'center', margin: '3rem 0 2rem 0' }}>
               <button className="btn" style={{ padding: '1rem 3rem' }} onClick={() => setPhase('START')}>RETURN TO MENU</button>
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
            <div className="top-bar">
              <div className="gold-display">💰 {gold} GOLD</div>
              <div className="round-display">ROUND {round}</div>
            </div>
            
            <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', textShadow: '0 0 20px var(--accent-glow)' }}>
              THE ARMORY
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
              RECRUIT HEROES FOR YOUR SNAKE
            </p>

            <div className="tier-legend" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1.5rem', color: '#aaa', fontSize: '0.9rem', background: 'rgba(0,0,0,0.4)', padding: '0.5rem 2rem', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <span>Cost 1: ⭐ Common</span>
               <span>Cost 2: ⭐⭐ Uncommon</span>
               <span>Cost 3: ⭐⭐⭐ Rare</span>
               <span>Cost 4: ⭐⭐⭐⭐ Epic</span>
            </div>

            <div className="hero-grid">
              {shopItems.map((item, idx) => (
                <div key={idx} className="hero-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <HeroIcon hero={item} size={80} />
                  </div>
                  <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="hero-name">{item.name}</div>
                    <div className="hero-class">{item.classes.join(', ')}</div>
                    <div className="hero-description" style={{ marginBottom: '1rem' }}>{item.description}</div>
                  </div>
                  <button 
                    className="btn" 
                    disabled={gold < item.tier || snake.length >= maxSnakeLength}
                    style={{ 
                      width: '100%', 
                      opacity: (gold < item.tier || snake.length >= maxSnakeLength) ? 0.5 : 1,
                      cursor: (gold < item.tier || snake.length >= maxSnakeLength) ? 'not-allowed' : 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                    onClick={() => buyHero(item)}
                  >
                    <span>Hire</span>
                    <span className="hero-price">⭐ {item.tier}</span>
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #444', maxWidth: '800px', margin: '2rem auto 0 auto' }}>
               <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Snake Capacity</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#aaa', fontSize: '1.1rem' }}>Party Size: {snake.length} / {maxSnakeLength}</p>
               </div>
               <button 
                 className="btn"
                 disabled={gold < (5 + (maxSnakeLength - 3) * 5)}
                 style={{
                    opacity: gold < (5 + (maxSnakeLength - 3) * 5) ? 0.5 : 1,
                    cursor: gold < (5 + (maxSnakeLength - 3) * 5) ? 'not-allowed' : 'pointer',
                    padding: '1.2rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    lineHeight: '1'
                 }}
                 onClick={() => {
                    setGold(g => g - (5 + (maxSnakeLength - 3) * 5));
                    setMaxSnakeLength(m => m + 1);
                 }}
               >
                 <span>UPGRADE +1</span>
                 <span style={{fontSize: '1rem', color: 'var(--accent)'}}>💰 {5 + (maxSnakeLength - 3) * 5} Gold</span>
               </button>
            </div>

            {/* Current Build Display */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '4rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>CURRENT SNAKE ({snake.length} HEROES)</div>
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '50px' }}>
                  {snake.length === 0 && <div style={{ color: '#555' }}>Empty</div>}
                  {snake.map((s) => (
                   <motion.div key={s.id} initial={{ scale: 0 }} animate={{ scale: 1 }} title={s.name}>
                     <HeroIcon hero={s} size={40} />
                   </motion.div>
                ))}
                </div>
              </div>

              {/* Synergies Display */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ color: 'var(--text-muted)' }}>ACTIVE SYNERGIES</div>
                 <div className="glass-panel" style={{ padding: '1rem 2rem', minWidth: '350px' }}>
                   {Object.keys(classCounts).length === 0 && <span style={{ color: '#555' }}>No heroes</span>}
                   {Object.entries(classCounts).map(([cName, count]) => {
                      const isActive = count >= 2;
                      
                      const SYNERGY_DESC: Record<string, string> = {
                        Warrior: '+50 HP, +50% Damage',
                        Ranger: 'Double Attack Speed',
                        Mage: '+50% Dmg, Huge AoE',
                        Rogue: '+2 Extra Projectiles',
                        Healer: 'Doubled Healing',
                      };
                      
                      return (
                        <div key={cName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: isActive ? 800 : 400, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                              {cName} ({count}/2) {isActive && '★'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: isActive ? '#ddd' : '#666', marginTop: '4px' }}>
                              {SYNERGY_DESC[cName] || 'Unknown buff'}
                            </span>
                          </div>
                        </div>
                      )
                   })}
                   <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
                     Get 2 heroes of a class to unlock its synergy buff!
                   </div>
                 </div>
              </div>
            </div>

            <button 
              className="btn" 
              style={{ marginTop: '3rem', padding: '1rem 4rem', fontSize: '1.5rem', background: 'var(--accent)', color: '#000' }}
              onClick={startArena}
            >
              START ROUND {round}
            </button>
          </motion.div>
        )}

        {/* ITEM SELECTION PHASE */}
        {phase === 'ITEM_SELECT' && (
          <motion.div 
            className="overlay glass-panel"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key="item-modal"
            style={{ background: 'rgba(20, 0, 10, 0.95)', border: '2px solid var(--accent-secondary)' }}
          >
            <h2 className="title" style={{ color: 'var(--accent-secondary)', fontSize: '4rem', textShadow: '0 0 30px var(--accent-secondary)' }}>BOSS DEFEATED</h2>
            <p style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '1rem' }}>You survived Round {round}! Choose a passive relic to permanently augment your snake.</p>
            
            <div className="card-container" style={{ marginTop: '2rem', maxWidth: '1000px', display: 'flex', gap: '2rem' }}>
              {itemChoices.map((item) => (
                <div key={item.id} className="hero-card" style={{ borderColor: 'var(--accent-secondary)', background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(200, 50, 100, 0.1) 100%)', padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '400px' }}>
                  <div style={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
                    <div className="hero-name" style={{ color: 'var(--accent-secondary)', fontSize: '1.8rem' }}>{item.name}</div>
                    <div className="hero-description" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', color: '#ddd', fontSize: '1.1rem', lineHeight: '1.5', flexGrow: 1 }}>{item.description}</div>
                  </div>
                  <button 
                    className="btn" 
                    style={{ width: '100%', marginTop: '3rem', backgroundColor: 'var(--accent-secondary)', color: '#000', fontWeight: 800, padding: '1rem' }}
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
          <motion.div className="overlay glass-panel" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
             <h2 className="title" style={{ fontSize: '5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #ff4757, #ff6b81)', WebkitBackgroundClip: 'text' }}>GAME OVER</h2>
             <p style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '3rem' }}>The snake succumbed to the swarm on Round {score}.</p>
             <button className="btn" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem' }} onClick={() => {
                setSnake([]);
                setGold(3);
                setMaxSnakeLength(3);
                setRound(1);
                setInventory([]);
                setPhase('START');
             }}>
                MAIN MENU
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEV TOOLS */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 999 }}>
        <button onClick={() => setShowDev(!showDev)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', opacity: showDev ? 1 : 0.5 }}>
          💻 DEV
        </button>
      </div>
      
      {showDev && (
        <div style={{ position: 'absolute', top: '50px', right: '10px', width: '300px', background: 'rgba(0,0,0,0.9)', border: '1px solid var(--accent)', padding: '15px', borderRadius: '10px', zIndex: 998, maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 style={{ color: 'var(--accent)', marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>DEV MENU</h3>
          <button style={{ background: '#fff', color: '#000', padding: '5px', width: '100%', marginBottom: '15px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setGold(g => g + 999)}>+999 GOLD</button>
          
          <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>ADD DIRECTLY TO SNAKE:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {CHARACTER_DATA.map(c => (
               <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', padding: '5px 10px', borderRadius: '5px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <HeroIcon hero={c} size={20} />
                   <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                 </div>
                 <button onClick={() => setSnake(s => [...s, { ...c, id: Math.random().toString() }])} style={{ background: 'var(--accent)', border: 'none', width: '25px', height: '25px', cursor: 'pointer', borderRadius: '3px', fontWeight: 'bold' }}>+</button>
               </div>
            ))}
          </div>
        </div>
      )}

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
