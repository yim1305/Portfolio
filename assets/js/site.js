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

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  /* 2. Trajectory rail (home page). The satellite sits on the waypoint of the project
        that is crossing the middle of the screen, and follows the page up and down.
        Above the list it returns to its orbit around the portrait (class "sat-on-rail"
        on <html> is removed). Nothing here runs on scroll events: an
        IntersectionObserver reports when a project crosses a thin band at mid-screen. */
  var wrap = document.querySelector(".work-wrap");
  var rail = wrap && wrap.querySelector(".rail");
  var workItems = wrap ? Array.prototype.slice.call(wrap.querySelectorAll(".work__item")) : [];
  if (rail && workItems.length && hasObserver) {
    var root = document.documentElement;
    var inBand = workItems.map(function () { return false; });
    var current = -2; /* -1 = above the list, 0..n-1 = project index */

    var place = function (index) {
      current = index;
      var y = 0;
      if (index >= 0) {
        var node = workItems[index].querySelector(".work__node");
        y = workItems[index].offsetTop + node.offsetTop + node.offsetHeight / 2;
      }
      rail.style.setProperty("--rail-y", y + "px");
      rail.style.setProperty("--rail-progress", rail.offsetHeight ? (y / rail.offsetHeight).toFixed(4) : "0");
      root.classList.toggle("sat-on-rail", index >= 0);
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

    /* Layout can shift (window resize, images loading); re-seat the satellite afterwards. */
    var reseat;
    var reseatSoon = function () { clearTimeout(reseat); reseat = setTimeout(function () { if (current > -2) place(current); }, 200); };
    window.addEventListener("resize", reseatSoon);
    window.addEventListener("load", reseatSoon);
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
