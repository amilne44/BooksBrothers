// Real-time search + client-side sorting for the main page
(function () {
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const toggleOrder = document.getElementById("toggleOrder");
  const ownerFilter = document.getElementById("ownerFilter");
  const grid = document.getElementById("grid");

  let ascending = true;

  function normalize(s) {
    return (s || "").toString().toLowerCase();
  }

  function filterAndSort() {
    const q = normalize(searchInput.value).trim();
    const selectedOwners = Array.from(ownerFilter.selectedOptions).map(opt => opt.value).filter(v => v);
    const tiles = Array.from(grid.children);

    // Filter by search and owner
    tiles.forEach(tile => {
      const title = tile.getAttribute("data-title") || "";
      const author = tile.getAttribute("data-author") || "";
      const genre = tile.getAttribute("data-genre") || "";
      const ownerId = tile.getAttribute("data-owner-id") || "";
      
      const matchesSearch = (title + " " + author + " " + genre).includes(q);
      const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(ownerId);
      
      tile.style.display = (matchesSearch && matchesOwner) ? "" : "none";
    });

    // Sort the visible tiles
    const key = sortSelect.value;
    const visible = tiles.filter(t => t.style.display !== "none");

    visible.sort((a, b) => {
      const av = a.getAttribute(`data-${key}`) || "";
      const bv = b.getAttribute(`data-${key}`) || "";
      if (av < bv) return ascending ? -1 : 1;
      if (av > bv) return ascending ? 1 : -1;
      return 0;
    });

    // Append in sorted order to the grid
    visible.forEach(t => grid.appendChild(t));
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => filterAndSort());
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", () => filterAndSort());
  }
  if (toggleOrder) {
    toggleOrder.addEventListener("click", () => {
      ascending = !ascending;
      toggleOrder.textContent = ascending ? "Asc" : "Desc";
      filterAndSort();
    });
  }
  if (ownerFilter) {
    ownerFilter.addEventListener("change", () => filterAndSort());
  }
})();