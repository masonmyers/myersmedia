/* Shared site behavior: mobile nav toggle, active link highlighting, footer year */
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Highlight active nav link based on current page
  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[data-page]").forEach(function (link) {
    if (link.getAttribute("data-page") === currentPage) {
      link.classList.add("active");
    }
  });

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Wire up social links from config
  if (window.SITE_CONFIG && window.SITE_CONFIG.SOCIAL_LINKS) {
    var s = window.SITE_CONFIG.SOCIAL_LINKS;
    document.querySelectorAll('[data-social="twitter"]').forEach(function (a) { a.href = s.twitter; });
    document.querySelectorAll('[data-social="linkedin"]').forEach(function (a) { a.href = s.linkedin; });
    document.querySelectorAll('[data-social="instagram"]').forEach(function (a) { a.href = s.instagram; });
  }
});
