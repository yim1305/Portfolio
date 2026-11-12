/* ==========================================================================
   site.js — the only script on the site. Plain JavaScript, no libraries.
   Every page works with this file missing; it only adds polish:

     1. Scroll reveal        elements with class "reveal" fade in once
     2. Trajectory rail      the satellite follows the project at mid-screen, both ways
     3. In-view video        <video data-inview> plays only while visible
     4. Lightbox             <a data-zoom href="big-image"> opens in a dialog
     5. Reduced motion       pauses the orbit animation if the user asks

   The class "js" is added to <html> by a one-line script in each page's
   <head>, so the hidden starting states in site.css never apply without JS.
   ========================================================================== */
(function () {
  "use strict";

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduceMotion = motionPreference.matches;
  var hasObserver = "IntersectionObserver" in window;

  /* Add a class the first time an element scrolls into view. */
  function onFirstView(selector, className, rootMargin) {
    var nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;
    if (!hasObserver) {
      nodes.forEach(function (n) { n.classList.add(className); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(className);
        io.unobserve(entry.target);
      });
    }, { rootMargin: rootMargin, threshold: 0 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* 1. Scroll reveal */
  onFirstView(".reveal", "is-in", "0px 0px -8% 0px");

  /* 2. Preserve the original waypoint-to-waypoint spring animation on the rail.
        A separate marker is used only for the reversible flight to/from the orbit.
        The SVG clock pauses while away and resumes at the same phase on return. */
  var wrap = document.querySelector(".work-wrap");
  var rail = wrap && wrap.querySelector(".rail");
  var orbitSvg = document.querySelector(".orbit__svg");
  var orbitSat = document.querySelector(".orbit__sat");
  var railSat = rail && rail.querySelector(".rail__sat");
  var workItems = wrap ? Array.prototype.slice.call(wrap.querySelectorAll(".work__item")) : [];
  if (rail && workItems.length && orbitSvg && orbitSat && railSat && hasObserver && orbitSat.getScreenCTM) {
    var root = document.documentElement;
    var away = false;
    var frame = 0;
    var needsMeasure = true;
    var geometry;
    var current = -2;
    var railY = 0;
    var inBand = workItems.map(function () { return false; });
    var flightSat = railSat.cloneNode(true);
    var clamp = function (value, min, max) { return Math.max(min, Math.min(max, value)); };

    /* Outside the clipped intro and rail, the flight can cross between sections. */
    flightSat.className = "satellite-flight";
    flightSat.hidden = true;
    flightSat.setAttribute("aria-hidden", "true");
    document.body.appendChild(flightSat);

    /* The original observer and spring timing still choose each project waypoint. */
    var place = function (index) {
      current = index;
      railY = 0;
      if (index >= 0) {
        var node = workItems[index].querySelector(".work__node");
        railY = workItems[index].offsetTop + node.offsetTop + node.offsetHeight / 2;
      }
      rail.style.setProperty("--rail-y", railY + "px");
      scheduleSatellite();
    };
    var band = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { inBand[workItems.indexOf(entry.target)] = entry.isIntersecting; });
      var next = inBand.lastIndexOf(true);
      if (next < 0) {
        var line = window.innerHeight * 0.45;
        if (workItems[0].getBoundingClientRect().top > line) next = -1;
        else if (workItems[workItems.length - 1].getBoundingClientRect().bottom < line) next = workItems.length - 1;
        else next = current;
      }
      if (next !== current) place(next);
    }, { rootMargin: "-45% 0px -54% 0px", threshold: 0 });
    workItems.forEach(function (item) { band.observe(item); });

    var updateSatellite = function () {
      frame = 0;
      if (motionPreference.matches) {
        away = false;
        flightSat.hidden = true;
        root.classList.remove("satellite-away", "satellite-ready", "sat-on-rail");
        rail.style.setProperty("--rail-progress", "1");
        if (orbitSvg.pauseAnimations) orbitSvg.pauseAnimations();
        return;
      }
      var scroll = Math.max(0, window.scrollY);
      if (needsMeasure) {
        var railRect = rail.getBoundingClientRect();
        var first = workItems[0].querySelector(".work__node").getBoundingClientRect();
        var focus = window.innerHeight * 0.5;
        var arrival = Math.max(120, first.top + first.height / 2 + scroll - focus);
        geometry = {
          x: railRect.left + railRect.width / 2,
          height: railRect.height,
          first: first.top + first.height / 2 + scroll,
          arrival: arrival,
          departure: Math.max(0, arrival - Math.max(180, Math.min(420, window.innerHeight * 0.55)))
        };
        needsMeasure = false;
        if (current >= 0) {
          var activeNode = workItems[current].querySelector(".work__node");
          railY = workItems[current].offsetTop + activeNode.offsetTop + activeNode.offsetHeight / 2;
          rail.style.setProperty("--rail-y", railY + "px");
        }
      }
      var progress = clamp((scroll - geometry.departure) / (geometry.arrival - geometry.departure), 0, 1);
      root.classList.add("satellite-ready");
      if (progress === 0) {
        flightSat.hidden = true;
        root.classList.remove("satellite-away", "sat-on-rail");
        rail.style.setProperty("--rail-progress", "0");
        if (orbitSvg.unpauseAnimations) orbitSvg.unpauseAnimations();
        away = false;
        return;
      }
      if (!away) {
        if (orbitSvg.pauseAnimations) orbitSvg.pauseAnimations();
        away = true;
      }
      if (progress === 1) {
        if (current < 0) place(0);
        flightSat.hidden = true;
        root.classList.add("satellite-away", "sat-on-rail");
        rail.style.setProperty("--rail-progress", String(clamp(railY / geometry.height, 0, 1)));
        return;
      }
      root.classList.remove("sat-on-rail");
      var matrix = orbitSat.getScreenCTM();
      if (!matrix) {
        /* Keep the original visible if its SVG has no rendered geometry yet. */
        flightSat.hidden = true;
        root.classList.remove("satellite-away", "satellite-ready", "sat-on-rail");
        away = false;
        if (orbitSvg.unpauseAnimations) orbitSvg.unpauseAnimations();
        return;
      }
      var x, y, size;
      var rotation = 0;
      {
        var sourceX = matrix.e;
        var sourceY = matrix.f + scroll;
        var distanceY = geometry.first - sourceY;
        var t = progress;
        var u = 1 - t;
        /* A gentle bend leaves the orbit and arrives vertically at the rail.
           Reversing scroll uses the same frozen origin and the same curve. */
        x = u * u * u * sourceX + 3 * u * u * t * sourceX + 3 * u * t * t * geometry.x + t * t * t * geometry.x;
        y = u * u * u * sourceY + 3 * u * u * t * (sourceY + distanceY * 0.45) + 3 * u * t * t * (geometry.first - distanceY * 0.2) + t * t * t * geometry.first;
        var orbitSize = 56 * Math.hypot(matrix.a, matrix.b);
        size = orbitSize + (44 - orbitSize) * t;
        rotation = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI * (1 - t);
      }
      flightSat.style.transform = "translate3d(" + (x - 22) + "px," + (y - scroll - 22) + "px,0) scale(" + (size / 44) + ") rotate(" + rotation + "deg)";
      rail.style.setProperty("--rail-progress", "0");
      flightSat.hidden = false;
      root.classList.add("satellite-away");
    };
    var scheduleSatellite = function () {
      if (!frame) frame = window.requestAnimationFrame(updateSatellite);
    };
    var measureSatellite = function () { needsMeasure = true; scheduleSatellite(); };
    window.addEventListener("scroll", scheduleSatellite, { passive: true });
    window.addEventListener("resize", measureSatellite);
    window.addEventListener("load", measureSatellite);
    if (motionPreference.addEventListener) motionPreference.addEventListener("change", measureSatellite);
    if ("ResizeObserver" in window) {
      var satelliteResize = new ResizeObserver(measureSatellite);
      satelliteResize.observe(document.querySelector(".intro"));
      satelliteResize.observe(wrap);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSatellite);
    scheduleSatellite();
  }

  /* 3. In-view video: muted loops that play only while on screen */
  var videos = document.querySelectorAll("video[data-inview]");
  if (videos.length && hasObserver && !reduceMotion) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          var p = v.play();
          if (p && p.catch) p.catch(function () { if (!v.closest("a")) v.controls = true; });
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.5 });
    videos.forEach(function (v) { vio.observe(v); });
  } else {
    videos.forEach(function (v) { if (!v.closest("a")) v.controls = true; });
  }

  /* 4. Lightbox: enlarge a figure in a native <dialog>; falls back to opening the image */
  var zoomLinks = document.querySelectorAll("a[data-zoom]");
  if (zoomLinks.length && "HTMLDialogElement" in window) {
    var dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Enlarged figure");
    var big = document.createElement("img");
    big.alt = "";
    dialog.appendChild(big);
    document.body.appendChild(dialog);
    dialog.addEventListener("click", function () { dialog.close(); });
    zoomLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        var img = link.querySelector("img");
        big.src = link.getAttribute("href");
        big.alt = img ? img.alt : "";
        /* Vector plots have no pixel size, so give them room. */
        if (/\.svg$/i.test(big.src)) dialog.setAttribute("data-plot", ""); else dialog.removeAttribute("data-plot");
        dialog.showModal();
      });
    });
  }

  /* 5. Reduced motion: freeze the orbiting satellite */
  if (reduceMotion) {
    document.querySelectorAll("svg.orbit__svg").forEach(function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }
})();
