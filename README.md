# Krittin Jindamai's Portfolio

A small static website for professors and research groups: who I am, what I work on, and the results, in as little reading time as possible.

- Plain HTML, one CSS file, one small JavaScript file. No framework, no build step, no dependencies.
- Works on GitHub Pages as-is. Every link is relative, so the repository can have any name.
- Pages work with JavaScript turned off. The script only adds polish.

## Contents

1. [File map](#file-map)
2. [Preview on your computer](#preview-on-your-computer)
3. [Publish on GitHub Pages](#publish-on-github-pages)
4. [Common edits](#common-edits)
5. [Snippets](#snippets)
6. [Design rules](#design-rules)
7. [Plot style](#plot-style)
8. [Checklist before pushing](#checklist-before-pushing)
9. [Open items](#open-items)

## File map

```
index.html            Home: intro, links, six selected projects
experience.html       Experience: education, honors, coursework, research, engineering and work experience
projects.html         Projects: one list of every project
projects/
  _template.html      Copy this to start a new project page
  <project>.html      One page per project
assets/
  css/site.css        All styles. Design tokens (colors, type, spacing) are in section 2
  js/site.js          Scroll reveal, trajectory rail, in-view video, figure lightbox
  fonts/              Self-hosted fonts (STIX Two Text, IBM Plex Sans; SIL Open Font License)
  img/<project>/      Images for each project, in a folder named like its page
  video/              Existing MP4 files and project-specific transparent WebM videos
  docs/               CV, transcript and papers (PDF)
docs/
  media-exports/      Animation preview, asset notes and original validation records
  archive/            Historical website handoff
.nojekyll             Tells GitHub Pages to serve the files untouched
```

The three main pages are in the navigation bar. Project pages are reached from the home page, the Experience page and the Projects page.

The header and footer are copied into every HTML file. If you change one, change it in all of them (search for `SITE HEADER` or `SITE FOOTER`).

## Preview on your computer

Double-clicking `index.html` works. For the closest match to the live site, run a local server from this folder:

```
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Publish on GitHub Pages

1. Create a new empty repository on GitHub. Its name becomes part of the address: `https://<username>.github.io/<repository-name>/`.
2. In this folder:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<username>/<repository-name>.git
   git push -u origin main
   ```
3. On GitHub: Settings → Pages → Build and deployment → Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** → Save.
4. Wait a minute or two, then open the address shown on that page.

Every later `git push` updates the site.

## Common edits

### Replace the CV or transcript

Overwrite the file in `assets/docs/` and keep the same file name:

- `assets/docs/Krittin-Jindamai-CV.pdf`
- `assets/docs/transcript.pdf`

No HTML changes are needed. If the CV content changed, update `experience.html` to match.

### Edit the intro, awards or coursework

Edit the intro and Selected work in `index.html` (look for the `INTRO` and `SELECTED WORK` comments). Education, Honors and awards, and Relevant coursework are the first three sections in `experience.html`. The navigation label is Education and experience; the page title and filename remain Experience and `experience.html`.

To show the PhD application line, find `Optional line for application season` in `index.html` and remove the comment marks around it.

### Fill a placeholder

Placeholders are marked in the HTML with `PLACEHOLDER` comments. Search the project for that word to find all of them.

- **Figure on a project page:** replace the whole `<figure>` that contains `<div class="placeholder">` with the [Figure snippet](#figure).
- **Text on a project page:** replace the `<div class="placeholder placeholder--text">` with normal `<p>` or `<ul>` elements.
- **Figure on the home page:** inside the project's `<a class="work__figure stack ...">`, replace the `<div class="stack__card placeholder">…</div>` with one to three `<img class="stack__card">` and set `stack--N` to the count (see [Home page plot cards](#home-page-plot-cards)).
- **Thumbnail on the Projects page:** replace `<div class="placeholder">…</div>` inside `index__thumb` with `<img src="assets/img/<project>/<file>" alt="" loading="lazy" decoding="async">`.

### Add a project

1. Copy `projects/_template.html` to `projects/<project-name>.html`. Use lowercase letters and hyphens.
2. Replace every item marked `EDIT`.
3. Put images in `assets/img/<project-name>/`, PDFs in `assets/docs/`, videos in `assets/video/`.
4. Open `projects.html`, copy one `<li>…</li>` row in the right list, and change its link, thumbnail, title, description, dates and status.
5. Update the `Previous` / `Next` links at the bottom of the neighbouring project pages if you want the new page in that chain.
6. Optional: add it to `experience.html`.

### Change which projects are on the home page

In `index.html`, each selected project is one `<li class="work__item">` block that starts with a `SELECTED WORK ITEM` comment. Reorder, remove or copy whole blocks. The intro button scrolls smoothly to `#selected-work` (instantly with reduced motion enabled), and the bottom Other projects button links to `projects.html`. Keep it to about six; the page is meant to be read in two minutes.

### Change a status

```html
<span class="status status--progress">In progress</span>
<span class="status status--done">Complete</span>
```

A project's status appears in up to three places: its own page, `projects.html`, and `index.html` if it is a selected project.

## Snippets

Paths below are written for a file inside `projects/` (they start with `../`). On the three top-level pages, drop the `../`.

### Figure

Click-to-enlarge and the "Figure N." label are automatic. Do not type the figure number.

```html
<figure class="figure">
  <a class="figure__frame figure__frame--white figure__frame--pad" href="../assets/img/<project>/<file>.png" data-zoom>
    <img src="../assets/img/<project>/<file>.png" alt="Describe the plot for someone who cannot see it." width="1200" height="750" loading="lazy" decoding="async">
  </a>
  <figcaption>What the figure shows and why it matters.</figcaption>
</figure>
```

- `width` and `height` are the image's real pixel size. They stop the page from jumping while it loads.
- Add `figure--wide` to span both columns of a figure grid, or `figure--lead` for the main figure under the facts.
- `figure__frame--white` gives plots a white background; `figure__frame--pad` adds a margin around them. Leave both off for photos.

### Video on a project page

Nothing downloads until the visitor presses play.

```html
<figure class="figure figure--wide">
  <div class="figure__frame">
    <video controls preload="none" playsinline poster="../assets/img/<project>/poster.jpg" width="1280" height="720" aria-label="Describe the video.">
      <source src="../assets/video/<file>.mp4" type="video/mp4">
    </video>
  </div>
  <figcaption>Caption text.</figcaption>
</figure>
```

### Home page plot cards

Each selected project shows one to three overlapping white cards. The **last** `<img>` is the card in front, so put the headline result last. The class `stack--N` must match the number of cards.

```html
<a class="work__figure stack stack--3 reveal" href="projects/<project>.html" aria-label="Open the project page">
  <img class="stack__card" src="assets/img/<project>/home-back.webp" alt="Short description." width="800" height="600" loading="lazy" decoding="async">
  <img class="stack__card" src="assets/img/<project>/home-middle.webp" alt="Short description." width="800" height="600" loading="lazy" decoding="async">
  <img class="stack__card" src="assets/img/<project>/home-front.webp" alt="Describe the headline plot." width="1000" height="700" loading="lazy" decoding="async">
</a>
```

- Use plots with a white or transparent background so they blend into the card. No gray MATLAB figure backgrounds: in MATLAB run `set(gcf, "Color", "w")` before exporting.
- Home-page versions are small copies, about 800 to 1000 px wide and under 60 KB each, named `home-*.webp`.

### Home page video

A project with a video shows that one video and no other cards. It plays muted only while it is on screen.

```html
<a class="work__figure stack stack--1 stack--video reveal" href="projects/<project>.html" aria-label="Open the project page">
  <video class="stack__card" data-inview muted loop playsinline preload="none" poster="assets/img/<project>/poster.jpg" width="768" height="432" aria-label="Describe the video.">
    <source src="assets/video/<file>-loop.mp4" type="video/mp4">
  </video>
</a>
```

Keep loops short, without sound, and under about 1.5 MB. This command makes one from a longer clip:

```
ffmpeg -i input.mp4 -an -vf "scale=768:432,fps=24" -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart output-loop.mp4
```

For a screen recording with a light gray background (a MATLAB figure window, for example), crop away the window frame and push the gray to white so the video blends into the page. Adjust the crop numbers (width:height:x:y) to the recording:

```
ffmpeg -i input.mp4 -an -vf "crop=704:528:0:68,colorlevels=rimax=0.93:gimax=0.93:bimax=0.93,fps=24" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart output.mp4
```

### Transparent simulation videos

The nonholonomic CBF and honors-thesis pages use transparent WebM videos as their lead figures. The Projects page uses those videos as previews. In Selected work, the thesis uses three plot cards, with the flywheel-speed comparison in front.

- Videos: `assets/video/cbf-nonholonomic/` and `assets/video/honors-thesis/`.
- Posters, alternate animated WebP exports and reusable stills: the matching folders under `assets/img/`.
- Use `media--transparent` on the containing figure, thumbnail or video card. Its CSS filter gives the original light outlines a dark appearance on the white page without altering the source files.
- Videos play muted only while visible. Detail-page controls allow manual playback, including with reduced motion enabled. Previews use `preload="none"` so the full simulations are not fetched during the initial page load.
- Export notes, original validation records and a working format/background preview are in [docs/media-exports](docs/media-exports/README.md).

The lunar hopper uses `assets/video/lunar-hopper/hopper-trajectory.webm` for its home, Projects and detail-page videos. Its `media--hopper` class darkens pale trajectory lines for white backgrounds. The detail page shows only Astro flight profiles and GN touchdown dispersion, split into readable panels, plus the cleaned CAD image. Original exports, unused plots and the WebP alternative remain in `assets/img/lunar-hopper/`; [hopper media notes](docs/media-exports/lunar-hopper/README.md) document organization and reproducible styling.

### Link buttons on a project page

```html
<p class="actions">
  <a class="btn btn--primary" href="../assets/docs/<paper>.pdf" target="_blank" rel="noopener">Paper (PDF)</a>
  <a class="btn" href="https://github.com/yim1305/<repo>" target="_blank" rel="noopener">Code on GitHub</a>
  <a class="btn" aria-disabled="true">Paper in preparation</a>
</p>
```

Use `btn--primary` once per page, for the most important link. On the home page this is Selected work.

**Every link to a PDF, to GitHub, or to any other site opens in a new tab:** add `target="_blank" rel="noopener"` to the `<a>`. Links between pages of this site stay in the same tab.

## Design rules

The site should read like a well-typeset paper: white page, navy ink, hairline rules, captioned figures. Follow these to keep it that way.

**Do**

- Use the tokens at the top of `assets/css/site.css` for every color, font and size.
- Reuse existing classes and the snippets above before writing new CSS.
- Give every image real `width` and `height` attributes, `alt` text, and `loading="lazy"` unless it is at the very top of a page.
- Lead with the result. A reader should learn what was done and what happened from the first two lines of any block.
- Write in sentence case. No all-caps labels.
- Keep images under about 300 KB each (export plots as SVG, or PNG/WebP no wider than 1600 px).

**Don't**

- Add libraries, frameworks, CSS resets, icon fonts, analytics or web fonts from a CDN.
- Add gradients, glow, blur, glass effects, emoji, or rounded "pill" tags. The only shadow is `--card-shadow`, on the overlapping plot cards of the home page.
- Add new colors. The orange `--signal` is only for the satellite marker and the in-progress dot. Blue `--link` is only for links.
- Add new animation. Every animation is listed in section 14 of `site.css`: the orbit drawing itself once, the satellite circling the portrait and wiggling, the satellite flying reversibly between its orbit and the trajectory line as the page scrolls, plot cards dealing in once, the one-time text reveal. All of them animate only `transform` or `opacity` and switch off for visitors who prefer reduced motion. The satellite uses a passive scroll listener that schedules at most one `requestAnimationFrame`; the other reveals use IntersectionObserver.
- Put more than three cards per project on the home page, or combine a video with other cards.
- Open a PDF, a GitHub link or any external link in the same tab.
- Use 3D, canvas or WebGL, or draw charts in the browser. Plots are static images.

## Plot style

Plots look consistent when they share these settings (matplotlib shown; use the same values in MATLAB).

```python
INK, INK2, RULE, GRID = "#0e1a33", "#45506a", "#c5cddb", "#e8ecf2"
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"]   # use in this order
plt.rcParams.update({
    "font.family": "IBM Plex Sans", "font.size": 12, "svg.fonttype": "path",
    "axes.edgecolor": RULE, "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
    "axes.spines.top": False, "axes.spines.right": False,
    "xtick.major.size": 0, "ytick.major.size": 0,
    "axes.grid": True, "grid.color": GRID, "axes.axisbelow": True,
    "savefig.transparent": True,
})
# 2 px lines, horizontal gridlines only, one y-axis per panel, legend plus labels at line ends.
# Detail-page figure: figsize=(9.6, 4.5). Home-page figure: figsize=(7.2, 4.5), font.size 15.
```

- One measure per axis. For two quantities use two panels side by side, never two y-axes.
- Compare cases (for example, controller off and on) as side-by-side panels with a shared y-axis.
- Label axes with units.

## Checklist before pushing

- [ ] Open all three main pages and any page you changed. Check at a narrow window width too.
- [ ] Click every new link, PDF and figure.
- [ ] Search the project for `PLACEHOLDER` and `EDIT` to see what is still unfinished.
- [ ] New images have `width`, `height` and `alt`.
- [ ] If the header or footer changed, it changed in every HTML file.
- [ ] CV facts on the site match the current CV PDF.

## Open items

Things left for the owner to fill in or confirm:

- **CLF-MCBF for safe HCMG mode switching:** result figure, write-up and paper link (placeholders on its page, on the home page and on the Projects page).
- **Lunar hopper numbers:** the project page reports the navigation results recorded in the repository README (median 12 to 13 m, worst 23 to 34 m, 100 runs). The CV and the Experience page say "RMS landing error below 10 m across 1,000 Monte Carlo simulations". Make the two agree.
- **Payload flight software** flight-data plot: the axis units (m, m/s) were carried over from the previous site. The values look more like ft and ft/s; confirm and regenerate if needed.
- **Airbrake** result plots are small screenshots (about 390 px wide). Higher-resolution exports from MATLAB would look sharper.

### The satellite

The satellite is one SVG symbol (`<symbol id="sat">` near the top of `index.html`), colored by the `.sat__*` rules in `site.css`. It circles the portrait, then flies continuously from its current orbit position to the Selected work rail as the visitor scrolls down. The orbit clock pauses during this trip. Scrolling up retraces the same curve, rejoins the saved orbit position, and resumes the orbit clock. On the rail, the original IntersectionObserver selects the project at mid-screen, preserving the 800 ms spring slide, 300 ms pop/fade, wiggle, and 700 ms rail fill. A separate transparent marker is visible only during the flight between orbit and rail; neither satellite wrapper has a white background circle. `site.js` section 2 uses a passive scroll listener and requestAnimationFrame for the connecting flight transforms, and remeasures layout on resize, image/font load, and ResizeObserver notifications. Reduced motion keeps the satellite still on its orbit and shows static waypoints. Run `node scripts/check-satellite.cjs` for desktop/mobile behavior checks. To change the icon, edit the shapes inside the symbol only.

### Icon buttons

LinkedIn, GitHub and Email in the intro are round icon buttons with a tooltip (`data-label`). LinkedIn and GitHub use recognizable SVG brand marks in the site's navy ink; Email uses an envelope outline. The `.icon-btn__brand` class fills the brand marks with `currentColor` instead of applying the envelope's stroke. GitHub artwork: https://github.com/primer/octicons/blob/main/icons/mark-github-16.svg. LinkedIn brand reference: https://brand.linkedin.com/in-logo.

### Intro portraits

The intro displays only `assets/img/portrait.jpg` (the smiling headshot), with no photo swapping. The unused `assets/img/portrait-rocket.jpg` is retained for future use. To change the displayed photo, replace the headshot with another square image of at least 600 x 600 px.
