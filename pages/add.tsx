import React, { useState } from 'react';

export default function AddPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const search = async () => {
    setLoading(true);
    const res = await fetch(`/api/openlibrary/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };
  const addBook = async (r: any) => {
    const res = await fetch('/api/books/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(r)
    });
    if (res.ok) alert('Added!');
    else {
      const err = await res.json();
      alert('Add failed: ' + (err.error || JSON.stringify(err)));
    }
  };
  return (
    <main style={{ padding: 24 }}>
      <h1>Add books — Books Brothers</h1>
      <div style={{ marginTop: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title, author, ISBN..." />
        <button onClick={search} disabled={loading || !q}>Search</button>
      </div>

      <div style={{ marginTop: 20 }}>
        {loading ? <div>Searching...</div> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {results.map(r => (
              <div key={r.openLibraryId} style={{ border: '1px solid #ccc', padding: 12 }}>
                <div style={{ display: 'flex' }}>
                  {r.coverUrl ? <img src={r.coverUrl} alt={r.title} style={{ width: 80, height: 120, objectFit: 'cover' }} /> : <div style={{ width: 80, height: 120, background: '#eee' }} />}
                  <div style={{ marginLeft: 12 }}>
                    <h3>{r.title}</h3>
                    <div>{r.author}</div>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => addBook(r)}>Add to my bookshelf</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}