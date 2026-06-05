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
  if (!loader) return;

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
      // Calculate how far to move from center to header logo (68px, 45px)
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = 68 - cx;
      const dy = 45 - cy;
      content.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      content.style.transform = `translate(${dx}px, ${dy}px) scale(0.08)`;
      content.style.opacity = '0';
    }
    loader.classList.add('is-exit');

    setTimeout(() => document.body.classList.add('is-loaded'), 500);
  }, 950);

  loader.addEventListener('transitionend', () => loader.remove(), { once: true });
}

// --- Scroll Reveal (Intersection Observer) ---
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
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

// --- Hero Canvas (gradient mesh / particles) ---
function initHeroCanvas() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.innerWidth < 768 || reduceMotion) return;
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h, mouseX = 0, mouseY = 0;
  let rafId = null;
  let running = false;
  const particles = [];
  const PARTICLE_COUNT = 18;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }
  }

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59, 94, 232, ${0.06 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach((p) => {
      // Mouse attraction
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160 && dist > 0) {
        p.vx += dx / dist * 0.012;
        p.vy += dy / dist * 0.012;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Bounce
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 94, 232, ${p.opacity})`;
      ctx.fill();
    });

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
  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.parentElement.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, { passive: true });

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

  img.style.transition = '--hero-parallax-y 0.1s linear';

  function update() {
    const scrollY = window.scrollY;
    const speed = 0.15;
    img.style.setProperty('--hero-parallax-y', `${scrollY * speed}px`);
  }

  window.addEventListener('scroll', update, { passive: true });
}

// --- Contact form mail fallback ---
function initContactForm() {
  const form = document.querySelector('[data-contact-mailto]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
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
  });
}
