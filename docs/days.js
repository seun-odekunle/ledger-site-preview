// keepingledger.com: plan, do, reflect. One phone, three lines. The active line shows its screen: planning and Today
// are one still each, and the day review is four stills, one for each of its steps, shown in turn. The line's ring is
// its progress; then the next line. Plays only while on screen; with Reduce Motion nothing moves by itself: choosing a
// line shows it, and choosing the day review again shows its next step. The site is light only.
(function () {
  const sec = document.getElementById('days'); if (!sec) return;
  const items = [...sec.querySelectorAll('.days-item')];
  const views = [...sec.querySelectorAll('.days-view')];
  const HOLD = 6000, FRAME = 2600, C = 62.83;
  // How many stills each line has (its views carry data-frame 0, 1, 2…).
  const frames = items.map((_, k) => Math.max(1, views.filter(v => +v.dataset.step === k).length));
  const length = k => frames[k] > 1 ? frames[k] * FRAME : HOLD;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let i = 0, f = 0, visible = false, start = 0, spent = 0, raf = 0;
  function ring(k, p) { items[k].querySelector('.fill').style.strokeDashoffset = String(C * (1 - Math.max(0, Math.min(1, p)))); }
  function paint() { views.forEach(v => v.classList.toggle('is-on', +v.dataset.step === i && +(v.dataset.frame || 0) === f)); }
  function show(k) {
    i = k; f = 0; spent = 0; start = performance.now(); sec.dataset.step = k;
    items.forEach((b, n) => { b.setAttribute('aria-pressed', n === k ? 'true' : 'false'); if (n !== k) ring(n, 0); });
    paint(); run();
  }
  function run() {
    cancelAnimationFrame(raf);
    if (!visible || reduce.matches) return;
    start = performance.now() - spent;
    const tick = () => {
      spent = performance.now() - start; ring(i, spent / length(i));
      const at = Math.min(frames[i] - 1, Math.floor(spent / FRAME));
      if (frames[i] > 1 && at !== f) { f = at; paint(); }
      if (spent >= length(i)) { show((i + 1) % items.length); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  items.forEach((b, n) => b.addEventListener('click', () => {
    if (reduce.matches && n === i && frames[n] > 1) { f = (f + 1) % frames[n]; paint(); return; }   // step through by hand
    show(n);
  }));
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!visible) cancelAnimationFrame(raf); run(); }, { threshold: 0.4 }).observe(sec.querySelector('.days-stage'));
  show(0);
})();
