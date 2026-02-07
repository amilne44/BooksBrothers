// Remove a book from the current user's bookshelf
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("myGrid");
  if (!grid) return;

  grid.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("remove-btn")) return;
    const tile = e.target.closest(".tile");
    const bookId = tile && tile.getAttribute("data-book-id");
    if (!bookId) return alert("Missing book id");

    e.target.disabled = true;
    e.target.textContent = "Removing...";

    try {
      const res = await fetch("/api/books/remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ book_id: Number(bookId) })
      });

      if (res.ok) {
        // Update button to show success state
        e.target.textContent = "Removed";
        e.target.classList.add('success');
        e.target.disabled = true;
        // Remove tile after a short delay
        setTimeout(() => tile.remove(), 1500);
      } else {
        const err = await res.json();
        alert("Remove failed: " + (err.error || JSON.stringify(err)));
        e.target.disabled = false;
        e.target.textContent = "Remove";
      }
    } catch (err) {
      alert("Remove request failed: " + err);
      e.target.disabled = false;
      e.target.textContent = "Remove";
    }
  });
});

// Real-time search for My books page
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  const grid = document.getElementById("myGrid");
  
  function normalize(s) {
    return (s || "").toString().toLowerCase();
  }

  function filterBooks() {
    const q = normalize(searchInput.value).trim();
    const tiles = Array.from(grid.children);

    tiles.forEach(tile => {
      const title = tile.getAttribute("data-title") || "";
      const author = tile.getAttribute("data-author") || "";
      const genre = tile.getAttribute("data-genre") || "";
      const match = (title + " " + author + " " + genre).includes(q);
      tile.style.display = match ? "" : "none";
    });
  }

  searchInput.addEventListener("input", filterBooks);
});