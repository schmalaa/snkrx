import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { Filter } from 'bad-words';
import { getFlagEmoji } from '../utils/getFlagEmoji';

const filter = new Filter();

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
];

export const Profile = () => {
  const { user } = useUser();
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setCountry((user.unsafeMetadata.country as string) || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');
    setSuccess('');
    
    const trimmed = username.trim();
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
      await user.update({ 
        username: trimmed,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          country: country || null
        }
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to update profile. Username might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="page-container z-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="page-content" style={{ maxWidth: '600px', width: '100%', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
        <h2 className="title text-4xl mb-6">PLAYER PROFILE</h2>
        
        <form onSubmit={handleSubmit} className="glass-panel w-full p-6 flex-col gap-4">
          <div className="flex-col gap-2">
            <label className="text-muted font-bold tracking-wide">GAMERTAG</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter Gamertag..."
              className="gamertag-input"
              style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
            />
            <span className="text-sm text-muted">This name represents you on the global leaderboard. Alphanumeric, 3-15 chars.</span>
          </div>

          <div className="flex-col gap-2 mt-2">
            <label className="text-muted font-bold tracking-wide">HOME COUNTRY (OPTIONAL)</label>
            <div className="flex gap-2">
              <select 
                value={country} 
                onChange={e => setCountry(e.target.value)}
                className="gamertag-input"
                style={{ width: '100%', fontSize: '1.2rem', padding: '1rem', cursor: 'pointer', appearance: 'none' }}
              >
                <option value="">-- None --</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {getFlagEmoji(c.code)} {c.name}
                  </option>
                ))}
              </select>
              {country && (
                <div className="flex items-center justify-center p-2" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '60px', fontSize: '2rem' }}>
                  {getFlagEmoji(country)}
                </div>
              )}
            </div>
            <span className="text-sm text-muted">Display your flag next to your records.</span>
          </div>

          {error && <div className="font-bold mt-2" style={{ color: '#ff4757', padding: '10px', background: 'rgba(255,71,87,0.1)', borderRadius: '8px', border: '1px solid rgba(255,71,87,0.3)' }}>{error}</div>}
          {success && <div className="font-bold mt-2 text-accent" style={{ padding: '10px', background: 'rgba(0,255,170,0.1)', borderRadius: '8px', border: '1px solid rgba(0,255,170,0.3)' }}>{success}</div>}
          
          <button type="submit" disabled={loading} className="btn w-full mt-4" style={{ padding: '1rem', fontSize: '1.2rem' }}>
            {loading ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
