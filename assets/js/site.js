/* ==========================================================================
   site.js — the only script on the site. Plain JavaScript, no libraries.
   Every page works with this file missing; it only adds polish:

     1. Scroll reveal        elements with class "reveal" fade in once
     2. Trajectory           the satellite flies to a curved path beside Selected
                             work and follows the scroll along it, both ways
     3. In-view video        <video data-inview> plays only while visible
     4. Lightbox             <a data-zoom href="big-image"> opens in a dialog
     5. Reduced motion       pauses the orbit animation if the user asks
     6. Filters              <div class="filters"> buttons show one category of a list
     7. Timeline chart       built on the Experience page from the entries' dates
     8. Section links        marks the section in view in <nav class="subnav">
     9. Copy email           <a data-copy="address"> copies it and confirms
    10. Fast page changes    gets the next page ready when a link is pointed at

   The class "js" is added to <html> by a one-line script in each page's
   <head>, so the hidden starting states in site.css never apply without JS.
   ========================================================================== */
(function () {
  "use strict";

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduceMotion = motionPreference.matches;
  var hasObserver = "IntersectionObserver" in window;
  var clamp = function (value, min, max) { return Math.max(min, Math.min(max, value)); };
  var all = function (selector, context) { return Array.prototype.slice.call((context || document).querySelectorAll(selector)); };

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

  /* 2. Trajectory. Three stages, all driven by the scroll position and all reversible:
          orbit    the satellite circles the portrait (an SVG clock, paused while it is away)
          flight   a fixed marker flies from the orbit to the first waypoint
          path     the marker on the rail follows a curve that swings out to every waypoint
        The scroll position is eased a little each frame so the motion glides instead of
        stepping. The curve is rebuilt from the waypoints whenever the layout changes. */
  var wrap = document.querySelector(".work-wrap");
  var rail = wrap && wrap.querySelector(".rail");
  var orbitSvg = document.querySelector(".orbit__svg");
  var orbitSat = document.querySelector(".orbit__sat");
  var railSat = rail && rail.querySelector(".rail__sat");
  var workItems = wrap ? all(".work__item", wrap) : [];
  if (rail && workItems.length && orbitSvg && orbitSat && railSat && orbitSat.getScreenCTM) {
    var root = document.documentElement;
    var SVG_NS = "http://www.w3.org/2000/svg";
    var away = false;
    var frame = 0;
    var needsMeasure = true;
    var geometry;
    var eased = null;          /* eased scroll position, in page pixels */
    var passed = -1;           /* index of the last waypoint already passed */
    var lastShift = null;
    var flightSat = railSat.cloneNode(true);

    /* Outside the clipped intro and rail, the flight can cross between sections. */
    flightSat.className = "satellite-flight";
    flightSat.hidden = true;
    flightSat.setAttribute("aria-hidden", "true");
    document.body.appendChild(flightSat);

    /* The curve: a dashed planned path with the flown part drawn solid, in color, over it.
       The flown part is drawn once, whole, inside a clipping window (.rail__mask). Scrolling
       slides the window down and its content back up by the same amount, so the browser only
       moves two layers and never repaints the curve. */
    var svgNode = function (name, attributes) {
      var node = document.createElementNS(SVG_NS, name);
      for (var key in attributes) node.setAttribute(key, attributes[key]);
      return node;
    };
    var curve = svgNode("svg", { "class": "rail__curve", focusable: "false" });
    var doneCurve = svgNode("svg", { "class": "rail__curve", focusable: "false" });
    var planPath = svgNode("path", { "class": "rail__plan" });
    var donePath = svgNode("path", { "class": "rail__done", stroke: "url(#rail-grad)" });
    var gradient = svgNode("linearGradient", { id: "rail-grad", gradientUnits: "userSpaceOnUse", x1: 0, x2: 0 });
    [["0", "#2a78d6"], ["0.35", "#7a5af5"], ["0.7", "#e8541e"], ["1", "#eda100"]].forEach(function (stop) {
      gradient.appendChild(svgNode("stop", { offset: stop[0], "stop-color": stop[1] }));
    });
    var mask = document.createElement("div");
    mask.className = "rail__mask";
    curve.appendChild(planPath);
    doneCurve.appendChild(gradient);
    doneCurve.appendChild(donePath);
    mask.appendChild(doneCurve);
    rail.insertBefore(mask, rail.firstChild);
    rail.insertBefore(curve, mask);
    wrap.classList.add("work-wrap--curved");

    /* Sample the curve every few pixels. Between two waypoints it is one or more
       full cosine swings, so it leaves and reaches every waypoint heading straight down. */
    var buildCurve = function (nodes, amp, wave) {
      var points = [];
      var length = 0;
      var add = function (x, y) {
        if (points.length) {
          var last = points[points.length - 1];
          length += Math.hypot(x - last.x, y - last.y);
        }
        points.push({ x: x, y: y, len: length });
      };
      add(amp, nodes[0]);
      for (var i = 0; i < nodes.length - 1; i++) {
        var span = nodes[i + 1] - nodes[i];
        if (span <= 0) continue;
        var swings = Math.max(1, Math.round(span / wave));
        var steps = Math.max(8, Math.ceil(span / 6));
        for (var k = 1; k <= steps; k++) {
          var t = k / steps;
          add(amp * Math.cos(2 * Math.PI * swings * t), nodes[i] + span * t);
        }
      }
      return { points: points, length: length };
    };
    /* Position and lean of the curve at height y. */
    var along = function (y) {
      var points = geometry.curve.points;
      var low = 0;
      var high = points.length - 1;
      if (high < 1) return { x: geometry.amp, lean: 0 };
      while (high - low > 1) {
        var mid = (low + high) >> 1;
        if (points[mid].y <= y) low = mid; else high = mid;
      }
      var a = points[low];
      var b = points[high];
      var t = b.y > a.y ? clamp((y - a.y) / (b.y - a.y), 0, 1) : 0;
      return {
        x: a.x + (b.x - a.x) * t,
        lean: Math.atan2(b.x - a.x, b.y - a.y) * 180 / Math.PI
      };
    };
    /* Show the flown path from the top of the rail down to height y (0 hides it). */
    var setFlown = function (y) {
      var shift = (clamp(y, 0, geometry.height) - geometry.height).toFixed(1);
      if (shift === lastShift) return;
      lastShift = shift;
      mask.style.transform = "translate3d(0," + shift + "px,0)";
      doneCurve.style.transform = "translate3d(0," + (-shift).toFixed(1) + "px,0)";
    };
    var setPassed = function (index) {
      if (index === passed) return;
      passed = index;
      workItems.forEach(function (item, i) { item.classList.toggle("is-passed", i <= index); });
    };

    var measure = function (scroll) {
      var railRect = rail.getBoundingClientRect();
      var style = window.getComputedStyle(wrap);
      var amp = parseFloat(style.getPropertyValue("--rail-amp")) || 0;
      var wave = parseFloat(style.getPropertyValue("--rail-wave")) || 480;
      var nodes = workItems.map(function (item) {
        var node = item.querySelector(".work__node");
        return item.offsetTop + node.offsetTop + node.offsetHeight / 2;
      });
      var focus = window.innerHeight * 0.5;
      var top = railRect.top + scroll;
      var arrival = Math.max(120, top + nodes[0] - focus);
      var maxScroll = Math.max(arrival + 1, document.documentElement.scrollHeight - window.innerHeight);
      var run = nodes[nodes.length - 1] - nodes[0];
      geometry = {
        amp: amp,
        nodes: nodes,
        height: railRect.height,
        full: nodes[nodes.length - 1] + 2,             /* reveal height that shows the whole path */
        curve: buildCurve(nodes, amp, wave),
        x: railRect.left + railRect.width / 2 + amp,   /* first waypoint, in page pixels */
        first: top + nodes[0],
        arrival: arrival,
        departure: Math.max(0, arrival - Math.max(180, Math.min(420, window.innerHeight * 0.55))),
        /* If the page ends before the last waypoint reaches mid-screen, speed up so the
           satellite still arrives there at the bottom of the page. */
        rate: Math.max(1, run / Math.max(1, maxScroll - arrival))
      };
      var d = "";
      geometry.curve.points.forEach(function (p, i) { d += (i ? "L" : "M") + (p.x + 1).toFixed(1) + " " + p.y.toFixed(1); });
      planPath.setAttribute("d", d);
      donePath.setAttribute("d", d);
      gradient.setAttribute("y1", nodes[0].toFixed(1));
      gradient.setAttribute("y2", nodes[nodes.length - 1].toFixed(1));
      lastShift = null;
      needsMeasure = false;
    };

    var updateSatellite = function () {
      frame = 0;
      var scroll = Math.max(0, window.pageYOffset || 0);
      if (needsMeasure) measure(scroll);
      var last = geometry.nodes.length - 1;

      if (motionPreference.matches) {
        /* Still picture: satellite on its orbit, whole path drawn, every waypoint filled. */
        away = false;
        eased = scroll;
        flightSat.hidden = true;
        root.classList.remove("satellite-away", "satellite-ready", "sat-on-rail");
        setFlown(geometry.full);
        setPassed(last);
        if (orbitSvg.pauseAnimations) orbitSvg.pauseAnimations();
        return;
      }

      /* Ease toward the real scroll position; keep animating until it is reached. */
      if (eased === null) eased = scroll;
      var gap = scroll - eased;
      if (Math.abs(gap) < 0.6) {
        eased = scroll;
      } else {
        if (Math.abs(gap) > 1400) eased = scroll - (gap > 0 ? 1400 : -1400);
        eased += (scroll - eased) * 0.2;
        scheduleSatellite();
      }

      var progress = clamp((eased - geometry.departure) / (geometry.arrival - geometry.departure), 0, 1);
      root.classList.add("satellite-ready");
      if (progress === 0) {
        flightSat.hidden = true;
        root.classList.remove("satellite-away", "sat-on-rail");
        setFlown(0);
        setPassed(-1);
        if (orbitSvg.unpauseAnimations) orbitSvg.unpauseAnimations();
        away = false;
        return;
      }
      if (!away) {
        if (orbitSvg.pauseAnimations) orbitSvg.pauseAnimations();
        away = true;
      }
      if (progress === 1) {
        /* On the path: the height follows the scroll, the curve gives the sideways position. */
        var y = clamp(geometry.nodes[0] + (eased - geometry.arrival) * geometry.rate, geometry.nodes[0], geometry.nodes[last]);
        var spot = along(y);
        var reached = -1;
        for (var i = 0; i <= last; i++) if (y >= geometry.nodes[i] - 3) reached = i;
        railSat.style.transform = "translate3d(" + spot.x.toFixed(2) + "px," + y.toFixed(2) + "px,0) rotate(" + (-spot.lean).toFixed(2) + "deg)";
        setFlown(y + 2);
        setPassed(reached);
        flightSat.hidden = true;
        root.classList.add("satellite-away", "sat-on-rail");
        return;
      }
      root.classList.remove("sat-on-rail");
      setFlown(0);
      setPassed(-1);
      var matrix = orbitSat.getScreenCTM();
      if (!matrix) {
        /* Keep the original visible if its SVG has no rendered geometry yet. */
        flightSat.hidden = true;
        root.classList.remove("satellite-away", "satellite-ready", "sat-on-rail");
        away = false;
        if (orbitSvg.unpauseAnimations) orbitSvg.unpauseAnimations();
        return;
      }
      /* A gentle bend leaves the orbit and arrives heading straight down at the first
         waypoint. Reversing scroll uses the same frozen origin and the same curve. */
      var sourceX = matrix.e;
      var sourceY = matrix.f + scroll;
      var distanceY = geometry.first - sourceY;
      var t = progress;
      var u = 1 - t;
      var x = u * u * u * sourceX + 3 * u * u * t * sourceX + 3 * u * t * t * geometry.x + t * t * t * geometry.x;
      var flightY = u * u * u * sourceY + 3 * u * u * t * (sourceY + distanceY * 0.45) + 3 * u * t * t * (geometry.first - distanceY * 0.2) + t * t * t * geometry.first;
      var orbitSize = 56 * Math.hypot(matrix.a, matrix.b);
      var size = orbitSize + (44 - orbitSize) * t;
      var rotation = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI * (1 - t);
      flightSat.style.transform = "translate3d(" + (x - 22) + "px," + (flightY - scroll - 22) + "px,0) scale(" + (size / 44) + ") rotate(" + rotation + "deg)";
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

  /* The intro's decorative animations (ring, moon, stars) stop while it is off screen. */
  var intro = document.querySelector(".intro");
  if (intro && hasObserver) {
    new IntersectionObserver(function (entries) {
      document.documentElement.classList.toggle("intro-off", !entries[entries.length - 1].isIntersecting);
    }).observe(intro);
  }

  /* 3. In-view video: warm nearby loops after load, and play only when fully
        visible in the active tab. Data saver and reduced motion keep posters
        until the visitor presses play. Projects-list previews also require a mouse
        hover before downloading or playing. Recheck preferences when they change. */
  var videos = document.querySelectorAll("video[data-inview]");
  var connection = navigator.connection;
  var allowVideo = function () {
    return !motionPreference.matches && !(connection && connection.saveData);
  };
  if (videos.length && hasObserver) {
    var startVideos = function () {
      var states = Array.prototype.map.call(videos, function (v) {
        if (!allowVideo() && !v.closest("a")) v.controls = true;
        return { video: v, near: false, visible: false, warmed: false, hoverOnly: v.hasAttribute("data-hover"), hovered: false };
      });
      var updateVideo = function (state) {
        var v = state.video;
        var active = !state.hoverOnly || state.hovered;
        if (document.hidden || !state.visible || !active) v.pause();
        if (document.hidden || !allowVideo() || !active) return;
        if (state.near && !state.warmed) {
          state.warmed = true;
          v.preload = "auto";
          if (v.paused && v.readyState === 0) v.load();
        }
        if (state.visible && v.paused) {
          var p = v.play();
          if (p && p.catch) p.catch(function () { if (!v.closest("a")) v.controls = true; });
        }
      };
      states.forEach(function (state) {
        if (!state.hoverOnly) return;
        var card = state.video.closest(".card") || state.video;
        card.addEventListener("pointerenter", function (event) {
          if (event.pointerType !== "mouse") return;
          state.hovered = true;
          updateVideo(state);
        });
        card.addEventListener("pointerleave", function () {
          state.hovered = false;
          updateVideo(state);
        });
      });
      var warm = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var state = states[videosIndex(entry.target)];
          state.near = entry.isIntersecting;
          updateVideo(state);
        });
      }, { rootMargin: "50% 0px" });
      var videosIndex = function (v) { return Array.prototype.indexOf.call(videos, v); };
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var state = states[videosIndex(entry.target)];
          state.visible = entry.isIntersecting && entry.intersectionRatio >= 1;
          updateVideo(state);
        });
      }, { threshold: [0, 1] });
      videos.forEach(function (v) { warm.observe(v); vio.observe(v); });
      document.addEventListener("visibilitychange", function () { states.forEach(updateVideo); });
      var videoPreferenceChanged = function () {
        states.forEach(function (state) {
          if (!allowVideo()) {
            state.video.pause();
            if (!state.video.closest("a")) state.video.controls = true;
          }
          updateVideo(state);
        });
      };
      if (motionPreference.addEventListener) motionPreference.addEventListener("change", videoPreferenceChanged);
      if (connection && connection.addEventListener) connection.addEventListener("change", videoPreferenceChanged);
    };
    if (document.readyState === "complete") startVideos();
    else window.addEventListener("load", startVideos, { once: true });
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

  /* 6. Filters. A <div class="filters" data-filter-list="#id"> holds buttons with
        data-filter="all" or a category name. Every direct child of the list that
        carries data-category is counted, and hidden when it does not match. */
  all(".filters[data-filter-list]").forEach(function (bar) {
    var list = document.querySelector(bar.getAttribute("data-filter-list"));
    if (!list) return;
    var items = all("[data-category]", list).filter(function (item) { return item.parentNode === list; });
    var buttons = all(".filter", bar);
    buttons.forEach(function (button) {
      var kind = button.getAttribute("data-filter");
      var count = kind === "all" ? items.length : items.filter(function (item) { return item.getAttribute("data-category") === kind; }).length;
      var badge = document.createElement("span");
      badge.className = "filter__count";
      badge.textContent = count;
      button.appendChild(badge);
      if (!count) button.hidden = true;
      button.addEventListener("click", function () {
        var apply = function () {
          buttons.forEach(function (other) { other.setAttribute("aria-pressed", other === button ? "true" : "false"); });
          items.forEach(function (item) { item.hidden = kind !== "all" && item.getAttribute("data-category") !== kind; });
        };
        if (document.startViewTransition && !motionPreference.matches) document.startViewTransition(apply); else apply();
      });
    });
  });

  /* 7. Timeline chart. <div class="timeline" data-timeline="#id"> is filled from the
        entries of that list. Each entry needs data-start and data-end ("YYYY-MM", or
        "present" for the end), data-category, and optionally data-label for a short
        name. Rows are grouped by category in the order of data-groups. */
  all(".timeline[data-timeline]").forEach(function (chart) {
    var list = document.querySelector(chart.getAttribute("data-timeline"));
    if (!list) return;
    var today = new Date();
    var nowIndex = today.getFullYear() * 12 + today.getMonth();
    var monthIndex = function (text) {
      var match = /^(\d{4})-(\d{1,2})$/.exec(text || "");
      return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : nowIndex;
    };
    var escapeHtml = function (text) {
      return String(text).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    };
    var rows = all("[data-start]", list).map(function (entry) {
      var title = entry.querySelector("h3");
      var when = entry.querySelector(".entry__meta span");
      var open = !/^\d{4}-\d{1,2}$/.test(entry.getAttribute("data-end") || "");
      return {
        entry: entry,
        category: entry.getAttribute("data-category"),
        label: entry.getAttribute("data-label") || (title ? title.textContent : ""),
        when: when ? when.textContent : "",
        start: monthIndex(entry.getAttribute("data-start")),
        end: (open ? nowIndex : monthIndex(entry.getAttribute("data-end"))) + 1,
        open: open
      };
    });
    if (!rows.length) return;
    var min = Infinity;
    var max = nowIndex + 1;
    rows.forEach(function (row) { min = Math.min(min, row.start); max = Math.max(max, row.end); });
    min = Math.floor(min / 12) * 12;   /* start the axis at January of the first year */
    max += 1;
    var percent = function (index) { return ((index - min) / (max - min) * 100).toFixed(2) + "%"; };

    var ticks = "";
    var lines = "";
    for (var year = Math.ceil(min / 12); year * 12 <= max; year++) {
      var share = (year * 12 - min) / (max - min);
      lines += '<i class="tl__line" style="left:' + percent(year * 12) + '"></i>';
      if (share < 0.97) ticks += '<span class="tl__tick' + (share < 0.03 ? " tl__tick--first" : "") + '" style="left:' + percent(year * 12) + '">' + year + "</span>";
    }
    lines += '<i class="tl__line tl__line--now" style="left:' + percent(nowIndex + 0.5) + '"></i>';

    var groups = (chart.getAttribute("data-groups") || "").split(",").map(function (pair) {
      var parts = pair.split(":");
      return { key: parts[0].trim(), label: (parts[1] || parts[0]).trim() };
    }).filter(function (group) { return group.key; });
    if (!groups.length) groups = [{ key: null, label: "" }];

    var html = '<div class="tl__axis" aria-hidden="true">' + ticks + "</div>";
    groups.forEach(function (group) {
      var members = rows.filter(function (row) { return group.key === null || row.category === group.key; });
      if (!members.length) return;
      if (group.label) html += '<div class="tl__group">' + escapeHtml(group.label) + "</div>";
      members.forEach(function (row) {
        var months = row.end - row.start;
        var tip = row.when + " (" + months + (months === 1 ? " month" : " months") + (row.open ? " so far" : "") + ")";
        html += '<div class="tl__row"><div class="tl__label">' + escapeHtml(row.label) + "</div>" +
          '<div class="tl__track">' + lines +
          '<button class="tl__bar' + (row.open ? " tl__bar--open" : "") + '" type="button" data-row="' + rows.indexOf(row) + '" data-category="' + escapeHtml(row.category || "") + '"' +
          ' data-tip-title="' + escapeHtml(row.label) + '" data-tip="' + escapeHtml(tip) + '"' +
          ' aria-label="' + escapeHtml(row.label + ", " + tip + ". Jump to details.") + '"' +
          ' style="left:' + percent(row.start) + ";width:" + ((row.end - row.start) / (max - min) * 100).toFixed(2) + '%"></button>' +
          "</div></div>";
      });
    });
    chart.innerHTML = html + '<div class="tl__tip" aria-hidden="true"></div>';

    var tip = chart.querySelector(".tl__tip");
    var showTip = function (bar) {
      tip.innerHTML = "<b>" + escapeHtml(bar.getAttribute("data-tip-title")) + "</b>" + escapeHtml(bar.getAttribute("data-tip"));
      var box = chart.getBoundingClientRect();
      var at = bar.getBoundingClientRect();
      tip.classList.add("is-on");
      var above = at.top - box.top - tip.offsetHeight - 8;
      tip.style.left = clamp(at.left - box.left + at.width / 2 - tip.offsetWidth / 2, 8, box.width - tip.offsetWidth - 8) + "px";
      tip.style.top = (above < 4 ? at.bottom - box.top + 8 : above) + "px";
    };
    var hideTip = function () { tip.classList.remove("is-on"); };
    var flashTimer = 0;
    all(".tl__bar", chart).forEach(function (bar) {
      bar.addEventListener("mouseenter", function () { showTip(bar); });
      bar.addEventListener("focus", function () { showTip(bar); });
      bar.addEventListener("mouseleave", hideTip);
      bar.addEventListener("blur", hideTip);
      bar.addEventListener("click", function () {
        var entry = rows[Number(bar.getAttribute("data-row"))].entry;
        if (entry.hidden) {
          /* The entry is filtered out: switch its list back to "All" first. */
          all(".filters[data-filter-list]").forEach(function (filters) {
            if (document.querySelector(filters.getAttribute("data-filter-list")) !== list) return;
            var showAll = filters.querySelector('.filter[data-filter="all"]');
            if (showAll) showAll.click();
          });
        }
        window.setTimeout(function () {
          entry.scrollIntoView({ behavior: motionPreference.matches ? "auto" : "smooth", block: "center" });
          all(".entry.is-target", list).forEach(function (other) { other.classList.remove("is-target"); });
          entry.classList.add("is-target");
          window.clearTimeout(flashTimer);
          flashTimer = window.setTimeout(function () { entry.classList.remove("is-target"); }, 2200);
        }, 60);
      });
    });
  });

  /* 8. Section links: underline the link of the section currently in view */
  var subnavLinks = all(".subnav a[href^='#']");
  if (subnavLinks.length) {
    var subnavTargets = subnavLinks.map(function (link) { return document.getElementById(link.getAttribute("href").slice(1)); });
    var subnavFrame = 0;
    var markSection = function () {
      subnavFrame = 0;
      var best = -1;
      subnavTargets.forEach(function (target, i) {
        if (target && target.getBoundingClientRect().top < window.innerHeight * 0.35) best = i;
      });
      subnavLinks.forEach(function (link, i) { link.classList.toggle("is-current", i === best); });
    };
    window.addEventListener("scroll", function () {
      if (!subnavFrame) subnavFrame = window.requestAnimationFrame(markSection);
    }, { passive: true });
    markSection();
  }

  /* 9. Copy email: a link with data-copy copies that text and confirms with a short
        message. If copying is not possible the link works normally (it opens the mail app). */
  var copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.top = "-1000px";
      document.body.appendChild(field);
      field.select();
      field.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (error) { ok = false; }
      document.body.removeChild(field);
      if (ok) resolve(); else reject(new Error("copy failed"));
    });
  };
  var toast;
  var toastTimer = 0;
  var showToast = function (message) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    void toast.offsetWidth;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("is-on"); }, 2600);
  };
  all("a[data-copy]").forEach(function (link) {
    var label = link.getAttribute("data-label");
    link.addEventListener("click", function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      var text = link.getAttribute("data-copy");
      copyText(text).then(function () {
        showToast("Copied " + text);
        if (label) {
          link.setAttribute("data-label", "Copied");
          window.setTimeout(function () { link.setAttribute("data-label", label); }, 2000);
        }
      }).catch(function () { window.location.href = link.getAttribute("href"); });
    });
  });

  /* 10. Fetch just the next page's HTML on intent. Avoid prerendering whole pages:
         that also runs their scripts and loads media before the visitor navigates.
         Limit hints to two pages, and skip them on data saver or slow connections. */
  var here = window.location;
  if (here && /^https?:$/.test(here.protocol)) {
    var fetched = {};
    var fetchCount = 0;
    var fetchAhead = function (event) {
      if (fetchCount >= 2 || document.hidden || (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType)))) return;
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.origin !== here.origin || link.pathname === here.pathname) return;
      if (link.hasAttribute("download") || link.hasAttribute("data-zoom")) return;
      if (!/(\/|\.html)$/.test(link.pathname) || fetched[link.pathname]) return;
      fetched[link.pathname] = true;
      fetchCount++;
      var hint = document.createElement("link");
      hint.rel = "prefetch";
      hint.href = link.href;
      document.head.appendChild(hint);
    };
    document.addEventListener("mouseover", fetchAhead, { passive: true });
    document.addEventListener("focusin", fetchAhead);
    document.addEventListener("touchstart", fetchAhead, { passive: true });
  }
})();
