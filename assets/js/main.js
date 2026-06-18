/* ============================================================
   GLORY TECHNOLOGY — Main JS
   ============================================================ */

/* ── Theme (anti-flash handled inline in <head>) ─────────── */
function initTheme() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const update = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.querySelector('.theme-label').textContent = dark ? 'Light' : 'Dark';
    btn.querySelector('.theme-icon').innerHTML = dark
      ? `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  };
  btn.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
    localStorage.setItem('gt-theme', dark ? 'light' : 'dark');
    update();
    if (!dark) initCanvas(); else stopCanvas();
  });
  update();
}

/* ── Language toggle ─────────────────────────────────────── */
let currentLang = localStorage.getItem('gt-lang') || 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('gt-lang', lang);
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = lang === 'zh' ? (el.getAttribute('data-zh') || el.getAttribute('data-en')) : el.getAttribute('data-en');
  });
  document.querySelectorAll('[data-en-html]').forEach(el => {
    el.innerHTML = lang === 'zh' ? (el.getAttribute('data-zh-html') || el.getAttribute('data-en-html')) : el.getAttribute('data-en-html');
  });
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.querySelector('.lang-label').textContent = lang === 'zh' ? 'EN' : '中';
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
}

function initLang() {
  setLang(currentLang);
  const btn = document.getElementById('lang-btn');
  if (!btn) return;
  btn.addEventListener('click', () => setLang(currentLang === 'zh' ? 'en' : 'zh'));
}

/* ── Nav ─────────────────────────────────────────────────── */
function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const mobile = document.querySelector('.nav-mobile');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      mobile.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobile.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  // Active nav link
  const path = window.location.pathname.replace(/\/$/, '').split('/').pop() || 'index';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const page = href.replace('.html', '').replace(/^\//, '').replace(/\/$/, '') || 'index';
    if (page === path || (path === '' && page === 'index')) a.classList.add('active');
  });
}

/* ── Scroll reveal ───────────────────────────────────────── */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const delay = e.target.dataset.d || 0;
        setTimeout(() => e.target.classList.add('in'), delay);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── Canvas hero (hexagonal grid drift) ──────────────────── */
let canvasAnim = null;

function stopCanvas() {
  if (canvasAnim) { cancelAnimationFrame(canvasAnim); canvasAnim = null; }
  const c = document.getElementById('hero-canvas');
  if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); }
}

function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const HEX_SIZE = 36;
  const color = dark ? 'rgba(232,64,0,' : 'rgba(26,64,96,';

  // Generate hex grid points
  const hexes = [];
  const cols = Math.ceil(canvas.width / (HEX_SIZE * 1.8)) + 2;
  const rows = Math.ceil(canvas.height / (HEX_SIZE * 1.6)) + 2;

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const x = c * HEX_SIZE * 1.75 + (r % 2 === 0 ? 0 : HEX_SIZE * 0.875);
      const y = r * HEX_SIZE * 1.5;
      hexes.push({ x, y, ox: x, oy: y, phase: Math.random() * Math.PI * 2, speed: 0.003 + Math.random() * 0.004, amp: 6 + Math.random() * 10, opacity: 0.03 + Math.random() * 0.06 });
    }
  }

  function drawHex(x, y, size, opacity) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = color + opacity + ')';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  let t = 0;
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t++;
    hexes.forEach(h => {
      h.phase += h.speed;
      const dy = Math.sin(h.phase) * h.amp;
      drawHex(h.ox, h.oy + dy, HEX_SIZE * 0.9, h.opacity);
    });
    canvasAnim = requestAnimationFrame(frame);
  }
  if (canvasAnim) cancelAnimationFrame(canvasAnim);
  frame();
}

/* ── Contact form ────────────────────────────────────────── */
function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = currentLang === 'zh' ? '发送中...' : 'Sending...';

    // Set dynamic subject
    const company = form.querySelector('[name="company"]')?.value || '';
    const subject = form.querySelector('[name="_subject"]');
    if (subject) subject.value = `Glory Tech Enquiry — ${company}`;

    const replyto = form.querySelector('[name="_replyto"]');
    const emailField = form.querySelector('[name="email"]');
    if (replyto && emailField) replyto.value = emailField.value;

    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (res.ok) {
        showToast(currentLang === 'zh' ? '感谢您的留言，我们将尽快回复。' : 'Message sent! We\'ll be in touch soon.');
        form.reset();
      } else {
        showToast(currentLang === 'zh' ? '发送失败，请稍后再试。' : 'Something went wrong. Please try again.');
      }
    } catch {
      showToast(currentLang === 'zh' ? '发送失败，请稍后再试。' : 'Something went wrong. Please try again.');
    }
    btn.disabled = false;
    btn.setAttribute('data-en', 'Send Message');
    btn.setAttribute('data-zh', '发送消息');
    btn.textContent = currentLang === 'zh' ? '发送消息' : 'Send Message';
  });
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

/* ── WhatsApp bubble ─────────────────────────────────────── */
function initWhatsApp() {
  const wa = document.createElement('a');
  wa.href = 'https://wa.me/6598663084';
  wa.target = '_blank';
  wa.rel = 'noopener noreferrer';
  wa.className = 'wa-bubble';
  wa.setAttribute('aria-label', 'Chat with us on WhatsApp');
  wa.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.855L.073 23.486a.75.75 0 0 0 .918.919l5.7-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.504-5.222-1.383l-.374-.216-3.384.866.88-3.308-.235-.385A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>`;
  document.body.appendChild(wa);
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLang();
  initNav();
  initReveal();
  initCanvas();
  initForm();
  initWhatsApp();
});
