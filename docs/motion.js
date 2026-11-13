// keepingledger.com: the devices in step, and the Watch. Mounted into shadow roots from the templates in index.html.
// The devices scene replays while it is on screen; less motion shows the finished state.
(function () {
  "use strict";
  function mount(id, tpl) {
    var host = document.getElementById(id), t = document.getElementById(tpl);
    if (!host || !t || !host.attachShadow) return null;
    var r = host.attachShadow({ mode: "open" }); r.appendChild(t.content.cloneNode(true)); return r;
  }
  var RA = mount("moA", "tpl-a"), RW = mount("moW", "tpl-w");
  if (!RA) return;
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

  var timers = { A: [] };
  function later(k, ms, fn) { var t = setTimeout(fn, ms); timers[k].push(t); return t; }
  function clearTimers(k) { timers[k].forEach(clearTimeout); timers[k] = []; }

  // A scene plays when enough of it is on screen, and then again every `every` ms while it stays there. `part` returns
  // the element to watch each time it is asked, because a scene is rebuilt when the window changes size. These scenes
  // can also be used by hand: once a visitor touches one (any element in `touch`), it stops replaying and is theirs. With Reduce
  // Motion it shows its finished state once.
  function seen(el, share) {
    if (!el) return false;
    var r = el.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
    return r.height > 0 && Math.min(r.bottom, vh) - Math.max(r.top, 0) >= r.height * share;
  }
  function loop(part, share, play, every, touch) {
    if (still) { play(); return; }
    var last = -Infinity, theirs = false;
    setInterval(function () {
      if (theirs || document.hidden || !seen(part(), share)) return;
      var now = performance.now();
      if (now - last >= every) { last = now; play(); }
    }, 350);
    (touch || []).forEach(function (el) { if (el) el.addEventListener("pointerdown", function () { theirs = true; }); });
  }

  var AREAS = {
    health: { name: "Health", m: "var(--fern)", p: "var(--fern-p)", icon: '<path d="M6 10.4C2.3 8 1.1 6.2 1.1 4.4 1.1 2.9 2.3 1.7 3.7 1.7c1 0 1.8.5 2.3 1.3.5-.8 1.3-1.3 2.3-1.3 1.4 0 2.6 1.2 2.6 2.7 0 1.8-1.2 3.6-4.9 6Z"/>' },
    home: { name: "Home", m: "var(--berry)", p: "var(--berry-p)", icon: '<path d="M1.4 5.8 6 1.8l4.6 4M2.7 4.8v5.6h6.6V4.8M5 10.4V7.5h2v2.9"/>' },
    growth: { name: "Growth", m: "var(--iris)", p: "var(--iris-p)", icon: '<path d="M2.2 10.2c-.3-4.6 2.6-8 8.4-8.4.3 5.6-3 8.6-8.4 8.4Zm0 0 5-5"/>' }
  };
  // The line control, every layer in one SVG: dashed outline (open), ring (an amount on its way), fill and check (done).
  function ctlSVG(shape) {
    var s = shape === "task"
      ? '<rect class="pen" x="0" y="0" width="22" height="22" rx="6"/><rect class="fil" x="0" y="0" width="22" height="22" rx="6"/>'
      : '<circle class="pen" cx="11" cy="11" r="11"/><circle class="trk" cx="11" cy="11" r="11"/><circle class="arc" cx="11" cy="11" r="11" transform="rotate(-90 11 11)"/><circle class="fil" cx="11" cy="11" r="11"/>';
    return '<svg viewBox="-2 -2 26 26" aria-hidden="true">' + s + '<path class="chk" pathLength="1" d="M6.6 11.3 9.7 14.4 15.4 7.9"/></svg>';
  }
  function moodSVG() {
    return '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="11" cy="11" r="10.2" stroke-width="1.65" stroke-dasharray="3.1 2.2"/><path d="M5.5 11.9 Q11 11.9 16.5 11.9" stroke-width="1.9" stroke-linecap="round"/></svg>';
  }
  function areaIcon(area) { return '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + AREAS[area].icon + "</svg>"; }
  var DUE = '<span class="due"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="6" cy="6" r="5.2"/><path d="M6 3.3v3.2" stroke-linecap="round"/><circle cx="6" cy="8.6" r=".4" fill="currentColor"/></svg>Due</span>';
  function timeHTML(t) { var m = /^(\d+:\d+) ([AP]M)$/.exec(t); return m ? m[1] + "<small>" + m[2] + "</small>" : t; }
  function minutes(t) { if (t === "any") return -2; if (t === "all day") return -1; var m = /^(\d+):(\d+) ([AP]M)$/.exec(t); return (+m[1] % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2]; }

  // =====================================================================
  // 1 · Every device, kept in step
  // =====================================================================
  // The hero's day (home.js), Sam's page at 1:30 PM, drawn the way each app draws Today now: the iPhone's header,
  // week strip and floating tab bar; the iPad's sidebar, month and Coming up; the Mac's menu bar, sidebar and page.
  // Done lines sit above the Now line in the order they happened; open lines below, up next first (TodayScreen).
  var LINES = [
    { id: "run", kind: "habit", area: "health", time: "7:00 AM", title: "Morning run", sub: "2 of 3 this week", tap: true },
    { id: "note", kind: "note", time: "8:40 AM", title: "Coffee on the balcony. Clear head." },
    { id: "rent", kind: "task", area: "home", time: "any", title: "Pay rent", sub: "due today", due: true, tap: true },
    { id: "water", kind: "habit", area: "health", time: "all day", title: "Drink water", sub: "24 of 70 oz", ring: 24 / 70, chip: "+8 oz" },
    { id: "walk", kind: "habit", area: "growth", time: "2:00 PM", title: "Walk after lunch", sub: "daily", tap: true },
    { id: "ada", kind: "event", time: "3:00 PM", title: "Coffee with Ada", sub: "Personal" },
    { id: "phone", kind: "habit", area: "health", time: "10:00 PM", title: "No phone after 10pm", sub: "clean so far", hold: true }
  ];
  function lineById(id) { return LINES.filter(function (x) { return x.id === id; })[0]; }
  var TAPS = LINES.filter(function (L) { return L.tap; }).map(function (L) { return L.id; });
  var START = { run: 1 };   // done, and when (its order above the Now line); the note sits at 2
  // Mac, iPad and iPhone at true relative scale, joined to the cloud by lines. The Watch stands beside them in its own
  // shadow root (W, below): it has no line drawn, but a line marked on any of the four is marked on the other three.
  var DEVS = ["mac", "ipad", "iphone"];
  var DEV_NAME = { mac: "Mac", ipad: "iPad", iphone: "iPhone", watch: "Apple Watch" };
  var stageA = RA.getElementById("stageA"), wrapA = RA.getElementById("wrapA");
  var scaleA = 1, stA = {}, busy = {}, genA = 0, modeA = null, seqA = 3, W = null;
  // Where each device's line meets the cloud, in stage pixels (see the layout in motion.css). Drawn device -> cloud.
  var LINKS = {
    wide: { mac: "M502,400 V546", ipad: "M450,563 H478", iphone: "M553,563 H526" },
    narrow: { ipad: "M100,335 V396", iphone: "M202,413 H126" }
  };
  var SIZE = { wide: [700, 729], narrow: [300, 548] };
  var SIG = '<svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>';
  var WIFI = '<svg viewBox="0 0 16 12"><path d="M8 11.6 5.6 9.1a3.4 3.4 0 0 1 4.8 0L8 11.6Zm-4.3-4.4L2.1 5.6a8.4 8.4 0 0 1 11.8 0l-1.6 1.6a6.1 6.1 0 0 0-8.6 0ZM0 3.5a11.4 11.4 0 0 1 16 0l-1.6 1.6a9.1 9.1 0 0 0-12.8 0Z"/></svg>';
  var BATT = '<svg viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="19" height="9" rx="2.2"/><path d="M24.5 4.3v4.4c.9-.3 1.5-1.2 1.5-2.2s-.6-1.9-1.5-2.2Z" fill-opacity=".45"/></svg>';
  var SEARCH = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="8.6" cy="8.6" r="6.1"/><path d="m13.2 13.2 4.6 4.6"/></svg>';
  var PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 4.5v15M4.5 12h15"/></svg>';
  var CHEV = '<svg viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 1.8 4.5 4.4 4.5-4.4"/></svg>';
  var SIDEBAR = '<svg viewBox="0 0 22 18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1" y="1" width="20" height="16" rx="3.5"/><path d="M8 1v16"/></svg>';
  var NAV_ICONS = {
    Today: '<svg viewBox="0 0 24 24"><path d="M6.5 2.5h7.2l5 5v12a2 2 0 0 1-2 2h-10.2a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.3 12.2h7.4M8.3 15.4h7.4M8.3 18.6h4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    TodayOn: '<svg viewBox="0 0 24 24"><path d="M6.5 2.5h7.2l5 5v12a2 2 0 0 1-2 2h-10.2a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M8.3 12.2h7.4M8.3 15.4h7.4M8.3 18.6h4.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>',
    Plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.2h18"/><g fill="currentColor" stroke="none"><circle cx="8" cy="13" r="1.1"/><circle cx="12" cy="13" r="1.1"/><circle cx="16" cy="13" r="1.1"/><circle cx="8" cy="16.8" r="1.1"/><circle cx="12" cy="16.8" r="1.1"/></g></svg>',
    Journal: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 5.2c2.9-1.3 6.1-1.2 8.7.4v14.3c-2.6-1.5-5.8-1.6-8.7-.4V5.2Zm19 0c-2.9-1.3-6.1-1.2-8.7.4v14.3c2.6-1.5 5.8-1.6 8.7-.4V5.2Z"/></svg>',
    Insights: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="11" width="3.4" height="8" rx="1"/><rect x="8.9" y="6" width="3.4" height="13" rx="1"/><rect x="13.8" y="9" width="3.4" height="10" rx="1"/><rect x="18.6" y="4" width="3.4" height="15" rx="1"/><rect x="2.5" y="20.2" width="20" height="1.6" rx=".8"/></svg>'
  };
  var SECTIONS = ["Today", "Plan", "Journal", "Insights"];
  function sbHTML(left, cell) { return '<div class="sb" aria-hidden="true"><span>' + left + '</span><span class="ic">' + (cell ? SIG : "") + WIFI + BATT + "</span></div>"; }
  var fMonth = new Intl.DateTimeFormat(LANG, { month: "long" });
  var fWDMD = new Intl.DateTimeFormat(LANG, { weekday: "long", month: "short", day: "numeric" });
  var fMacClock = new Intl.DateTimeFormat(LANG, { weekday: "short", month: "short", day: "numeric" });
  var dayName = fWeekLong.format(today);

  // ----- a day's bar (DayBar.swift): how full its page is, in its Areas' colours as lines get done, gray for the rest -----
  var PAST = [["--fern", "--fern", "--iris", "--berry"], ["--fern", "--iris", "--iris"], ["--fern", "--berry", "--fern", "--iris", "--fern"],
    ["--iris", "--fern"], ["--fern", "--fern", "--berry", "--iris"], ["--berry", "--fern", "--iris"], ["--fern", "--iris", "--fern", "--fern"]];
  function barHTML(done, open) {
    var total = done.length + open;
    if (!total) return '<i class="bar"></i>';
    var w = (10 + Math.min(total, 12) / 12 * 24) / 17, stops = [], parts = [];
    done.forEach(function (c) { var p = parts.filter(function (x) { return x.c === c; })[0]; if (p) p.n++; else parts.push({ c: c, n: 1 }); });
    var share = done.length / total, at = 0;
    parts.forEach(function (p) { var s = p.n / done.length * share; stops.push("var(" + p.c + ") " + ((at + s / 2) * 100).toFixed(1) + "%"); at += s; });
    var bg;
    if (!done.length) bg = "var(--a-label3)";
    else {
      if (open) { stops.push("var(" + parts[parts.length - 1].c + ") " + (Math.max(at - 0.02, 0) * 100).toFixed(1) + "%", "var(--a-label3) " + (Math.min(at + 0.02, 1) * 100).toFixed(1) + "%"); }
      bg = stops.length > 1 ? "linear-gradient(90deg," + stops.join(",") + ")" : stops[0].split(" ")[0];
    }
    return '<i class="bar" style="width:' + w.toFixed(3) + "em;background:" + bg + '"></i>';
  }
  function dayBar(offset, dev) {
    if (offset === 0) return '<span class="tbar" data-bar="' + dev + '">' + todayBar(dev) + "</span>";
    if (offset < 0) return barHTML(PAST[(offset % 7 + 7) % 7], 0);
    return offset <= 14 ? barHTML([], [3, 4, 3, 4, 3, 3, 4][offset % 7]) : '<i class="bar"></i>';
  }
  function todayBar(dev) {
    var st = stA[dev], counts = LINES.filter(function (L) { return L.kind === "habit" || L.kind === "task"; });
    var done = counts.filter(function (L) { return st[L.id]; }).sort(function (a, b) { return st[a.id] - st[b.id]; }).map(function (L) { return AREAS[L.area].m.slice(4, -1); });
    return barHTML(done, counts.length - done.length);
  }

  // ----- the page card -----
  function lineHTML(dev, L) {
    var area = L.area ? AREAS[L.area] : null, slot = "", sub = "", acc = "";
    var vars = area ? ' style="--m:' + area.m + ";--p:" + area.p + '"' : "";
    if (L.kind === "habit" || L.kind === "task") {
      var cls = "ctl" + (L.ring ? " is-ring" : " is-pen");
      var arc = L.ring ? ' style="--arc:' + (L.ring * 69.115).toFixed(2) + '"' : "";
      slot = L.tap
        ? '<button type="button" class="' + cls + '" data-dev="' + dev + '" data-id="' + L.id + '"' + arc + ">" + ctlSVG(L.kind === "task" ? "task" : "circle") + "</button>"
        : '<span class="' + cls + '"' + arc + ">" + ctlSVG("circle") + "</span>";
    } else if (L.kind === "note") slot = '<span class="ctl"><span class="dash">—</span></span>';
    if (L.sub) sub = (area ? areaIcon(L.area) + "<span>" + area.name + " · " : "<span>") + L.sub + "</span>";
    if (L.due) acc = DUE;
    if (L.chip) acc = '<span class="chip">' + L.chip + "</span>";
    var strip = area ? area.m : L.kind === "event" ? "var(--a-cal)" : "var(--a-label4)";
    return '<div class="ln' + (L.kind === "note" ? " note compact" : "") + '" data-k="' + L.id + '"' + vars + '><span class="lstrip" style="--s:' + strip + '"></span>' +
      '<span class="tm">' + timeHTML(L.time) + '</span><span class="slot">' + slot + '</span><span class="tt"><span class="ti">' + L.title +
      '</span><span class="sub">' + sub + '</span></span><span class="acc">' + acc + "</span></div>";
  }
  function orderA(st) {
    var done = LINES.filter(function (L) { return st[L.id] || L.kind === "note"; })
      .sort(function (a, b) { return (st[a.id] || 2) - (st[b.id] || 2); }).map(function (L) { return L.id; });
    var open = LINES.filter(function (L) { return !st[L.id] && L.kind !== "note"; })
      .sort(function (a, b) { return minutes(a.time) - minutes(b.time) || a.title.localeCompare(b.title); }).map(function (L) { return L.id; });
    return done.concat(["now"], open);
  }
  function statusText(st) {
    var n = 0, go = 0;
    LINES.forEach(function (L) { if (L.kind === "habit" || L.kind === "task") { if (st[L.id]) n++; else go++; } });
    return "1:30 PM · " + n + " done" + (go ? ", " + go + " to go." : ".");
  }
  function pageHTML(dev, large) {
    var head = large
      ? '<div class="ttl">' + fWDMD.format(today).replace(/^(\w+) /, "$1, ") + '</div><div class="greet">Afternoon, Sam</div>'
      : '<div class="greet">Afternoon, Sam</div><div class="titlerow"><div class="ttl">' + dayName + '<span class="chev">' + CHEV + "</span></div>" +
        '<div class="hctl"><span class="gl">' + SEARCH + '</span><span class="gl av"><b>S</b></span></div></div>';
    var week = "";
    if (!large) {
      var off = (today.getDay() - FIRST + 7) % 7;
      for (var i = 0; i < 7; i++) {
        var d = addDays(today, i - off);
        week += '<span class="wd' + (i === off ? " sel" : "") + '"><span class="l">' + fWeekNarrow.format(d) + '</span><span class="n">' + fDay.format(d) + "</span>" + dayBar(i - off, dev) + "</span>";
      }
      week = '<div class="week">' + week + "</div>";
    }
    return '<div class="head">' + head + '<div class="stat" data-stat="' + dev + '"></div>' + week + "</div>" +
      '<div class="seclabel">' + dayName + "’s page</div>" +
      '<div class="card" data-card="' + dev + '">' + LINES.map(function (L) { return lineHTML(dev, L); }).join("") + '<div class="now" data-k="now">Now · 1:30 PM</div></div>';
  }
  function monthHTML(dev) {
    var first = new Date(today.getFullYear(), today.getMonth(), 1, 12);
    var start = addDays(first, -((first.getDay() - FIRST + 7) % 7)), cells = "";
    var head = "";
    for (var h = 0; h < 7; h++) head += "<span>" + fWeekNarrow.format(addDays(start, h)) + "</span>";
    // Only the month's own days; the rest of its first and last weeks stay blank (TodayLarge's month).
    for (var k = 0; k < 42; k++) {
      var d = addDays(start, k);
      if (k % 7 === 0 && k > 0 && d.getMonth() !== today.getMonth()) break;
      var offset = Math.round((d - today) / 864e5);
      cells += d.getMonth() !== today.getMonth() ? '<span class="md"></span>'
        : '<span class="md' + (offset === 0 ? " sel" : "") + '"><span class="n">' + fDay.format(d) + "</span>" + dayBar(offset, dev) + "</span>";
    }
    return '<div class="month"><div class="mh"><b>' + fMonth.format(today) + '</b><span class="arrows">‹&#8195;›</span></div><div class="mgrid">' + head + cells + "</div></div>";
  }
  function comingHTML() {
    function day(label, ids) {
      return '<div class="cday"><div class="cl">' + label + "</div>" + ids.map(function (id) {
        var L = lineById(id); return '<div class="cline" style="--s:' + AREAS[L.area].m + '">' + L.title.replace(/^Drink water$/, "Drink water") + "</div>";
      }).join("") + "</div>";
    }
    var t1 = addDays(today, 1), t2 = addDays(today, 2);
    return '<div class="coming"><div class="ch">Coming up</div><div class="clist">' +
      day("Tomorrow · " + fWeekShort.format(t1) + " " + fDay.format(t1), ["water", "phone", "walk"]) +
      day(fWeekShort.format(t2) + " " + fDay.format(t2), ["water", "run", "phone", "walk"]) + "</div></div>";
  }
  function navHTML(mac) {
    return SECTIONS.map(function (s, i) {
      return '<div class="nav' + (i ? "" : " on") + '"><span class="ni">' + NAV_ICONS[s] + "</span><span>" + s + "</span>" + (mac ? '<span class="kb">⌘' + (i + 1) + "</span>" : "") + "</div>";
    }).join("");
  }
  function tabsHTML() {
    return SECTIONS.map(function (s, i) { return '<span class="tab' + (i ? "" : " on") + '">' + NAV_ICONS[i ? s : "TodayOn"] + s + "</span>"; }).join("");
  }
  function devHTML(dev) {
    if (dev === "mac") return '<div class="dev mac"><div class="scr"><div class="menubar"><b>Ledger</b><span>File</span><span>Edit</span><span>View</span><span>Line</span><span>Go</span><span>Window</span><span>Help</span>' +
      '<span class="mic">' + WIFI + BATT + '</span><span class="clk">' + fMacClock.format(today).replace(",", "") + "&#8194;1:30 PM</span></div>" +
      '<div class="win"><div class="side"><div class="lights"><i></i><i></i><i></i></div><div class="find"><span class="fld">' + SEARCH + 'Search</span><span class="add">' + PLUS + "</span></div>" +
      navHTML(true) + monthHTML(dev) + comingHTML() + '<div class="me"><span class="av"><b>S</b></span><span><b>Sam</b><small>Settings ⌘,</small></span></div></div>' +
      '<div class="main">' + pageHTML(dev, true) + "</div></div></div></div>";
    if (dev === "ipad" && modeA === "wide") return '<div class="dev ipad land"><div class="scr">' + sbHTML("1:30 PM&#8194;" + fMacClock.format(today).replace(",", ""), false) +
      '<div class="win"><div class="side"><span class="gl tog">' + SIDEBAR + "</span>" + navHTML(false) + monthHTML(dev) + comingHTML() + "</div>" +
      '<div class="main"><div class="hctl"><span class="gl">' + SEARCH + '</span><span class="gl av"><b>S</b></span></div>' + pageHTML(dev, true) +
      '<span class="fab">' + PLUS + "</span></div></div></div></div>";
    if (dev === "ipad") return '<div class="dev ipad port"><div class="scr">' + sbHTML("1:30 PM&#8194;" + fMacClock.format(today).replace(",", ""), false) +
      '<div class="topbar"><span class="gl tog">' + SIDEBAR + '</span><span class="tabpill gl">' + SECTIONS.map(function (s, i) { return '<span class="' + (i ? "" : "on") + '">' + s + "</span>"; }).join("") +
      '</span><span class="hctl"><span class="gl">' + SEARCH + '</span><span class="gl av"><b>S</b></span></span></div><div class="main">' + pageHTML(dev, true) + '</div><span class="fab">' + PLUS + "</span></div></div>";
    return '<div class="dev iphone"><div class="scr">' + sbHTML("1:30", true) + '<div class="main">' + pageHTML(dev, false) + "</div>" +
      '<div class="tabbar"><div class="tabs gl">' + tabsHTML() + '</div><span class="plus gl">' + PLUS + "</span></div></div></div>";
  }
  var CLOUD = '<div class="cloud" id="cloudA"><svg viewBox="0 0 48 32" aria-hidden="true"><path d="M13.5 27.5h22a7.6 7.6 0 0 0 1-15.1A10.6 10.6 0 0 0 16.6 9.6a8.9 8.9 0 0 0-3.1 17.9Z"/></svg><span>Your iCloud</span></div>';
  function linksHTML() {
    var L = LINKS[modeA], sz = SIZE[modeA], out = "";
    Object.keys(L).forEach(function (d) { out += '<path class="base" d="' + L[d] + '"/><path class="pulse" data-dev="' + d + '" d="' + L[d] + '"/>'; });
    return '<svg class="links" width="' + sz[0] + '" height="' + sz[1] + '" aria-hidden="true">' + out + "</svg>";
  }

  function buildA() {
    stageA.innerHTML = linksHTML() + CLOUD + DEVS.filter(shown).map(devHTML).join("");
    stageA.querySelectorAll("button.ctl").forEach(function (b) {
      b.addEventListener("click", function () { tapA(b.dataset.dev, b.dataset.id); });
    });
    DEVS.filter(shown).forEach(function (d) { paintA(d, false); });
  }
  function ctlEl(dev, id) { return stageA.querySelector('.ctl[data-dev="' + dev + '"][data-id="' + id + '"]'); }
  // Draws one device's page from its state; with `animate`, lines glide to their new places (FLIP).
  function paintA(dev, animate) {
    var st = stA[dev], card = stageA.querySelector('[data-card="' + dev + '"]'); if (!card) return;
    var before = {};
    if (animate && !still) Array.prototype.forEach.call(card.children, function (el) { before[el.dataset.k] = el.getBoundingClientRect().top; });
    var keys = orderA(st);
    keys.forEach(function (k, i) {
      var el = card.querySelector('[data-k="' + k + '"]');
      if (card.children[i] !== el) card.insertBefore(el, card.children[i] || null);
      el.classList.toggle("nosep", keys[i + 1] === "now" || i === keys.length - 1);
      var L = lineById(k); if (!L || !L.tap) return;
      var v = !!st[k], b = el.querySelector(".ctl");
      el.classList.toggle("ink", v); el.classList.toggle("compact", v);
      b.classList.toggle("no-anim-once", !animate);
      b.classList.toggle("is-ink", v); b.classList.toggle("is-pen", !v);
      b.setAttribute("aria-label", L.title + " on " + DEV_NAME[dev] + ", " + (v ? "done" : "not done"));
      b.setAttribute("aria-pressed", v ? "true" : "false");
      var acc = el.querySelector(".acc"); if (L.due) acc.innerHTML = v ? "" : DUE;
      if (k === "run") el.querySelector(".sub span").textContent = "Health · " + (v ? 2 : 1) + " of 3 this week";
    });
    stageA.querySelector('[data-stat="' + dev + '"]').textContent = statusText(st);
    stageA.querySelectorAll('[data-bar="' + dev + '"]').forEach(function (b) { b.innerHTML = todayBar(dev); });
    if (!animate || still) return;
    var k = scaleA || 1;
    Array.prototype.forEach.call(card.children, function (el) {
      var dy = (before[el.dataset.k] - el.getBoundingClientRect().top) / k;
      if (!dy || Math.abs(dy) < 0.5) return;
      el.style.transition = "none"; el.style.transform = "translateY(" + dy + "px)"; el.style.zIndex = "1";
      void el.offsetWidth;
      el.style.transition = "transform 380ms var(--smooth)"; el.style.transform = "";
      el.addEventListener("transitionend", function te(e) { if (e.propertyName === "transform") { el.style.transition = ""; el.style.zIndex = ""; el.removeEventListener("transitionend", te); } });
    });
  }
  // Ticking: the check draws first, then the line moves above the Now line (or back below it).
  function setDone(dev, id, v, animate) {
    stA[dev][id] = v ? seqA++ : 0;
    var b = ctlEl(dev, id);
    if (!animate || still || !b) { paintA(dev, false); return; }
    b.classList.remove("no-anim-once"); b.classList.toggle("is-ink", v); b.classList.toggle("is-pen", !v);
    later("A", 380, function () { paintA(dev, true); });
  }
  function resetStateA() { seqA = 3; DEVS.forEach(function (d) { stA[d] = Object.assign({}, START); }); busy = {}; }

  function layoutA() {
    var w = wrapA.clientWidth;
    var mode = w < 560 ? "narrow" : "wide";
    if (mode !== modeA) {
      modeA = mode;
      ["wide", "narrow"].forEach(function (c) { stageA.classList.toggle(c, c === mode); });
      genA++; clearTimers("A"); busy = {}; buildA();
    }
    var sz = SIZE[mode];
    // Grows with the tile (all three together, so their sizes stay true to each other), up to 1.35x.
    scaleA = Math.min(w / sz[0], 1.35);
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
    var b = ctlEl(dev, id), row = b && b.closest(".ln"); if (!row) return;
    row.classList.add("press"); later("A", 220, function () { row.classList.remove("press"); });
  }
  function tapA(dev, id) {
    if (busy[id]) return;
    var v = !stA[dev][id];
    setDone(dev, id, v, true);
    var others = DEVS.filter(function (d) { return d !== dev && shown(d); });
    if (still || !p_ok()) { others.forEach(function (d) { setDone(d, id, v, true); }); if (W) W.set(id, v, false); return; }
    busy[id] = true;
    var cloud = RA.getElementById("cloudA");
    later("A", 120, function () {
      pulse(dev, "up", 480, function () {
        cloud.classList.remove("lit"); void cloud.offsetWidth; cloud.classList.add("lit");
        if (W) later("A", 420, function () { W.set(id, v, true); });
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
  // A line marked on the Watch: the Watch has no line drawn to the cloud, so the cloud lights and the others follow.
  function fromWatch(id, v) {
    var others = DEVS.filter(shown);
    if (still || !p_ok()) { others.forEach(function (d) { setDone(d, id, v, true); }); return; }
    busy[id] = true;
    var cloud = RA.getElementById("cloudA");
    later("A", 420, function () {
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
  }
  function p_ok() { return typeof Element.prototype.animate === "function"; }
  // The play: a line is marked on the iPhone and appears on the iPad, the Mac and the Watch; then one is marked on the
  // Watch and appears on the other three.
  function playA() {
    genA++; clearTimers("A");
    resetStateA(); buildA(); if (W) W.reset();
    if (still) { DEVS.forEach(function (d) { setDone(d, "walk", true, false); setDone(d, "rent", true, false); }); if (W) { W.set("walk", true, false); W.set("rent", true, false); } return; }
    later("A", 700, function () { pressRow("iphone", "walk"); });
    later("A", 820, function () { tapA("iphone", "walk"); });
    if (W) { later("A", 3500, function () { W.show("rent"); }); later("A", 4100, function () { W.tap("rent"); }); }
  }
  // =====================================================================
  // Page
  // =====================================================================
  resetStateA(); layoutA();
  if ("ResizeObserver" in window) new ResizeObserver(function () { layoutA(); }).observe(wrapA);

  // The Watch: Ledger's Today on an Apple Watch (WatchTodayView, WatchLineRow). Its lines only: done ones, the Now
  // line, open ones, then the mood. Tap a line to mark it; it is marked on the other three devices too.
  if (RW) {
    var ws = RW.getElementById("watchOnly"), wst = { run: 1 }, wseq = 3;
    var OWN = LINES.filter(function (L) { return L.kind === "habit" || L.kind === "task"; });
    function wsub(L, v) {
      if (v) return (L.id === "run" ? "7:00 AM" : "1:30 PM") + " · done";
      var at = minutes(L.time) >= 0 ? L.time : "", detail = L.id === "run" ? "1 of 3 this week" : L.sub;
      return [at, detail].filter(Boolean).join(" · ");
    }
    function wrowHTML(L) {
      var a = AREAS[L.area], tag = L.tap ? "button" : "div";
      var cls = "ctl" + (L.ring ? " is-ring" : " is-pen"), arc = L.ring ? ";--arc:" + (L.ring * 69.115).toFixed(2) : "";
      return "<" + tag + (L.tap ? ' type="button"' : "") + ' class="wrow" data-k="' + L.id + '" style="--m:' + a.m + ";--p:" + a.m + arc + '">' +
        '<span class="wbar"></span><span class="' + cls + '">' + ctlSVG(L.kind === "task" ? "task" : "circle") + "</span>" +
        '<span class="wtt"><span class="ti">' + L.title + '</span><span class="ws"></span></span>' + (L.chip ? '<span class="wchip">+8</span>' : "") + "</" + tag + ">";
    }
    ws.innerHTML = '<div class="dev watch solo"><div class="scr"><div class="wtop" aria-hidden="true"><span>1:30</span><b>Today</b></div>' +
      '<div class="wscroll"><div class="wstat" id="wstat"></div><div class="wlist" id="wlist">' + OWN.map(wrowHTML).join("") +
      '<div class="wnow" data-k="now">Now · 1:30 PM</div><div class="wrow wmood" data-k="mood"><span class="wbar" style="--m:transparent"></span><span class="ctl">' + moodSVG() +
      '</span><span class="wtt"><span class="ti">How are you feeling?</span></span></div></div></div><span class="wplus" aria-hidden="true">' + PLUS + "</span></div></div>";
    var wlist = RW.getElementById("wlist");
    function wpaint(animate) {
      var before = {};
      if (animate && !still) Array.prototype.forEach.call(wlist.children, function (el) { before[el.dataset.k] = el.getBoundingClientRect().top; });
      var done = OWN.filter(function (L) { return wst[L.id]; }).sort(function (a, b) { return wst[a.id] - wst[b.id]; });
      var open = OWN.filter(function (L) { return !wst[L.id]; }).sort(function (a, b) { return minutes(a.time) - minutes(b.time) || a.title.localeCompare(b.title); });
      var keys = done.map(function (L) { return L.id; }).concat(["now"], open.map(function (L) { return L.id; }), ["mood"]);
      keys.forEach(function (k, i) {
        var el = wlist.querySelector('[data-k="' + k + '"]');
        if (wlist.children[i] !== el) wlist.insertBefore(el, wlist.children[i] || null);
        var L = lineById(k); if (!L) return;
        var v = !!wst[k], c = el.querySelector(".ctl");
        el.classList.toggle("ink", v);
        if (L.tap) { c.classList.toggle("is-ink", v); c.classList.toggle("is-pen", !v); el.setAttribute("aria-pressed", v ? "true" : "false"); }
        el.querySelector(".ws").textContent = wsub(L, v);
      });
      RW.getElementById("wstat").textContent = dayName + " · " + done.length + " done, " + open.length + " to go";
      if (!animate || still) return;
      Array.prototype.forEach.call(wlist.children, function (el) {
        var dy = before[el.dataset.k] - el.getBoundingClientRect().top;
        if (!dy || Math.abs(dy) < 0.5) return;
        el.style.transition = "none"; el.style.transform = "translateY(" + dy + "px)"; el.style.zIndex = "1";
        void el.offsetWidth;
        el.style.transition = "transform 380ms var(--smooth)"; el.style.transform = "";
        el.addEventListener("transitionend", function te(e) { if (e.propertyName === "transform") { el.style.transition = ""; el.style.zIndex = ""; el.removeEventListener("transitionend", te); } });
      });
    }
    var wscroll = RW.querySelector(".wscroll");
    function wrow(id) { return wlist.querySelector('[data-k="' + id + '"]'); }
    // Scrolls the Watch's list, if it has to, so a line is in view.
    function wshow(id) {
      var el = wrow(id); if (!el || !wscroll) return;
      var r = el.getBoundingClientRect(), s = wscroll.getBoundingClientRect(), k = wscroll.offsetHeight ? s.height / wscroll.offsetHeight : 1;
      var room = s.height * 0.2, by = r.bottom > s.bottom - room ? r.bottom - (s.bottom - room) : r.top < s.top + room ? r.top - (s.top + room) : 0;
      if (Math.abs(by) > 1) wscroll.scrollBy({ top: by / (k || 1), behavior: still ? "auto" : "smooth" });
    }
    // Marks a line on the Watch (or clears it), as a tap there or as news from another device.
    function wset(id, v, animate) {
      var b = wrow(id); if (!b || !!wst[id] === !!v) return;
      var c = b.querySelector(".ctl");
      wst[id] = v ? wseq++ : 0;
      c.classList.remove("no-anim-once"); c.classList.toggle("is-ink", v); c.classList.toggle("is-pen", !v);
      b.setAttribute("aria-label", lineById(id).title + " on Apple Watch, " + (v ? "done" : "not done"));
      if (!animate || still) { wpaint(false); wshow(id); return; }
      later("A", 380, function () { wpaint(true); later("A", 420, function () { wshow(id); }); });
    }
    function wtap(id) {
      if (busy[id]) return;
      var v = !wst[id];
      wset(id, v, true); fromWatch(id, v);
    }
    wlist.querySelectorAll("button.wrow").forEach(function (b) {
      b.addEventListener("click", function () { wtap(b.dataset.k); });
      b.setAttribute("aria-label", lineById(b.dataset.k).title + " on Apple Watch, " + (wst[b.dataset.k] ? "done" : "not done"));
    });
    wlist.querySelectorAll(".ctl").forEach(function (c) { c.classList.add("no-anim-once"); });
    wpaint(false);
    W = {
      set: wset, show: wshow,
      // The play's own tap: the row dips, as under a finger, then is marked.
      tap: function (id) { var b = wrow(id); if (b && b.animate && !still) b.animate([{ transform: "scale(1)" }, { transform: "scale(.95)" }, { transform: "scale(1)" }], { duration: 240, easing: "ease-out" }); wtap(id); },
      reset: function () {
        wst = { run: 1 }; wseq = 3;
        wlist.querySelectorAll(".ctl").forEach(function (c) { c.classList.add("no-anim-once"); });
        wlist.querySelectorAll("button.wrow").forEach(function (b) { b.setAttribute("aria-label", lineById(b.dataset.k).title + " on Apple Watch, " + (wst[b.dataset.k] ? "done" : "not done")); });
        wpaint(false); if (wscroll) wscroll.scrollTop = 0;
      }
    };
  }
  // The devices: plays once most of the iPhone, where the autoplay ticks, is on screen (the scene can be taller than the
  // window), and replays while it stays there.
  loop(function () { return stageA.querySelector(".iphone") || stageA; }, 0.7, playA, 10500, [stageA, RW && RW.getElementById("watchOnly")]);
})();
