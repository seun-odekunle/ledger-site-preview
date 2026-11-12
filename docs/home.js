// keepingledger.com home: the section pictures under the hero (the hero itself is hero.js). Nothing is stored or sent anywhere.
// A habit's month, the graduation badge, and Health lines that fill in. Same tokens and line parts as the app. Animations start when a tile is half on screen; Reduce Motion shows the end state.
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
