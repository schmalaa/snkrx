import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlagIcon } from '../components/FlagIcon';
import { getPlayerTitle } from '../utils/getPlayerTitle';

interface UserRow {
  username: string;
  score: number;
  country?: string;
  tags?: string;
  last_played_at?: string;
}

export const Admin = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTagUpdate = async (username: string, newTag: string) => {
    // Optimistic UI update
    setUsers(users.map(u => u.username === username ? { ...u, tags: newTag || undefined } : u));
    
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, tags: newTag || null })
      });
    } catch (err) {
      console.error(err);
      fetchUsers(); // revert on failure
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const lower = search.toLowerCase();
    return users.filter(u => u.username.toLowerCase().includes(lower));
  }, [users, search]);

  return (
    <motion.div className="page-container z-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="page-content-wide w-full flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="title m-0 text-4xl" style={{ color: '#ff4757', textShadow: '0 0 20px rgba(255, 71, 87, 0.4)' }}>
            COMMAND CENTER
          </h2>
          <div className="text-muted text-xl font-bold">
            Total Players Tracked: {users.length}
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Search by Gamertag..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="gamertag-input"
            style={{ maxWidth: '400px', fontSize: '1.2rem' }}
          />
        </div>

        <div className="leaderboard-panel w-full p-0 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-muted text-2xl">Loading intelligence...</div>
          ) : (
            <table className="w-full text-left border-collapse" style={{ fontSize: '1.1rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <th className="p-4 py-3 text-muted font-bold">GAMERTAG</th>
                  <th className="p-4 py-3 text-muted font-bold text-center">HIGH SCORE</th>
                  <th className="p-4 py-3 text-muted font-bold">ACTIVE ROLE</th>
                  <th className="p-4 py-3 text-muted font-bold">LAST ONLINE</th>
                  <th className="p-4 py-3 text-muted font-bold text-right">MANAGE TAGS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const badge = getPlayerTitle(u.username, u.score, u.tags);
                  const activeRoleDropdown = u.tags?.toLowerCase().includes('banned') ? 'banned' 
                    : u.tags?.toLowerCase().includes('dev') ? 'dev' 
                    : u.tags?.toLowerCase().includes('vip') ? 'vip' : '';

                  return (
                    <tr key={u.username} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                      <td className="p-4 flex items-center gap-3">
                        <span className="font-bold text-white text-xl">{u.username}</span>
                        {u.country && <FlagIcon code={u.country} size={24} />}
                      </td>
                      <td className="p-4 font-bold text-accent-secondary text-2xl text-center">
                        {u.score}
                      </td>
                      <td className="p-4">
                        {badge ? (
                          <span style={{ fontSize: '0.9rem', padding: '4px 10px', borderRadius: '4px', background: badge.bg, color: badge.color, textShadow: badge.glow, border: badge.border, fontWeight: 'bold' }}>
                            {badge.title}
                          </span>
                        ) : (
                          <span className="text-muted italic text-sm">None</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted">
                        {u.last_played_at ? new Date(u.last_played_at).toLocaleString() : 'Legacy'}
                      </td>
                      <td className="p-4 text-right">
                        <select 
                          className="gamertag-input" 
                          style={{ padding: '0.5rem', width: 'auto', display: 'inline-block' }}
                          value={activeRoleDropdown}
                          onChange={(e) => handleTagUpdate(u.username, e.target.value)}
                        >
                          <option value="">Normal Player</option>
                          <option value="vip">Grant VIP Status</option>
                          <option value="dev">Grant DEV Status</option>
                          <option value="banned">BAN USER</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted">No players found matching "{search}"</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
};
