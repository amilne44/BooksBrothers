import axios from 'axios';

const BASE = process.env.OPEN_LIBRARY_BASE ?? 'https://openlibrary.org';

export async function searchOpenLibrary(q: string, limit = 10) {
  const url = `${BASE}/search.json?q=${encodeURIComponent(q)}&limit=${limit}`;
  const { data } = await axios.get(url);
  // Map to minimal fields we need
  return (data.docs || []).map((d: any) => {
    const olid = d.edition_key?.[0] || d.key?.replace('/works/', '') || null;
    const coverId = d.cover_i;
    const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
    return {
      openLibraryId: olid,
      title: d.title,
      author: (d.author_name && d.author_name[0]) || null,
      genre: d.subject ? d.subject[0] : null,
      pages: d.number_of_pages_median || null,
      coverUrl
    };
  });
}