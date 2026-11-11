// Prototype (2026-11-11): one phone, three lines. The active line shows its step: the day review plays as a
// recording, the other two are stills for now. The site is light only (2026-11-11). The ring is the clip's own
// progress, or a timer for a still; then the next line. Plays only while on screen; with reduced motion nothing
// moves until a line is chosen, and the clip doesn't advance.
(function () {
  const sec = document.getElementById('days'); if (!sec) return;
  const items = [...sec.querySelectorAll('.days-item')];
  const views = [...sec.querySelectorAll('.days-view')];
  const video = sec.querySelector('video.days-view');
  const STILL_MS = 6000, C = 62.83;
  const media = { 0: { clip: 'images/clips/dayreview-light.mp4', still: 'images/clips/dayreview-light.jpg' },
                  1: { still: 'images/clips/pace-light.jpg' }, 2: { still: 'images/clips/judge-light.jpg' } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let i = 0, visible = false, stillStart = 0, stillSpent = 0, raf = 0;
  function setSources() {
    video.poster = media[0].still; video.src = media[0].clip;
    views.forEach(v => { const s = +v.dataset.step; if (v.tagName === 'IMG') v.src = media[s].still; });
  }
  function ring(k, p) { items[k].querySelector('.fill').style.strokeDashoffset = String(C * (1 - Math.max(0, Math.min(1, p)))); }
  function show(k, restart) {
    i = k;
    items.forEach((b, n) => { b.setAttribute('aria-pressed', n === k ? 'true' : 'false'); if (n !== k) ring(n, 0); });
    views.forEach(v => v.classList.toggle('is-on', +v.dataset.step === k));
    if (k === 0) { if (restart) video.currentTime = 0; stillSpent = 0; } else { video.pause(); stillSpent = 0; stillStart = performance.now(); }
    run();
  }
  function run() {
    cancelAnimationFrame(raf);
    if (!visible) { video.pause(); return; }
    if (i === 0) { if (!reduce.matches || video.dataset.chosen) video.play().catch(() => {}); }
    else stillStart = performance.now() - stillSpent;
    const tick = () => {
      if (i === 0) ring(0, video.duration ? video.currentTime / video.duration : 0);
      else if (!reduce.matches) {
        stillSpent = performance.now() - stillStart; ring(i, stillSpent / STILL_MS);
        if (stillSpent >= STILL_MS) { show((i + 1) % items.length, true); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  video.addEventListener('ended', () => { ring(0, 1); if (!reduce.matches) show(1, true); });
  items.forEach((b, n) => b.addEventListener('click', () => { if (n === 0) video.dataset.chosen = '1'; show(n, true); }));
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!visible) { stillSpent = performance.now() - stillStart; video.pause(); } run(); }, { threshold: 0.4 }).observe(sec.querySelector('.days-stage'));
  setSources(); show(0, false);
})();
