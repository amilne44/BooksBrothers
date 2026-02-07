import type { NextApiRequest, NextApiResponse } from 'next';
import { searchOpenLibrary } from '../../../lib/openLibrary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || '');
  if (!q) return res.status(400).json({ error: 'q required' });
  try {
    const results = await searchOpenLibrary(q, 20);
    res.json(results);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'search failed' });
  }
}