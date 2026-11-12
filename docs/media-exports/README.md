# Simulation animation assets

The animation exports have been organized into the existing project asset folders. All 22 files from the temporary export folder were preserved; the source-to-destination SHA-256 hashes matched before the empty folder was removed.

| Project | Video | Animated image alternatives | Posters and stills |
| --- | --- | --- | --- |
| Nonholonomic CBF | `../../assets/video/cbf-nonholonomic/cbf-tracker.webm` | `../../assets/img/cbf-nonholonomic/cbf-tracker.webp` | `cbf-tracker-{start,middle,end}.png` and matching preview JPEGs in the same image folder |
| Honors thesis | `../../assets/video/honors-thesis/cmg-rotation.webm` | `../../assets/img/honors-thesis/cmg-rotation.webp` and `cmg-rotation-small.webp` | `cmg-rotation-{start,middle,end}.png` and matching preview JPEGs in the same image folder |

The CBF video is 1200 by 500 pixels and about 41.2 seconds long. The thesis rotation video is 720 by 720 pixels and about 93.4 seconds long. It shows the satellite's attitude, body axes and nadir direction, rather than the full orbit-and-charts simulation.

Both source videos retain their alpha channel and original light outlines. The portfolio's `media--transparent` class applies `invert(1) hue-rotate(180deg)` to present dark outlines against the white page. This also adjusts the accent colors. Remove the filter when reusing the originals against a dark background.

Open [the preview page](index.html) to switch between video and animated WebP, and between light and dark backgrounds. This page references the organized assets directly and contains no duplicate video files.

## Preserved export records

- [source-notes.md](source-notes.md): the original exporter handoff, preserved for reference. Its regeneration commands and dependency folders refer to the source project and are not included in this static website checkout.
- [validation.json](validation.json): the supplied export validation results, including dimensions, alpha checks and WebP loop information.
- `checks/`: the two original encoded-frame check PNGs.

The existing thesis plots and CBF Gazebo images remain available in their original project image folders. The historical website handoff is in `../archive/website-v2-handoff.md`.

## Lunar hopper

See [lunar-hopper/README.md](lunar-hopper/README.md) for the later hopper video export, original plots, presentation crops, cleaned CAD, source records and preview.
