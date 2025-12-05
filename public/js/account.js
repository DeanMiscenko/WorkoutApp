document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/details")
    .then(res => {
      if (res.status === 401) {
        const span = document.getElementById("user-email");
        span.textContent = "Not logged in";
        return null;
      }
      if (!res.ok) {
        throw new Error("Request failed: " + res.status);
      }
      return res.json();
    })
    .then(data => {
      if (!data) return;
      const span = document.getElementById("user-email");
      if (data && data.email) {
        span.textContent = data.email;
      } else {
        span.textContent = "Not entered";
      }
    })
    .catch(err => {
      const span = document.getElementById("user-email");
      span.textContent = "Error loading email";
      console.error(err);
    });

  document.querySelectorAll("[data-placeholder]").forEach(span => {
    if (!span.textContent.trim()) {
      span.textContent = span.dataset.placeholder || "Not entered";
      span.classList.add("placeholder-text");
    }
  });
});
