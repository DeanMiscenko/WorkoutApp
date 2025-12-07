document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector(".exercise-page");
    if (!main) return;
  
    const region = main.dataset.region;
    const grid = document.getElementById("exercise-grid");
    const searchInput = document.getElementById("exercise-search");
    const filterButtons = Array.from(document.querySelectorAll(".body-filter-btn"));
    let cards = [];
    let currentFilter = "all";
  
    function applyFilters() {
      const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
      cards.forEach(card => {
        const name = (card.dataset.name || "").toLowerCase();
        const body = card.dataset.bodypart || "";
        const matchesSearch = !query || name.includes(query);
        const matchesFilter = currentFilter === "all" || body === currentFilter;
        card.style.display = matchesSearch && matchesFilter ? "" : "none";
      });
    }
  
    function attachEvents() {
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
  
      document.querySelectorAll(".log-exercise-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          if (id) {
            window.location.href = "log_exercise.html?id=" + encodeURIComponent(id);
          }
        });
      });
    }
  
    function renderExercises(list) {
      if (!grid) return;
      grid.innerHTML = "";
      list.forEach(ex => {
        const card = document.createElement("article");
        card.className = "exercise-card";
        card.dataset.name = ex.name;
        card.dataset.bodypart = ex.body_part || "";
  
        const tag = ex.body_part ? ex.body_part.charAt(0).toUpperCase() + ex.body_part.slice(1) : ex.region;
  
        card.innerHTML =
          '<h3>' + ex.name + '</h3>' +
          '<span class="exercise-tag">' + tag + '</span>' +
          '<p>' + (ex.description || "") + '</p>' +
          '<div class="exercise-image-placeholder"></div>' +
          '<button class="body-filter-btn log-exercise-btn" data-id="' + ex.id + '">Log this exercise</button>';
  
        grid.appendChild(card);
      });
  
      cards = Array.from(document.querySelectorAll(".exercise-card"));
      attachEvents();
      applyFilters();
    }
  
    if (!region) return;
  
    fetch("/api/exercises?region=" + encodeURIComponent(region))
      .then(res => {
        if (!res.ok) throw new Error("Failed to load exercises");
        return res.json();
      })
      .then(renderExercises)
      .catch(err => {
        console.error(err);
        if (grid) {
          grid.innerHTML = "<p style=\"color:white;\">Error loading exercises.</p>";
        }
      });
  });
  