// keepingledger.com home: the live day page, then the section pictures. Nothing is stored or sent anywhere.
(function () {
  var NBSP = " ";
  var AREAS = {
    health: { name: "Health", m: "var(--fern)", p: "var(--fern-p)", icon: '<path d="M6 10.4C2.3 8 1.1 6.2 1.1 4.4 1.1 2.9 2.3 1.7 3.7 1.7c1 0 1.8.5 2.3 1.3.5-.8 1.3-1.3 2.3-1.3 1.4 0 2.6 1.2 2.6 2.7 0 1.8-1.2 3.6-4.9 6Z"/>' },
    home: { name: "Home", m: "var(--berry)", p: "var(--berry-p)", icon: '<path d="M1.4 5.8 6 1.8l4.6 4M2.7 4.8v5.6h6.6V4.8M5 10.4V7.5h2v2.9"/>' },
    growth: { name: "Growth", m: "var(--iris)", p: "var(--iris-p)", icon: '<path d="M2.2 10.2c-.3-4.6 2.6-8 8.4-8.4.3 5.6-3 8.6-8.4 8.4Zm0 0 5-5"/>' }
  };
  var LEVELS = ["Very unpleasant", "Unpleasant", "Slightly unpleasant", "Neutral", "Slightly pleasant", "Pleasant", "Very pleasant"];

  var state, seq, pickerFor;
  function fresh() {
    seq = 3; pickerFor = null;
    state = {
      mood: null,
      lines: [
        { id: "run", kind: "habit", verb: "show", area: "health", time: "7:00 AM", title: "Morning run", base: 1, target: 3, done: true, at: 1 },
        { id: "note", kind: "note", time: "8:40 AM", title: "Coffee on the balcony. Clear head.", at: 2 },
        { id: "rent", kind: "task", area: "home", time: "any", title: "Pay rent", due: true, done: false },
        { id: "water", kind: "habit", verb: "reach", area: "health", time: "all day", title: "Drink water", amount: 24, target: 70, step: 8, done: false },
        { id: "walk", kind: "habit", verb: "do", area: "growth", time: "2:00 PM", title: "Walk after lunch", done: false },
        { id: "ada", kind: "event", time: "3:00 PM", title: "Coffee with Ada", cal: "Personal" },
        { id: "phone", kind: "habit", verb: "avoid", area: "health", time: "10:00 PM", title: "No phone after 10pm" }
      ]
    };
  }

  // ----- dates: the visitor's real day and week, the week starting on their region's first day -----
  var today = new Date();
  var dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  document.getElementById("dayname").textContent = dayName;
  document.getElementById("seclabel").textContent = dayName + "’s page";
  var firstDay = 7;
  try { var loc = new Intl.Locale(navigator.language || "en-US"); var wi = loc.getWeekInfo ? loc.getWeekInfo() : loc.weekInfo; if (wi && wi.firstDay) firstDay = wi.firstDay; } catch (e) {}
  var offset = (today.getDay() - (firstDay % 7) + 7) % 7;
  var PAST = [["--fern", "--berry", "--iris"], ["--fern", "--iris"], ["--iris", "--fern", "--jade"], ["--berry", "--fern"], ["--fern", "--jade", "--iris"], ["--iris", "--berry", "--fern"]];
  var weekEl = document.getElementById("week");
  var todayDots;
  for (var i = 0; i < 7; i++) {
    var d = new Date(today); d.setDate(today.getDate() - offset + i);
    var cell = document.createElement("div");
    cell.className = "day" + (i === offset ? " sel" : "");
    var dots = "";
    if (i < offset) dots = PAST[i % PAST.length].map(function (c) { return '<i style="--c:var(' + c + ')"></i>'; }).join("");
    cell.innerHTML = '<span class="l">' + d.toLocaleDateString("en-US", { weekday: "narrow" }) + '</span><span class="n">' + d.getDate() + '</span><span class="dots">' + dots + '</span>';
    weekEl.appendChild(cell);
    if (i === offset) todayDots = cell.querySelector(".dots");
  }

  // ----- drawing -----
  function controlSVG(shape) {
    var s = shape === "task"
      ? '<rect class="pen" x="0" y="0" width="22" height="22" rx="6"/><rect class="fil" x="0" y="0" width="22" height="22" rx="6"/>'
      : '<circle class="pen" cx="11" cy="11" r="11"/><circle class="trk" cx="11" cy="11" r="11"/><circle class="arc" cx="11" cy="11" r="11" transform="rotate(-90 11 11)"/><circle class="fil" cx="11" cy="11" r="11"/>';
    return '<svg viewBox="-2 -2 26 26" aria-hidden="true">' + s + '<path class="chk" pathLength="1" d="M6.6 11.3 9.7 14.4 15.4 7.9"/></svg>';
  }
  function moodSVG(level, size, dashed) {
    var s = size, sw = Math.max(1.2, 0.075 * s), r = s / 2 - sw / 2, cs = Math.max(1.4, 0.085 * s);
    var midY = s / 2 + 0.04 * s, bend = (level / 3) * (s / 2) * 0.55, y0 = midY - 0.3 * bend;
    var dash = dashed ? ' stroke-dasharray="' + (0.14 * s).toFixed(2) + " " + (0.10 * s).toFixed(2) + '"' : "";
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + " " + s + '" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r.toFixed(3) + '" stroke-width="' + sw.toFixed(2) + '"' + dash + "/>" +
      '<path d="M' + (s / 4) + " " + y0.toFixed(2) + " Q" + (s / 2) + " " + (y0 + bend).toFixed(2) + " " + (3 * s / 4) + " " + y0.toFixed(2) + '" stroke-width="' + cs.toFixed(2) + '" stroke-linecap="round"/></svg>';
  }
  function iconSVG(area) { return '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + AREAS[area].icon + "</svg>"; }
  function timeHTML(t) { var m = /^(\d+:\d+) ([AP]M)$/.exec(t); return m ? m[1] + "<small>" + m[2] + "</small>" : t; }
  function minutes(t) { if (t === "any") return -2; if (t === "all day") return -1; var m = /^(\d+):(\d+) ([AP]M)$/.exec(t); var h = +m[1] % 12 + (m[3] === "PM" ? 12 : 0); return h * 60 + +m[2]; }

  var card = document.getElementById("card"), els = {};
  function rowShell(id, cls) {
    var el = document.createElement("div");
    el.className = "ln " + (cls || ""); el.setAttribute("role", "listitem"); el.dataset.key = id;
    el.innerHTML = '<span class="strip"></span><span class="tm"></span><span class="slot"></span><span class="tt"><span class="ti"></span><span class="sub"></span></span><span class="acc"></span>';
    return el;
  }
  function lineEl(L) {
    var el = els[L.id];
    if (!el) {
      el = els[L.id] = rowShell(L.id);
      var slot = el.querySelector(".slot");
      if (L.kind === "habit" || L.kind === "task") {
        var b = document.createElement(L.verb === "avoid" ? "span" : "button");
        b.className = "ctl" + (L.verb === "avoid" ? " static" : "");
        if (b.tagName === "BUTTON") { b.type = "button"; b.addEventListener("click", function () { tap(L.id); }); }
        b.innerHTML = controlSVG(L.kind === "task" ? "task" : "circle");
        slot.appendChild(b);
      } else if (L.kind === "note") {
        slot.innerHTML = '<span class="ctl static"><span class="dash">—</span></span>';
      }
      if (L.area) { el.style.setProperty("--m", AREAS[L.area].m); el.style.setProperty("--p", AREAS[L.area].p); }
      el.querySelector(".strip").style.setProperty("--s", L.area ? AREAS[L.area].m : (L.kind === "event" ? "var(--a-cal)" : "var(--a-label4)"));
      el.querySelector(".tm").innerHTML = timeHTML(L.time);
      el.querySelector(".ti").textContent = L.title;
      if (L.kind === "note") el.classList.add("note", "compact");
    }
    var done = !!L.done, ctl = el.querySelector("button.ctl, span.ctl.static:not(:empty)");
    if (L.kind === "habit" || L.kind === "task") {
      el.classList.toggle("ink", done);
      el.classList.toggle("compact", done);
      var c = el.querySelector(".ctl");
      var ring = L.verb === "reach" && !done && L.amount > 0;
      c.classList.toggle("is-ink", done); c.classList.toggle("is-ring", ring); c.classList.toggle("is-pen", !done && !ring);
      if (L.verb === "reach") {
        var f = Math.max(0.02, Math.min(1, L.amount / L.target));
        c.querySelector(".arc").style.strokeDasharray = (f * 69.115).toFixed(2) + " 69.115";
      }
      if (c.tagName === "BUTTON") {
        var label = L.verb === "reach" ? (done ? L.title + ", done" : "Add 8 ounces to " + L.title) : (done ? "Mark " + L.title + " not done" : "Mark " + L.title + " done");
        c.setAttribute("aria-label", label);
        if (L.verb !== "reach") c.setAttribute("aria-pressed", String(done));
      } else { c.setAttribute("role", "img"); c.setAttribute("aria-label", L.title + ", holding"); }
    }
    // sub-line and accessory
    var sub = "", acc = "";
    var a = L.area ? iconSVG(L.area) + "<span>" + AREAS[L.area].name + " · " : "<span>";
    if (L.id === "run") sub = a + (L.base + (done ? 1 : 0)) + " of " + L.target + " this week</span>";
    if (L.id === "rent") { sub = a + (done ? "done 1:30" + NBSP + "PM" : "due today") + "</span>"; if (!done) acc = '<span class="due"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="6" cy="6" r="5.2"/><path d="M6 3.3v3.2" stroke-linecap="round"/><circle cx="6" cy="8.6" r=".4" fill="currentColor"/></svg>Due</span>'; }
    if (L.id === "water") { sub = a + L.amount + " of " + L.target + " oz</span>"; if (!done) acc = '<button class="chip" type="button" data-add aria-label="Add 8 ounces of water">+8 oz</button>'; }
    if (L.id === "walk") sub = a + (done ? "done 1:30" + NBSP + "PM" : "daily") + "</span>";
    if (L.id === "phone") sub = a + "clean so far</span>";
    if (L.kind === "event") sub = "<span>" + L.cal + "</span>";
    if (L.kind === "note") sub = "<span>Note</span>";
    var subEl = el.querySelector(".sub"); if (subEl.innerHTML !== sub) subEl.innerHTML = sub;
    var accEl = el.querySelector(".acc");
    if ((accEl.dataset.v || "") !== acc) {
      accEl.innerHTML = acc; accEl.dataset.v = acc;
      var add = accEl.querySelector("[data-add]"); if (add) add.addEventListener("click", function () { addWater(add); });
    }
    return el;
  }
  function nowEl() {
    if (!els.now) { els.now = document.createElement("div"); els.now.className = "now"; els.now.dataset.key = "now"; els.now.setAttribute("role", "listitem"); els.now.textContent = "Now · 1:30" + NBSP + "PM"; }
    return els.now;
  }
  function moodLineEl(logged) {
    var key = logged ? "mood" : "prompt", el = els[key];
    if (!el) {
      el = els[key] = rowShell(key, logged ? "ink" : "");
      el.querySelector(".strip").style.setProperty("--s", "var(--a-label4)");
      var b = document.createElement("button"); b.type = "button"; b.className = "ctl"; b.style.color = "var(--a-label2)";
      b.addEventListener("click", function () { togglePicker(key); });
      el.querySelector(".slot").appendChild(b);
      el.querySelector(".ti").addEventListener("click", function () { togglePicker(key); });
      el.querySelector(".ti").style.cursor = "pointer";
    }
    var b2 = el.querySelector(".ctl");
    if (logged) {
      var lv = state.mood.level;
      el.querySelector(".tm").innerHTML = timeHTML("1:30 PM");
      b2.innerHTML = moodSVG(lv, 22, false).replace("<svg ", '<svg style="width:22px;height:22px;margin:-11px 0 0 -11px" ');
      el.querySelector(".ti").textContent = LEVELS[lv + 3];
      el.querySelector(".sub").innerHTML = "<span>Mood</span>";
      b2.setAttribute("aria-label", "Mood: " + LEVELS[lv + 3] + ". Change it");
    } else {
      el.querySelector(".tm").innerHTML = "any";
      b2.innerHTML = moodSVG(0, 22, true).replace("<svg ", '<svg style="width:22px;height:22px;margin:-11px 0 0 -11px" ');
      el.querySelector(".ti").textContent = "How are you feeling?";
      el.querySelector(".sub").innerHTML = "<span>Mood</span>";
      b2.setAttribute("aria-label", "How are you feeling? Pick a mood");
    }
    b2.setAttribute("aria-expanded", String(pickerFor === key));
    return el;
  }
  function pickerEl() {
    if (!els.picker) {
      var el = els.picker = document.createElement("div"); el.className = "picker"; el.dataset.key = "picker";
      var faces = "";
      for (var lv = -3; lv <= 3; lv++) faces += '<button type="button" data-lv="' + lv + '" aria-label="' + LEVELS[lv + 3] + '">' + moodSVG(lv, 32, false) + "</button>";
      el.innerHTML = '<div class="faces" role="group" aria-label="How are you feeling?">' + faces + "</div>";
      el.addEventListener("click", function (e) { var b = e.target.closest("button[data-lv]"); if (b) pickMood(+b.dataset.lv); });
    }
    return els.picker;
  }

  // ----- order: done lines (as marked) · Now · the mood prompt · open lines (any, all day, then by time) -----
  function order() {
    var L = state.lines, out = [];
    var done = L.filter(function (x) { return x.done || x.kind === "note"; }).map(function (x) { return { at: x.at, el: function () { return lineEl(x); }, key: x.id }; });
    if (state.mood) done.push({ at: state.mood.at, el: function () { return moodLineEl(true); }, key: "mood" });
    done.sort(function (a, b) { return a.at - b.at; });
    done.forEach(function (d) { out.push(d.key); if (pickerFor === d.key) out.push("picker"); });
    out.push("now");
    if (!state.mood) { out.push("prompt"); if (pickerFor === "prompt") out.push("picker"); }
    L.filter(function (x) { return !(x.done || x.kind === "note"); })
      .sort(function (a, b) { return minutes(a.time) - minutes(b.time) || a.title.localeCompare(b.title); })
      .forEach(function (x) { out.push(x.id); });
    return out;
  }
  function elFor(key) {
    if (key === "now") return nowEl();
    if (key === "picker") return pickerEl();
    if (key === "prompt") return moodLineEl(false);
    if (key === "mood") return moodLineEl(true);
    for (var i = 0; i < state.lines.length; i++) if (state.lines[i].id === key) return lineEl(state.lines[i]);
  }
  function render() {
    var keys = order(), seen = {};
    keys.forEach(function (k, i) {
      var el = elFor(k); seen[k] = true;
      if (card.children[i] !== el) card.insertBefore(el, card.children[i] || null);
      if (el.classList.contains("ln")) el.classList.toggle("nosep", keys[i + 1] === "now" || keys[i + 1] === "picker" || i === keys.length - 1);
    });
    Object.keys(els).forEach(function (k) { if (!seen[k] && els[k].parentNode) els[k].parentNode.removeChild(els[k]); });
    var doneN = 0, toGo = 0, dots = [];
    state.lines.filter(function (x) { return x.kind === "habit" || x.kind === "task"; }).forEach(function (x) { if (x.done) { doneN++; dots.push(x); } else toGo++; });
    dots.sort(function (a, b) { return a.at - b.at; });
    todayDots.innerHTML = dots.slice(0, 3).map(function (x) { return '<i style="--c:' + AREAS[x.area].m + '"></i>'; }).join("");
    document.getElementById("status").textContent = "1:30" + NBSP + "PM · " + doneN + " done" + (toGo ? ", " + toGo + " to go." : ".");
  }

  // ----- motion: lines glide to their new place (FLIP), scaled with the phone -----
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function flip(mutate) {
    var before = {};
    Array.prototype.forEach.call(card.children, function (el) { before[el.dataset.key] = el.getBoundingClientRect().top; });
    mutate(); render();
    if (reduce.matches) return;
    var k = scale || 1;
    Array.prototype.forEach.call(card.children, function (el) {
      var key = el.dataset.key;
      if (!(key in before)) { el.classList.remove("appear"); void el.offsetWidth; el.classList.add("appear"); return; }
      var dy = (before[key] - el.getBoundingClientRect().top) / k;
      if (Math.abs(dy) < 0.5) return;
      el.style.transition = "none"; el.style.transform = "translateY(" + dy + "px)"; el.style.zIndex = "1";
      void el.offsetWidth;
      el.style.transition = "transform 350ms var(--smooth)"; el.style.transform = "";
      el.addEventListener("transitionend", function te(e) { if (e.propertyName === "transform") { el.style.transition = ""; el.style.zIndex = ""; el.removeEventListener("transitionend", te); } });
    });
  }

  // ----- what taps do -----
  function line(id) { return state.lines.filter(function (x) { return x.id === id; })[0]; }
  function tap(id) {
    var L = line(id);
    if (L.verb === "reach") { if (!L.done) addWater(document.querySelector('[data-key="water"] [data-add]')); return; }
    flip(function () { L.done = !L.done; L.at = L.done ? seq++ : undefined; pickerFor = null; });
  }
  function addWater(chip) {
    var L = line("water"); if (L.done || L.amount >= L.target) return;
    L.amount += L.step;
    if (chip && !reduce.matches) { chip.classList.remove("pulse"); void chip.offsetWidth; chip.classList.add("pulse"); }
    lineEl(L);
    if (L.amount >= L.target) setTimeout(function () { flip(function () { L.done = true; L.at = seq++; }); }, reduce.matches ? 0 : 360);
  }
  function togglePicker(key) { flip(function () { pickerFor = pickerFor === key ? null : key; }); var f = els.picker && els.picker.querySelector("button"); if (pickerFor && f) f.focus({ preventScroll: true }); }
  function pickMood(lv) {
    flip(function () { if (!state.mood) state.mood = { level: lv, at: seq++ }; else state.mood.level = lv; pickerFor = null; });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pickerFor) togglePicker(pickerFor); });

  function start() {
    Object.keys(els).forEach(function (k) { if (els[k].parentNode) els[k].parentNode.removeChild(els[k]); });
    els = {}; fresh(); card.classList.add("no-anim"); render();
    requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.remove("no-anim"); }); });
    document.getElementById("scroll").scrollTop = 0;
  }
  document.getElementById("again").addEventListener("click", start);

  // ----- fit the phone to the space: never wider than its column, never taller than most of the window -----
  var wrap = document.getElementById("wrap"), device = document.getElementById("device"), scale = 1;
  function fit() {
    var col = wrap.parentNode.getBoundingClientRect().width;
    var maxH = Math.max(560, window.innerHeight - 230);
    scale = Math.min(1, col / 426, maxH / 898);
    device.style.transform = "scale(" + scale + ")";
    wrap.style.width = (426 * scale) + "px"; wrap.style.height = (898 * scale) + "px";
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap.parentNode); else window.addEventListener("resize", fit);
  window.addEventListener("resize", fit);
  fit(); start();
})();

// The rest of the page: a habit's month, the graduation badge, and Health lines that fill in. Same tokens and line
// parts as the hero. Animations start when a tile is half on screen; Reduce Motion shows the end state.
(function () {
  var NBSP = " ";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ICON = {
    heart: '<path d="M6 10.4C2.3 8 1.1 6.2 1.1 4.4 1.1 2.9 2.3 1.7 3.7 1.7c1 0 1.8.5 2.3 1.3.5-.8 1.3-1.3 2.3-1.3 1.4 0 2.6 1.2 2.6 2.7 0 1.8-1.2 3.6-4.9 6Z"/>',
    leaf: '<path d="M2.2 10.2c-.3-4.6 2.6-8 8.4-8.4.3 5.6-3 8.6-8.4 8.4Zm0 0 5-5"/>'
  };
  function icon(n) { return '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + "</svg>"; }
  function ctlSVG() { return '<svg viewBox="-2 -2 26 26" aria-hidden="true"><circle class="pen" cx="11" cy="11" r="11"/><circle class="trk" cx="11" cy="11" r="11"/><circle class="arc" cx="11" cy="11" r="11" transform="rotate(-90 11 11)"/><circle class="fil" cx="11" cy="11" r="11"/><path class="chk" pathLength="1" d="M6.6 11.3 9.7 14.4 15.4 7.9"/></svg>'; }
  function time(t) { var m = /^(\d+:\d+) ([AP]M)$/.exec(t); return m ? m[1] + "<small>" + m[2] + "</small>" : t; }
  function row(o) {
    return '<div class="ln ' + (o.cls || "") + '"' + (o.m ? ' style="--m:var(' + o.m + ');--p:var(' + o.p + ')"' : "") + '>' +
      '<span class="strip" style="--s:var(' + o.strip + ')"></span><span class="tm">' + time(o.time) + '</span>' +
      '<span class="slot">' + (o.ctl || "") + '</span>' +
      '<span class="tt"><span class="ti">' + o.title + '</span><span class="sub">' + o.sub + '</span></span><span class="acc">' + (o.acc || "") + "</span></div>";
  }
  function onView(el, fn) {
    if (reduce || !("IntersectionObserver" in window)) { fn(true); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(false); } }); }, { threshold: 0.5 });
    io.observe(el);
  }

  // ----- It reports, never grades: Walk after lunch, September (a filled day when done; blank otherwise) -----
  var DONE = [1, 2, 3, 5, 7, 8, 9, 10, 14, 15, 16, 17, 21, 22, 23, 25, 28, 29];
  var g = "SMTWTFS".split("").map(function (l) { return '<span class="l">' + l + "</span>"; }).join("") + "<span></span><span></span>";
  for (var d = 1; d <= 30; d++) g += '<span class="d' + (DONE.indexOf(d) >= 0 ? " on" : "") + '">' + d + "</span>";
  document.getElementById("month").innerHTML =
    '<div class="hd"><h3>Walk after lunch</h3></div><div class="sub2">' + icon("leaf") + "<span>Growth · Do it · daily</span></div>" +
    '<div class="hd" style="margin-top:16px"><h3 style="font-size:15px">September</h3><span class="sub2" aria-hidden="true">‹&nbsp;&nbsp;&nbsp;›</span></div>' +
    '<div class="grid" aria-hidden="true">' + g + '</div><div class="sum">Done on 18 of 30 days.</div>';

  // ----- Graduation: Morning run, a 10-week window; week 5 fell short (a pencil gap), then the seal -----
  var badge = document.getElementById("badge"), sub = document.getElementById("badge-sub");
  var R = 85, C = 2 * Math.PI * R, N = 10, GAP = 0.012, SEG = (1 / N - 2 * GAP) * C, MISS = 4;
  function seal() {
    var pts = [], n = 24;
    for (var i = 0; i < n; i++) { var a = (i / n) * 2 * Math.PI - Math.PI / 2, r = i % 2 ? 22.4 : 26; pts.push((164 + r * Math.cos(a)).toFixed(2) + "," + (36 + r * Math.sin(a)).toFixed(2)); }
    return '<g class="seal"><polygon points="' + pts.join(" ") + '" fill="var(--warm)" stroke="var(--warm)" stroke-width="3" stroke-linejoin="round"/><path d="M156.2 36.6 161.6 42 171.6 31" fill="none" stroke="var(--on-warm)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }
  function mark(i, cls) { return '<circle class="mk ' + cls + '" data-i="' + i + '" cx="100" cy="100" r="' + R + '" transform="rotate(-90 100 100)" stroke-dasharray="' + SEG.toFixed(2) + " " + C.toFixed(2) + '" stroke-dashoffset="' + (-(i / N + GAP) * C).toFixed(2) + '"/>'; }
  var runner = '<g transform="translate(64 64) scale(3)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14.6" cy="4.4" r="2" fill="#fff" stroke="none"/><path d="M13.2 8.2 11.4 13.6M13.2 8.6l3 2 2-1M13.2 8.6l-3 1.4-1.6 2.4M11.4 13.6l3.2 2.6-.8 4.6M11.4 13.6l-2 3.8-3.2 1"/></g>';
  function drawBadge() {
    var s = "";
    for (var i = 0; i < N; i++) s += mark(i, "faint");
    for (var j = 0; j < N; j++) s += mark(j, (j === MISS ? "gap" : "held") + " ink");
    badge.innerHTML = s + '<circle cx="100" cy="100" r="60" fill="var(--fern)"/>' + runner + seal();
    badge.classList.remove("sealed", "animate");
  }
  function playBadge(instant) {
    drawBadge();
    var inks = badge.querySelectorAll(".mk.ink"), held = 0;
    if (instant) { badge.classList.add("sealed"); sub.textContent = "9 of 10 weeks at 3×. Ready to graduate."; return; }
    inks.forEach(function (m) { m.style.strokeDasharray = "0 " + C.toFixed(2); m.style.transition = "stroke-dasharray 300ms ease-out"; });
    sub.textContent = "0 of 10 weeks at 3×";
    void badge.getBoundingClientRect();
    inks.forEach(function (m, i) {
      setTimeout(function () {
        m.style.strokeDasharray = SEG.toFixed(2) + " " + C.toFixed(2);
        if (i !== MISS) held++;
        sub.textContent = held + " of " + (i + 1) + " weeks at 3×";
      }, 200 + i * 190);
    });
    setTimeout(function () { badge.classList.add("animate", "sealed"); sub.textContent = "9 of 10 weeks at 3×. Ready to graduate."; }, 200 + N * 190 + 150);
  }
  drawBadge();
  onView(document.getElementById("grad-tile"), playBadge);
  document.getElementById("badge-replay").addEventListener("click", function () { playBadge(reduce); });

  // ----- Health: steps fill a Reach it line; a workout Health saw can be logged; events sit on the page -----
  var stepsCard = document.getElementById("steps-card");
  function stepsRow(n, done) {
    return row({ cls: "nosep" + (done ? " ink" : ""), m: "--fern", p: "--fern-p", strip: "--fern", time: "all day", title: "Walk 8,000 steps",
      ctl: '<span class="ctl static ' + (done ? "is-ink" : "is-ring") + '" role="img" aria-label="' + (done ? "Reached" : "In progress") + '">' + ctlSVG() + "</span>",
      sub: icon("heart") + "<span>Health · " + n.toLocaleString("en-US") + " of 8,000 steps</span>" });
  }
  function playSteps(instant) {
    var from = 6240, to = 8214, dur = 1500;
    stepsCard.innerHTML = stepsRow(instant ? to : from, instant);
    var arc = stepsCard.querySelector(".arc"), txt = stepsCard.querySelector(".sub span");
    function setF(f) { arc.style.transition = "none"; arc.style.strokeDasharray = (Math.max(0.02, Math.min(1, f)) * 69.115).toFixed(2) + " 69.115"; }
    if (instant) return;
    setF(from / 8000);
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3), n = Math.round(from + (to - from) * e);
      setF(n / 8000); txt.textContent = "Health · " + n.toLocaleString("en-US") + " of 8,000 steps";
      if (k < 1) requestAnimationFrame(step);
      else setTimeout(function () { var c = stepsCard.querySelector(".ctl"), l = stepsCard.querySelector(".ln"); c.classList.remove("is-ring"); c.classList.add("is-ink"); l.classList.add("ink"); }, 250);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 300);
  }
  stepsCard.innerHTML = stepsRow(6240, false);
  (function () { var a = stepsCard.querySelector(".arc"); a.style.strokeDasharray = (6240 / 8000 * 69.115).toFixed(2) + " 69.115"; })();
  onView(document.getElementById("steps-tile"), playSteps);
  document.getElementById("steps-replay").addEventListener("click", function () { playSteps(reduce); });

  var walkCard = document.getElementById("walk-card"), logged = false;
  function drawWalk() {
    walkCard.innerHTML = row({ cls: "nosep two" + (logged ? " ink" : ""), m: "--iris", p: "--iris-p", strip: "--iris", time: "2:00 PM", title: "Walk after lunch",
      ctl: '<button class="ctl ' + (logged ? "is-ink" : "is-pen") + '" type="button" aria-pressed="' + logged + '" aria-label="' + (logged ? "Mark Walk after lunch not done" : "Mark Walk after lunch done") + '">' + ctlSVG() + "</button>",
      sub: icon("leaf") + "<span>" + (logged ? "Growth · done 1:05" + NBSP + "PM" : "Growth · Health saw a 25-min walk at 1:05" + NBSP + "PM") + "</span>",
      acc: logged ? "" : '<button class="chip" type="button" aria-label="Log the walk Health saw">Log it</button>' });
    walkCard.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { logged = !logged; drawWalk(); var c = walkCard.querySelector(".ctl"); if (c && document.activeElement !== c) c.focus({ preventScroll: true }); }); });
  }
  drawWalk();

  document.getElementById("cal-card").innerHTML =
    row({ strip: "--cal-work", time: "9:30 AM", title: "Team standup", sub: "<span>Work</span>" }) +
    row({ cls: "nosep", strip: "--a-cal", time: "3:00 PM", title: "Coffee with Ada", sub: "<span>Personal</span>" });

  // ----- Screens: fall back to a labelled placeholder if a screenshot isn't there -----
  document.querySelectorAll(".shot img").forEach(function (img) {
    img.addEventListener("error", function () { img.closest(".shot").classList.add("missing"); });
  });
})();
