export const getPlayerTitle = (username: string, maxScore: number, tags?: string) => {
  if (!username) return null;

  if (tags) {
    const list = tags.toLowerCase().split(',').map(s => s.trim());
    if (list.includes('banned')) {
      return { title: 'BANNED', color: '#7f8c8d', glow: 'none', bg: 'rgba(50, 50, 50, 0.4)', border: '1px solid #7f8c8d' };
    }
    if (list.includes('dev')) {
      return { title: 'DEV', color: '#ff4757', glow: '0 0 10px #ff4757', bg: 'rgba(255, 71, 87, 0.15)', border: '1px solid #ff4757' };
    }
    if (list.includes('vip')) {
      return { title: 'VIP', color: '#ffa502', glow: '0 0 10px #ffa502', bg: 'rgba(255, 165, 2, 0.15)', border: '1px solid #ffa502' };
    }
  }

  // Hardcoded Roles
  const name = username.toLowerCase();
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
