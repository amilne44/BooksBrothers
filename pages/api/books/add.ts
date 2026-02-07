import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // Note: update export if you prefer
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' });

  const { openLibraryId, title, author, genre, pages, coverUrl } = req.body;
  if (!title || !openLibraryId) return res.status(400).json({ error: 'openLibraryId and title required' });

  try {
    const book = await prisma.book.upsert({
      where: { openLibraryId },
      update: {},
      create: {
        openLibraryId,
        title,
        author,
        genre,
        pages,
        coverUrl
      }
    });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create bookshelf entry if missing
    await prisma.bookshelf.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        bookId: book.id
      }
    });

    res.json({ success: true, book });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'add failed' });
  }
}