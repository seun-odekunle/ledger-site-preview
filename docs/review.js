// Preview only: a review panel for the redesign draft. Answers stay in this browser; Copy puts them on the clipboard
// to paste into chat. Never on keepingledger.com.
(function () {
  "use strict";
  var KEY = "ledger-preview-review", BUILT = document.documentElement.dataset.built || "";
  var ITEMS = [
    ["top", "Top of the page", "top"], ["journal", "Tonight: day review and Journal", "journal"],
    ["planning", "The days ahead: planning animation", "planning"], ["weeks", "Week by week", "weeks"],
    ["graduate", "Month by month: graduation", "graduate"], ["health", "Health and Calendar", "health"],
    ["devices", "Every device: the sync animation", "devices"], ["watch", "Apple Watch", "watch"],
    ["privacy", "Privacy band", "privacy"], ["more", "The rest of it", "more"], ["price", "Try it, then pay once", "price"],
    ["faq", "Before you ask", "faq"], ["whole", "The page as a whole (order, pace, feel)", null]
  ];
  var data = {};
  try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { data = {}; }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }

  var btn = el("button", "rv-btn"); btn.type = "button"; btn.setAttribute("aria-expanded", "false");
  var panel = el("div", "rv-panel"); panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Review this draft");
  function count() { return ITEMS.filter(function (i) { return data[i[0]] && data[i[0]].v; }).length; }
  function label() { btn.innerHTML = ""; btn.appendChild(document.createTextNode("Review ")); btn.appendChild(el("b", null, count() + "/" + ITEMS.length)); }

  var head = el("div", "rv-head"); head.appendChild(el("h2", null, "Review this draft")); head.appendChild(el("small", null, BUILT));
  panel.appendChild(head);
  panel.appendChild(el("p", "rv-intro", "Keep or Change for each part, with a note if you like. It stays in this browser; Copy all at the bottom puts it on your clipboard for chat."));
  ITEMS.forEach(function (it) {
    var box = el("div", "rv-item"), t = el("div", "t");
    t.appendChild(el("span", null, it[1]));
    if (it[2]) { var a = el("a", null, "Go to it"); a.href = "#" + it[2]; a.addEventListener("click", function () { if (window.matchMedia("(max-width: 600px)").matches) toggle(false); }); t.appendChild(a); }
    box.appendChild(t);
    var opts = el("div", "rv-opts");
    [["keep", "Keep"], ["change", "Change"]].forEach(function (o) {
      var b = el("button", null, o[1]); b.type = "button";
      function paint() { b.setAttribute("aria-pressed", data[it[0]] && data[it[0]].v === o[0] ? "true" : "false"); }
      b.addEventListener("click", function () {
        var e = data[it[0]] || (data[it[0]] = {}); e.v = e.v === o[0] ? null : o[0]; store(); label();
        opts.querySelectorAll("button").forEach(function (x) { x.dispatchEvent(new Event("paint")); });
      });
      b.addEventListener("paint", paint); paint(); opts.appendChild(b);
    });
    box.appendChild(opts);
    var ta = el("textarea"); ta.rows = 1; ta.placeholder = "Note (optional)"; ta.value = (data[it[0]] && data[it[0]].n) || "";
    ta.setAttribute("aria-label", it[1] + ": note");
    ta.addEventListener("input", function () { var e = data[it[0]] || (data[it[0]] = {}); e.n = ta.value; store(); });
    box.appendChild(ta);
    panel.appendChild(box);
  });
  var cp = el("div", "rv-copy"), cb = el("button", null, "Copy all"), cs = el("span"), out = el("textarea"); cb.type = "button"; out.hidden = true;
  cb.addEventListener("click", function () {
    var lines = ["Ledger site preview" + (BUILT ? " (" + BUILT + ")" : "") + ", my review:"];
    ITEMS.forEach(function (it) { var e = data[it[0]] || {}; if (!e.v && !e.n) return; lines.push("- " + it[1] + ": " + (e.v === "keep" ? "Keep" : e.v === "change" ? "Change" : "No call") + (e.n ? ". " + e.n.trim() : "")); });
    var text = lines.length > 1 ? lines.join("\n") : "Ledger site preview: nothing marked yet.";
    function fallback() { out.hidden = false; out.value = text; out.focus(); out.select(); cs.textContent = "Select and copy the text below."; }
    try { navigator.clipboard.writeText(text).then(function () { cs.textContent = "Copied. Paste it into chat."; out.hidden = true; }, fallback); } catch (e) { fallback(); }
  });
  cp.appendChild(cb); cp.appendChild(cs); cp.appendChild(out); panel.appendChild(cp);

  function toggle(open) { panel.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); }
  btn.addEventListener("click", function () { toggle(panel.hidden); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { toggle(false); btn.focus(); } });
  label();
  document.body.appendChild(panel); document.body.appendChild(btn);

  // Preview only: try the page in light or dark without changing the device. Auto follows the device.
  var THEMES = ["auto", "light", "dark"], NAMES = { auto: "Auto", light: "Light", dark: "Dark" };
  var theme = "auto"; try { theme = localStorage.getItem("ledger-preview-theme") || "auto"; } catch (e) {}
  var tb = el("button", "rv-theme"); tb.type = "button";
  function applyTheme() {
    if (theme === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", theme);
    tb.innerHTML = ""; tb.appendChild(document.createTextNode("Theme ")); tb.appendChild(el("b", null, NAMES[theme]));
    tb.setAttribute("aria-label", "Theme: " + NAMES[theme] + ". Tap to change.");
  }
  tb.addEventListener("click", function () { theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]; try { localStorage.setItem("ledger-preview-theme", theme); } catch (e) {} applyTheme(); });
  applyTheme(); document.body.appendChild(tb);
})();
