import React, { useEffect, useState } from 'react';
import BookTile from '../components/BookTile';

export default function Home() {
  const [books, setBooks] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/books').then(r => r.json()).then(setBooks);
  }, []);
  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Books Brothers</h1>
        <nav>
          <a href="/add">Add a book</a> · <a href="/auth/signup">Sign up</a> · <a href="/api/auth/signin">Sign in</a>
        </nav>
      </header>

      <section style={{ marginTop: 20 }}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {books.map(b => <BookTile key={b.id} book={b} />)}
        </div>
      </section>
    </main>
  );
}