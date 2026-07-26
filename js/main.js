/* ========================================
   Main JS — Scroll animations & interactions
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initScrollReveal();
  initHeader();
  initMobileNav();
  initSmoothScroll();
  initSplitText();
  initHeroCanvas();
  initScrollProgress();
  initCursorGlow();
  initParallax();
  initContactForm();
});

// --- Page Loader ---
function initPageLoader() {
  const loader = document.getElementById('loader');
  if (!loader) {
    // Pages without a loader are ready immediately
    document.body.classList.add('is-loaded');
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasSeenLoader = (() => {
    try {
      return sessionStorage.getItem('opusLoaderSeen') === '1';
    } catch {
      return false;
    }
  })();

  if (reduceMotion || hasSeenLoader) {
    loader.remove();
    document.body.classList.add('is-loaded');
    return;
  }

  try {
    sessionStorage.setItem('opusLoaderSeen', '1');
  } catch {
    // Ignore blocked storage; the loader still works normally.
  }

  // Generate bubbles that rise and pop
  const bubblesContainer = document.getElementById('loaderBubbles');
  if (bubblesContainer) {
    for (let i = 0; i < 10; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'loader__bubble';
      const size = Math.random() * 60 + 15;
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      bubble.style.left = (Math.random() * 80 + 10) + '%';
      bubble.style.bottom = -(Math.random() * 20) + '%';
      // Bigger bubbles rise further
      const rise = -(Math.random() * 60 + 40) + 'vh';
      bubble.style.setProperty('--rise', rise);
      bubble.style.setProperty('--duration', (Math.random() * 2 + 2.5) + 's');
      bubble.style.setProperty('--delay', (Math.random() * 2 + 0.5) + 's');
      bubble.style.setProperty('--wobble', (Math.random() * 1 + 1.5) + 's');
      bubblesContainer.appendChild(bubble);
    }
  }

  // Pull the loader toward the header logo before revealing the page.
  setTimeout(() => {
    const content = loader.querySelector('.loader__content');
    if (content) {
      // Aim at the actual header logo position (fallback: 68px, 45px)
      let tx = 68, ty = 45;
      const headerLogo = document.querySelector('.header__logo-mark');
      if (headerLogo) {
        const r = headerLogo.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
      }
      const dx = tx - window.innerWidth / 2;
      const dy = ty - window.innerHeight / 2;
      content.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      content.style.transform = `translate(${dx}px, ${dy}px) scale(0.08)`;
      content.style.opacity = '0';
    }
    loader.classList.add('is-exit');

    setTimeout(() => document.body.classList.add('is-loaded'), 200);
    // Hold time kept short — first-time visitors used to wait ~1.1s before
    // any content appeared.
  }, 260);

  loader.addEventListener('transitionend', () => loader.remove(), { once: true });
}

// --- Scroll Reveal (Intersection Observer) ---
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Also reveal elements already scrolled past, so fast flick
        // scrolling never leaves a section stuck invisible.
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach((el) => observer.observe(el));
}

// --- Header scroll behavior ---
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  function onScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 20) {
      header.classList.add('header--scrolled');
      header.classList.remove('header--transparent');
    } else {
      header.classList.remove('header--scrolled');
      if (header.dataset.transparent === 'true') {
        header.classList.add('header--transparent');
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- Mobile Navigation ---
function initMobileNav() {
  const menuBtn = document.querySelector('.header__menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeBtn = document.querySelector('.mobile-nav__close');
  // Every link in the panel, not just .mobile-nav__link — the contact CTA is a button
  const links = document.querySelectorAll('.mobile-nav a');

  if (!menuBtn || !mobileNav) return;

  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  if (!mobileNav.id) mobileNav.id = 'mobileNav';
  mobileNav.setAttribute('role', 'dialog');
  mobileNav.setAttribute('aria-modal', 'true');
  mobileNav.setAttribute('aria-label', 'メニュー');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-controls', mobileNav.id);

  function isOpen() {
    return mobileNav.classList.contains('is-open');
  }

  function open() {
    mobileNav.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
    // Move focus into the dialog so the keyboard lands somewhere useful.
    // Deferred past the open transition — visibility only flips to visible at
    // the end of it, and a hidden element cannot take focus.
    const first = mobileNav.querySelector(FOCUSABLE);
    if (first) {
      mobileNav.addEventListener('transitionend', function once() {
        mobileNav.removeEventListener('transitionend', once);
        if (isOpen()) first.focus();
      });
      // Fallback if the transition never fires (reduced motion, etc.)
      setTimeout(() => {
        if (isOpen() && !mobileNav.contains(document.activeElement)) first.focus();
      }, 350);
    }
  }

  function close() {
    if (!isOpen()) return;
    mobileNav.classList.remove('is-open');
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.focus();
  }

  // Close without restoring focus — used when a link navigates away
  function dismiss() {
    mobileNav.classList.remove('is-open');
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  // Keep Tab inside the dialog while it is open
  function trapFocus(e) {
    if (e.key !== 'Tab' || !isOpen()) return;
    const items = [...mobileNav.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetWidth || el.offsetHeight || el.getClientRects().length
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  menuBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  links.forEach((link) => link.addEventListener('click', dismiss));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      close();
    }
    trapFocus(e);
  });
}

// --- Smooth scroll for anchor links ---
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// --- Split Text Animation (character-by-character) ---
function initSplitText() {
  const lines = document.querySelectorAll('[data-split-line]');
  if (!lines.length) return;

  lines.forEach((line, lineIdx) => {
    const text = line.textContent;
    line.textContent = '';
    line.classList.add('is-split');

    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = `${lineIdx * 0.4 + i * 0.05}s`;
      line.appendChild(span);
    });
  });
}

// --- Hero Canvas (generative dotted flow field) ---
function initHeroCanvas() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  let rafId = null;
  let running = false;
  let t = 0;
  const particles = [];
  const TRAIL = 9;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(p, edge) {
    p.x = edge ? -12 : Math.random() * w;
    p.y = Math.random() * h;
    p.speed = 0.5 + Math.random() * 1.0;
    p.alpha = 0.07 + Math.random() * 0.26;
    p.tick = (Math.random() * 3) | 0;
    p.trail = [];
  }

  function createParticles() {
    particles.length = 0;
    const count = Math.round(Math.min(230, Math.max(70, w / 6.5)));
    for (let i = 0; i < count; i++) {
      const p = {};
      spawn(p, false);
      particles.push(p);
    }
  }

  // Pseudo curl field: layered sine waves, biased to drift right
  function fieldAngle(x, y, time) {
    return (
      Math.sin(x * 0.0016 + time * 0.00022) * 0.85 +
      Math.cos(y * 0.0021 - time * 0.00017) * 0.85
    ) * 0.6;
  }

  function draw() {
    if (!running) return;
    t += 16;
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      const a = fieldAngle(p.x, p.y, t);
      p.x += Math.cos(a) * p.speed * 1.5 + 0.4;
      p.y += Math.sin(a) * p.speed * 0.9;

      p.tick++;
      if (p.tick % 3 === 0) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > TRAIL) p.trail.shift();
      }

      if (p.x > w + 16 || p.y < -16 || p.y > h + 16) spawn(p, true);

      for (let i = 0; i < p.trail.length; i++) {
        const q = p.trail[i];
        const k = (i + 1) / p.trail.length;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 0.7 + k * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 94, 232, ${p.alpha * k})`;
        ctx.fill();
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    draw();
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  resize();
  createParticles();

  window.addEventListener('resize', () => { resize(); createParticles(); }, { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && document.visibilityState === 'visible') {
          start();
        } else {
          stop();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop();
    else start();
  });
}

// --- Scroll Progress Bar ---
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// --- Cursor Glow Effect ---
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!glow || window.innerWidth < 768 || reduceMotion) return;

  let active = false;
  let rafId = null;
  let nextX = 0;
  let nextY = 0;

  document.addEventListener('mousemove', (e) => {
    if (!active) {
      glow.classList.add('is-active');
      active = true;
    }
    nextX = e.clientX;
    nextY = e.clientY;
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        glow.style.left = nextX + 'px';
        glow.style.top = nextY + 'px';
        rafId = null;
      });
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    glow.classList.remove('is-active');
    active = false;
  });
}

// --- Parallax on hero image ---
function initParallax() {
  const el = document.querySelector('[data-parallax]');
  if (!el || window.innerWidth < 768) return;

  const img = el.querySelector('img');
  if (!img) return;

  function update() {
    const scrollY = window.scrollY;
    const speed = 0.15;
    img.style.setProperty('--hero-parallax-y', `${scrollY * speed}px`);
  }

  window.addEventListener('scroll', update, { passive: true });
}

// --- Contact form submission ---
// The endpoint is an Apps Script Web App. Its ContentService responses are served with
// Access-Control-Allow-Origin: *, so a CORS fetch can read the JSON body and we can tell
// success from failure. Content-Type text/plain keeps it a simple request (Apps Script
// cannot answer a CORS preflight). If the response still cannot be read - offline, proxy,
// Google hiccup - we do not guess: we ask the endpoint whether the submission arrived
// (JSONP, which is not subject to CORS) before deciding what to tell the visitor.
const CONTACT_SUBMIT_TIMEOUT_MS = 20000;
const CONTACT_VERIFY_TIMEOUT_MS = 8000;
const CONTACT_MAIL_ADDRESS = 'contact@opus-net.net';

function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const submitButton = form.querySelector('.form-submit');
  const status = form.querySelector('.form-status');
  const startedAt = Date.now();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    // data-contact-endpoint wins; the form's own action is the no-JavaScript fallback.
    const endpoint = (form.dataset.contactEndpoint || form.getAttribute('action') || '').trim();

    if (endpoint) {
      await submitContactToEndpoint(form, formData, endpoint, submitButton, status, startedAt);
      return;
    }

    openContactMail(form, formData);
  });
}

async function submitContactToEndpoint(form, formData, endpoint, submitButton, status, startedAt) {
  if (formData.get('website')) return;

  const payload = Object.fromEntries(formData.entries());
  payload.elapsed_ms = Date.now() - startedAt;
  payload.submission_id = createContactSubmissionId();

  clearContactFallback(status);
  setContactStatus(status, 'sending', '送信中です。しばらくお待ちください。');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = '送信中';
  }

  let result = null;
  try {
    result = await postContact(endpoint, payload);
  } catch (error) {
    // We do not know whether the server got it. Ask before reporting anything.
    result = await verifyContactDelivery(endpoint, payload.submission_id);
  }

  if (result && result.ok) {
    form.reset();
    setContactStatus(
      status,
      'success',
      'お問い合わせを送信しました。担当者よりご連絡いたします。'
    );
  } else if (result && result.message === 'invalid_payload') {
    setContactStatus(
      status,
      'error',
      '入力内容に不備があるため送信できませんでした。必須項目をご確認のうえ、もう一度お試しください。'
    );
  } else if (result) {
    setContactStatus(
      status,
      'error',
      `送信に失敗しました。お手数ですが、下のボタンからメールでお送りいただくか、${CONTACT_MAIL_ADDRESS} まで直接ご連絡ください。`
    );
    showContactFallback(status, form, formData);
  } else {
    setContactStatus(
      status,
      'error',
      `送信できたか確認できませんでした。通信環境をご確認のうえ再度お試しいただくか、下のボタンからメールでお送りください（${CONTACT_MAIL_ADDRESS}）。`
    );
    showContactFallback(status, form, formData);
  }

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = '入力内容を送信';
  }
}

/**
 * POST the payload and read the endpoint's JSON answer.
 * Resolves with the parsed body ({ ok, message }); throws when the outcome is unknown.
 */
async function postContact(endpoint, payload) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), CONTACT_SUBMIT_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      // Simple request: no preflight, which Apps Script could not answer anyway.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
    });

    if (!response.ok) throw new Error(`contact endpoint returned ${response.status}`);

    const text = await response.text();
    const data = JSON.parse(text);
    if (!data || typeof data.ok !== 'boolean') throw new Error('unexpected contact response');
    return data;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Last resort when the POST response was unreadable: ask the endpoint whether that
 * submission id arrived. A <script> tag is not subject to CORS, so this still works when
 * fetch is blocked. Resolves with { ok: true } when confirmed, otherwise null (unknown).
 */
function verifyContactDelivery(endpoint, submissionId) {
  if (!submissionId) return Promise.resolve(null);

  return new Promise((resolve) => {
    const callbackName = `opusContactCheck_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement('script');
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      delete window[callbackName];
      script.remove();
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), CONTACT_VERIFY_TIMEOUT_MS);

    window[callbackName] = (data) => finish(data && data.ok ? { ok: true, message: 'received' } : null);
    script.onerror = () => finish(null);
    script.src = `${endpoint}?check=${encodeURIComponent(submissionId)}&callback=${callbackName}`;
    document.head.appendChild(script);
  });
}

function createContactSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Offers the mailto fallback without touching the page markup. */
function showContactFallback(status, form, formData) {
  if (!status) return;
  clearContactFallback(status);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn--outline contact-fallback-btn';
  button.dataset.contactFallback = 'true';
  button.textContent = 'メールソフトで送信する';
  button.addEventListener('click', () => openContactMail(form, formData));

  status.insertAdjacentElement('afterend', button);
}

function clearContactFallback(status) {
  if (!status) return;
  const existing = status.parentElement
    ? status.parentElement.querySelector('[data-contact-fallback]')
    : null;
  if (existing) existing.remove();
}

function openContactMail(form, formData) {
    const to = form.dataset.contactMailto;
    const subject = `【Opus.net公式サイト】${formData.get('inquiry_type') || 'お問い合わせ'}`;
    const body = [
      `お問い合わせ内容: ${formData.get('inquiry_type') || ''}`,
      `法人名・団体名: ${formData.get('company_name') || ''}`,
      `お名前: ${formData.get('name') || ''}`,
      `メールアドレス: ${formData.get('email') || ''}`,
      `電話番号: ${formData.get('phone') || ''}`,
      '',
      'お問い合わせ詳細:',
      formData.get('message') || '',
    ].join('\n');

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function setContactStatus(status, type, message) {
  if (!status) return;

  status.textContent = message;
  status.className = `form-status form-status--${type}`;
}
