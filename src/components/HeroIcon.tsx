import type { CharacterDef } from '../game/Data';

export const HeroIcon = ({ hero, size = 60 }: { hero: CharacterDef, size?: number }) => {
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
