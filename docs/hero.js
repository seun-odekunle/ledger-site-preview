// keepingledger.com: the hero. A phone that plays one whole day in Ledger by itself (a line marked, a habit added
// with the + panel, water, a walk Health saw, the evening's day review, tomorrow's page), the light behind it that
// follows its time of day, and the cards beside it that say what Ledger does. The phone's screen is built here and
// mounted in a shadow root (hero-app.css); the words and the cards are in index.html. Made-up data; nothing is stored
// or sent anywhere. With Reduce Motion the phone shows one still afternoon and the cards stay a plain list.
(function () {
  "use strict";
  var hero = document.getElementById("top"), host = document.getElementById("hxApp"), stage = document.getElementById("hxStage");
  if (!hero || !host || !stage || !host.attachShadow) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  var LANG = "en-US";
  var today = new Date(); today.setHours(12, 0, 0, 0);
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  var DAY = today.toLocaleDateString(LANG, { weekday: "long" }), TOM = addDays(today, 1), TOMDAY = TOM.toLocaleDateString(LANG, { weekday: "long" });
  var TOMDATE = TOM.toLocaleDateString(LANG, { month: "short", day: "numeric" });

  // =====================================================================
  // The app's screen
  // =====================================================================
  var AREAS = {
    health: { name: "Health", m: "var(--fern)", p: "var(--fern-p)", icon: '<path d="M6 10.4C2.3 8 1.1 6.2 1.1 4.4 1.1 2.9 2.3 1.7 3.7 1.7c1 0 1.8.5 2.3 1.3.5-.8 1.3-1.3 2.3-1.3 1.4 0 2.6 1.2 2.6 2.7 0 1.8-1.2 3.6-4.9 6Z"/>' },
    home: { name: "Home", m: "var(--berry)", p: "var(--berry-p)", icon: '<path d="M1.4 5.8 6 1.8l4.6 4M2.7 4.8v5.6h6.6V4.8M5 10.4V7.5h2v2.9"/>' },
    growth: { name: "Growth", m: "var(--iris)", p: "var(--iris-p)", icon: '<path d="M2.2 10.2c-.3-4.6 2.6-8 8.4-8.4.3 5.6-3 8.6-8.4 8.4Zm0 0 5-5"/>' }
  };
  var LINES = [
    { id: "run", kind: "habit", area: "health", time: "7:00 AM", title: "Morning run", sub: "2 of 3 this week" },
    { id: "rent", kind: "task", area: "home", time: "any", title: "Pay rent", sub: "due today", due: true },
    { id: "water", kind: "habit", area: "health", time: "all day", title: "Drink water", ring: true },
    { id: "walk", kind: "habit", area: "growth", time: "2:00 PM", title: "Walk after lunch", sub: "daily" },
    { id: "read", kind: "habit", area: "growth", time: "9:00 PM", title: "Read 20 pages", sub: "daily" }
  ];
  function mins(t) { if (t === "any") return -2; if (t === "all day") return -1; var m = /^(\d+):(\d+) ([AP]M)$/.exec(t); return (+m[1] % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2]; }
  function timeHTML(t) { var m = /^(\d+:\d+) ([AP]M)$/.exec(t); return m ? m[1] + "<small>" + m[2] + "</small>" : t; }
  function ctl(shape) {
    var s = shape === "task" ? '<rect class="pen" width="22" height="22" rx="6"/><rect class="fil" width="22" height="22" rx="6"/>'
      : '<circle class="pen" cx="11" cy="11" r="11"/><circle class="trk" cx="11" cy="11" r="11"/><circle class="arc" cx="11" cy="11" r="11" transform="rotate(-90 11 11)"/><circle class="fil" cx="11" cy="11" r="11"/>';
    return '<svg viewBox="-2 -2 26 26">' + s + '<path class="chk" pathLength="1" d="M6.6 11.3 9.7 14.4 15.4 7.9"/></svg>';
  }
  function icon(a) { return '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' + AREAS[a].icon + "</svg>"; }
  function face(level) { var b = level / 3 * 5.2, y = 11.4 - 0.3 * b; return '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="10" stroke-width="1.6"/><path d="M5.5 ' + y.toFixed(2) + " Q11 " + (y + b).toFixed(2) + " 16.5 " + y.toFixed(2) + '" stroke-width="1.9" stroke-linecap="round"/></svg>'; }
  var CHEV = '<svg width="14" height="9" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 1.8 4.5 4.4 4.5-4.4"/></svg>';
  var HBTN = '<div class="hbtn"><span class="gls"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="8.6" cy="8.6" r="6.1"/><path d="m13.2 13.2 4.6 4.6"/></svg></span><span class="gls av"><i>S</i></span></div>';
  var SIG = '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 11.6 5.6 9.1a3.4 3.4 0 0 1 4.8 0L8 11.6Zm-4.3-4.4L2.1 5.6a8.4 8.4 0 0 1 11.8 0l-1.6 1.6a6.1 6.1 0 0 0-8.6 0ZM0 3.5a11.4 11.4 0 0 1 16 0l-1.6 1.6a9.1 9.1 0 0 0-12.8 0Z"/></svg><svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="19" height="9" rx="2.2" fill="currentColor"/><path d="M24.5 4.3v4.4c.9-.3 1.5-1.2 1.5-2.2s-.6-1.9-1.5-2.2Z" fill="currentColor" fill-opacity=".45"/></svg>';
  var TABS = [["Today", '<path d="M6.5 2.5h7.2l5 5v12a2 2 0 0 1-2 2h-10.2a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M8.3 12.2h7.4M8.3 15.4h7.4M8.3 18.6h4.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'],
    ["Plan", '<g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.2h18"/></g><g fill="currentColor"><circle cx="8" cy="13" r="1.1"/><circle cx="12" cy="13" r="1.1"/><circle cx="16" cy="13" r="1.1"/><circle cx="8" cy="16.8" r="1.1"/><circle cx="12" cy="16.8" r="1.1"/></g>'],
    ["Journal", '<path fill="currentColor" d="M2.5 5.2c2.9-1.3 6.1-1.2 8.7.4v14.3c-2.6-1.5-5.8-1.6-8.7-.4V5.2Zm19 0c-2.9-1.3-6.1-1.2-8.7.4v14.3c2.6-1.5 5.8-1.6 8.7-.4V5.2Z"/>'],
    ["Insights", '<g fill="currentColor"><rect x="4" y="11" width="3.4" height="8" rx="1"/><rect x="8.9" y="6" width="3.4" height="13" rx="1"/><rect x="13.8" y="9" width="3.4" height="10" rx="1"/><rect x="18.6" y="4" width="3.4" height="15" rx="1"/><rect x="2.5" y="20.2" width="20" height="1.6" rx=".8"/></g>']];
  function lineHTML(L, extra) {
    var a = AREAS[L.area];
    var sub = L.ring ? '<span class="sub">' + icon(L.area) + '<span data-oz>' + a.name + " · 24 of 70 oz</span></span>" : '<span class="sub">' + icon(L.area) + "<span>" + a.name + (L.sub ? " · " + L.sub : "") + "</span></span>";
    var acc = L.due ? '<span class="due" data-due>Due</span>' : L.ring ? '<span class="chip" data-chip>+8 oz</span>' : "";
    return '<div class="ln' + (extra || "") + '" data-k="' + L.id + '" style="--m:' + a.m + ";--p:" + a.p + '"><span class="strip"></span><span class="tm">' + timeHTML(L.time) + '</span><span class="ctl' + (L.ring ? " ring" : "") + '"' + (L.ring ? ' style="--arc:23.7"' : "") + ">" + ctl(L.kind) +
      '</span><span class="tt"><span class="ti">' + L.title + "</span>" + sub + '</span><span class="acc">' + acc + "</span></div>";
  }
  var off = today.getDay();
  function weekHTML(sel) {
    var out = "";
    for (var i = 0; i < 7; i++) { var d = addDays(today, i - off); out += '<div class="' + (i === sel ? "sel" : "") + '"><span class="l">' + "SMTWTFS"[i] + '</span><span class="n">' + d.getDate() + '</span><span class="bar" data-bar="' + i + '"></span></div>'; }
    return out;
  }
  var TOMLINES = [{ id: "rent2", kind: "task", area: "home", time: "any", title: "Pay rent" }, { id: "w2", kind: "habit", area: "health", time: "all day", title: "Drink water", sub: "0 of 70 oz" },
    { id: "k2", kind: "habit", area: "growth", time: "2:00 PM", title: "Walk after lunch", sub: "daily" }, { id: "r2", kind: "habit", area: "growth", time: "9:00 PM", title: "Read 20 pages", sub: "daily" }];
  var when = '<div class="when">' + DAY + " · 9:41 PM</div>";

  var app = host.attachShadow({ mode: "open" });
  app.innerHTML =
    '<link rel="stylesheet" href="hero-app.css?v=b1b1a9d">' +
    '<div class="sbar"><b id="clk">7:02</b><span>' + SIG + "</span></div>" +
    // Today
    '<div class="view" id="vToday"><div class="head"><div class="greet" id="greet">Morning, Sam</div><div class="trow"><h3><span>' + DAY + "</span>" + CHEV + "</h3>" + HBTN + "</div>" +
      '<div class="stat" id="stat"></div><div class="week">' + weekHTML(off) + "</div></div>" +
      '<div class="rev" id="rev"><div class="k">Day review · ' + DAY + '<span>Not tonight</span></div><b>How was today, Sam?</b><div class="faces">' + [-3, -2, -1, 0, 1, 2, 3].map(function (l) { return '<span data-face="' + l + '">' + face(l) + "</span>"; }).join("") + "</div></div>" +
      '<div class="seclab">' + DAY + '’s page</div><div class="card" id="card">' + LINES.map(function (L) { return lineHTML(L); }).join("") + '<div class="nowrow" data-k="now" id="nowrow">Now · 7:02 AM</div></div></div>' +
    // tomorrow's page
    '<div class="view out" id="vTom"><div class="head"><div class="greet"></div><div class="trow"><h3>' + TOMDAY + CHEV + "</h3>" + HBTN + "</div>" +
      '<div class="stat">' + TOMDATE + ' · 4 planned</div><div class="week">' + weekHTML((off + 1) % 7) + '</div></div><div class="seclab">' + TOMDAY + '’s page</div><div class="card">' +
      TOMLINES.map(function (L, i, a) { return lineHTML(L, i === a.length - 1 ? " nosep" : ""); }).join("") + "</div></div>" +
    '<div class="tabbar"><div class="tabs gls">' + TABS.map(function (t, i) { return '<span class="tab' + (i ? "" : " on") + '"><svg viewBox="0 0 24 24">' + t[1] + "</svg>" + t[0] + "</span>"; }).join("") + '</div><span class="plus gls" id="plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 4.5v15M4.5 12h15"/></svg></span></div>' +
    '<div class="toast" id="toast">Saved to ' + DAY + ' in the Journal<b>Undo</b></div><div class="dim"></div>' +
    // the day review: it covers the screen, four steps
    '<div class="sheet"><div class="sbarrow"><span class="gls">Close</span><span class="gls">Skip</span></div><div class="prog"><i id="prog"></i></div>' +
      '<div class="step" data-s="0">' + when + '<h4>How was today, Sam?</h4><div class="pad"><small class="a">Stressed · anxious</small><small class="b">Excited · joyful</small><small class="c">Sad · drained</small><small class="d">Calm · content</small><span class="knob" id="knob">' + face(0) + '</span></div><div class="moodl" id="moodl">Neutral · medium energy</div><div class="cap">What fits? · Optional</div><div class="chips"><span>Calm</span><span>Content</span><span id="fit">Relieved</span><span>Proud</span></div><div class="nextrow"><span data-next>Next</span></div></div>' +
      '<div class="step" data-s="1">' + when + '<h4>Your day</h4><div class="lead">What happened.</div><div class="box"><div class="cap" id="nmcap">Not marked · 2</div><div class="yrow" id="yread">Read 20 pages<span class="btns"><span data-did>Did it</span><span>Didn’t</span></span></div><div class="yrow">Drink water<span class="btns"><span>Did it</span><span>Didn’t</span></span></div></div><div class="box"><div class="cap" id="dncap">Done · 2</div><div class="drow"><small>7:00 AM</small>Morning run</div><div class="drow"><small>2:00 PM</small>Walk after lunch</div><div class="drow" id="dread" hidden><small>9:00 PM</small>Read 20 pages</div></div><div class="nextrow"><span class="back">Back</span><span data-next>Next</span></div></div>' +
      '<div class="step" data-s="2">' + when + '<h4>Anything to keep?</h4><div class="box" style="padding:12px 14px"><div class="cap" style="margin:0 0 4px">From your day</div><div style="font-size:15px;font-weight:500">Walk after lunch. How did it go?</div><div style="font-size:13px;color:var(--blue);margin-top:4px">Ask another</div></div><div class="field" id="field"></div><div class="hint">Or write about anything else. The question is only a start.</div><div class="nextrow"><span class="back">Back</span><span data-next>Next</span></div></div>' +
      '<div class="step" data-s="3">' + when + "<h4>Tomorrow</h4>" + '<div class="lead">' + TOMDAY + ' already has 3 things and a free morning.</div><div class="cap">Still open</div><div class="open"><b>Pay rent</b><small>Today · Deadline</small><div class="chips"><span class="t" id="tomchip">Tomorrow</span><span>Schedule…</span><span>Let go</span></div></div><div class="nextrow"><span class="back">Back</span><span data-next>Done</span></div></div>' +
    "</div>" +
    // the + panel: a sentence goes in, Ledger reads it into parts, Add writes the line
    '<div class="cpanel" id="cpanel"><div class="cbar"><span class="gls">Cancel</span><b id="cttl">New</b><span class="gls add" id="cadd">Add</span></div><div class="cfield"><span id="csay"></span><svg viewBox="0 0 24 24"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg></div>' +
      '<div class="cempty"><p>Say it the way you’d tell a friend. Ledger writes the line.</p><div class="ctiles"><div><b>How are you feeling?</b><small>A moment, any time</small></div><div><b class="ow">Write in the Journal</b><small>A new entry for today</small></div></div><div class="cap">Try saying</div><div class="cex"><span>Pay rent on the 1st</span><span>Gym 3 times a week</span><span>Call Mum on Sunday</span></div></div>' +
      '<div class="cread"><div class="cprev"><i></i><span><b>Gym</b><small>Health · 0 of 3 this week</small></span></div><p>Read as a habit: Show up. Choose a part below to change a guess.</p><div class="cap">Ledger read · choose a part to change it</div><div class="chips"><span>Gym</span><span>Show up ▾</span><span>3×</span><span>Per week</span><span class="ar">Health</span></div></div></div>';
  function $(id) { return app.getElementById(id); }
  // The screen stays hidden until its stylesheet is in, so it never shows unstyled.
  var sheet = app.querySelector("link"), shown = false;
  function show() { if (!shown) { shown = true; host.classList.add("ready"); } }
  sheet.addEventListener("load", show); sheet.addEventListener("error", show); setTimeout(show, 2500);
  hero.classList.add(reduce ? "hx-still" : "hx-live");

  var card = $("card"), st = {}, seq = 1;

  // ---------- the cards beside the phone ----------
  var HOLD = 5200, fxEls = [].slice.call(hero.querySelectorAll(".hx-card"));
  function plain() { return window.innerWidth < 980; }      // narrow: one card at a time above the phone, with no flight
  function away(el) { var r = el.getBoundingClientRect(); return el.dataset.side === "l" ? -(r.right + 40) : window.innerWidth - r.left + 40; }   // past the window's edge
  // A card flies in from outside the window, and any card already on its side leaves.
  function fx(key) {
    var el = document.getElementById("hx-" + key); if (!el || reduce) return;
    fxEls.forEach(function (c) { c.classList.toggle("cur", c === el); if (c !== el && c.dataset.side === el.dataset.side) leave(c); });
    if (el.classList.contains("on") && !el._leaving) return;
    el._age = 0; el.classList.add("on");
    if (plain() || !el.animate) return;
    var left = el.dataset.side === "l";
    el.animate([{ translate: away(el) + "px -30px", rotate: (left ? -8 : 8) + "deg", opacity: 1 }, { opacity: 1, offset: .5 }], { duration: 760, easing: "cubic-bezier(.16,.9,.3,1)" });
  }
  // Leaving: a small draw back toward the phone, then out past the edge of the window, tipping as it goes.
  function leave(el) {
    if (!el.classList.contains("on") || el._leaving) return;
    if (plain() || !el.animate) { el.classList.remove("on", "cur"); return; }
    el._leaving = true;
    var left = el.dataset.side === "l";
    var a = el.animate([{ translate: (left ? 12 : -12) + "px 0", offset: .22, easing: "cubic-bezier(.55,0,.9,.45)" }, { opacity: 1, offset: .85 }, { translate: away(el) + "px -38px", rotate: (left ? -9 : 9) + "deg", opacity: 0, offset: 1 }], { duration: 700, fill: "forwards" });
    a.onfinish = function () { el.style.transition = "none"; el.classList.remove("on", "cur"); a.cancel(); void el.offsetWidth; el.style.transition = ""; el._leaving = false; };
  }
  function fxLeaveAll() { fxEls.forEach(leave); }
  function fxReset() { fxEls.forEach(function (c) { if (c.getAnimations) c.getAnimations().forEach(function (a) { if (!a.animationName) a.cancel(); }); c._leaving = false; c._age = 0; c.classList.remove("on", "cur"); }); }
  // A card stays about five seconds (its clock stops while the hero is off screen).
  if (!reduce) setInterval(function () { if (!seen) return; fxEls.forEach(function (c) { if (c.classList.contains("on") && !c._leaving) { c._age = (c._age || 0) + 100; if (c._age >= HOLD) leave(c); } }); }, 100);

  // ---------- the light: m morning, a afternoon, e evening ----------
  var sun = document.getElementById("hxSun");
  function setTod(t) {
    var back = t === "m" && hero.dataset.tod === "e";
    if (!back || reduce || !sun) { hero.dataset.tod = t; return; }
    // A new morning: the light doesn't run backwards. It fades, starts again on the left, and comes back.
    sun.style.opacity = 0;
    setTimeout(function () { sun.style.transition = "none"; hero.dataset.tod = "m"; void sun.offsetWidth; sun.style.transition = ""; sun.style.opacity = ""; }, 720);
  }

  // ---------- Today: done lines (as marked) · Now · open lines (any, all day, then by time) ----------
  function order() {
    var done = LINES.filter(function (L) { return st[L.id]; }).sort(function (a, b) { return st[a.id] - st[b.id]; }).map(function (L) { return L.id; });
    var open = LINES.filter(function (L) { return !st[L.id]; }).sort(function (a, b) { return mins(a.time) - mins(b.time); }).map(function (L) { return L.id; });
    return done.concat(["now"], open);
  }
  function barHTML() {
    var done = LINES.filter(function (L) { return st[L.id]; }).sort(function (a, b) { return st[a.id] - st[b.id]; }), total = LINES.length, w = 10 + total / 12 * 24;
    if (!done.length) return '<i style="width:' + w + 'px;background:var(--l3)"></i>';
    var share = done.length / total, stops = done.map(function (L, i) { return AREAS[L.area].m + " " + ((i + .5) / done.length * share * 100).toFixed(0) + "%"; });
    if (done.length < total) stops.push(AREAS[done[done.length - 1].area].m + " " + (share * 100 - 2).toFixed(0) + "%", "var(--l3) " + (share * 100 + 2).toFixed(0) + "%");
    return '<i style="width:' + w + "px;background:" + (stops.length > 1 ? "linear-gradient(90deg," + stops.join(",") + ")" : AREAS[done[0].area].m) + '"></i>';
  }
  function paintToday(animate, clock) {
    var before = {};
    [].forEach.call(card.children, function (el) { before[el.dataset.k] = el.offsetTop; });
    var keys = order();
    keys.forEach(function (k, i) {
      var el = card.querySelector('[data-k="' + k + '"]');
      if (card.children[i] !== el) card.insertBefore(el, card.children[i] || null);
      el.classList.toggle("nosep", keys[i + 1] === "now" || i === keys.length - 1);
      if (k !== "now") { el.classList.toggle("done", !!st[k]); var due = el.querySelector("[data-due]"); if (due) due.hidden = !!st[k]; }
    });
    if (animate && !reduce) [].forEach.call(card.children, function (el) {      // lines glide to their new place
      var dy = before[el.dataset.k] - el.offsetTop; if (!dy) return;
      el.style.transition = "none"; el.style.transform = "translateY(" + dy + "px)"; el.style.zIndex = 1; void el.offsetWidth;
      el.style.transition = "transform 380ms var(--smooth)"; el.style.transform = "";
      setTimeout(function () { el.style.transition = ""; el.style.zIndex = ""; }, 420);
    });
    var n = LINES.filter(function (L) { return st[L.id]; }).length;
    $("stat").textContent = clock + " · " + n + " done, " + (LINES.length - n) + " to go.";
    $("nowrow").textContent = "Now · " + clock;
    $("clk").textContent = clock.replace(/ [AP]M/, "");
    app.querySelector('#vToday [data-bar="' + off + '"]').innerHTML = barHTML();
  }
  [].forEach.call(app.querySelectorAll("[data-bar]"), function (b) {      // the week's other days
    var i = +b.dataset.bar, inTom = !!b.closest("#vTom");
    if (i < off) b.innerHTML = '<i style="width:' + (18 + (i * 7) % 12) + "px;background:linear-gradient(90deg,var(--fern)," + (i % 2 ? "var(--iris)" : "var(--berry)") + ')"></i>';
    else if (i > off || inTom) b.innerHTML = i === off && inTom ? '<i style="width:20px;background:linear-gradient(90deg,var(--fern),var(--iris))"></i>' : '<i style="width:18px;background:var(--l3)"></i>';
  });
  // The line the + panel writes.
  var SAY = "Gym 3 times a week", GYM = { id: "gym", kind: "habit", area: "health", time: "any", title: "Gym", sub: "0 of 3 this week" };
  function addLine(clock) {
    if (LINES.indexOf(GYM) < 0) LINES.push(GYM);
    if (!card.querySelector('[data-k="gym"]')) card.insertAdjacentHTML("beforeend", lineHTML(GYM));
    paintToday(false, clock);
    var el = card.querySelector('[data-k="gym"]');
    if (!reduce && el.animate) el.animate([{ opacity: 0, transform: "scale(.96)", background: "rgba(38, 64, 191, .12)" }, { opacity: 1, transform: "none", background: "rgba(38, 64, 191, .12)", offset: .5 }, { opacity: 1, transform: "none", background: "rgba(38, 64, 191, 0)" }], { duration: 900, easing: "ease-out" });
  }
  function dropLine() { var i = LINES.indexOf(GYM); if (i >= 0) LINES.splice(i, 1); var el = card.querySelector('[data-k="gym"]'); if (el) el.remove(); }

  // ---------- the play ----------
  var runId = 0, seen = true;
  // Time passes only while the hero is on screen.
  function wait(ms, id) { return new Promise(function (res) { var left = ms; (function tick() { if (id !== runId) return; if (!seen) { setTimeout(tick, 120); return; } if (left <= 0) { res(); return; } left -= 60; setTimeout(tick, 60); })(); }); }
  // No hand on screen: the thing that's used dips for a moment, as it does under a finger.
  async function tap(el, id) { await wait(330, id); el.classList.add("hit"); await wait(150, id); el.classList.remove("hit"); }
  function step(n) { [].forEach.call(app.querySelectorAll(".step"), function (s) { var k = +s.dataset.s; s.classList.toggle("on", k === n); s.classList.toggle("was", k < n); }); $("prog").style.width = (n + 1) * 25 + "%"; }
  function water(oz) { card.querySelector("[data-oz]").textContent = "Health · " + oz + " of 70 oz"; card.querySelector(".ring").style.setProperty("--arc", (oz / 70 * 69.115).toFixed(1)); }
  function reset() {
    st = {}; seq = 1; dropLine(); host.classList.remove("capture", "review"); $("cpanel").classList.remove("has", "read"); $("csay").textContent = ""; $("csay").classList.remove("typing"); $("cttl").textContent = "New";
    $("vToday").classList.remove("out"); $("vTom").classList.add("out"); $("rev").classList.remove("on"); $("toast").classList.remove("on");
    $("greet").textContent = "Morning, Sam"; water(24);
    $("knob").style.left = "50%"; $("knob").style.top = "50%"; $("knob").style.background = "#8A8FA6"; $("knob").innerHTML = face(0); $("moodl").textContent = "Neutral · medium energy"; $("fit").classList.remove("on");
    $("yread").hidden = false; $("yread").style.opacity = ""; $("dread").hidden = true; $("nmcap").textContent = "Not marked · 2"; $("dncap").textContent = "Done · 2";
    $("field").textContent = ""; $("field").classList.remove("typing"); $("tomchip").classList.remove("on"); step(0);
    paintToday(false, "7:02 AM");
    fxReset(); setTod("m");
  }
  function mark(k, clock) { st[k] = seq++; paintToday(true, clock); }

  async function play() {
    var id = ++runId;
    while (id === runId) {
      reset();
      // ----- morning: the day's page, marked as it goes -----
      await wait(900, id);
      await tap(card.querySelector('[data-k="run"] .ctl'), id); mark("run", "7:05 AM"); fx("grad"); await wait(1500, id);
      // 8:30: the + is pressed, a habit is said in plain words, Ledger reads it, and Add writes the line
      paintToday(false, "8:30 AM"); await tap($("plus"), id); host.classList.add("capture"); fx("plus"); await wait(950, id);
      $("csay").classList.add("typing");
      for (var c = 1; c <= SAY.length && id === runId; c++) { $("csay").textContent = SAY.slice(0, c); if (c === 1) $("cpanel").classList.add("has"); await wait(52, id); }
      await wait(260, id); $("csay").classList.remove("typing"); $("cttl").textContent = "New habit"; $("cpanel").classList.add("read"); await wait(1900, id);
      await tap($("cadd"), id); host.classList.remove("capture"); await wait(460, id);
      addLine("8:31 AM"); await wait(1000, id); fx("areas"); await wait(1900, id);
      // water, logged by asking; then a walk Health saw
      paintToday(false, "10:24 AM"); await wait(480, id); water(32); fx("siri");
      var chip = card.querySelector("[data-chip]"); chip.classList.add("pulse"); setTimeout(function () { chip.classList.remove("pulse"); }, 220); await wait(1500, id);
      $("greet").textContent = "Afternoon, Sam"; setTod("a"); paintToday(false, "2:12 PM"); await wait(480, id); mark("walk", "2:12 PM"); fx("health"); await wait(1700, id);
      // ----- evening: the day review -----
      setTod("e");
      $("greet").textContent = "Evening, Sam"; paintToday(false, "9:41 PM"); $("rev").classList.add("on"); await wait(800, id);
      await tap(app.querySelector('[data-face="2"]'), id); host.classList.add("review"); await wait(980, id);
      $("knob").style.left = "74%"; $("knob").style.top = "30%"; $("knob").style.background = "#D05BA6"; $("knob").innerHTML = face(2);
      await wait(760, id); $("moodl").textContent = "Pleasant · high energy"; fx("notice"); await wait(350, id);
      await tap($("fit"), id); $("fit").classList.add("on"); await wait(300, id);
      await tap(app.querySelector('.step[data-s="0"] [data-next]'), id); step(1); await wait(700, id);
      await tap(app.querySelector("[data-did]"), id); st.read = seq++; $("yread").style.opacity = 0; await wait(260, id); $("yread").hidden = true; $("dread").hidden = false; $("nmcap").textContent = "Not marked · 1"; $("dncap").textContent = "Done · 3"; await wait(550, id);
      await tap(app.querySelector('.step[data-s="1"] [data-next]'), id); step(2); await wait(830, id);
      $("field").classList.add("typing");
      var words = "Long walk after lunch. A good day.";
      for (var i = 1; i <= words.length && id === runId; i++) { $("field").textContent = words.slice(0, i); await wait(38, id); }
      await wait(450, id); $("field").classList.remove("typing");
      await tap(app.querySelector('.step[data-s="2"] [data-next]'), id); step(3);
      // ----- then tomorrow, set before sleep -----
      await wait(800, id);
      await tap($("tomchip"), id); $("tomchip").classList.add("on"); await wait(600, id);
      await tap(app.querySelector('.step[data-s="3"] [data-next]'), id); host.classList.remove("review"); paintToday(false, "9:43 PM"); $("rev").classList.remove("on"); $("toast").classList.add("on"); await wait(1100, id);
      $("toast").classList.remove("on"); $("vToday").classList.add("out"); $("vTom").classList.remove("out"); $("clk").textContent = "9:43"; setTod("m"); fx("acct"); await wait(3600, id); fxLeaveAll(); await wait(660, id);
    }
  }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.12 }).observe(document.getElementById("hxScene"));
  if (reduce) {      // one still afternoon: two lines done, the habit from the + panel on the page
    reset(); st.run = 1; st.walk = 2; seq = 3; $("greet").textContent = "Afternoon, Sam"; addLine("2:12 PM"); setTod("a");
  } else play();

  // ---------- size, and a small lean toward the pointer ----------
  // The phone's width leads: about half of a wide window (720 px at most), most of a narrow one.
  function size() { var w = document.documentElement.clientWidth, pw = Math.min(w - 32, Math.max(330, Math.min(w * 0.48, 720))); hero.style.setProperty("--k", (pw / 521.8).toFixed(4)); }
  size(); window.addEventListener("resize", size);
  if (!reduce) {
    var aim = [0, 0], lean = [0, 0], raf = 0;
    var frame = function () {
      raf = 0;
      lean[0] += (aim[0] - lean[0]) * 0.08; lean[1] += (aim[1] - lean[1]) * 0.08;
      hero.style.setProperty("--lx", lean[0].toFixed(3)); hero.style.setProperty("--ly", lean[1].toFixed(3));
      if (Math.abs(aim[0] - lean[0]) + Math.abs(aim[1] - lean[1]) > 0.002) raf = requestAnimationFrame(frame);
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };
    hero.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; var r = hero.getBoundingClientRect(); aim = [clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5), clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5)]; kick(); });
    hero.addEventListener("pointerleave", function () { aim = [0, 0]; kick(); });
  }
})();
