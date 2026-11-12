# Transparent animation exports

Upload the `.webp` files to a website's image block for the easiest embedding, including Safari. They animate and loop automatically. Upload the `.webm` files if your site supports custom HTML/video assets; those include an alpha channel for transparent playback in Chrome, Edge and Firefox. Safari's video transparency support varies, so use the animated WebP option there. These are designed for dark backgrounds, like the original portfolio.

| Animation | Dimensions | Duration | Video | Animated image |
| --- | --- | --- | --- | --- |
| CBF tracker | 1200 × 500 | 41.2 s | `cbf-tracker.webm` (30 fps) | `cbf-tracker.webp` (15 fps) |
| CMG rotation | 720 × 720 | ~93.4 s | `cmg-rotation.webm` (30 fps) | `cmg-rotation.webp` (15 fps) |

An additional `cmg-rotation-small.webp` is 480 × 480 at 12 fps (about 20 MB, versus 23 MB for the full-size version). The CMG files include the full playback, so they are substantially larger than the CBF files (about 2.7–2.9 MB).

CBF uses the recorded 0–80 s run at 2× speed plus the existing end hold. The floor fill is omitted; the safe-set markers, grid, commanded spiral, robot and measured trail remain. The commanded spiral extends beyond the room and the canvas, as on the original page.

CMG uses the original simulation clock, quaternions and fixed ECI camera view, with body-axis and nadir labels. This export shows the satellite rotation alone, without the Earth/orbit panel or charts. Both animations restart at the beginning of each loop.

## Image embed (works in ordinary website image blocks)

```html
<img src="cbf-tracker.webp" alt="CBF robot tracking a spiral inside its safe set"
     width="1200" height="500" style="max-width:100%;height:auto">
<img src="cmg-rotation.webp" alt="CMG satellite attitude and nadir direction"
     width="720" height="720" style="max-width:100%;height:auto">
```

## Video embed

```html
<video autoplay muted loop playsinline preload="metadata"
       width="1200" height="500" style="max-width:100%;height:auto;background:transparent"
       aria-label="CBF robot tracking playback">
  <source src="cbf-tracker.webm" type="video/webm">
</video>
<video autoplay muted loop playsinline preload="metadata"
       width="720" height="720" style="max-width:100%;height:auto;background:transparent"
       aria-label="CMG satellite rotation">
  <source src="cmg-rotation.webm" type="video/webm">
</video>
```

Use `index.html` to preview both formats against different backgrounds. The PNGs are transparent still frames; files ending in `-preview.jpg` have a dark background only for convenient inspection.

Regenerate from the repository root with `node scripts/export-transparent-animations.mjs`. Render dependencies live in the ignored `.animation-tools` folder. The live portfolio uses the same default animation behavior; export mode is enabled only by this script.

Format references: https://developer.chrome.com/blog/alpha-transparency-in-chrome-video and https://www.remotion.dev/docs/transparent-videos

Validation: `node scripts/verify-transparent-animations.mjs` decoded both VP9 videos with alpha and verified animated WebP alpha, duration and infinite looping. Opening, middle and final frames were inspected. The existing site performance suite passed 11 of 13 checks; its two unrelated failures expect an old asset cache suffix and a chart function that has already moved to `cmg-charts.js`.
