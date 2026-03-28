import { sql } from '@vercel/postgres';

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    try {
      // Attempt to fetch top 10 scores
      const { rows } = await sql`SELECT username, score FROM leaderboard ORDER BY score DESC LIMIT 10;`;
      return response.status(200).json(rows);
    } catch (error: any) {
      // Lazy initialization: if table doesn't exist, create it and return empty array
      if (error.message?.includes('relation "leaderboard" does not exist')) {
        await sql`CREATE TABLE IF NOT EXISTS leaderboard ( username VARCHAR(255) PRIMARY KEY, score INTEGER NOT NULL );`;
        return response.status(200).json([]);
      }
      return response.status(500).json({ error: error.message });
    }
  } else if (request.method === 'POST') {
    const { username, score } = request.body;
    
    if (!username || typeof score !== 'number') {
      return response.status(400).json({ error: 'Invalid body' });
    }
    
    try {
      // Ensure the table exists before attempting an insert
      await sql`CREATE TABLE IF NOT EXISTS leaderboard ( username VARCHAR(255) PRIMARY KEY, score INTEGER NOT NULL );`;
      
      // Upsert: Only update the score if it's purely greater than their historical maximum
      await sql`
        INSERT INTO leaderboard (username, score)
        VALUES (${username}, ${score})
        ON CONFLICT (username) DO UPDATE
        SET score = GREATEST(leaderboard.score, EXCLUDED.score);
      `;
      
      return response.status(200).json({ success: true });
    } catch (error: any) {
      return response.status(500).json({ error: error.message });
    }
  } else {
    response.setHeader('Allow', ['GET', 'POST']);
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
}
