# Lunar hopper media

All 22 files from the temporary hopper export were moved into the repository and verified with SHA-256 before cleanup. Original simulation media and plot exports remain unchanged.

| Files | Location |
| --- | --- |
| Main transparent WebM video | `../../../assets/video/lunar-hopper/hopper-trajectory.webm` |
| Posters, animated WebP alternative and CAD images | `../../../assets/img/lunar-hopper/` |
| Original Astro and GN plots, including unused EKF/sensor-comparison plots for future use | `../../../assets/img/lunar-hopper/` |
| Export metadata, helper, examples and original handoff | This folder |

The video appears in Selected work, the Projects list and the detail page. It plays muted while visible and uses a static poster before loading. The detail page has playback controls.

The `media--hopper` class darkens pale trajectory lines for white backgrounds using a brightness/saturation adjustment. Original colors and the supplied alpha-detection/WebP-fallback helper remain available in [the preview](preview.html).

## Published plots

Only Astro flight profiles and GN touchdown dispersion are shown on the project page. Presentation PNGs:

- `flight-profiles-detail.png`: the four flight-profile panels, with the internal case identifier removed from the title area.
- `touchdown-outbound-scatter.png` and `touchdown-return-scatter.png`: outbound/return dispersion panels.
- `touchdown-outbound-distribution.png` and `touchdown-return-distribution.png`: case C histograms with original median, percentile and worst-run annotations.

The crops preserve data geometry, axes, units, annotations and colored series. Grayscale labels and grids use the site's navy palette; near-white backgrounds are made white. The complete original GN figure retains its unaided-navigation panels for future use.

Regenerate presentation plots with the built-in .NET drawing library from the repository root:

```powershell
Add-Type -Path scripts/media/HopperPlots.cs -ReferencedAssemblies System.Drawing
[HopperPlots]::Export((Get-Location).Path)
```

The GN study measures navigation estimation error at touchdown on a fixed trajectory, using 100 trials per sensor case and hop. TRN assumes 50 m per-axis position noise at 0.2 Hz. These conditions are recorded beside the published plots.

## Source records

- [source-notes.md](source-notes.md): original handoff; paths describe the original package.
- [manifest.json](manifest.json): original hashes, timing, rendering choices and provenance.
- [validation.json](validation.json): supplied export validation, preserved without claiming new browser checks.
- [embed.html](embed.html): reusable snippet with organized asset paths.
- `hopper.js` and `hopper.css`: supplied standalone embed helper for future use.
- [cad-edit-notes.md](cad-edit-notes.md): CAD cleanup instructions and saved result.

Terrain: NASA LOLA, Barker et al. (2023), *Planetary Science Journal* 4, 183; doi:10.3847/PSJ/acf3e1.
