document.addEventListener('DOMContentLoaded', () => {
  ensureGlobalEffects();
  initScrollReveal();
  initHeader();
  initMobileNav();
  initSmoothScroll();
  initBrandMark();
  initServiceMedia();
  initContactForm();
  document.body.classList.add('is-ready');
});

function ensureGlobalEffects() {
  let progress = document.getElementById('scrollProgress');
  if (!progress) {
    progress = document.createElement('div');
    progress.id = 'scrollProgress';
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
  }

  let cursor = document.getElementById('cursorGlow');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = 'cursorGlow';
    cursor.className = 'cursor-glow';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
  }

  initScrollProgress(progress);
  initCursor(cursor);
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!reveals.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: .12,
    rootMargin: '0px 0px -4% 0px',
  });

  reveals.forEach((element) => observer.observe(element));
}

function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let queued = false;
  const update = () => {
    header.classList.toggle('header--scrolled', window.scrollY > 20);
    queued = false;
  };

  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

function initMobileNav() {
  const menuButton = document.querySelector('.header__menu-btn');
  const navigation = document.querySelector('.mobile-nav');
  const closeButton = document.querySelector('.mobile-nav__close');
  if (!menuButton || !navigation) return;

  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const links = navigation.querySelectorAll('a');

  if (!navigation.id) navigation.id = 'mobileNav';
  navigation.setAttribute('role', 'dialog');
  navigation.setAttribute('aria-modal', 'true');
  navigation.setAttribute('aria-label', 'メニュー');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-controls', navigation.id);

  const isOpen = () => navigation.classList.contains('is-open');

  const open = () => {
    navigation.classList.add('is-open');
    document.body.classList.add('nav-open');
    menuButton.setAttribute('aria-expanded', 'true');
    const first = navigation.querySelector(focusableSelector);
    window.setTimeout(() => {
      if (isOpen() && first) first.focus();
    }, 360);
  };

  const close = ({ restoreFocus = true } = {}) => {
    if (!isOpen()) return;
    navigation.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuButton.focus();
  };

  const trapFocus = (event) => {
    if (event.key !== 'Tab' || !isOpen()) return;
    const items = [...navigation.querySelectorAll(focusableSelector)].filter(
      (element) => element.offsetWidth || element.offsetHeight || element.getClientRects().length
    );
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  menuButton.addEventListener('click', open);
  if (closeButton) closeButton.addEventListener('click', () => close());
  links.forEach((link) => link.addEventListener('click', () => close({ restoreFocus: false })));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      close();
      return;
    }
    trapFocus(event);
  });
}

function initSmoothScroll() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });
}

function initScrollProgress(progress) {
  let queued = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
    queued = false;
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  update();
}

function initCursor(cursor) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (reduceMotion || !finePointer || window.innerWidth <= 900) return;

  let currentX = -100;
  let currentY = -100;
  let targetX = -100;
  let targetY = -100;
  let running = true;

  document.addEventListener('mousemove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.classList.add('is-active');
  }, { passive: true });

  document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  document.querySelectorAll('a, button, input, textarea, label').forEach((element) => {
    element.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    element.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });

  const animate = () => {
    if (!running) return;
    currentX += (targetX - currentX) * .22;
    currentY += (targetY - currentY) * .22;
    cursor.style.left = `${currentX}px`;
    cursor.style.top = `${currentY}px`;
    requestAnimationFrame(animate);
  };

  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
    if (running) requestAnimationFrame(animate);
  });
  requestAnimationFrame(animate);
}

function initBrandMark() {
  const spin = document.getElementById('brandMarkSpin');
  if (!spin) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  let queued = false;
  const update = () => {
    spin.style.transform = `rotate(${window.scrollY * .03}deg)`;
    queued = false;
  };

  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
}

function initServiceMedia() {
  const rows = document.querySelectorAll('.home-service-row');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!rows.length || !finePointer || window.innerWidth <= 900) return;

  let currentX = -300;
  let currentY = -300;
  let targetX = -300;
  let targetY = -300;
  let activeMedia = null;

  document.addEventListener('mousemove', (event) => {
    targetX = Math.min(window.innerWidth - 282, Math.max(12, event.clientX + 28));
    targetY = Math.min(window.innerHeight - 182, Math.max(12, event.clientY - 85));
  }, { passive: true });

  const animate = () => {
    currentX += (targetX - currentX) * .12;
    currentY += (targetY - currentY) * .12;
    if (activeMedia) {
      activeMedia.style.left = `${currentX}px`;
      activeMedia.style.top = `${currentY}px`;
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  rows.forEach((row) => {
    const media = row.querySelector('.home-service-row__media');
    if (!media) return;
    row.addEventListener('mouseenter', () => {
      if (activeMedia && activeMedia !== media) activeMedia.classList.remove('is-floating');
      activeMedia = media;
      media.classList.add('is-floating');
    });
    row.addEventListener('mouseleave', () => {
      media.classList.remove('is-floating');
      if (activeMedia === media) activeMedia = null;
    });
  });
}

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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    if (!formData.get('cf-turnstile-response')) {
      setContactStatus(
        status,
        'error',
        'スパム防止の確認が完了していません。少し待ってから、もう一度送信してください。確認欄が表示されない場合は、下のボタンからメールでお送りください。'
      );
      showContactFallback(status, form, formData);
      return;
    }
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
    result = await verifyContactDelivery(endpoint, payload.submission_id);
  }

  if (result && result.ok) {
    form.reset();
    resetContactTurnstile(form);
    setContactStatus(
      status,
      'success',
      'お問い合わせを送信しました。担当者よりご連絡いたします。'
    );
  } else if (result && (
    result.message === 'turnstile_required'
    || result.message === 'turnstile_failed'
    || result.message === 'turnstile_unavailable'
  )) {
    resetContactTurnstile(form);
    setContactStatus(
      status,
      'error',
      'スパム防止の確認ができませんでした。画面を更新してもう一度お試しいただくか、下のボタンからメールでお送りください。'
    );
    showContactFallback(status, form, formData);
  } else if (result && result.message === 'invalid_payload') {
    resetContactTurnstile(form);
    setContactStatus(
      status,
      'error',
      '入力内容に不備があるため送信できませんでした。必須項目をご確認のうえ、もう一度お試しください。'
    );
  } else if (result) {
    resetContactTurnstile(form);
    setContactStatus(
      status,
      'error',
      `送信に失敗しました。お手数ですが、下のボタンからメールでお送りいただくか、${CONTACT_MAIL_ADDRESS} まで直接ご連絡ください。`
    );
    showContactFallback(status, form, formData);
  } else {
    resetContactTurnstile(form);
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

function resetContactTurnstile(form) {
  if (!window.turnstile || typeof window.turnstile.reset !== 'function') return;
  if (!form.querySelector('.cf-turnstile')) return;
  try {
    // This page has one implicit widget. Omitting the id resets every rendered widget.
    window.turnstile.reset();
  } catch (error) {
    // The widget may not have finished rendering yet. A page reload remains available.
  }
}

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
