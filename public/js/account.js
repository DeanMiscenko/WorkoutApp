document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/profile")
    .then(res => {
      if (res.status === 401) {
        const emailSpan = document.getElementById("user-email");
        if (emailSpan) {
          emailSpan.textContent = "Not logged in";
        }
        return null;
      }
      if (!res.ok) {
        throw new Error("Request failed: " + res.status);
      }
      return res.json();
    })
    .then(data => {
      if (!data) return;

      const emailSpan = document.getElementById("user-email");
      const usernameSpan = document.getElementById("user-username");
      const goalSpan = document.getElementById("user-goal");
      const weightSpan = document.getElementById("user-weight");
      const weightGoalSpan = document.getElementById("user-weight-goal");
      const heightSpan = document.getElementById("user-height");
      const memberSinceSpan = document.getElementById("user-member-since");

      if (emailSpan && data.email) emailSpan.textContent = data.email;
      if (usernameSpan && data.username) usernameSpan.textContent = data.username;
      if (goalSpan && data.goal) goalSpan.textContent = data.goal;
      if (weightSpan && data.weight != null) weightSpan.textContent = data.weight + " kg";
      if (weightGoalSpan && data.weight_goal != null) weightGoalSpan.textContent = data.weight_goal + " kg";
      if (heightSpan && data.height != null) heightSpan.textContent = data.height + " cm";

      if (memberSinceSpan && data.created_at) {
        const raw = String(data.created_at);
        const dateOnly = raw.split(" ")[0];
        memberSinceSpan.textContent = dateOnly;
      }
    })
    .catch(err => {
      const emailSpan = document.getElementById("user-email");
      if (emailSpan) {
        emailSpan.textContent = "Error loading profile";
      }
      console.error(err);
    });

  document.querySelectorAll("[data-placeholder]").forEach(span => {
    if (!span.textContent.trim()) {
      span.textContent = span.dataset.placeholder || "Not entered";
      span.classList.add("placeholder-text");
    }
  });
});
