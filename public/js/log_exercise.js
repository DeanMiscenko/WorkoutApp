document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const titleEl = document.getElementById("exercise-title");
    const subtitleEl = document.getElementById("exercise-subtitle");
    const hiddenId = document.getElementById("exercise-id");
  
    if (!id) {
      titleEl.textContent = "No exercise selected";
      subtitleEl.textContent = "Go back and pick an exercise to log.";
      return;
    }
  
    hiddenId.value = id;
  
    fetch("/api/exercises?id=" + encodeURIComponent(id))
      .then(res => {
        if (!res.ok) throw new Error("Failed to load exercise");
        return res.json();
      })
      .then(ex => {
        titleEl.textContent = "Log: " + ex.name;
        subtitleEl.textContent = ex.description || "";
      })
      .catch(err => {
        console.error(err);
        titleEl.textContent = "Error loading exercise";
        subtitleEl.textContent = "";
      });
  });
  