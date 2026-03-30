import { motion } from 'framer-motion';
import { CHARACTER_DATA } from '../game/Data';
import { HeroIcon } from '../components/HeroIcon';

const EnemyIcon = ({ type, color }: { type: string, color: string }) => {
  return (
    <svg viewBox="0 0 100 100" width={40} height={40}>
      <g fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth="2" style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}>
        {type === 'star' && <polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" />}
        {type === 'square' && <rect x="20" y="20" width="60" height="60" />}
        {type === 'diamond' && <polygon points="50,10 90,50 50,90 10,50" />}
        {type === 'circle' && <circle cx="50" cy="50" r="35" />}
        {type === 'triangle' && <polygon points="50,15 85,80 15,80" />}
      </g>
    </svg>
  );
};

const ENEMY_DATA = [
  { name: 'Basic Follower', rounds: 'Round 1+', description: 'Standard slow-moving grunt. Overwhelms you in numbers.', type: 'triangle', color: 'hsl(350, 100%, 60%)' },
  { name: 'Fast Unit', rounds: 'Round 3+', description: 'Skittish and quick. Darts around attempting to flank the snake.', type: 'diamond', color: '#00d2ff' },
  { name: 'Boss', rounds: 'Every 3 Rounds', description: 'Massive elite with huge health pool. Drops a Relic upon death.', type: 'square', color: 'hsl(330, 100%, 50%)' },
  { name: 'Tank Unit', rounds: 'Round 5+', description: 'High HP behemoth that requires focused fire to take down.', type: 'square', color: '#ff9f43' },
  { name: 'Swarmer', rounds: 'Round 7+', description: 'Small explosive units that spawn in tight packs.', type: 'circle', color: '#1dd1a1' },
  { name: 'Super Boss', rounds: 'Late Game', description: 'Star-shaped monstrosity with exponentially scaling stats.', type: 'star', color: '#ff0033' }
];

export const Wiki = () => {
  return (
    <motion.div className="page-container wiki-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="page-content-wide w-full flex-col items-center" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 className="title logo-title text-4xl mb-4">SNAKE WIKI</h2>
        
        {/* Synergies Section */}
        <div className="w-full mb-8">
          <h3 className="text-accent text-2xl mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Class Synergies</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-accent font-bold mb-1">Warrior (3+)</div>
              <div className="text-sm text-muted">+50% Global Damage. Frontline bruisers with high HP.</div>
            </div>
            <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-accent font-bold mb-1">Mage (3+)</div>
              <div className="text-sm text-muted">+50% Global Damage. Heavy area-of-effect spells.</div>
            </div>
            <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-accent font-bold mb-1">Enchanter (2+)</div>
              <div className="text-sm text-muted">+25% Global Damage. Attacks chain lightning to nearby foes.</div>
            </div>
            <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-accent font-bold mb-1">Psyker</div>
              <div className="text-sm text-muted">Bends spacetime. Unique attacks and utility ranges.</div>
            </div>
            <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-accent font-bold mb-1">Ranger</div>
              <div className="text-sm text-muted">Piercing, high physical single-target projectiles.</div>
            </div>
            <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-accent font-bold mb-1">Healer</div>
              <div className="text-sm text-muted">Periodically regenerates snake health during combat.</div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-accent-secondary text-2xl mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Hero Roster</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', paddingBottom: '2.5rem' }}>
            {CHARACTER_DATA.map(hero => (
              <div key={hero.id} className="flex items-center gap-10px p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', transition: 'background 0.2s' }}>
                <div style={{ flexShrink: 0 }}>
                  <HeroIcon hero={hero} size={50} />
                </div>
                
                <div className="flex-col flex-grow" style={{ minWidth: 0 }}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-lg text-white" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hero.name}</span>
                    <span style={{ color: '#ffb142', fontSize: '0.9rem', letterSpacing: '2px' }}>{Array(hero.tier).fill('⭐').join('')}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', marginBottom: '0.25rem' }}>
                    {hero.classes.join(' • ')}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {hero.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enemies Roster Section */}
        <div className="w-full mt-4">
          <h3 className="text-4xl mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', color: '#ff4757', textShadow: '0 0 20px rgba(255, 71, 87, 0.5)' }}>Enemies Roster</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', paddingBottom: '2.5rem' }}>
            {ENEMY_DATA.map((enemy, idx) => (
              <div key={idx} className="flex items-center gap-10px p-3" style={{ background: 'rgba(255,100,100,0.05)', border: `1px solid ${enemy.color.startsWith('hsl') ? 'rgba(255,255,255,0.2)' : enemy.color + '44'}`, borderRadius: '8px', boxShadow: `inset 0 0 10px ${enemy.color.startsWith('hsl') ? 'rgba(255,255,255,0.05)' : enemy.color + '11'}` }}>
                <div className="flex justify-center items-center" style={{ flexShrink: 0, width: '60px' }}>
                  <EnemyIcon type={enemy.type} color={enemy.color} />
                </div>
                
                <div className="flex-col flex-grow" style={{ minWidth: 0 }}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-lg text-white" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enemy.name}</span>
                    <span style={{ color: enemy.color, fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>{enemy.rounds}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {enemy.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
