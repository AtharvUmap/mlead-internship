const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
);

document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

/* Reflections carousel */
(function () {
  const track = document.getElementById("reflections-track");
  const prev = document.getElementById("refl-prev");
  const next = document.getElementById("refl-next");
  const dotsEl = document.getElementById("refl-dots");
  if (!track || !prev || !next || !dotsEl) return;

  const count = track.children.length;
  const dots = dotsEl.querySelectorAll(".reflections__dot");
  let i = 0;

  function update() {
    track.style.transform = `translateX(-${i * 100}%)`;
    dots.forEach((d, j) => d.classList.toggle("is-active", j === i));
    prev.disabled = i === 0;
    next.disabled = i === count - 1;
  }

  prev.addEventListener("click", () => { if (i > 0) { i--; update(); } });
  next.addEventListener("click", () => { if (i < count - 1) { i++; update(); } });

  dots.forEach((dot, j) => {
    dot.style.cursor = "pointer";
    dot.addEventListener("click", () => { i = j; update(); });
  });

  window.addEventListener("keydown", (e) => {
    const journey = document.getElementById("journey");
    if (!journey) return;
    const rect = journey.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.2;
    if (!inView) return;
    if (e.key === "ArrowLeft" && i > 0) { i--; update(); }
    if (e.key === "ArrowRight" && i < count - 1) { i++; update(); }
  });

  update();
})();

/* Gallery scroller */
(function () {
  const scroller = document.getElementById("gallery-scroll");
  const prev = document.getElementById("gal-prev");
  const next = document.getElementById("gal-next");
  if (!scroller || !prev || !next) return;
  function step() {
    const item = scroller.querySelector(".gallery__item");
    return item ? item.offsetWidth + 16 : 300;
  }
  prev.addEventListener("click", () => scroller.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => scroller.scrollBy({ left: step(), behavior: "smooth" }));
})();

/* People constellation */
(function () {
  const svg = document.getElementById("constellation-svg");
  const tooltip = document.getElementById("constellation-tooltip");
  if (!svg || !tooltip) return;

  const linkGroup = document.getElementById("constellation-links");
  const nodeGroup = document.getElementById("constellation-nodes");
  const svgNS = "http://www.w3.org/2000/svg";
  const W = 900, H = 600;

  const center = {
    id: "me",
    label: "Atharv",
    radius: 54,
    isCenter: true,
    x: W / 2, y: H / 2,
    vx: 0, vy: 0,
    fx: W / 2, fy: H / 2,
  };

  const people = [
    { id: "p1", label: "Jordan", role: "My supervisor", contribution: "Challenged me to speak up in rooms where I felt out of place.", image: "https://i.pravatar.cc/320?img=12" },
    { id: "p2", label: "Maya", role: "Co-intern", contribution: "Made the hard weeks feel shared. Taught me collaboration isn't a transaction.", image: "https://i.pravatar.cc/320?img=47" },
    { id: "p3", label: "Devon", role: "Peer leader, LEAD cohort", contribution: "Showed me leadership looks like listening, not broadcasting.", image: "https://i.pravatar.cc/320?img=33" },
    { id: "p4", label: "Priya", role: "Upperclassman mentor", contribution: "Reminded me reflection is a skill, not a personality trait.", image: "https://i.pravatar.cc/320?img=45" },
    { id: "p5", label: "Sam", role: "Workshop participant", contribution: "Asked a question I couldn't answer. I'm still thinking about it.", image: "https://i.pravatar.cc/320?img=68" },
  ];

  people.forEach((p, i) => {
    const a = (i / people.length) * Math.PI * 2 - Math.PI / 2;
    p.x = W / 2 + Math.cos(a) * 200;
    p.y = H / 2 + Math.sin(a) * 200;
    p.vx = 0; p.vy = 0;
    p.radius = 42;
    p.fx = null; p.fy = null;
  });

  const nodes = [center, ...people];
  const links = people.map((p) => ({ source: center, target: p }));

  links.forEach((l) => {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("class", "constellation__link");
    l.el = line;
    linkGroup.appendChild(line);
  });

  nodes.forEach((n) => {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "constellation__node" + (n.isCenter ? " is-center" : ""));
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("r", n.radius);
    const t = document.createElementNS(svgNS, "text");
    t.textContent = n.label;
    g.appendChild(c);
    g.appendChild(t);
    n.el = g;
    nodeGroup.appendChild(g);

    if (!n.isCenter) {
      g.addEventListener("mouseenter", () => {
        tooltip.innerHTML =
          `<div class="constellation__tooltip-img" style="background-image:url('${n.image}')"></div>` +
          `<div class="constellation__tooltip-body"><strong>${n.label}</strong><em>${n.role}</em><p>${n.contribution}</p></div>`;
        tooltip.classList.add("is-visible");
      });
      g.addEventListener("mouseleave", () => tooltip.classList.remove("is-visible"));
      g.addEventListener("mousemove", (e) => {
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const tipW = tooltip.offsetWidth || 280;
        const tipH = tooltip.offsetHeight || 200;
        const left = x + 14 + tipW > rect.width ? x - tipW - 14 : x + 14;
        const top = y + 14 + tipH > rect.height ? y - tipH - 14 : y + 14;
        tooltip.style.left = Math.max(8, left) + "px";
        tooltip.style.top = Math.max(8, top) + "px";
      });
    }

    let dragging = false, dx = 0, dy = 0;
    g.addEventListener("mousedown", (e) => {
      dragging = true;
      svg.classList.add("is-dragging");
      const pt = toSVG(e);
      dx = n.x - pt.x;
      dy = n.y - pt.y;
      n.fx = n.x; n.fy = n.y;
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const pt = toSVG(e);
      n.fx = pt.x + dx;
      n.fy = pt.y + dy;
    });
    window.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      svg.classList.remove("is-dragging");
      if (!n.isCenter) { n.fx = null; n.fy = null; }
    });
  });

  function toSVG(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function tick() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let ddx = b.x - a.x, ddy = b.y - a.y;
        let d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        const force = 4000 / (d * d);
        const fx = (ddx / d) * force;
        const fy = (ddy / d) * force;
        if (!a.isCenter) { a.vx -= fx; a.vy -= fy; }
        if (!b.isCenter) { b.vx += fx; b.vy += fy; }
      }
    }
    links.forEach((l) => {
      const a = l.source, b = l.target;
      const ddx = b.x - a.x, ddy = b.y - a.y;
      const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      const target = 220;
      const k = 0.015;
      const fx = ((d - target) * k) * (ddx / d);
      const fy = ((d - target) * k) * (ddy / d);
      if (!a.isCenter) { a.vx += fx; a.vy += fy; }
      if (!b.isCenter) { b.vx -= fx; b.vy -= fy; }
    });
    nodes.forEach((n) => {
      if (n.isCenter) return;
      n.vx += (W / 2 - n.x) * 0.0018;
      n.vy += (H / 2 - n.y) * 0.0018;
    });
    nodes.forEach((n) => {
      if (n.fx != null) { n.x = n.fx; n.vx = 0; }
      else { n.vx *= 0.85; n.x += n.vx; }
      if (n.fy != null) { n.y = n.fy; n.vy = 0; }
      else { n.vy *= 0.85; n.y += n.vy; }
      n.x = Math.max(n.radius, Math.min(W - n.radius, n.x));
      n.y = Math.max(n.radius, Math.min(H - n.radius, n.y));
    });
    links.forEach((l) => {
      l.el.setAttribute("x1", l.source.x);
      l.el.setAttribute("y1", l.source.y);
      l.el.setAttribute("x2", l.target.x);
      l.el.setAttribute("y2", l.target.y);
    });
    nodes.forEach((n) => {
      n.el.setAttribute("transform", `translate(${n.x}, ${n.y})`);
    });
    requestAnimationFrame(tick);
  }
  tick();
})();
