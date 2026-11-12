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
      node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) {
        var safe = w.replace(/&/g, "&amp;").replace(/</g, "&lt;");
        out += '<span class="w" aria-hidden="true" style="--i:' + (n++) + '">' + safe + "<i" + (blue ? ' class="b"' : "") + ">" + safe + "</i></span> ";
      });
    });
    h.setAttribute("aria-label", label); h.innerHTML = out;
    return [].slice.call(h.querySelectorAll(".w"));
  }
  var heads = [];
  ["#join", "#days", "#journal", "#planning", "#weeks", "#graduate", "#health", "#devices", "#watch", "#privacy .sec", "#more", "#price", "#faq", "#evening"].forEach(function (sel) {
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

  // ---------- The rest of it: a list that answers the pointer ----------
  // The chosen line is full size and its ring fills; then the next one takes over. Resting the pointer on a line, or
  // tapping it, chooses it and holds it there. Plays only while on screen; with less motion nothing moves by itself.
  var rest = document.getElementById("more");
  if (rest && rest.querySelector(".rest-item")) {
    var items = [].slice.call(rest.querySelectorAll(".rest-item")), views = [].slice.call(rest.querySelectorAll(".days-view"));
    var HOLD = 5200, C = 100.53, cur = 0, seen = false, held = false, spent = 0, last = 0, raf = 0, intent = 0;
    function ring(k, p) { items[k].querySelector(".fill").style.strokeDashoffset = String(C * (1 - clamp(p, 0, 1))); }
    function choose(k) {
      cur = k; spent = 0;
      items.forEach(function (b, n) { b.setAttribute("aria-pressed", n === k ? "true" : "false"); if (n !== k) ring(n, 0); });
      views.forEach(function (v) { v.classList.toggle("is-on", +v.dataset.step === k); });
      ring(k, reduce ? 1 : 0);
    }
    function tick(ts) {
      raf = 0;
      if (!seen || reduce) return;
      if (!held) { spent += Math.min(ts - last, 100); ring(cur, spent / HOLD); if (spent >= HOLD) choose((cur + 1) % items.length); }
      last = ts; raf = requestAnimationFrame(tick);
    }
    function run() { if (!raf && seen && !reduce) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    items.forEach(function (b, n) {
      b.addEventListener("click", function () { choose(n); });
      b.addEventListener("focus", function () { if (b.matches(":focus-visible")) choose(n); });
      b.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return; clearTimeout(intent); intent = setTimeout(function () { if (cur !== n) choose(n); }, 110); });
    });
    var list = rest.querySelector(".rest-list");
    list.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") held = true; });
    list.addEventListener("pointerleave", function () { held = false; clearTimeout(intent); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; run(); }, { threshold: 0.35 }).observe(list); else { seen = true; run(); }
    choose(0);
  }
})();
