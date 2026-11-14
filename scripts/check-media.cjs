// Behavioral checks for video lifecycle and bounded page prefetching.
// Run: node scripts/check-media.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function preview({ saveData = false, reduced = false, hidden = false, hoverOnly = false } = {}) {
  const listeners = {};
  const listen = (name, fn) => (listeners[name] ||= []).push(fn);
  const fire = name => (listeners[name] || []).forEach(fn => fn());
  const observers = [];
  const hints = [];
  const cardEvents = {};
  const card = { addEventListener: (name, fn) => { cardEvents[name] = fn; } };
  const motion = { matches: reduced, addEventListener: (_, fn) => listen('motion', fn) };
  const connection = { saveData, effectiveType: '4g', addEventListener: (_, fn) => listen('connection', fn) };
  const video = {
    paused: true, readyState: 0, plays: 0, loads: 0, controls: false,
    hasAttribute: name => name === 'data-hover' && hoverOnly,
    closest: selector => hoverOnly && (selector === '.card' || selector === 'a') ? card : null,
    pause() { this.paused = true; },
    play() { this.plays++; this.paused = false; return Promise.resolve(); },
    load() { this.loads++; this.readyState = 1; }
  };
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe() {}
    send(ratio) { this.callback([{ target: video, isIntersecting: ratio > 0, intersectionRatio: ratio }]); }
  }
  const doc = {
    hidden, readyState: 'complete',
    querySelector: () => null,
    querySelectorAll: selector => selector === 'video[data-inview]' ? [video] : [],
    addEventListener: listen,
    createElement: () => ({}),
    head: { appendChild: hint => hints.push(hint) }
  };
  const win = {
    IntersectionObserver: Observer,
    matchMedia: () => motion,
    location: { protocol: 'https:', origin: 'https://example.test', pathname: '/Portfolio/' }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/site.js'), 'utf8'), {
    window: win, document: doc, navigator: { connection }, IntersectionObserver: Observer
  });
  const warm = observers.find(o => o.options.rootMargin);
  const visible = observers.find(o => o.options.threshold);
  return {
    video, hints, warm: ratio => warm.send(ratio), visible: ratio => visible.send(ratio),
    enter(pointerType = 'mouse') { cardEvents.pointerenter({ pointerType }); },
    leave() { cardEvents.pointerleave(); },
    hidden(value) { doc.hidden = value; fire('visibilitychange'); },
    saver(value) { connection.saveData = value; fire('connection'); },
    reduced(value) { motion.matches = value; fire('motion'); },
    slow() { connection.effectiveType = '2g'; },
    hover(page, attributes = []) {
      const link = {
        target: '', origin: win.location.origin, pathname: '/Portfolio/' + page,
        href: win.location.origin + '/Portfolio/' + page,
        hasAttribute: name => attributes.includes(name)
      };
      (listeners.mouseover || []).forEach(fn => fn({ target: { closest: () => link } }));
    }
  };
}

const page = preview();
assert.equal(page.video.loads, 0, 'No video download before approaching the viewport');
page.warm(0.1);
assert.equal(page.video.loads, 1, 'Nearby video is prepared once');
assert(page.video.paused, 'Preparing a video does not play it');
page.visible(0.1);
assert(page.video.paused, 'A sliver of visible video does not start decoding');
page.visible(0.5);
assert(page.video.paused, 'Half-visible video stays paused');
page.visible(0.999);
assert(page.video.paused, 'Almost fully visible video stays paused');
page.visible(1);
assert(!page.video.paused, 'Fully visible video starts playing');
page.visible(0.999);
assert(page.video.paused, 'Video pauses as soon as it is no longer fully visible');
page.visible(1);
page.hidden(true);
assert(page.video.paused, 'Background tabs stop video playback');
page.hidden(false);
assert(!page.video.paused, 'Returning to a visible video resumes playback');
page.visible(0);
page.hidden(true);
page.hidden(false);
assert(page.video.paused, 'Returning does not resume an offscreen video');
page.visible(1);
page.reduced(true);
assert(page.video.paused && page.video.controls, 'Changing motion preference stops autoplay and exposes manual controls');
page.reduced(false);
assert(!page.video.paused, 'Disabling reduced motion restores visible autoplay');
page.saver(true);
assert(page.video.paused, 'Enabling data saver stops autoplay');

for (const options of [{ saveData: true }, { reduced: true }, { hidden: true }]) {
  const limited = preview(options);
  limited.warm(1);
  limited.visible(1);
  assert.equal(limited.video.loads, 0, 'Restricted page does not warm video');
  assert.equal(limited.video.plays, 0, 'Restricted page does not autoplay');
}
const manual = preview({ saveData: true });
manual.visible(1);
manual.video.play();
assert(!manual.video.paused, 'Data saver still allows explicit manual playback');
manual.hidden(true);
assert(manual.video.paused, 'Manual playback also stops when the tab is hidden');

const hovered = preview({ hoverOnly: true });
hovered.warm(1);
hovered.visible(1);
assert.equal(hovered.video.loads, 0, 'Projects cards do not download video just by entering the viewport');
assert(hovered.video.paused, 'Fully visible Projects card waits for hover');
hovered.enter('touch');
assert(hovered.video.paused, 'Touch pointers retain static previews');
hovered.enter();
assert(!hovered.video.paused, 'Mouse hover starts a fully visible Projects preview');
assert.equal(hovered.video.loads, 1, 'Mouse hover prepares the video');
hovered.leave();
assert(hovered.video.paused, 'Leaving the whole card pauses its preview');
hovered.visible(0.999);
hovered.enter();
assert(hovered.video.paused, 'Hover does not override full visibility');
hovered.visible(1);
assert(!hovered.video.paused, 'A hovered card plays once fully visible');
hovered.hidden(true);
assert(hovered.video.paused, 'Hovered previews stop in background tabs');
hovered.leave();
hovered.hidden(false);
assert(hovered.video.paused, 'Returning to an unhovered card does not play');

const navigation = preview();
navigation.hover('figure.html', ['data-zoom']);
navigation.hover('download.html', ['download']);
assert.equal(navigation.hints.length, 0, 'Zoom and download links are excluded');
navigation.hover('projects.html');
navigation.hover('projects.html');
navigation.hover('experience.html');
navigation.hover('projects/lunar-hopper.html');
assert.equal(navigation.hints.length, 2, 'At most two unique pages are prefetched');
assert(navigation.hints.every(hint => hint.rel === 'prefetch'), 'Hints fetch documents without executing another page');
const saver = preview({ saveData: true });
saver.hover('projects.html');
assert.equal(saver.hints.length, 0, 'Data saver disables prefetch');
const slow = preview();
slow.slow();
slow.hover('projects.html');
assert.equal(slow.hints.length, 0, 'Slow connections disable prefetch');

console.log('Passed: full video visibility, mouse-only Projects previews, background tabs, preferences, manual playback, and bounded HTML prefetch.');
