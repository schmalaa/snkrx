import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { getPlayerTitle } from '../utils/getPlayerTitle';

export const Leaderboard = () => {
  const { user } = useUser();
  const [leaderboardData, setLeaderboardData] = useState<{ username: string, score: number }[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
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
    
    fetchLeaderboard();
  }, []);

  return (
    <motion.div className="page-container z-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="page-content-wide w-full flex-col items-center">
        <h2 className="title text-center text-4xl mb-6" style={{ color: '#ffea00', textShadow: '0 0 30px rgba(255, 234, 0, 0.5)' }}>GLOBAL LEADERBOARD</h2>
        <div className="leaderboard-panel w-full">
          {loadingLeaderboard ? (
            <div className="text-center text-muted p-4 text-2xl">Synchronizing records...</div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center text-muted p-4 text-2xl">No runs recorded yet. The frontier is empty.</div>
          ) : (
            <div className="flex-col gap-3">
              {leaderboardData.map((entry, idx) => {
                const badge = getPlayerTitle(entry.username, entry.score);
                return (
                  <div key={idx} className="flex justify-between items-center p-4" style={{ background: idx === 0 ? 'rgba(255, 234, 0, 0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', border: idx === 0 ? '1px solid rgba(255, 234, 0, 0.4)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex gap-4 items-center">
                      <span className="font-bold" style={{ fontSize: '1.8rem', color: idx === 0 ? '#ffea00' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : '#888', width: '50px' }}>
                        #{idx + 1}
                      </span>
                      <span className="flex items-center gap-3" style={{ fontSize: '1.8rem', color: user?.username === entry.username ? 'var(--accent)' : '#fff', fontWeight: user?.username === entry.username ? 'bold' : 'normal' }}>
                        {entry.username} {user?.username === entry.username && '(You)'}
                        {badge && (
                          <span style={{ fontSize: '1rem', padding: '4px 10px', borderRadius: '4px', background: badge.bg, color: badge.color, textShadow: badge.glow, border: badge.border }}>
                            {badge.title}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-bold text-accent-secondary text-2xl">
                      Round {entry.score}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
