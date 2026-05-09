/* PUKiB site interactions */

(function () {
  'use strict';

  /* ============== Mobile menu toggle ============== */
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ============== Hero video poster fade-out when video is ready ============== */
  document.querySelectorAll('[data-hero-video]').forEach(video => {
    const wrap = video.closest('[data-hero-video-wrap]');
    if (!wrap) return;
    const markReady = () => wrap.classList.add('video-ready');
    if (video.readyState >= 3) markReady();
    video.addEventListener('canplay', markReady, { once: true });
    video.addEventListener('playing', markReady, { once: true });
  });

  /* ============== Scroll reveal ============== */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ============== Container showcase — SVG isometric switcher ============== */
  const showcase = document.querySelector('[data-showcase]');
  if (showcase) {
    const buttons = showcase.querySelectorAll('[data-size-pick]');
    const stages = showcase.querySelectorAll('[data-size-stage]');
    const setSize = (size) => {
      buttons.forEach(b => b.classList.toggle('active', b.dataset.sizePick === size));
      stages.forEach(s => s.classList.toggle('active', s.dataset.sizeStage === size));
    };
    buttons.forEach(b => {
      b.addEventListener('click', () => setSize(b.dataset.sizePick));
    });
    const initial = showcase.querySelector('[data-size-pick].active');
    if (initial) setSize(initial.dataset.sizePick);
  }

  /* ============== Smooth section scroll for anchor links ============== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============== Order form (cennik) ============== */
  const orderForm = document.querySelector('[data-order-form]');
  if (orderForm) {
    const sizeButtons = orderForm.querySelectorAll('[data-size-btn]');
    const wasteButtons = orderForm.querySelectorAll('[data-waste-btn]');
    const summarySize = orderForm.querySelector('[data-summary-size]');
    const summaryPrice = orderForm.querySelector('[data-summary-price]');
    const summaryTransport = orderForm.querySelector('[data-summary-transport]');
    const totalEl = orderForm.querySelector('[data-summary-total]');
    const submitBtn = orderForm.querySelector('[data-submit]');

    const PRICE = {
      'gruz-7':       { net: 900,  label: 'Gruz · 7 m³' },
      'mix-7':        { net: 1300, label: 'Odpady mieszane · 7 m³' },
      'mix-10':       { net: 1800, label: 'Odpady mieszane · 10 m³' },
      'mix-36':       { net: 3700, label: 'Odpady mieszane · 36 m³' },
    };

    const TRANSPORT = {
      strefa1: { net: 100, label: 'Strefa I — Jastrzębie · Rybnik · Żory' },
      strefa2: { net: 200, label: 'Strefa II — Pszczyna · Cieszyn · Knurów' },
      strefa3: { net: 300, label: 'Strefa III — Katowice · Gliwice · Bielsko' },
    };

    let state = {
      product: 'gruz-7',
      transport: 'strefa1',
    };

    const fmt = (n) => new Intl.NumberFormat('pl-PL').format(n);

    const recalc = () => {
      const p = PRICE[state.product];
      const t = TRANSPORT[state.transport];
      if (!p || !t) return;
      summarySize && (summarySize.textContent = p.label);
      summaryPrice && (summaryPrice.textContent = fmt(p.net) + ' zł');
      summaryTransport && (summaryTransport.textContent = fmt(t.net) + ' zł');
      const total = (p.net + t.net) * 1.08;
      totalEl && (totalEl.textContent = fmt(Math.round(total)) + ' zł');
    };

    sizeButtons.forEach(b => {
      b.addEventListener('click', () => {
        sizeButtons.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.product = b.dataset.sizeBtn;
        // also drive the showcase visualization (if present)
        const stageSize = b.dataset.stageSize;
        if (stageSize) {
          const showcase = document.querySelector('[data-showcase]');
          if (showcase) {
            showcase.querySelectorAll('[data-size-stage]').forEach(s => {
              s.classList.toggle('active', s.dataset.sizeStage === stageSize);
            });
          }
        }
        recalc();
      });
    });

    wasteButtons.forEach(b => {
      b.addEventListener('click', () => {
        wasteButtons.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.transport = b.dataset.wasteBtn;
        recalc();
      });
    });

    // Initialize showcase visualization on page load
    const initialSizeBtn = orderForm.querySelector('[data-size-btn].active[data-stage-size]');
    if (initialSizeBtn) {
      const initSize = initialSizeBtn.dataset.stageSize;
      const showcase = document.querySelector('[data-showcase]');
      if (showcase) {
        showcase.querySelectorAll('[data-size-stage]').forEach(s => {
          s.classList.toggle('active', s.dataset.sizeStage === initSize);
        });
      }
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const p = PRICE[state.product];
        const t = TRANSPORT[state.transport];
        const name = orderForm.querySelector('[name="name"]')?.value || '';
        const phone = orderForm.querySelector('[name="phone"]')?.value || '';
        const email = orderForm.querySelector('[name="email"]')?.value || '';
        const address = orderForm.querySelector('[name="address"]')?.value || '';
        const date = orderForm.querySelector('[name="date"]')?.value || '';
        const city = orderForm.querySelector('[name="city"]')?.value || '';
        const notes = orderForm.querySelector('[name="notes"]')?.value || '';

        if (!name || !phone) {
          alert('Wypełnij imię i numer telefonu — bez tego nie zamówimy kontenera.');
          return;
        }

        const total = Math.round((p.net + t.net) * 1.08);
        const subject = `Zamówienie kontenera — ${p.label}`;
        const body =
`Dzień dobry,

Chciał(a)bym zamówić kontener:

— Kontener: ${p.label} (${fmt(p.net)} zł netto)
— Transport: ${t.label} (${fmt(t.net)} zł netto)
— RAZEM Z VAT 8%: ${fmt(total)} zł brutto

Dane kontaktowe:
— Imię i nazwisko: ${name}
— Telefon: ${phone}
— E-mail: ${email}
— Adres podstawienia: ${address}
— Miejscowość: ${city}
— Preferowany termin: ${date}

Dodatkowe informacje:
${notes || '—'}

Pozdrawiam.`;

        const mailto = `mailto:kontenery@pukib.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
      });
    }

    recalc();
  }

  /* ============== FAQ accordion (FIXED — iterates over each .faq-item) ============== */
  document.querySelectorAll('[data-faq] .faq-item').forEach(item => {
    const q = item.querySelector('[data-faq-q]');
    if (!q) return;
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ============== Marquee duplication for seamless loop ============== */
  document.querySelectorAll('.marquee-track').forEach(track => {
    if (track.dataset.duplicated === 'true') return;
    track.innerHTML += track.innerHTML;
    track.dataset.duplicated = 'true';
  });

})();
