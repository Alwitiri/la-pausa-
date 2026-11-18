/* La Pausa Café — admin dashboard interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const inr = (n) => Math.round(n).toLocaleString("en-IN");
  const fmtDate = (d, o = { day: "numeric", month: "short" }) => d.toLocaleDateString("en-GB", o);

  /* ---------- toast ---------- */
  const toast = $("#toast");
  let tTimer;
  const notify = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(tTimer);
    tTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  };

  /* ---------- dates ---------- */
  const now = new Date();
  $("#today").textContent = fmtDate(now, { day: "numeric", month: "short", year: "numeric" });
  const login = new Date(now); login.setHours(9, 12, 0, 0);
  $("#lastLogin").textContent = `${fmtDate(login, { day: "numeric", month: "short", year: "numeric" })}, 09:12 AM`;
  $$(".copy").forEach((c) => (c.textContent = `© ${now.getFullYear()} La Pausa Café. All rights reserved.`));

  /* ---------- sidebar ---------- */
  const mq = matchMedia("(max-width: 1024px)");
  $("#burger").addEventListener("click", () => {
    if (mq.matches) document.body.classList.toggle("sb-open");
    else document.body.classList.toggle("collapsed");
    setTimeout(drawChart, 520); // re-fit chart after the grid animates
  });
  const closeSb = () => document.body.classList.remove("sb-open");
  $("#scrim").addEventListener("click", closeSb);
  $("#sbClose").addEventListener("click", closeSb);
  $$(".sb-nav a").forEach((a) => a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (href === "#") { e.preventDefault(); notify(`${a.textContent.trim()} section coming soon`); }
    if (!href.endsWith(".html")) {
      $$(".sb-nav a").forEach((x) => x.classList.remove("active"));
      a.classList.add("active");
    }
    closeSb();
  }));

  /* ---------- counters ---------- */
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = +el.dataset.dec || 0;
    const isInr = el.hasAttribute("data-inr");
    const dur = 1600, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const v = target * (1 - Math.pow(1 - p, 4));
      el.textContent = dec ? v.toFixed(dec) : isInr ? inr(v) : Math.round(v).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 300);
  };
  $$("[data-count]").forEach(countUp);

  /* ---------- notifications ---------- */
  const bell = $("#bellBtn"), notif = $("#notif");
  bell.addEventListener("click", (e) => {
    e.stopPropagation();
    notif.hidden = !notif.hidden;
    bell.setAttribute("aria-expanded", !notif.hidden);
  });
  document.addEventListener("click", (e) => { if (!notif.contains(e.target)) { notif.hidden = true; bell.setAttribute("aria-expanded", false); } });
  $("#markRead").addEventListener("click", () => { $("#badge").classList.add("hide"); notif.hidden = true; notify("All notifications marked as read"); });
  $$("#notif a").forEach((a) => a.addEventListener("click", () => (notif.hidden = true)));

  /* ---------- recent orders ---------- */
  const orders = [
    ["ORD1248", "Dine-In", 2, "Completed", "10:45 AM", "photo-1572442388796-11668a67e53d"],
    ["ORD1247", "Takeaway", 1, "Completed", "10:32 AM", "photo-1568901346375-23c9450c58cd"],
    ["ORD1246", "Dine-In", 3, "Preparing", "10:20 AM", "photo-1621996346565-e3dbc646d9a9"],
    ["ORD1245", "Online", 2, "Completed", "09:50 AM", "photo-1534778101976-62847782c213"],
    ["ORD1244", "Dine-In", 1, "Completed", "09:12 AM", "photo-1473093295043-cdd812d0e601"],
  ];
  $("#orderList").innerHTML = orders.map(([id, type, n, st, time, img], i) => `
    <li style="animation-delay:${0.6 + i * 0.1}s">
      <span class="o-img img" style="--img:url('https://images.unsplash.com/${img}?auto=format&fit=crop&w=120&q=70')"></span>
      <div><b>#${id}</b><small>${type} • ${n} item${n > 1 ? "s" : ""}</small></div>
      <span class="tag ${st === "Completed" ? "ok" : "wait pulse"}">${st}</span>
      <span class="o-time">${time}</span>
    </li>`).join("");

  /* ---------- reservations: confirm pending ---------- */
  $$("[data-confirm]").forEach((b) => b.addEventListener("click", () => {
    b.textContent = "Confirmed";
    b.classList.replace("wait", "ok");
    b.closest("li").querySelector(".ini").classList.remove("warm");
    notify("Reservation confirmed ✔");
  }, { once: true }));

  /* ---------- menu toggles ---------- */
  $$(".switch input").forEach((sw) => sw.addEventListener("change", () => {
    sw.closest(".mi").classList.toggle("off", !sw.checked);
    notify(`${sw.dataset.item} is now ${sw.checked ? "available" : "hidden from menu"}`);
  }));
  $("#addItem").addEventListener("click", () => notify("Add Item form coming soon"));

  /* ---------- sliders ---------- */
  const slider = (items, dots, ms) => {
    let i = 0, timer;
    const go = (n) => {
      items[i].classList.remove("active"); dots[i].classList.remove("on");
      i = (n + items.length) % items.length;
      items[i].classList.add("active"); dots[i].classList.add("on");
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), ms); };
    dots.forEach((d, n) => d.addEventListener("click", () => { go(n); auto(); }));
    auto();
  };
  slider($$(".slide"), $$("#promoDots button"), 5000);
  slider($$(".review"), $$("#reviewDots button"), 6500);

  /* ---------- sales chart ---------- */
  const svg = $("#chartSvg"), tip = $("#tip"), chartBox = $("#chart");
  const rangeSel = $("#range");
  const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const makeData = (days) => {
    const rnd = seeded(days * 97 + 13);
    return Array.from({ length: days }, (_, k) => {
      const d = new Date(now); d.setDate(now.getDate() - (days - 1 - k));
      const wave = Math.sin(k / (days / 6)) * 18000 + Math.sin(k / 2.3) * 9000;
      const weekend = [0, 6].includes(d.getDay()) ? 14000 : 0;
      const rev = Math.max(35000, 82000 + wave + weekend + (rnd() - 0.5) * 22000 + k * (40000 / days));
      const ord = Math.round(rev / 1600 * (0.8 + rnd() * 0.25));
      return { d, rev, ord };
    });
  };

  // Catmull-Rom → cubic Bézier for smooth curves
  const smooth = (pts) => pts.reduce((acc, p, i, a) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const p0 = a[i - 2] || a[i - 1], p1 = a[i - 1], p2 = p, p3 = a[i + 1] || p;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return `${acc} C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }, "");

  let data = makeData(30), geo = null, animate = true, hoverIdx = null;

  function drawChart() {
    const W = chartBox.clientWidth, H = chartBox.clientHeight;
    if (!W) return;
    const pad = { l: 44, r: 12, t: 26, b: 30 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    if (iw < 40 || ih < 40) return;
    const max = 150000;
    const x = (i) => pad.l + (i / (data.length - 1)) * iw;
    const y = (v) => pad.t + ih - (Math.min(v, max) / max) * ih;
    const ordScale = 1100; // orders mapped onto the revenue axis

    const rev = data.map((p, i) => [x(i), y(p.rev)]);
    const ord = data.map((p, i) => [x(i), y(p.ord * ordScale)]);
    const revPath = smooth(rev), ordPath = smooth(ord);
    const areaPath = `${revPath} L${x(data.length - 1)},${pad.t + ih} L${pad.l},${pad.t + ih} Z`;

    const yTicks = [[0, "0k"], [50000, "50K"], [100000, "1L"], [150000, "1.5L"]];
    const labelCount = Math.min(5, data.length);
    const xIdx = Array.from({ length: labelCount }, (_, k) => Math.round(k * (data.length - 1) / (labelCount - 1)));

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.innerHTML = `
      <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2f6b45" stop-opacity=".28"/><stop offset="1" stop-color="#2f6b45" stop-opacity="0"/>
      </linearGradient></defs>
      <g class="grid">${yTicks.map(([v]) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/>`).join("")}
        <line x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${pad.t + ih}"/></g>
      <g class="axis">
        ${yTicks.map(([v, t]) => `<text x="${pad.l - 12}" y="${y(v) + 4}" text-anchor="end">${t}</text>`).join("")}
        ${xIdx.map((i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}">${fmtDate(data[i].d)}</text>`).join("")}
      </g>
      <path class="a-rev ${animate ? "area-in" : ""}" d="${areaPath}"/>
      <path class="l-ord ${animate ? "draw" : ""}" d="${ordPath}"/>
      <path class="l-rev ${animate ? "draw" : ""}" d="${revPath}"/>
      <g class="hover-g" id="hoverG">
        <line class="guide" id="guide" y1="${pad.t}" y2="${pad.t + ih}"/>
        <circle class="dot-ord" id="dotOrd" r="5"/>
        <circle class="dot-rev" id="dotRev" r="6.5"/>
      </g>
      <rect id="hit" x="${pad.l}" y="0" width="${iw}" height="${H}" fill="transparent"/>`;

    $$(".draw", svg).forEach((p) => p.style.setProperty("--len", Math.ceil(p.getTotalLength())));
    geo = { x, rev, ord, pad, iw };
    animate = false;

    const best = hoverIdx ?? data.reduce((b, p, i) => (p.rev > data[b].rev ? i : b), 0);
    setHover(best);
    $("#hit").addEventListener("pointermove", onMove);
    $("#hit").addEventListener("pointerdown", onMove);
  }

  function setHover(i) {
    if (!geo) return;
    i = Math.max(0, Math.min(data.length - 1, i));
    const [rx, ry] = geo.rev[i], [, oy] = geo.ord[i];
    const g = $("#guide");
    g.setAttribute("x1", rx); g.setAttribute("x2", rx);
    $("#dotRev").setAttribute("cx", rx); $("#dotRev").setAttribute("cy", ry);
    $("#dotOrd").setAttribute("cx", rx); $("#dotOrd").setAttribute("cy", oy);
    tip.innerHTML = `<b>₹${inr(data[i].rev)}</b><small>${fmtDate(data[i].d)} · ${data[i].ord} orders</small>`;
    const half = tip.offsetWidth / 2 + 4;
    tip.style.left = `${Math.max(half, Math.min(chartBox.clientWidth - half, rx))}px`;
    tip.style.top = `${ry - 14}px`;
  }

  function onMove(e) {
    const r = svg.getBoundingClientRect();
    const px = e.clientX - r.left;
    hoverIdx = Math.round(((px - geo.pad.l) / geo.iw) * (data.length - 1));
    setHover(hoverIdx);
  }

  rangeSel.addEventListener("change", () => {
    data = makeData(+rangeSel.value);
    animate = true; hoverIdx = null;
    drawChart();
  });

  let rT;
  window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(drawChart, 150); });
  // wait for fonts so text metrics are right, then draw
  (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(drawChart, 250));
})();
