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

    setTimeout(() => document.body.classList.add('is-loaded'), 400);
  }, 700);

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
  const links = document.querySelectorAll('.mobile-nav__link');

  if (!menuBtn || !mobileNav) return;

  function open() {
    mobileNav.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    mobileNav.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  links.forEach((link) => link.addEventListener('click', close));
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
    const endpoint = (form.dataset.contactEndpoint || '').trim();

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

  setContactStatus(status, 'sending', '送信中です。しばらくお待ちください。');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = '送信中';
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    form.reset();
    setContactStatus(status, 'success', 'お問い合わせを受け付けました。担当者よりご連絡いたします。');
  } catch {
    setContactStatus(status, 'error', '送信できませんでした。メールでのお問い合わせ画面を開きます。');
    openContactMail(form, formData);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = '入力内容を送信';
    }
  }
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
