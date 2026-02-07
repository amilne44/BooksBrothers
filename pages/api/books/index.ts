import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET only
  if (req.method !== 'GET') return res.status(405).end();
  const books = await prisma.book.findMany({
    include: {
      shelves: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const result = books.map(b => ({
    id: b.id,
    openLibraryId: b.openLibraryId,
    title: b.title,
    author: b.author,
    genre: b.genre,
    pages: b.pages,
    coverUrl: b.coverUrl,
    owners: b.shelves.map(s => ({ id: s.user.id, name: s.user.name || s.user.email }))
  }));

  res.json(result);
}