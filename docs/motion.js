// keepingledger.com: the devices in step, planning on your own rhythm, and the Watch. Mounted into shadow roots from
// the templates in index.html; plays once when half on screen; less motion shows the finished state.
(function () {
  "use strict";
  function mount(id, tpl) {
    var host = document.getElementById(id), t = document.getElementById(tpl);
    if (!host || !t || !host.attachShadow) return null;
    var r = host.attachShadow({ mode: "open" }); r.appendChild(t.content.cloneNode(true)); return r;
  }
  var RA = mount("moA", "tpl-a"), RB = mount("moB", "tpl-b"), RW = mount("moW", "tpl-w");
  if (!RA || !RB) return;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var still = reduceMQ.matches;

  // ---------- Dates (English site; German would pass "de-DE") ----------
  var LANG = "en-US";
  var today = new Date(); today.setHours(12, 0, 0, 0);
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  var fWeekLong = new Intl.DateTimeFormat(LANG, { weekday: "long" });
  var fWeekShort = new Intl.DateTimeFormat(LANG, { weekday: "short" });
  var fWeekNarrow = new Intl.DateTimeFormat(LANG, { weekday: "narrow" });
  var fDay = new Intl.DateTimeFormat(LANG, { day: "numeric" });
  var fMD = new Intl.DateTimeFormat(LANG, { month: "short", day: "numeric" });
  var fTime = new Intl.DateTimeFormat(LANG, { hour: "numeric", minute: "2-digit" });
  function range(a, b) { try { return fMD.formatRange(a, b); } catch (e) { return fMD.format(a) + " – " + fMD.format(b); } }
  function firstWeekday() {
    try { var l = new Intl.Locale(LANG); var wi = (l.getWeekInfo && l.getWeekInfo()) || l.weekInfo; return wi && wi.firstDay ? wi.firstDay % 7 : 0; }
    catch (e) { return 0; }
  }
  var FIRST = firstWeekday();

  var timers = { A: [], B: [] };
  function later(k, ms, fn) { var t = setTimeout(fn, ms); timers[k].push(t); return t; }
  function clearTimers(k) { timers[k].forEach(clearTimeout); timers[k] = []; }

  function onView(el, fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { threshold: 0.5 });
    io.observe(el);
  }

  var AREAS = {
    health: { name: "Health", m: "var(--fern)", p: "var(--fern-p)" },
    home: { name: "Home", m: "var(--berry)", p: "var(--berry-p)" },
    growth: { name: "Growth", m: "var(--iris)", p: "var(--iris-p)" }
  };
  function ctlSVG(shape) {
    var s = shape === "task"
      ? '<rect class="pen" x="0" y="0" width="22" height="22" rx="6"/><rect class="fil" x="0" y="0" width="22" height="22" rx="6"/>'
      : '<circle class="pen" cx="11" cy="11" r="11"/><circle class="fil" cx="11" cy="11" r="11"/>';
    return '<svg viewBox="-2 -2 26 26" aria-hidden="true">' + s + '<path class="chk" pathLength="1" d="M6.6 11.3 9.7 14.4 15.4 7.9"/></svg>';
  }

  // =====================================================================
  // 1 · Every device, kept in step
  // =====================================================================
  var LINES = [
    { id: "stretch", shape: "habit", title: "Stretch", area: "health" },
    { id: "walk", shape: "habit", title: "Walk after lunch", area: "growth" },
    { id: "rent", shape: "task", title: "Pay rent", area: "home" }
  ];
  var START = { stretch: true, walk: false, rent: false };
  var DEVS = ["mac", "ipad", "iphone", "watch"];
  var DEV_NAME = { mac: "Mac", ipad: "iPad", iphone: "iPhone", watch: "Apple Watch" };
  var stageA = RA.getElementById("stageA"), wrapA = RA.getElementById("wrapA");
  var scaleA = 1, stA = {}, busy = {}, genA = 0;

  function rowHTML(dev, L) {
    var a = AREAS[L.area];
    var btn = '<button type="button" class="ctl" data-dev="' + dev + '" data-id="' + L.id + '" style="--m:' + a.m + ";--p:" + a.p + '">' + ctlSVG(L.shape) + "</button>";
    if (dev === "watch") return '<div class="wrow">' + btn + '<span class="ti">' + L.title + "</span></div>";
    return '<div class="row">' + btn + '<div class="tt"><span class="ti">' + L.title + '</span><span class="sub"><i style="background:' + a.m + '"></i>' + a.name + "</span></div></div>";
  }
  function todayHTML(dev) {
    return '<div class="today"><div class="greet">Afternoon, Sam</div><div class="ttl">' + fWeekLong.format(today) + "</div>" +
      '<div class="stat" data-stat="' + dev + '"></div><div class="card">' + LINES.map(function (L) { return rowHTML(dev, L); }).join("") + "</div></div>";
  }
  function devHTML(dev) {
    if (dev === "mac") return '<div class="dev mac"><div class="lid"><div class="scr"><div class="menubar"><b>Ledger</b><span>File</span><span>Edit</span><span>View</span><span>Window</span><span class="clk">1:30 PM</span></div>' +
      '<div class="win"><div class="side"><div class="lights"><i></i><i></i><i></i></div><div class="nav on">Today</div><div class="nav">Plan</div><div class="nav">Journal</div><div class="nav">Insights</div></div>' +
      '<div class="main">' + todayHTML(dev) + "</div></div></div></div><div class=\"base\"></div></div>";
    if (dev === "ipad") return '<div class="dev ipad"><div class="scr"><div class="tabpill"><span class="on">Today</span><span>Plan</span><span>Journal</span><span>Insights</span></div>' + todayHTML(dev) + "</div></div>";
    if (dev === "iphone") return '<div class="dev iphone"><div class="scr"><div class="isl"></div>' + todayHTML(dev) +
      '<div class="tabbar"><span class="on">Today</span><span>Plan</span><span>Journal</span><span>Insights</span></div></div></div>';
    return '<div class="dev watch"><div class="band t"></div><div class="band b"></div><div class="body"><div class="scr"><div class="whead"><b>Today</b><span>1:30</span></div>' +
      LINES.map(function (L) { return rowHTML("watch", L); }).join("") + '</div></div><div class="crown"></div></div>';
  }
  var CLOUD = '<div class="cloud" id="cloudA"><svg viewBox="0 0 48 32" aria-hidden="true"><path d="M13.5 27.5h22a7.6 7.6 0 0 0 1-15.1A10.6 10.6 0 0 0 16.6 9.6a8.9 8.9 0 0 0-3.1 17.9Z"/></svg><span>Your iCloud</span></div>';

  function buildA() {
    stageA.innerHTML = CLOUD + DEVS.map(devHTML).join("");
    stageA.querySelectorAll(".ctl").forEach(function (b) {
      b.addEventListener("click", function () { tapA(b.dataset.dev, b.dataset.id, false); });
    });
    DEVS.forEach(function (d) { LINES.forEach(function (L) { setDone(d, L.id, stA[d][L.id], false); }); });
  }
  function ctlEl(dev, id) { return stageA.querySelector('.ctl[data-dev="' + dev + '"][data-id="' + id + '"]'); }
  function setDone(dev, id, v, animate) {
    stA[dev][id] = v;
    var b = ctlEl(dev, id); if (!b) return;
    b.classList.toggle("no-anim-once", !animate);
    b.classList.toggle("is-ink", v);
    var L = LINES.filter(function (x) { return x.id === id; })[0];
    b.setAttribute("aria-label", L.title + " on " + DEV_NAME[dev] + ", " + (v ? "done" : "not done"));
    b.setAttribute("aria-pressed", v ? "true" : "false");
    var st = stageA.querySelector('[data-stat="' + dev + '"]');
    if (st) {
      var n = LINES.filter(function (x) { return stA[dev][x.id]; }).length;
      st.textContent = n + " done · " + (LINES.length - n) + " to go";
    }
  }
  function resetStateA() { DEVS.forEach(function (d) { stA[d] = Object.assign({}, START); }); busy = {}; }

  var forcedLayout = null;
  function layoutA() {
    var w = wrapA.clientWidth;
    var mode = forcedLayout || (w < 640 ? "narrow" : "wide");
    ["wide", "narrow", "duo"].forEach(function (c) { stageA.classList.toggle(c, c === mode); });
    var sw = mode === "wide" ? 980 : 480, sh = mode === "wide" ? 612 : mode === "narrow" ? 652 : 490;
    scaleA = Math.min(w / sw, mode === "duo" ? 1.25 : 99);
    stageA.style.transform = "scale(" + scaleA + ")";
    stageA.style.left = Math.max(0, (w - sw * scaleA) / 2) + "px";
    wrapA.style.height = Math.round(sh * scaleA) + "px";
  }
  function shown(dev) { return !stageA.classList.contains("duo") || dev === "iphone" || dev === "watch"; }
  function center(el) {
    var r = el.getBoundingClientRect(), s = stageA.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - s.left) / scaleA, y: (r.top + r.height / 2 - s.top) / scaleA };
  }
  function ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function fly(p0, p1, c, dur, done) {
    var d = document.createElement("i"); d.className = "spark"; stageA.appendChild(d);
    var t0 = null, g = genA;
    function step(t) {
      if (g !== genA) { d.remove(); return; }
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = ease(k), u = 1 - e;
      var x = u * u * p0.x + 2 * u * e * c.x + e * e * p1.x, y = u * u * p0.y + 2 * u * e * c.y + e * e * p1.y;
      d.style.transform = "translate(" + x + "px," + y + "px)";
      if (k < 1) requestAnimationFrame(step); else { d.remove(); if (done) done(); }
    }
    requestAnimationFrame(step);
  }
  function touchAt(p) {
    var t = document.createElement("i"); t.className = "touch"; t.style.left = p.x + "px"; t.style.top = p.y + "px";
    stageA.appendChild(t); setTimeout(function () { t.remove(); }, 700);
  }
  function tapA(dev, id) {
    if (busy[id]) return;
    var v = !stA[dev][id];
    setDone(dev, id, v, true);
    var others = DEVS.filter(function (d) { return d !== dev && shown(d); });
    if (still) { others.forEach(function (d) { setDone(d, id, v, true); }); return; }
    busy[id] = true;
    var cloud = RA.getElementById("cloudA"), icon = cloud.querySelector("svg");
    var p0 = center(ctlEl(dev, id)), pc = center(icon);
    later("A", 120, function () {
      fly(p0, pc, { x: p0.x, y: pc.y }, 520, function () {
        cloud.classList.remove("lit"); void cloud.offsetWidth; cloud.classList.add("lit");
        var list = others.map(function (d) { return { d: d, p: center(ctlEl(d, id)) }; })
          .sort(function (a, b) { return Math.hypot(a.p.x - p0.x, a.p.y - p0.y) - Math.hypot(b.p.x - p0.x, b.p.y - p0.y); });
        list.forEach(function (o, i) {
          later("A", 160 + i * 110, function () {
            fly(pc, o.p, { x: o.p.x, y: pc.y }, 560, function () {
              setDone(o.d, id, v, true);
              if (i === list.length - 1) { busy[id] = false; later("A", 400, function () { cloud.classList.remove("lit"); }); }
            });
          });
        });
      });
    });
  }
  function playA() {
    genA++; clearTimers("A");
    stageA.querySelectorAll(".spark, .touch").forEach(function (e) { e.remove(); });
    resetStateA(); buildA();
    if (still) { DEVS.forEach(function (d) { setDone(d, "walk", true, false); }); return; }
    later("A", 650, function () { touchAt(center(ctlEl("iphone", "walk"))); });
    later("A", 820, function () { tapA("iphone", "walk"); });
  }

  // =====================================================================
  // 2 · Plan on your own rhythm
  // =====================================================================
  var TASKS = [
    { id: "landlord", title: "Call the landlord", area: "home" },
    { id: "library", title: "Return library books", area: "growth" },
    { id: "dentist", title: "Book the dentist", area: "health" }
  ];
  var stripEl = RB.getElementById("strip"), laneEl = RB.getElementById("lane"), trayEl = RB.getElementById("tray");
  var calEl = RB.getElementById("calendar"), segEl = RB.getElementById("seg"), knob = RB.getElementById("knob");
  var planEl = RB.getElementById("plan");
  var B = { cols: 21, off: 0, n: 7, planned: false };

  function sqSVG() { return '<svg viewBox="-2 -2 26 26" aria-hidden="true"><rect class="sq" x="0" y="0" width="22" height="22" rx="6"/></svg>'; }
  function targets(n) { return [1, Math.round((n - 1) * 0.45), n - 2]; }

  function buildB() {
    B.cols = calEl.clientWidth < 560 ? 16 : 21;
    var dow = (today.getDay() - FIRST + 7) % 7;
    B.off = Math.max(0, Math.min(dow, B.cols - 15));
    var start = addDays(today, -B.off);
    stripEl.style.setProperty("--cols", B.cols); laneEl.style.setProperty("--cols", B.cols);
    var html = "", segStart = 0;
    for (var i = 0; i <= B.cols; i++) {
      var d = addDays(start, i);
      if (i === B.cols || (i > 0 && d.getDay() === FIRST)) {
        html += '<span class="band" style="left:calc(' + (segStart / B.cols * 100) + '% + 2px);width:calc(' + ((i - segStart) / B.cols * 100) + '% - 4px)"></span>';
        segStart = i;
      }
    }
    html += '<span class="bracket" id="bracket"></span>';
    for (var j = 0; j < B.cols; j++) {
      var dd = addDays(start, j);
      html += '<div class="cell' + (j === B.off ? " today" : "") + '" data-col="' + j + '"><span class="l">' + fWeekNarrow.format(dd) + '</span><span class="n">' + fDay.format(dd) + '</span><span class="mk"></span></div>';
    }
    stripEl.innerHTML = html;
    trayEl.innerHTML = TASKS.map(function (t) {
      var a = AREAS[t.area];
      return '<div class="trow" data-t="' + t.id + '"><span class="pill" style="--p:' + a.p + '">' + sqSVG() + t.title + '</span><span class="where"></span></div>';
    }).join("");
    laneEl.innerHTML = "";
    setN(B.n, false);
    if (B.planned) place(false);
  }
  function placeKnob(animate) {
    var on = segEl.querySelector('[aria-checked="true"]'); if (!on) return;
    if (!animate) knob.style.transition = "none";
    knob.style.left = on.offsetLeft + "px"; knob.style.width = on.offsetWidth + "px";
    if (!animate) { void knob.offsetWidth; knob.style.transition = ""; }
  }
  function setN(n, animate) {
    B.n = n;
    segEl.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-checked", +b.dataset.n === n ? "true" : "false"); });
    placeKnob(animate);
    var br = RB.getElementById("bracket");
    if (!animate) br.style.transition = "none";
    br.style.left = "calc(" + (B.off / B.cols * 100) + "% + 1px)";
    br.style.width = "calc(" + (n / B.cols * 100) + "% - 2px)";
    if (!animate) { void br.offsetWidth; br.style.transition = ""; }
    var first = today, last = addDays(today, n - 1);
    var pl = RB.getElementById("plabel");
    var label = range(first, last) + " · " + n + " days";
    if (animate && !still) { pl.style.opacity = 0; later("B", 170, function () { pl.textContent = label; pl.style.opacity = 1; }); }
    else pl.textContent = label;
    pl.style.marginLeft = (B.off / B.cols * 100) + "%";
    RB.getElementById("askT").textContent = "Plan your next " + n + " days?";
    RB.getElementById("askS").textContent = range(first, last);
    var after = new Date(last); after.setHours(18, 0, 0, 0);
    RB.getElementById("doneT").textContent = "Planned through " + fWeekShort.format(last);
    RB.getElementById("doneS").textContent = "Next: " + fWeekShort.format(last) + " " + fTime.format(after) + ", for " + range(addDays(today, n), addDays(today, 2 * n - 1));
  }
  function place(animate) {
    B.planned = true;
    var ts = targets(B.n);
    TASKS.forEach(function (t, i) {
      var go = function () {
        var a = AREAS[t.area], col = B.off + ts[i];
        var cell = stripEl.querySelector('.cell[data-col="' + col + '"]');
        var chip = document.createElement("span");
        chip.className = "pill"; chip.dataset.t = t.id; chip.style.setProperty("--p", a.p);
        chip.innerHTML = sqSVG() + t.title;
        chip.style.gridRow = String(i + 1);
        if (col > B.cols * 0.6) { chip.style.gridColumn = "1 / " + (col + 2); chip.style.justifySelf = "end"; }
        else { chip.style.gridColumn = (col + 1) + " / span 1"; chip.style.justifySelf = "start"; }
        laneEl.appendChild(chip);
        var row = trayEl.querySelector('[data-t="' + t.id + '"]'), from = row.querySelector(".pill"), where = row.querySelector(".where");
        var day = addDays(today, ts[i]);
        var done = function () {
          cell.querySelector(".mk").style.setProperty("--m", a.m);
          cell.querySelector(".mk").classList.add("on");
          where.textContent = "On " + fWeekShort.format(day) + " " + fDay.format(day);
          where.classList.add("on");
          from.classList.remove("gone"); from.classList.add("placed");
        };
        if (animate && !still) {
          var r0 = from.getBoundingClientRect(), r1 = chip.getBoundingClientRect();
          chip.style.transform = "translate(" + (r0.left - r1.left) + "px," + (r0.top - r1.top) + "px)";
          from.classList.add("gone");
          void chip.offsetWidth;
          chip.classList.add("fly"); chip.style.transform = "";
          later("B", 690, done);
        } else { from.classList.add("gone"); done(); }
      };
      if (animate && !still) later("B", i * 230, go); else go();
    });
    var showDone = function () { planEl.classList.add("is-done"); };
    if (animate && !still) later("B", 3 * 230 + 760, showDone); else showDone();
  }
  function unplace() {
    B.planned = false;
    laneEl.innerHTML = "";
    stripEl.querySelectorAll(".mk").forEach(function (m) { m.classList.remove("on"); });
    trayEl.querySelectorAll(".pill").forEach(function (p) { p.classList.remove("gone", "placed"); });
    trayEl.querySelectorAll(".where").forEach(function (w) { w.classList.remove("on"); w.textContent = ""; });
    planEl.classList.remove("is-done");
  }
  function press(el) { if (still) return; el.classList.add("press"); later("B", 150, function () { el.classList.remove("press"); }); }
  segEl.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-n]"); if (!b) return;
    clearTimers("B"); if (B.planned) unplace();
    setN(+b.dataset.n, true);
  });
  RB.getElementById("start").addEventListener("click", function () { if (!B.planned) { clearTimers("B"); place(true); } });
  RB.getElementById("unplan").addEventListener("click", function () { clearTimers("B"); unplace(); });
  function playB() {
    clearTimers("B");
    B.n = 7; B.planned = false; unplace(); buildB();
    if (still) { setN(10, false); place(false); return; }
    later("B", 650, function () { var b = segEl.querySelector('[data-n="10"]'); press(b); setN(10, true); });
    later("B", 1900, function () { var s = RB.getElementById("start"); press(s); });
    later("B", 2080, function () { place(true); });
  }

  // =====================================================================
  // Page
  // =====================================================================
  RA.getElementById("replayA").addEventListener("click", playA);
  RB.getElementById("replayB").addEventListener("click", playB);
  resetStateA(); layoutA(); buildA();
  buildB();
  var lastCols = B.cols;
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () { layoutA(); }).observe(wrapA);
    new ResizeObserver(function () {
      var cols = calEl.clientWidth < 560 ? 16 : 21;
      if (cols !== lastCols) { lastCols = cols; clearTimers("B"); buildB(); } else placeKnob(false);
    }).observe(calEl);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeKnob(false); });

  // The Watch section: one watch, larger, ticked on its own.
  if (RW) {
    var ws = RW.getElementById("watchOnly");
    ws.innerHTML = '<div class="dev watch solo"><div class="band t"></div><div class="band b"></div><div class="body"><div class="scr"><div class="whead"><b>Today</b><span>1:30</span></div>' +
      LINES.map(function (L) { return rowHTML("watch", L); }).join("") + '</div></div><div class="crown"></div></div>';
    ws.querySelectorAll(".ctl").forEach(function (b) {
      var L = LINES.filter(function (x) { return x.id === b.dataset.id; })[0];
      function paint(v, anim) { b.classList.toggle("no-anim-once", !anim); b.classList.toggle("is-ink", v); b.setAttribute("aria-pressed", v ? "true" : "false"); b.setAttribute("aria-label", L.title + " on Apple Watch, " + (v ? "done" : "not done")); }
      paint(START[b.dataset.id], false);
      b.addEventListener("click", function () { paint(!b.classList.contains("is-ink"), true); });
    });
  }
  onView(RA.getElementById("wrapA"), playA);
  onView(RB.getElementById("planner"), playB);
})();
