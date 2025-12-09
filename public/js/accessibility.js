document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const wrapper = document.getElementById("content-scale-wrapper");
  
    const THEME_KEY = "liftoff-theme";
    const SCALE_KEY = "liftoff-scale-level";
  
    const themeToggle = document.getElementById("theme-toggle");
    const btnDec = document.getElementById("font-decrease");
    const btnReset = document.getElementById("font-reset");
    const btnInc = document.getElementById("font-increase");
  
    const scaleClasses = ["scale-100", "scale-110", "scale-125", "scale-140", "scale-155"];
  
    let theme = localStorage.getItem(THEME_KEY) || "dark";
    let scaleLevel = parseInt(localStorage.getItem(SCALE_KEY) || "0", 10);
    if (isNaN(scaleLevel)) scaleLevel = 0;
    if (scaleLevel < 0) scaleLevel = 0;
    if (scaleLevel > scaleClasses.length - 1) scaleLevel = scaleClasses.length - 1;
  
    function applyTheme(nextTheme) {
      if (nextTheme === "light") {
        body.classList.add("light-mode");
        if (themeToggle) themeToggle.setAttribute("aria-pressed", "true");
      } else {
        body.classList.remove("light-mode");
        if (themeToggle) themeToggle.setAttribute("aria-pressed", "false");
      }
      theme = nextTheme;
      localStorage.setItem(THEME_KEY, theme);
    }
  
    function applyScale() {
      if (!wrapper) return;
      wrapper.classList.remove(...scaleClasses);
      wrapper.classList.add(scaleClasses[scaleLevel]);
      localStorage.setItem(SCALE_KEY, String(scaleLevel));
    }
  
    applyTheme(theme);
    applyScale();
  
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const next = theme === "light" ? "dark" : "light";
        applyTheme(next);
      });
    }
  
    if (btnDec) {
      btnDec.addEventListener("click", () => {
        scaleLevel = Math.max(0, scaleLevel - 1);
        applyScale();
      });
    }
  
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        scaleLevel = 0;
        applyScale();
      });
    }
  
    if (btnInc) {
      btnInc.addEventListener("click", () => {
        scaleLevel = Math.min(scaleClasses.length - 1, scaleLevel + 1);
        applyScale();
      });
    }
  });
  
  