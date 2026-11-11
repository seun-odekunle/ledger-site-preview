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

  function onView(el, fn, th) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { threshold: th || 0.5 });
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
  // Mac, iPad and iPhone at true relative scale; the Watch has its own section below.
  var DEVS = ["mac", "ipad", "iphone"];
  var DEV_NAME = { mac: "Mac", ipad: "iPad", iphone: "iPhone", watch: "Apple Watch" };
  var stageA = RA.getElementById("stageA"), wrapA = RA.getElementById("wrapA");
  var scaleA = 1, stA = {}, busy = {}, genA = 0, modeA = null;
  // Where each device's line meets the cloud, in stage pixels (see the layout in motion.css). Drawn device -> cloud.
  var LINKS = {
    wide: { mac: "M502,400 V546", ipad: "M450,563 H478", iphone: "M553,563 H526" },
    narrow: { ipad: "M104,57 V22 H136", iphone: "M277,173 V22 H184" }
  };
  var SIZE = { wide: [700, 729], narrow: [320, 352] };
  var ICONS = '<span class="ic"><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
    '<svg viewBox="0 0 16 12"><path d="M8 11.6 5.6 9.1a3.4 3.4 0 0 1 4.8 0L8 11.6Zm-4.3-4.4L2.1 5.6a8.4 8.4 0 0 1 11.8 0l-1.6 1.6a6.1 6.1 0 0 0-8.6 0ZM0 3.5a11.4 11.4 0 0 1 16 0l-1.6 1.6a9.1 9.1 0 0 0-12.8 0Z"/></svg>' +
    '<svg viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="19" height="9" rx="2.2"/><path d="M24.5 4.3v4.4c.9-.3 1.5-1.2 1.5-2.2s-.6-1.9-1.5-2.2Z" fill-opacity=".45"/></svg></span>';
  function sbHTML(time) { return '<div class="sb" aria-hidden="true"><span>' + time + "</span>" + ICONS + "</div>"; }

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
  var NAVS = '<div class="nav on">Today</div><div class="nav">Plan</div><div class="nav">Journal</div><div class="nav">Insights</div>';
  function devHTML(dev) {
    if (dev === "mac") return '<div class="dev mac"><div class="scr"><div class="menubar"><b>Ledger</b><span>File</span><span>Edit</span><span>View</span><span>Window</span><span class="clk">Wed 1:30 PM</span></div>' +
      '<div class="win"><div class="side"><div class="lights"><i></i><i></i><i></i></div>' + NAVS + '</div><div class="main">' + todayHTML(dev) + "</div></div></div></div>";
    if (dev === "ipad" && modeA === "wide") return '<div class="dev ipad land"><div class="scr">' + sbHTML("1:30") +
      '<div class="win"><div class="side">' + NAVS + '</div><div class="main">' + todayHTML(dev) + "</div></div></div></div>";
    if (dev === "ipad") return '<div class="dev ipad port"><div class="scr">' + sbHTML("1:30") + '<div class="tabpill"><span class="on">Today</span><span>Plan</span><span>Journal</span><span>Insights</span></div>' + todayHTML(dev) + "</div></div>";
    return '<div class="dev iphone"><div class="scr">' + sbHTML("1:30") + todayHTML(dev) +
      '<div class="tabbar"><span class="on">Today</span><span>Plan</span><span>Journal</span><span>Insights</span></div></div></div>';
  }
  var CLOUD = '<div class="cloud" id="cloudA"><svg viewBox="0 0 48 32" aria-hidden="true"><path d="M13.5 27.5h22a7.6 7.6 0 0 0 1-15.1A10.6 10.6 0 0 0 16.6 9.6a8.9 8.9 0 0 0-3.1 17.9Z"/></svg><span>Your iCloud</span></div>';
  function linksHTML() {
    var L = LINKS[modeA], sz = SIZE[modeA], out = "";
    Object.keys(L).forEach(function (d) { out += '<path class="base" d="' + L[d] + '"/><path class="pulse" data-dev="' + d + '" d="' + L[d] + '"/>'; });
    return '<svg class="links" width="' + sz[0] + '" height="' + sz[1] + '" aria-hidden="true">' + out + "</svg>";
  }

  function buildA() {
    stageA.innerHTML = linksHTML() + CLOUD + DEVS.filter(shown).map(devHTML).join("");
    stageA.querySelectorAll(".ctl").forEach(function (b) {
      b.addEventListener("click", function () { tapA(b.dataset.dev, b.dataset.id); });
    });
    DEVS.filter(shown).forEach(function (d) { LINES.forEach(function (L) { setDone(d, L.id, stA[d][L.id], false); }); });
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

  function layoutA() {
    var w = wrapA.clientWidth;
    var mode = w < 560 ? "narrow" : "wide";
    if (mode !== modeA) {
      modeA = mode;
      ["wide", "narrow"].forEach(function (c) { stageA.classList.toggle(c, c === mode); });
      genA++; clearTimers("A"); busy = {}; buildA();
    }
    var sz = SIZE[mode];
    scaleA = Math.min(w / sz[0], 1);
    stageA.style.transform = "scale(" + scaleA + ")";
    stageA.style.left = Math.max(0, (w - sz[0] * scaleA) / 2) + "px";
    wrapA.style.height = Math.round(sz[1] * scaleA) + "px";
  }
  function shown(dev) { return modeA !== "narrow" || dev !== "mac"; }
  // A short bright dash runs along a device's line: "up" from the device to the cloud, "down" back to a device.
  function pulse(dev, dir, dur, done) {
    var p = stageA.querySelector('.links .pulse[data-dev="' + dev + '"]'), g = genA;
    if (!p) { if (done) done(); return; }
    var len = p.getTotalLength(), seg = Math.min(16, len * 0.6);
    p.style.strokeDasharray = seg + " " + (len + seg);
    var from = dir === "up" ? seg : -len, to = dir === "up" ? -len : seg;
    p.style.opacity = 1;
    var anim = p.animate([{ strokeDashoffset: from }, { strokeDashoffset: to }], { duration: dur, easing: "ease-in-out", fill: "forwards" });
    anim.onfinish = function () { p.style.opacity = 0; anim.cancel(); if (g === genA && done) done(); };
  }
  function pressRow(dev, id) {
    var b = ctlEl(dev, id), row = b && b.closest(".row"); if (!row) return;
    row.classList.add("press"); later("A", 220, function () { row.classList.remove("press"); });
  }
  function tapA(dev, id) {
    if (busy[id]) return;
    var v = !stA[dev][id];
    setDone(dev, id, v, true);
    var others = DEVS.filter(function (d) { return d !== dev && shown(d); });
    if (still || !p_ok()) { others.forEach(function (d) { setDone(d, id, v, true); }); return; }
    busy[id] = true;
    var cloud = RA.getElementById("cloudA");
    later("A", 120, function () {
      pulse(dev, "up", 480, function () {
        cloud.classList.remove("lit"); void cloud.offsetWidth; cloud.classList.add("lit");
        others.forEach(function (d, i) {
          later("A", 120 + i * 140, function () {
            pulse(d, "down", 480, function () {
              setDone(d, id, v, true);
              if (i === others.length - 1) { busy[id] = false; later("A", 400, function () { cloud.classList.remove("lit"); }); }
            });
          });
        });
      });
    });
  }
  function p_ok() { return typeof Element.prototype.animate === "function"; }
  function playA() {
    genA++; clearTimers("A");
    resetStateA(); buildA();
    if (still) { DEVS.forEach(function (d) { setDone(d, "walk", true, false); }); return; }
    later("A", 700, function () { pressRow("iphone", "walk"); });
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
  resetStateA(); layoutA();
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
    ws.innerHTML = '<div class="dev watch solo"><div class="scr"><div class="whead"><b>Today</b><span>1:30</span></div>' +
      LINES.map(function (L) { return rowHTML("watch", L); }).join("") + "</div></div>";
    ws.querySelectorAll(".ctl").forEach(function (b) {
      var L = LINES.filter(function (x) { return x.id === b.dataset.id; })[0];
      function paint(v, anim) { b.classList.toggle("no-anim-once", !anim); b.classList.toggle("is-ink", v); b.setAttribute("aria-pressed", v ? "true" : "false"); b.setAttribute("aria-label", L.title + " on Apple Watch, " + (v ? "done" : "not done")); }
      paint(START[b.dataset.id], false);
      b.addEventListener("click", function () { paint(!b.classList.contains("is-ink"), true); });
    });
  }
  onView(RA.getElementById("wrapA"), playA, 0.3);
  onView(RB.getElementById("planner"), playB);
})();
