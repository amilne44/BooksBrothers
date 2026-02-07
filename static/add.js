// Render Open Library search results as tiles matching the main grid
const btn = document.getElementById("btnSearch");
const qInput = document.getElementById("q");
const grid = document.getElementById("grid");

function escapeHtml(s){
  if (!s) return "";
  return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
}

function performSearch() {
  const q = qInput.value.trim();
  if (!q) return alert("Type a search term");
  doSearch(q);
}

async function doSearch(q) {
  grid.innerHTML = "Searching...";
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`);
    const data = await res.json();
    const docs = data.docs || [];
    if (docs.length === 0) {
      grid.innerHTML = "<p>No results</p>";
      return;
    }
    grid.innerHTML = "";
    // Process each result
    for (const d of docs) {
      const olid = (d.edition_key && d.edition_key[0]) || (d.key && d.key.replace("/works/","")) || "";
      const coverId = d.cover_i;
      const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";
      const title = d.title || "";
      const author = (d.author_name && d.author_name[0]) || "";
      
      // Fetch additional details from the works endpoint to get page count and subjects
      let pages = null;
      let genre = "";
      
      let description = "";
      let avg_rating = null;
      let ratings_count = null;

      if (d.key) {
        try {
          const workRes = await fetch(`https://openlibrary.org${d.key}.json`);
          if (workRes.ok) {
            const workData = await workRes.json();
            // Get page count from the first edition
            if (workData.editions && workData.editions.length > 0) {
              const editionKey = workData.editions[0];
              const editionRes = await fetch(`https://openlibrary.org${editionKey}.json`);
              if (editionRes.ok) {
                const editionData = await editionRes.json();
                pages = editionData.number_of_pages || null;
              }
            }
            // Get subjects/genre
            if (workData.subjects && workData.subjects.length > 0) {
              genre = workData.subjects[0];
            }
            // Get description
            if (workData.description) {
              description = typeof workData.description === 'string' ? workData.description : (workData.description.value || "");
            } else if (workData.excerpts && workData.excerpts.length > 0) {
              description = workData.excerpts[0].text || "";
            }
            // Get rating
            if (workData.ratings) {
              avg_rating = workData.ratings.average || null;
              ratings_count = workData.ratings.count || null;
            }
          }
        } catch (e) {
          console.log("Could not fetch work details:", e);
        }
      }

      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.openlibraryId = olid;
      tile.title = description;
      tile.innerHTML = `
        <div class="cover">
          ${coverUrl ? `<img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(title)}">` : '<div class="no-cover">No cover</div>'}
        </div>
        <h3>${escapeHtml(title)}</h3>
        <div class="meta">${escapeHtml(author)}</div>
        <div class="meta small">${genre ? escapeHtml(genre) + ' · ' : ''}${pages ? escapeHtml(pages) + ' pages' : ''}</div>
        <div style="margin-top:8px"><button class="add-btn">Add</button></div>
      `;

      const addBtn = tile.querySelector('.add-btn');
      addBtn.addEventListener('click', async () => {
        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';
        try {
          const body = { openLibraryId: olid || title, title, author, genre, pages, coverUrl, description, avg_rating, ratings_count };
          const r = await fetch('/api/books/add', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(body)});
          if (r.ok) {
            addBtn.textContent = 'Success';
            addBtn.classList.add('success');
            addBtn.disabled = true;
          } else if (r.status === 401) {
            alert('You must be signed in to add books. Redirecting to login.');
            window.location = '/auth/login?next=/add';
          } else {
            const err = await r.json().catch(() => ({}));
            alert('Add failed: ' + (err.error || JSON.stringify(err)));
            addBtn.disabled = false;
            addBtn.textContent = 'Add';
          }
        } catch (e) {
          alert('Add error: ' + e);
          addBtn.disabled = false;
          addBtn.textContent = 'Add';
        }
      });

      grid.appendChild(tile);
    }
  } catch (e) {
    grid.innerHTML = "<p>Search failed</p>";
    console.error(e);
  }
}

btn.addEventListener("click", performSearch);
qInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    performSearch();
  }
});