// Exercise the real site script with scroll, SVG-clock, and layout fixtures.
// Run: node scripts/check-satellite.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function preview({ reduced = false, scroll = 0, mobile = false } = {}) {
  const events = {};
  const classes = new Set();
  let pending;
  let paused = false;
  let widthShift = 0;
  const classList = set => ({
    add: (...names) => names.forEach(n => set.add(n)),
    remove: (...names) => names.forEach(n => set.delete(n)),
    toggle: (name, on) => { if (on) set.add(name); else set.delete(name); },
    contains: name => set.has(name)
  });
  const motion = { matches: reduced, addEventListener: (_, fn) => { events.motion = fn; } };
  const firstY = mobile ? 1150 : 900;
  const pageHeight = firstY + 3200;
  const win = {
    pageYOffset: scroll, innerHeight: mobile ? 700 : 800,
    matchMedia: () => motion,
    getComputedStyle: () => ({ getPropertyValue: name => ({ '--rail-amp': mobile ? '10px' : '18px', '--rail-wave': mobile ? '320px' : '520px' }[name] || '') }),
    addEventListener: (name, fn) => { events[name] = fn; },
    requestAnimationFrame: fn => { pending = fn; return 1; }
  };
  const rect = (left, top, width, height) => ({ left, top: top - win.pageYOffset, width, height });
  const marker = { hidden: false, style: {}, setAttribute() {}, className: 'rail__sat' };
  const railMarker = { ...marker, style: {}, cloneNode: () => marker };
  const items = [0, 450, 950, 1400, 1900, 2400].map(offset => {
    const set = new Set();
    return { offsetTop: offset, passed: set, classList: classList(set), querySelector: () => ({ offsetTop: 47, offsetHeight: 10 }) };
  });
  const rail = {
    firstChild: null,
    insertBefore() {},
    querySelector: () => railMarker,
    getBoundingClientRect: () => rect(79 + widthShift, firstY - 52, 2, 2500)
  };
  const wrapClasses = new Set();
  const wrap = { classList: classList(wrapClasses), querySelector: () => rail, querySelectorAll: () => items };
  const svg = { pauseAnimations: () => { paused = true; }, unpauseAnimations: () => { paused = false; } };
  const orbitSat = {
    getScreenCTM: () => ({
      e: (mobile ? 220 : 900) + widthShift,
      f: (mobile ? 800 : 300) - win.pageYOffset,
      a: Math.cos(-Math.PI / 7) * 0.8,
      b: Math.sin(-Math.PI / 7) * 0.8
    })
  };
  const created = [];
  const elements = { '.work-wrap': wrap, '.orbit__svg': svg, '.orbit__sat': orbitSat };
  const doc = {
    documentElement: { classList: classList(classes), scrollHeight: pageHeight },
    querySelector: name => elements[name] || null,
    querySelectorAll: name => name === 'svg.orbit__svg' ? [svg] : [],
    createElementNS: () => { const node = { attributes: {}, style: {}, setAttribute(key, value) { this.attributes[key] = value; }, appendChild() {} }; created.push(node); return node; },
    createElement: () => { const node = { attributes: {}, style: {}, setAttribute(key, value) { this.attributes[key] = value; }, appendChild() {} }; created.push(node); return node; },
    body: { appendChild: element => { assert.equal(element, marker); } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/site.js'), 'utf8'), { window: win, document: doc, navigator: {}, Math, Promise });
  const flush = () => { let guard = 0; while (pending && guard++ < 2000) { const fn = pending; pending = null; fn(); } assert(guard < 2000, 'The eased scroll settles'); };
  flush();
  const done = () => created.find(node => node.attributes.class === 'rail__done');
  // The flown path is revealed by a clipping window: the mask slides down and its content slides back up.
  const mask = () => created.find(node => node.className === 'rail__mask');
  const shiftOf = node => Number(/translate3d\(0,([-\d.]+)px/.exec(node.style.transform)[1]);
  const railHeight = 2500;
  return {
    marker, railMarker, classes, wrapClasses,
    get paused() { return paused; },
    get flown() {
      const content = created.find(node => node.attributes.class === 'rail__curve' && node.style.transform);
      assert.equal(shiftOf(content), -shiftOf(mask()), 'The clipped curve stays still while its window moves');
      return railHeight + shiftOf(mask());
    },
    get pathLength() { return 2400 + 47 + 5 + 2; },   // last waypoint centre, plus the round cap
    get curve() { return done().attributes.d; },
    get passed() { return items.filter(item => item.passed.has('is-passed')).length; },
    get railX() { return Number(/translate3d\(([-\d.]+)px/.exec(railMarker.style.transform)[1]); },
    scrollTo(y) { win.pageYOffset = y; events.scroll(); flush(); },
    reduced(value) { motion.matches = value; events.motion(); flush(); },
    resize(dx) { widthShift = dx; events.resize(); flush(); },
    arrival: firstY - win.innerHeight / 2,
    end: pageHeight - win.innerHeight
  };
}

for (const mobile of [false, true]) {
  const page = preview({ mobile });
  const flightScroll = page.arrival - 150;
  assert(page.wrapClasses.has('work-wrap--curved'), 'The rail is switched to its curved form');
  assert.equal(page.marker.hidden, true, 'Only the orbit satellite is shown at the top');
  assert.equal(page.paused, false, 'The orbit runs at the top');
  assert.equal(page.passed, 0, 'No waypoint is filled at the top');

  page.scrollTo(flightScroll);
  assert.equal(page.marker.hidden, false, 'A visible satellite flies between sections');
  assert.equal(page.paused, true, 'The departure phase is preserved');
  assert(page.classes.has('satellite-away'), 'Hide the orbit copy during flight');
  assert(!page.classes.has('sat-on-rail'), 'The rail satellite stays hidden during flight');
  const outward = page.marker.style.transform;

  page.scrollTo(page.arrival + 100);
  assert(page.classes.has('sat-on-rail'), 'The rail satellite takes over after landing');
  assert.equal(page.marker.hidden, true, 'The flight-only copy is hidden after landing');
  assert.equal(page.passed, 1, 'The first waypoint fills on arrival');
  const firstFlown = page.flown;
  const firstX = page.railX;
  const firstSpot = page.railMarker.style.transform;

  page.scrollTo(page.arrival + 700);
  assert(page.flown > firstFlown, 'The flown part of the path grows while scrolling down');
  assert(page.passed >= 2, 'Waypoints fill as the satellite passes them');
  const xs = new Set([firstX, page.railX]);
  for (let y = page.arrival + 150; y < page.arrival + 700; y += 60) { page.scrollTo(y); xs.add(page.railX); }
  assert(xs.size > 6 && Math.max(...xs) - Math.min(...xs) > 12, 'The satellite moves sideways along a curve, not down a straight line');
  assert(/^M[-\d.]+ [-\d.]+L/.test(page.curve) && page.curve.split('L').length > 100, 'The curve is drawn as a sampled path');

  page.scrollTo(page.arrival + 100);
  assert.equal(page.railMarker.style.transform, firstSpot, 'Scrolling up returns the satellite to the same spot on the curve');
  assert.equal(page.flown, firstFlown, 'The flown part shrinks again while scrolling up');
  assert.equal(page.passed, 1, 'Waypoints empty again while scrolling up');

  page.scrollTo(page.end);
  assert.equal(page.passed, 6, 'Every waypoint is filled at the end of the page');
  assert(Math.abs(page.flown - page.pathLength) < 0.2, 'The whole path is flown at the end of the page');

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
  assert(!page.classes.has('satellite-away'), 'Reduced motion keeps the satellite on its orbit');
  assert.equal(page.passed, 6, 'Reduced motion shows every waypoint filled');
  assert(Math.abs(page.flown - page.pathLength) < 0.2, 'Reduced motion shows the whole path');
  page.scrollTo(0);
  page.reduced(false);
  assert.equal(page.paused, false, 'The orbit resumes when reduced motion is disabled');
}
const deepLink = preview({ scroll: 1200 });
assert(deepLink.classes.has('sat-on-rail') && deepLink.paused, 'Opening at Selected work starts on the path');
const staticPage = preview({ reduced: true });
assert(staticPage.marker.hidden && staticPage.paused, 'Initial reduced-motion preference is respected');

const css = fs.readFileSync(path.join(__dirname, '../assets/css/site.css'), 'utf8');
for (const selector of ['.rail__sat', '.satellite-flight']) {
  const rule = css.slice(css.indexOf(selector + ' {')).split('}')[0];
  assert(!rule.includes('background:'), 'Satellite wrapper has a transparent background');
}
assert(css.includes('--rail-amp:') && css.includes('--rail-wave:'), 'The curve reads its swing and wavelength from site.css');
assert(css.includes('.orbit__sat:hover') && css.includes('--sat-happy: 1'), 'The satellite smiles while the pointer is on it');
assert(css.includes('scroll-behavior: smooth') && css.includes('scroll-behavior: auto'), 'Smooth anchor navigation respects reduced motion');
console.log('Passed: desktop/mobile flight, curved path both ways, waypoints, end of page, orbit resumption, resize, deep links, and reduced motion.');
