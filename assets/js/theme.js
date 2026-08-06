// Theme toggle. The initial value is set inline in <head> before first paint;
// this only handles the click and remembers the choice.
(function () {
  var root = document.documentElement;
  var button = document.getElementById("theme-toggle");
  if (!button) return;

  button.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
  });

  // Follow the system only while the visitor has never chosen.
  var stored = null;
  try {
    stored = localStorage.getItem("theme");
  } catch (e) {}
  if (!stored) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (event) {
      root.setAttribute("data-theme", event.matches ? "dark" : "light");
    });
  }
})();
