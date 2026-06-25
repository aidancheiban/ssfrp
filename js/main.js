const heroContent = document.querySelector(".hero-content");
const heroVideo = document.querySelector(".hero-video");
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks && header) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    header.classList.toggle("menu-open", isOpen);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
      header.classList.remove("menu-open");
    });
  });
}

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  // Fade hero content as user scrolls
  const fadeAmount = Math.max(1 - scrollY / 500, 0);

  if (heroContent) {
    heroContent.style.opacity = fadeAmount;
    heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
  }

  // Fade video slightly as user scrolls
  if (heroVideo) {
    heroVideo.style.opacity = Math.max(0.85 - scrollY / 700, 0);
  }

  // Change navbar once scrolling starts
  if (header) {
    if (scrollY > 80) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
});

// Field site tabs
const tabs = document.querySelectorAll(".site-tab");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.site;

    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");

    document.querySelectorAll(".site-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === `site-${target}`);
    });
  });
});

// Count up the stat numbers when they scroll into view
function runCounter(el) {
  const target = Number(el.dataset.target);
  const start = performance.now();
  const duration = 1400;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Scroll reveal + counters
const revealTargets = [
  ".stat",
  ".sites-section",
  ".info-card",
  ".apply-content",
];

document.body.classList.add("reveal-on");
const revealEls = document.querySelectorAll(revealTargets.join(","));
revealEls.forEach((el, i) => {
  el.classList.add("reveal");
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
});

const seen = new WeakSet();
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");

      if (!seen.has(entry.target)) {
        seen.add(entry.target);
        entry.target
          .querySelectorAll(".counter")
          .forEach((c) => runCounter(c));
      }
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.2 }
);

revealEls.forEach((el) => observer.observe(el));

// each letter locks to a fixed-width slot so the scramble doesn't reflow the line
function decodeTitle(el) {
  const finalText = el.textContent.trim();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const slots = [];
  el.textContent = "";
  const words = finalText.split(" ");
  words.forEach((word, wi) => {
    const w = document.createElement("span");
    w.className = "t-word";
    for (const ch of word) {
      const c = document.createElement("span");
      c.className = "t-char pending";
      c.dataset.final = ch;
      c.textContent = ch;
      w.appendChild(c);
      slots.push(c);
    }
    el.appendChild(w);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
  });

  slots.forEach((c) => { c.style.width = c.getBoundingClientRect().width + "px"; });

  const pool = "ABCDEFGHKNRSTUVXZ#%&/<>".split("");
  const lockAt = slots.map((_, i) => 0.1 + (i / slots.length) * 0.6);
  const start = performance.now();

  function frame(now) {
    const p = Math.min((now - start) / 1500, 1);
    let pending = false;
    slots.forEach((c, i) => {
      if (c.dataset.done) return;
      if (p >= lockAt[i]) {
        c.textContent = c.dataset.final;
        c.classList.replace("pending", "locked");
        c.dataset.done = "1";
      } else {
        pending = true;
        if (Math.random() < 0.5) c.textContent = pool[(Math.random() * pool.length) | 0];
      }
    });
    if (pending) requestAnimationFrame(frame);
    else el.textContent = finalText;
  }
  requestAnimationFrame(frame);
}

const title = document.getElementById("hero-title");
if (title) setTimeout(() => decodeTitle(title), 500);

// lens reveals the campus map under the video with a coord readout at the cursor
const hero = document.querySelector(".hero");
const finePointer = window.matchMedia("(pointer: fine)").matches;
const campus = [41.0043, -73.9091];

let campusMap = null;
const mapEl = document.getElementById("hero-map");
if (mapEl && window.L && finePointer) {
  campusMap = L.map(mapEl, {
    center: campus,
    zoom: 16,
    zoomControl: false,
    attributionControl: false,
    keyboard: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    touchZoom: false,
  });

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19 }
  ).addTo(campusMap);

  const pin = L.divIcon({
    className: "campus-pin",
    html: '<span class="campus-pin-dot"></span><span class="campus-pin-label">Lamont-Doherty Earth Observatory</span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  L.marker(campus, { icon: pin, interactive: false }).addTo(campusMap);

  hero.classList.add("map-ready");
  // hero is still animating in so remeasure once it settles
  setTimeout(() => campusMap.invalidateSize(), 200);
  window.addEventListener("resize", () => campusMap.invalidateSize());
}

if (hero && finePointer) {
  const readout = hero.querySelector(".lens-readout");
  let lx = 0, ly = 0, queued = false;

  function place() {
    queued = false;
    hero.style.setProperty("--lens-x", lx + "px");
    hero.style.setProperty("--lens-y", ly + "px");
    if (campusMap && readout) {
      const ll = campusMap.containerPointToLatLng([lx, ly]);
      readout.textContent = `${ll.lat.toFixed(4)}° N, ${Math.abs(ll.lng).toFixed(4)}° W`;
    }
  }

  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    lx = e.clientX - r.left;
    ly = e.clientY - r.top;
    hero.classList.add("lens-active");
    if (!queued) {
      queued = true;
      requestAnimationFrame(place);
    }
  });
  hero.addEventListener("mouseleave", () => hero.classList.remove("lens-active"));
}

// trunk draws down as you scroll
const rail = document.querySelector(".growth-rail");
if (rail) {
  const trunk = rail.querySelector(".trunk-path");
  const tip = rail.querySelector(".growth-tip");
  const branches = rail.querySelectorAll(".branch");
  const roots = rail.querySelector(".growth-roots");
  const len = trunk.getTotalLength();
  trunk.style.strokeDasharray = len;
  trunk.style.strokeDashoffset = len;

  function grow() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(window.scrollY / max, 1) : 1;
    trunk.style.strokeDashoffset = len * (1 - p);

    // each leaf opens once the bud reaches it
    const budY = p * window.innerHeight;
    tip.style.top = `${budY}px`;
    branches.forEach((b) => b.classList.toggle("grown", budY >= b.offsetTop + 38));
    roots.classList.toggle("grown", p >= 0.9);
  }

  grow();
  window.addEventListener("scroll", grow, { passive: true });
  window.addEventListener("resize", grow);
}
