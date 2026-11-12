# Hopper1 portfolio media

Copy this whole `portfolio-hopper` folder into your website repository's `public/` (or equivalent static assets directory). No installation, build step, Python or simulation inputs are needed. Nothing has been published.

## Animation

- `assets/video/hopper-trajectory.webm`: transparent VP9 video, 1600 × 900, 30 fps, 50 seconds, silent. Full outbound and return saved trajectory; lunar map, moving vehicle point, phase-colored trail and thrust arrow/plume. No text, axes, panels or inset windows are baked in.
- `assets/video/hopper-trajectory.webp`: transparent looping animated image, 960 × 540, 15 fps. Alternative when a browser's video decoder loses alpha. Can also be used directly as an `<img>`.
- `assets/video/hopper-poster.webp` and `.png`: transparent static poster, also used for reduced motion.

The animation uses the saved `a2200_08` optimizer samples, interpolated for playback. No trajectory was re-solved. Playback compresses roughly 21.4 minutes into 48 seconds, then holds the landing for 2 seconds. The rise, braking, observation and terminal phases are slowed as in the main animation. Display choices: fixed main camera, 2× vertical exaggeration, indicative thrust arrow/plume lengths, illustrative terrain shading. The plume is clipped near the DEM surface. Surface mesh uses every eighth pixel of the original 30 m DEM. The surrounding canvas is transparent; the lunar terrain itself is opaque.

## Embed

`embed.html` contains ready-to-copy HTML using `/portfolio-hopper/` paths. Include `hopper.css` and `hopper.js` once per page. Adjust the prefix for your site's base path. The module checks decoded video transparency and selects the animated WebP if necessary. It respects reduced motion and includes a pause/play button outside the media.

Serve `preview.html` through your website's development server to inspect the animation against dark, light and checkerboard backgrounds. Opening it directly as a local file may block ES modules; the static images remain usable. Actual alpha-video behavior depends on the browser/OS decoder; only the tested local browser is recorded in `validation.json`.

For a simple image-only embed:

```html
<picture>
  <source media="(prefers-reduced-motion: reduce)"
          srcset="/portfolio-hopper/assets/video/hopper-poster.webp">
  <img src="/portfolio-hopper/assets/video/hopper-trajectory.webp"
       alt="Lunar hopper flight over mapped terrain with thrust indicator"
       width="960" height="540" style="width:100%;height:auto">
</picture>
```

## Plots

Original high-resolution PNGs are preserved and accompanied by lossless WebP versions for web use. Plot backgrounds retain their original light theme for readable labels. Animation background is transparent.

| File stem in `assets/plots/` | What to show |
| --- | --- |
| `ekf-errors-outbound` | Main EKF plot: position, velocity and attitude errors, five Monte Carlo sample histories and filter ±3σ bounds. Case C: IMU + two star trackers + SPLICE TRN. |
| `ekf-errors-return` | Same EKF plot for the return hop; optional companion to the outbound plot. |
| `astro-flight-profiles` | Astro: altitude above DEM, speed, thrust and mass over the optimized round trip. |
| `gn-sensor-comparison` | GN: why TRN position aiding matters; compares IMU only, IMU + star trackers, and the full sensor set. |
| `gn-touchdown-dispersion` | GN: Monte Carlo touchdown estimation errors, distributions and comparison with unaided navigation. |

That is the main EKF result (both hops) plus three supporting plot types: one from Astro and two from GN. For a compact portfolio, show outbound EKF + flight profiles + sensor comparison; keep return EKF and touchdown distributions in a gallery.

Suggested caption: “Optimized lunar hopper round trip over a NASA LOLA terrain model, with a 15-state error-state EKF evaluated in a seeded sensor-error Monte Carlo study.”

The GN study uses 100 trials per sensor case per hop on a fixed trajectory. Its plotted horizontal “3σ” metric is 3 × horizontal RMS, not an empirical 99.7th percentile. These results describe navigation knowledge, not closed-loop landing accuracy. The saved study assumes placeholder TRN position noise of 50 m per axis (1σ) at 0.2 Hz; retain that context when discussing performance.

## Provenance and credit

`manifest.json` records source hashes, playback timing and rendering settings without absolute local paths. Simulation source/configuration and saved numerical results were read-only during export. `validation.json` records the media checks. Only presentation media and embed helpers are included in this folder; the numerical simulation files and terrain raster are not needed by your website.

Terrain: NASA LOLA, Barker et al. (2023), *Planetary Science Journal* 4, 183; doi:10.3847/PSJ/acf3e1. Source page recorded with the original terrain: https://pgda.gsfc.nasa.gov/products/90.
