import { useState, useEffect, useRef } from 'react';
import './App.css';
import { ArenaEngine } from './game/Arena';
import { CHARACTER_DATA, ITEM_DATA } from './game/Data';
import type { CharacterDef, ItemDef } from './game/Data';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'START' | 'SHOP' | 'ARENA' | 'ITEM_SELECT';

function App() {
  const [phase, setPhase] = useState<Phase>('START');
  const [gold, setGold] = useState(10);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState<CharacterDef[]>([]);
  const [shopItems, setShopItems] = useState<CharacterDef[]>([]);
  const [inventory, setInventory] = useState<ItemDef[]>([]);
  const [itemChoices, setItemChoices] = useState<ItemDef[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArenaEngine | null>(null);

  // Generate 3 random shop items
  const generateShop = () => {
    const sorted = [...CHARACTER_DATA].sort(() => 0.5 - Math.random());
    setShopItems(sorted.slice(0, 3));
  };
  
  const generateItems = () => {
    const sorted = [...ITEM_DATA].sort(() => 0.5 - Math.random());
    setItemChoices(sorted.slice(0, 3));
  };

  const buyHero = (hero: CharacterDef) => {
    if (gold >= hero.tier) {
      setGold(prev => prev - hero.tier);
      setSnake(prev => [...prev, { ...hero, id: hero.id + Math.random() }]); // give unique instance id
    }
  };

  const startArena = () => {
    setPhase('ARENA');
  };

  const handleGameOver = () => {
    setPhase('START');
    setGold(10);
    setRound(1);
    setSnake([]);
    // Stop engine
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
      setGold(g => g + 3 + Math.floor(round / 2));
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
           
           <div className="build-indicator glass-panel" style={{ padding: '0.5rem 1rem' }}>
             {snake.map((s, idx) => (
                <div key={idx} className="snake-segment-icon" style={{ backgroundColor: s.color }} title={s.name} />
             ))}
           </div>
        </>
      )}

      <AnimatePresence>
        {phase === 'START' && (
          <motion.div 
            className="overlay glass-panel"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          >
            <h1 className="title" style={{ fontSize: '5rem' }}>SNKRX WEB</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.2rem', letterSpacing: '0.2rem' }}>A WEB APPLICATION PORT</p>
            {score > 0 && <p style={{ color: 'var(--accent-secondary)', marginBottom: '2rem' }}>Latest Score: {score}</p>}
            <button className="btn" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem' }} onClick={() => {
              setSnake([{ ...CHARACTER_DATA[0], id: 'h1_initial' }]); // Start with Vagrant
              setGold(10);
              setRound(1);
              generateShop();
              setPhase('SHOP');
            }}>
              PLAY GAME
            </button>
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
              TAVERN
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
              RECRUIT HEROES FOR YOUR SNAKE
            </p>

            <div className="hero-grid">
              {shopItems.map((item, idx) => (
                <div key={idx} className="hero-card">
                  <div className="hero-color" style={{ backgroundColor: item.color }} />
                  <div style={{ textAlign: 'center' }}>
                    <div className="hero-name">{item.name}</div>
                    <div className="hero-class">{item.classes.join(', ')}</div>
                    <div className="hero-description">{item.description}</div>
                  </div>
                  <button 
                    className="btn" 
                    disabled={gold < item.tier}
                    style={{ 
                      width: '100%', 
                      opacity: gold < item.tier ? 0.5 : 1,
                      cursor: gold < item.tier ? 'not-allowed' : 'pointer',
                      display: 'flex', justifyContent: 'space-between'
                    }}
                    onClick={() => buyHero(item)}
                  >
                    <span>Hire</span>
                    <span className="hero-price">⭐ {item.tier}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Current Build Display */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '4rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>CURRENT SNAKE ({snake.length} HEROES)</div>
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '50px' }}>
                  {snake.length === 0 && <div style={{ color: '#555' }}>Empty</div>}
                  {snake.map((s) => (
                   <motion.div 
                     key={s.id}
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="snake-segment-icon" 
                     style={{ width: '30px', height: '30px', backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}` }}
                     title={s.name} 
                   />
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
            className="overlay-panel"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key="item-modal"
          >
            <h2 className="title" style={{ color: 'var(--accent-secondary)' }}>BOSS DEFEATED</h2>
            <p style={{ color: 'var(--text-muted)' }}>Choose a passive item relic to permanently augment your snake.</p>
            
            <div className="card-container" style={{ marginTop: '2rem' }}>
              {itemChoices.map((item) => (
                <div key={item.id} className="hero-card" style={{ borderColor: 'var(--accent-secondary)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="hero-name" style={{ color: 'var(--accent-secondary)' }}>{item.name}</div>
                    <div className="hero-description" style={{ marginTop: '1rem' }}>{item.description}</div>
                  </div>
                  <button 
                    className="btn" 
                    style={{ width: '100%', marginTop: 'auto', backgroundColor: 'var(--accent-secondary)' }}
                    onClick={() => {
                       setInventory(prev => [...prev, item]);
                       setRound(r => r + 1);
                       setGold(g => g + 5 + Math.floor(round / 2));
                       generateShop();
                       setPhase('SHOP');
                    }}
                  >
                    SELECT
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default App;
