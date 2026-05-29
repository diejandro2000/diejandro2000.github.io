document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }

  // Theme button
  themeToggle.addEventListener("click", toggleTheme);

  console.log("Invoice app loaded correctly.");
});

// ==========================
// THEME
// ==========================

function toggleTheme() {
  document.body.classList.toggle("dark");

  const btn = document.getElementById("themeToggle");

  if (document.body.classList.contains("dark")) {
    btn.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    btn.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
}
