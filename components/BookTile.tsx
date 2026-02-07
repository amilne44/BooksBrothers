import React from 'react';

type Owner = { id: number; name: string };

export default function BookTile({ book }: { book: any }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, width: 220 }}>
      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} style={{ maxHeight: '100%', maxWidth: '100%' }} />
        ) : (
          <div style={{ color: '#888' }}>No cover</div>
        )}
      </div>
      <h3 style={{ margin: '8px 0 2px' }}>{book.title}</h3>
      <div style={{ fontSize: 13, color: '#555' }}>{book.author}</div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
        {book.genre ? <span>{book.genre} · </span> : null}
        {book.pages ? <span>{book.pages} pages</span> : null}
      </div>
      <div style={{ marginTop: 8, fontSize: 13 }}>
        <strong>Owners</strong>
        <ul>
          {book.owners.map((o: Owner) => <li key={o.id}>{o.name}</li>)}
        </ul>
      </div>
    </div>
  );
}