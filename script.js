const t = (v) => (v == null ? "" : String(v));
const q = (s) => document.querySelector(s);

function toast(msg) {
  let el = q("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove("show"), 2200);
}

const shell = (s) => `<section id="${t(s.id)}" class="stack" aria-labelledby="title-${t(s.id)}"><h2 id="title-${t(s.id)}" class="section-title">${t(s.title)}</h2>`;
const card = (im, i) => `<figure class="gallery-card"><button class="gallery-trigger" type="button" data-i="${i}" data-src="${t(im.src)}" data-alt="${t(im.alt)}" data-cap="${t(im.caption)}"><img src="${t(im.src)}" alt="${t(im.alt)}" loading="lazy" /></button>${im.caption ? `<figcaption>${t(im.caption)}</figcaption>` : ""}</figure>`;

/* Section renderers: hero, timeline, gallery, list, text+gallery, masonry, about, contact. */
function renderHero(s) { return `<section id="${t(s.id)}" class="hero stack" aria-labelledby="title-${t(s.id)}"><img class="hero-media" src="${t(s.backgroundImage)}" alt="${t(s.backgroundAlt)}" loading="lazy" /><h1 id="title-${t(s.id)}">${t(s.title)}</h1><p class="hero-subtitle">${t(s.subtitle)}</p><p class="hero-intro">${t(s.intro)}</p><a class="btn" href="${t(s.cta && s.cta.href)}">${t(s.cta && s.cta.label)}</a></section>`; }
function renderTimeline(s) { return `${shell(s)}<ol class="timeline">${(s.items || []).map((i) => `<li><p class="timeline-period">${t(i.period)}</p><h3>${t(i.institution || i.title)}</h3><p>${t(i.program || i.subtitle)}</p><p class="muted">${t(i.details || i.description)}</p></li>`).join("")}</ol></section>`; }
function renderGallery(s) { return `${shell(s)}<div class="gallery-grid">${(s.images || []).map(card).join("")}</div></section>`; }
function renderList(s) { return `${shell(s)}${(s.summary || s.description) ? `<p class="muted">${t(s.summary || s.description)}</p>` : ""}<ul>${(s.items || []).map((i) => `<li>${t(typeof i === "string" ? i : i.name || i.title)}</li>`).join("")}</ul></section>`; }
function renderTextGallery(s) { const txt = t(s.summary || s.description || s.content); return `${shell(s)}${txt ? `<p>${txt}</p>` : ""}${s.images ? `<div class="gallery-grid">${(s.images || []).map(card).join("")}</div>` : ""}<ul>${(s.items || []).map((i) => `<li>${t(typeof i === "string" ? i : `${i.name || ""}${i.level ? ` (${i.level})` : ""}${i.note ? ` - ${i.note}` : ""}`)}</li>`).join("")}</ul></section>`; }
function renderMasonry(s) { return `${shell(s)}<div class="masonry">${(s.images || []).map(card).join("")}</div></section>`; }
function renderAbout(s) { return `${shell(s)}<p>${t(s.content)}</p><ul>${(s.highlights || []).map((h) => `<li>${t(h)}</li>`).join("")}</ul></section>`; }
function renderContact(s) { return `${shell(s)}<p><strong>Email:</strong> <a href="mailto:${t(s.email)}">${t(s.email)}</a></p><p><strong>Phone:</strong> ${t(s.phone)}</p><p><strong>Location:</strong> ${t(s.location)}</p><ul>${(s.social || []).map((i) => `<li><a href="${t(i.url)}" target="_blank" rel="noreferrer">${t(i.label)}</a></li>`).join("")}</ul><form id="contact-form" class="stack" novalidate><label>Name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label><label>Message<textarea name="message" rows="4" required></textarea></label><button class="btn" type="submit">Send Message</button></form></section>`; }

function getRenderer(s) {
  if (s.type === "hero") return renderHero;
  if (s.type === "timeline" || s.type === "education") return renderTimeline;
  if (s.type === "masonry" || s.variant === "masonry") return renderMasonry;
  if (s.type === "gallery") return renderGallery;
  if (s.type === "list" || s.type === "achievements") return renderList;
  if (s.type === "text+gallery" || s.type === "sports" || s.type === "hobbies") return renderTextGallery;
  if (s.type === "about") return renderAbout;
  if (s.type === "contact") return renderContact;
  return renderList;
}

/* Lightbox with next/prev, ESC, outside-click close, keyboard nav, index display. */
function setupLightbox() {
  const lb = q("#lightbox"), img = q("#lightbox-image"), cap = q("#lightbox-caption"), idx = q("#lightbox-index");
  const closeBtn = q("#lightbox-close"), prev = q("#lightbox-prev"), next = q("#lightbox-next");
  if (!lb || !img || !cap || !idx || !closeBtn || !prev || !next) return;
  const triggers = [...document.querySelectorAll(".gallery-trigger")];
  let at = 0, last;
  const paint = () => { const b = triggers[at]; if (!b) return; img.src = t(b.dataset.src); img.alt = t(b.dataset.alt); cap.textContent = t(b.dataset.cap); idx.textContent = `${at + 1} / ${triggers.length}`; };
  const open = (i, from) => { at = (i + triggers.length) % triggers.length; last = from; paint(); lb.hidden = false; lb.setAttribute("aria-hidden", "false"); closeBtn.focus(); };
  const close = () => { lb.hidden = true; lb.setAttribute("aria-hidden", "true"); img.src = ""; if (last) last.focus(); };
  document.addEventListener("click", (e) => { const b = e.target.closest(".gallery-trigger"); if (b) return open(Number(b.dataset.i || 0), b); if (e.target === lb) close(); });
  prev.addEventListener("click", () => { at--; paint(); });
  next.addEventListener("click", () => { at++; paint(); });
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (lb.hidden) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") { at--; paint(); } if (e.key === "ArrowRight") { at++; paint(); } });
}

/* Smooth anchors and active nav state while scrolling. */
function setupNav() {
  const links = [...document.querySelectorAll(".nav-list a[href^='#']")], byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  links.forEach((a) => a.addEventListener("click", (e) => { const id = a.getAttribute("href").slice(1), el = document.getElementById(id); if (!el) return; e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); history.replaceState(null, "", `#${id}`); }));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (!en.isIntersecting) return; links.forEach((a) => { a.classList.remove("is-active"); a.removeAttribute("aria-current"); }); const a = byId.get(en.target.id); if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "page"); } }), { rootMargin: "-40% 0px -45% 0px", threshold: 0.01 });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

/* Contact form: validates email, then uses mailto fallback and toast. */
function setupContactForm() {
  const f = q("#contact-form");
  if (!f) return;
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = t(f.name.value).trim(), email = t(f.email.value).trim(), message = t(f.message.value).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("Please enter a valid email.");
    if (!name || !message) return toast("Please complete all fields.");
    toast("Thanks. Opening your mail app.");
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:you@example.com?subject=Contact%20from%20Site&body=${body}`;
  });
}

async function init() {
  const main = q("#main-content");
  if (!main) return;
  try {
    const res = await fetch("content.json", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    document.title = t(data.site && data.site.title) || document.title;
    main.innerHTML = (data.sections || []).map((s) => getRenderer(s)(s)).join("");
    const f = q("#footer-text");
    if (f) f.textContent = `${t(data.site && data.site.owner)} | Updated ${t(data.site && data.site.updated)}`;
    setupLightbox();
    setupNav();
    setupContactForm();
  } catch {
    main.innerHTML = "<section><h2>Content failed to load</h2><p>Please verify content.json is available.</p></section>";
  }
}

init();
