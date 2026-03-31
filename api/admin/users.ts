import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT username, score, country, tags, last_played_at FROM leaderboard ORDER BY last_played_at DESC NULLS LAST LIMIT 100;');
      return response.status(200).json(rows);
    } catch (error: any) {
      if (error.message?.includes('column')) {
        try {
          await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS tags VARCHAR(255);');
          await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;');
          const { rows } = await pool.query('SELECT username, score, country, tags, last_played_at FROM leaderboard ORDER BY last_played_at DESC NULLS LAST LIMIT 100;');
          return response.status(200).json(rows);
        } catch (retryError: any) {
          return response.status(500).json({ error: retryError.message });
        }
      }
      return response.status(500).json({ error: error.message });
    }
  } else if (request.method === 'POST') {
    const { username, tags } = request.body;
    
    if (!username) {
      return response.status(400).json({ error: 'Missing username' });
    }
    
    try {
      await pool.query(
        `UPDATE leaderboard SET tags = $2 WHERE username = $1;`,
        [username, tags || null]
      );
      
      return response.status(200).json({ success: true });
    } catch (error: any) {
      return response.status(500).json({ error: error.message });
    }
  } else {
    response.setHeader('Allow', ['GET', 'POST']);
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
}
