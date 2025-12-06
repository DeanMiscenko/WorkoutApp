document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("exercise-search");
    const cards = Array.from(document.querySelectorAll(".exercise-card"));
    const filterButtons = Array.from(document.querySelectorAll(".body-filter-btn"));
    let currentFilter = "all";
  
    function applyFilters() {
      const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
      cards.forEach(card => {
        const name = (card.dataset.name || card.textContent || "").toLowerCase();
        const body = card.dataset.bodypart || "";
        const matchesSearch = !query || name.includes(query);
        const matchesFilter = currentFilter === "all" || body === currentFilter;
        card.style.display = matchesSearch && matchesFilter ? "" : "none";
      });
    }
  
    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }
  
    if (filterButtons.length) {
      filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          filterButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          currentFilter = btn.dataset.filter || "all";
          applyFilters();
        });
      });
    }
  });
  