// keepingledger.com: the page under the hero. Each section's heading starts in pencil and is inked, word by word, as
// it comes into view (day.css). The menu's glass follows the pointer and turns dark over the evening. Nothing is stored
// or sent anywhere.
(function () {
  "use strict";
  var day = document.getElementById("day");
  if (!day || !("querySelector" in document)) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var bar = document.querySelector(".top");
  // The glass catches the light where the pointer is (bar.css).
  if (bar) bar.addEventListener("pointermove", function (e) { var r = bar.getBoundingClientRect(); bar.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px"); bar.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px"); });
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }

  // ---------- headings: one pencil word with an ink copy over it, per word; <b> marks the phrase in Ledger Blue ----------
  function inkable(h) {
    var label = h.textContent.replace(/\s+/g, " ").trim(), out = "", n = 0;
    [].forEach.call(h.childNodes, function (node) {
      var blue = node.nodeType === 1 && node.tagName === "B";
      if (node.nodeType === 1 && node.tagName === "BR") { out += node.className ? '<br class="' + node.className + '">' : "<br>"; return; }      // a heading may set its own lines
      node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) {
        var safe = w.replace(/&/g, "&amp;").replace(/</g, "&lt;");
        out += '<span class="w" aria-hidden="true" style="--i:' + (n++) + '">' + safe + "<i" + (blue ? ' class="b"' : "") + ">" + safe + "</i></span> ";
      });
    });
    h.setAttribute("aria-label", label); h.innerHTML = out;
    return [].slice.call(h.querySelectorAll(".w"));
  }
  var heads = [];
  ["#join", "#days", "#weeks", "#graduate", "#journal", "#health", "#devices", "#privacy", "#more", "#price", "#faq", "#evening"].forEach(function (sel) {
    var el = day.querySelector(sel); if (!el) return;
    el.setAttribute("data-sec", "");
    [].forEach.call(el.querySelectorAll("h2"), function (h) { heads.push({ el: h, words: inkable(h), shown: reduce }); });
  });
  var evening = document.getElementById("evening"), ticking = false;
  function ink(h, p) { h.words.forEach(function (w) { w.style.setProperty("--p", p); }); }
  if (!reduce) heads.forEach(function (h) { if (h.el.getBoundingClientRect().top >= window.innerHeight * 0.82) ink(h, 0); else h.shown = true; });   // headings already in view stay inked
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    heads.forEach(function (h) { if (!h.shown && h.el.getBoundingClientRect().top < vh * 0.82) { h.shown = true; ink(h, 1); } });
    if (bar && evening) bar.classList.toggle("night", evening.getBoundingClientRect().top < 64);
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  window.addEventListener("load", kick);
  kick();
})();
