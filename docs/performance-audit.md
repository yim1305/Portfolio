# Performance audit, 2026-11-14

Scope: local source inspection, linked asset sizes, MP4 structure inspection, and behavioral checks. No deployed mobile trace or FPS measurement was taken, so these findings do not establish a measured frame-rate improvement. GitHub Pages network latency and caching need a separate deployed check.

## Improvements applied

- Video autoplay now requires 100% visibility and pauses as soon as any part leaves the viewport. Videos too large to fit the viewport retain manual detail-page controls. Previously the callback checked only `isIntersecting`, which could keep partially visible videos playing.
- Preview videos pause when the tab is hidden and resume only if still visible and autoplay is allowed.
- Projects-list previews additionally require mouse hover over their card before warming or playing. Leaving the card pauses playback; touch visitors retain static previews. Home and detail-page videos use the full-visibility rule without requiring hover.
- Reduced motion and data saver prevent both automatic playback and speculative video warming. Changes to those preferences are handled while the page is open. Detail-page controls retain manual playback.
- Hover/focus/touch hints fetch only HTML, with a two-page limit. The previous Chromium speculation rules could prerender another page, executing its scripts and fetching subresources. Hints are disabled on data saver and reported 2G connections.

References: [IntersectionObserver intersection ratios](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry/intersectionRatio), [Chrome prerendering behavior](https://developer.chrome.com/docs/web-platform/prerender-pages/).

## Existing strengths

- No runtime dependencies or framework; shared CSS and deferred JavaScript.
- Two small, self-hosted normal font files are preloaded (about 73 KiB together).
- Home-page images are lazy except the high-priority portrait; image and video dimensions reserve layout space.
- Videos use `preload="none"` and static posters. Full flight videos are manually played.
- Every active MP4 has its `moov` metadata before `mdat`, allowing playback without fetching the whole file first.
- Where `ScrollTimeline` exists (Chrome, Edge, recent Safari), the satellite, its flight and the flown path are scroll-driven animations: keyframes are written once per layout and the compositor plays them, so no script runs per frame. Script only switches states (which satellite shows, which waypoints are filled). Not yet confirmed in a real browser trace.
- In other browsers the frame-by-frame fallback schedules frames only while catching up; geometry is cached between layout changes. The path uses transform-based clipping rather than redrawing its stroke each frame.
- Old 20+ MB CMG animations are not referenced by current HTML. Removing them would reduce repository size, but would not speed up the current pages.

## Remaining candidates, in priority order

| Candidate | Current file size | Possible next change |
| --- | ---: | --- |
| Home airbrake preview (`airbrake-loop.mp4`) | 1,175 KiB | Shorter loop or lower bitrate/frame rate; compare visual quality before replacing. This is the largest automatic preview. |
| Lunar hopper CAD (`hopper-vehicle-clean.png`) | 753 KiB | Add a smaller WebP display copy and retain the PNG for the lightbox. |
| Payload team photo (`team.jpg`) | 352 KiB | Add responsive WebP sizes for narrow screens. Already lazy-loaded. |
| Full airbrake flight (`airbrake-flight.mp4`) | 5,672 KiB | Optional lower-resolution playback source if deployed playback stalls. Already manual with no preload. |

The home page references about 1,972 KiB of image/video/poster files in total, and Projects about 970 KiB. These totals are not initial-transfer measurements: lazy images and deferred videos are not all requested at startup. Shared fonts, CSS and JavaScript are additional.

Before changing the orbit or path again, capture a browser Performance trace on the deployed page with a cold cache, a mobile viewport, CPU throttling and network throttling. Scroll through all projects in both directions; inspect long tasks, layout/paint cost, video decode and dropped frames. Compare warm-cache behavior separately. A slower download does not by itself establish a scroll-rendering bottleneck.

## Validation

Passed `node --check assets/js/site.js`, `node scripts/check-satellite.cjs`, and `node scripts/check-media.cjs`. These cover desktop/mobile satellite behavior, reverse scrolling, resizing, reduced motion, video visibility and tab lifecycle, data saver, manual playback, and prefetch limits. They use fixtures rather than a real browser rendering engine.
