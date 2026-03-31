import { Pool } from 'pg';

// Standard connection pool capable of interpreting the raw Prisma URI string
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT username, score, country, tags FROM leaderboard ORDER BY score DESC LIMIT 10;');
      return response.status(200).json(rows);
    } catch (error: any) {
      if (error.message?.includes('relation "leaderboard" does not exist')) {
        await pool.query('CREATE TABLE IF NOT EXISTS leaderboard ( username VARCHAR(255) PRIMARY KEY, score INTEGER NOT NULL, country VARCHAR(5), tags VARCHAR(255), last_played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP );');
        return response.status(200).json([]);
      }

      if (error.message?.includes('column')) {
        try {
          await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS country VARCHAR(5);');
          await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS tags VARCHAR(255);');
          await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;');
          const { rows } = await pool.query('SELECT username, score, country, tags FROM leaderboard ORDER BY score DESC LIMIT 10;');
          return response.status(200).json(rows);
        } catch (retryError: any) {
          return response.status(500).json({ error: retryError.message });
        }
      }

      return response.status(500).json({ error: error.message });
    }
  } else if (request.method === 'POST') {
    const { username, score, country } = request.body;
    
    if (!username) {
      return response.status(400).json({ error: 'Missing username' });
    }
    
    try {
      await pool.query('CREATE TABLE IF NOT EXISTS leaderboard ( username VARCHAR(255) PRIMARY KEY, score INTEGER NOT NULL, country VARCHAR(5), tags VARCHAR(255), last_played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP );');
      
      try {
        await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS country VARCHAR(5);');
        await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS tags VARCHAR(255);');
        await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;');
      } catch (e) {
        // Ignore edge cases
      }
      
      if (typeof score === 'number') {
        await pool.query(
          `INSERT INTO leaderboard (username, score, country, last_played_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (username) DO UPDATE
           SET score = GREATEST(leaderboard.score, EXCLUDED.score),
               country = COALESCE(EXCLUDED.country, leaderboard.country),
               last_played_at = CURRENT_TIMESTAMP;`,
          [username, score, country || null]
        );
      } else {
        await pool.query(
          `UPDATE leaderboard SET country = $2, last_played_at = CURRENT_TIMESTAMP WHERE username = $1;`,
          [username, country || null]
        );
      }
      
      return response.status(200).json({ success: true });
    } catch (error: any) {
      return response.status(500).json({ error: error.message });
    }
  } else {
    response.setHeader('Allow', ['GET', 'POST']);
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
}
