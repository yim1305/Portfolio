// Exercise the real site script with scroll, SVG-clock, and layout fixtures.
// Run: node scripts/check-satellite.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function preview({ reduced = false, scroll = 0, mobile = false } = {}) {
  const events = {};
  const classes = new Set();
  const properties = {};
  let pending;
  let paused = false;
  let widthShift = 0;
  let observeBand;
  function Observer(callback) { observeBand = callback; this.observe = () => {}; }
  const motion = { matches: reduced, addEventListener: (_, fn) => { events.motion = fn; } };
  const win = {
    IntersectionObserver: Observer,
    scrollY: scroll, innerHeight: mobile ? 700 : 800,
    matchMedia: () => motion,
    addEventListener: (name, fn) => { events[name] = fn; },
    requestAnimationFrame: fn => { pending = fn; return 1; }
  };
  const rect = (left, top, width, height) => ({ left, top: top - win.scrollY, width, height });
  const marker = {
    hidden: false, style: {}, setAttribute() {},
    className: 'rail__sat'
  };
  const railMarker = { ...marker, cloneNode: () => marker };
  const firstY = mobile ? 1150 : 900;
  const nodes = [firstY, firstY + 450, firstY + 950, firstY + 1400, firstY + 1900, firstY + 2400].map(y => ({
    offsetTop: y - firstY,
    getBoundingClientRect: () => rect(75 + widthShift, y - 52, 400, 450),
    querySelector: () => ({ offsetTop: 47, offsetHeight: 10, getBoundingClientRect: () => rect(75 + widthShift, y - 5, 10, 10) })
  }));
  const rail = {
    querySelector: () => railMarker,
    getBoundingClientRect: () => rect(79 + widthShift, firstY - 50, 2, 2500),
    style: { setProperty: (key, value) => { properties[key] = value; } }
  };
  const wrap = { querySelector: () => rail, querySelectorAll: () => nodes };
  const svg = { pauseAnimations: () => { paused = true; }, unpauseAnimations: () => { paused = false; } };
  const orbitSat = {
    getScreenCTM: () => ({
      e: (mobile ? 220 : 900) + widthShift,
      f: (mobile ? 800 : 300) - win.scrollY,
      a: Math.cos(-Math.PI / 7) * 0.8,
      b: Math.sin(-Math.PI / 7) * 0.8
    })
  };
  const elements = { '.work-wrap': wrap, '.orbit__svg': svg, '.orbit__sat': orbitSat };
  const doc = {
    documentElement: { classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) } },
    querySelector: name => elements[name] || null,
    querySelectorAll: name => name === 'svg.orbit__svg' ? [svg] : [],
    body: { appendChild: element => { assert.equal(element, marker); } }
  };
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../assets/js/site.js'), 'utf8'), { window: win, document: doc, Math, IntersectionObserver: Observer });
  const flush = () => { while (pending) { const fn = pending; pending = null; fn(); } };
  const observe = () => observeBand(nodes.map(target => ({ target, isIntersecting: target.getBoundingClientRect().top < win.innerHeight * 0.46 && target.getBoundingClientRect().top + 450 > win.innerHeight * 0.45 })));
  observe();
  flush();
  return {
    marker, railMarker, classes, properties,
    get paused() { return paused; },
    scrollTo(y) { win.scrollY = y; observe(); events.scroll(); flush(); },
    reduced(value) { motion.matches = value; events.motion(); flush(); },
    resize(dx) { widthShift = dx; events.resize(); flush(); }
  };
}

for (const mobile of [false, true]) {
  const page = preview({ mobile });
  const flightScroll = mobile ? 500 : 200;
  assert.equal(page.marker.hidden, true, 'Only the orbit satellite is shown at the top');
  assert.equal(page.paused, false, 'The orbit runs at the top');
  page.scrollTo(flightScroll);
  assert.equal(page.marker.hidden, false, 'A visible satellite flies between sections');
  assert.equal(page.paused, true, 'The departure phase is preserved');
  assert(page.classes.has('satellite-away'), 'Hide the orbit copy during flight');
  const outward = page.marker.style.transform;
  page.scrollTo(600);
  const firstFill = Number(page.properties['--rail-progress']);
  page.scrollTo(1600);
  assert.equal(page.railMarker.className, 'rail__sat', 'Keep the original rail satellite in place');
  assert(page.classes.has('sat-on-rail'), 'Use the original rail satellite after landing');
  assert.equal(page.marker.hidden, true, 'The flight-only copy is hidden after landing');
  assert(Number(page.properties['--rail-progress']) > firstFill, 'The rail fills while scrolling down');
  page.scrollTo(600);
  assert.equal(Number(page.properties['--rail-progress']), firstFill, 'The rail empties while scrolling up');
  page.scrollTo(flightScroll);
  assert.equal(page.marker.style.transform, outward, 'Return flight retraces the same position and orientation');
  page.resize(-30);
  assert.notEqual(page.marker.style.transform, outward, 'Flight adapts to layout resizing');
  page.scrollTo(0);
  assert.equal(page.marker.hidden, true, 'Flight marker disappears on reunion');
  assert(!page.classes.has('satellite-away'), 'The original satellite becomes visible again');
  assert.equal(page.paused, false, 'The original orbit resumes on reunion');
  page.scrollTo(flightScroll);
  page.reduced(true);
  assert.equal(page.marker.hidden, true, 'Reduced motion removes scroll-driven flight');
  assert.equal(page.paused, true, 'Reduced motion freezes the orbit');
  assert(!page.classes.has('satellite-ready'), 'Static waypoints remain visible with reduced motion');
  page.scrollTo(0);
  page.reduced(false);
  assert.equal(page.paused, false, 'The orbit resumes when reduced motion is disabled');
}
const deepLink = preview({ scroll: 1200 });
assert(deepLink.classes.has('sat-on-rail') && deepLink.paused, 'Opening at Selected work starts on the original rail');
const staticPage = preview({ reduced: true });
assert(staticPage.marker.hidden && staticPage.paused, 'Initial reduced-motion preference is respected');
const css = fs.readFileSync(require('node:path').join(__dirname, '../assets/css/site.css'), 'utf8');
assert(css.includes('transform 800ms var(--settle), opacity 300ms var(--ease)'), 'Original slide/pop transition timing is preserved');
for (const selector of ['.rail__sat', '.satellite-flight']) {
  const rule = css.slice(css.indexOf(selector + ' {')).split('}')[0];
  assert(!rule.includes('background:'), 'Satellite wrapper has a transparent background');
}
assert(css.includes('scroll-behavior: smooth') && css.includes('scroll-behavior: auto'), 'Smooth anchor navigation respects reduced motion');
console.log('Passed: desktop/mobile flight, reverse path, orbit resumption, rail fill, resize, deep links, and reduced motion.');
