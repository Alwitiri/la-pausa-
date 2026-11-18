/* La Pausa Café — public site interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- sticky nav ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const burger = $("#burger");
  const links = $("#navLinks");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  $$("a, button", links).forEach((el) => el.addEventListener("click", () => setMenu(false)));

  /* ---------- active link on scroll ---------- */
  const sections = $$("main section[id], footer[id]");
  const navMap = new Map($$(".nav-links a").map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting || !navMap.has(e.target.id)) return;
      navMap.forEach((a) => a.classList.remove("active"));
      navMap.get(e.target.id).classList.add("active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  $$(".reveal, .sketch").forEach((el) => io.observe(el));

  /* ---------- hero parallax ---------- */
  const heroContent = $(".hero-content");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroContent.style.transform = `translateY(${y * 0.25}px)`;
        heroContent.style.opacity = 1 - y / (window.innerHeight * 0.9);
      }
    }, { passive: true });
  }

  /* ---------- menu carousel ---------- */
  const track = $("#menuTrack");
  const step = () => track.querySelector(".dish").getBoundingClientRect().width + 18;
  $("#menuNext").addEventListener("click", () => {
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step() });
  });
  $("#menuPrev").addEventListener("click", () => {
    const atStart = track.scrollLeft <= 4;
    track.scrollTo({ left: atStart ? track.scrollWidth : track.scrollLeft - step() });
  });

  /* ---------- testimonials ---------- */
  const quotes = $$(".quote");
  let qi = 0, qTimer;
  const showQuote = (n) => {
    const prev = quotes[qi];
    prev.classList.add("leaving");
    prev.classList.remove("active");
    setTimeout(() => prev.classList.remove("leaving"), 700);
    qi = (n + quotes.length) % quotes.length;
    quotes[qi].classList.add("active");
  };
  const autoQuotes = () => { clearInterval(qTimer); qTimer = setInterval(() => showQuote(qi + 1), 6000); };
  $("#qNext").addEventListener("click", () => { showQuote(qi + 1); autoQuotes(); });
  $("#qPrev").addEventListener("click", () => { showQuote(qi - 1); autoQuotes(); });
  autoQuotes();

  /* ---------- toast ---------- */
  const toast = $("#toast");
  let tTimer;
  const notify = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(tTimer);
    tTimer = setTimeout(() => toast.classList.remove("show"), 3500);
  };

  /* ---------- booking modal ---------- */
  const modal = $("#booking");
  const form = $("#bookingForm");
  form.date.min = new Date().toISOString().split("T")[0];
  const openModal = () => {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => form.name.focus(), 50);
  };
  const closeModal = () => { modal.hidden = true; document.body.style.overflow = ""; };
  $$("[data-open-booking]").forEach((b) => b.addEventListener("click", openModal));
  $$("[data-close]", modal).forEach((b) => b.addEventListener("click", closeModal));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const date = new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    closeModal();
    form.reset();
    notify(`Thanks ${d.name.split(" ")[0]}! Table for ${d.guests} on ${date} at ${d.time} requested ☕`);
  });

  /* ---------- lightbox ---------- */
  const lb = $("#lightbox");
  const lbImg = $("#lightboxImg");
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ""; };
  $$(".g-item").forEach((g) => g.addEventListener("click", () => {
    lbImg.src = g.dataset.full;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }));
  lb.addEventListener("click", (e) => { if (e.target !== lbImg) closeLb(); });
  $("[data-open-gallery]").addEventListener("click", (e) => { e.preventDefault(); $(".g-item").click(); });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!modal.hidden) closeModal();
    if (!lb.hidden) closeLb();
    if (links.classList.contains("open")) setMenu(false);
  });

  /* ---------- small extras ---------- */
  $("[data-open-menu]").addEventListener("click", (e) => { e.preventDefault(); notify("Full menu coming soon — swipe through our favourites above!"); });
  $("#watchVibe").addEventListener("click", () => notify("🎬 Vibe video coming soon!"));
  $$(".dish").forEach((d) => d.addEventListener("click", () => notify(`${d.querySelector("h3").textContent} — ask our barista for today's specials!`)));
})();
