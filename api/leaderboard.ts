import { Pool } from 'pg';

// Standard connection pool capable of interpreting the raw Prisma URI string
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT username, score, country FROM leaderboard ORDER BY score DESC LIMIT 10;');
      return response.status(200).json(rows);
    } catch (error: any) {
      if (error.message?.includes('relation "leaderboard" does not exist')) {
        await pool.query('CREATE TABLE IF NOT EXISTS leaderboard ( username VARCHAR(255) PRIMARY KEY, score INTEGER NOT NULL, country VARCHAR(5) );');
        return response.status(200).json([]);
      }
      return response.status(500).json({ error: error.message });
    }
  } else if (request.method === 'POST') {
    const { username, score, country } = request.body;
    
    if (!username || typeof score !== 'number') {
      return response.status(400).json({ error: 'Invalid body' });
    }
    
    try {
      await pool.query('CREATE TABLE IF NOT EXISTS leaderboard ( username VARCHAR(255) PRIMARY KEY, score INTEGER NOT NULL, country VARCHAR(5) );');
      
      try {
        await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS country VARCHAR(5);');
      } catch (e) {
        // Ignore if error occurs when column already exists in some edge cases
      }
      
      await pool.query(
        `INSERT INTO leaderboard (username, score, country)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE
         SET score = GREATEST(leaderboard.score, EXCLUDED.score),
             country = COALESCE(EXCLUDED.country, leaderboard.country);`,
        [username, score, country || null]
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
