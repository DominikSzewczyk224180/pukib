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

  /* ============== Hero video: hide poster when ready ============== */
  const heroVideo = document.querySelector('.hero-video');
  const heroEl = document.querySelector('.hero');
  if (heroVideo && heroEl) {
    const markReady = () => heroEl.classList.add('video-ready');
    if (heroVideo.readyState >= 3) markReady();
    heroVideo.addEventListener('canplay', markReady, { once: true });
    heroVideo.addEventListener('playing', markReady, { once: true });
  }

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

  /* ============== Container showcase interactions ============== */
  const containerItems = document.querySelectorAll('.container-item');
  const cube = document.querySelector('.cube');
  if (containerItems.length && cube) {
    containerItems.forEach(item => {
      item.addEventListener('click', () => {
        containerItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const size = item.getAttribute('data-size');
        cube.setAttribute('data-size', size);
      });
      item.addEventListener('mouseenter', () => {
        const size = item.getAttribute('data-size');
        if (size) cube.setAttribute('data-size', size);
      });
    });
  }

  /* ============== Time/date for topbar live status ============== */
  const liveTime = document.querySelector('[data-live-time]');
  if (liveTime) {
    const update = () => {
      const d = new Date();
      const t = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      liveTime.textContent = t;
    };
    update();
    setInterval(update, 30 * 1000);
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
    const summaryWaste = orderForm.querySelector('[data-summary-waste]');
    const summaryPrice = orderForm.querySelector('[data-summary-price]');
    const summaryTransport = orderForm.querySelector('[data-summary-transport]');
    const totalEl = orderForm.querySelector('[data-summary-total]');
    const cityInput = orderForm.querySelector('[data-city]');
    const messageBody = orderForm.querySelector('[data-msg-body]');
    const submitBtn = orderForm.querySelector('[data-submit]');

    const PRICE = {
      'gruz-7':       { net: 900,  label: 'Gruz 7m³' },
      'mix-7':        { net: 1300, label: 'Odpady zmieszane 7m³' },
      'mix-10':       { net: 1800, label: 'Odpady zmieszane 10m³' },
      'mix-36':       { net: 3700, label: 'Odpady zmieszane 36m³' },
    };

    const TRANSPORT = {
      strefa1: { net: 100, label: 'Strefa I (Jastrzębie/Rybnik/Żory)' },
      strefa2: { net: 200, label: 'Strefa II (Pszczyna/Cieszyn/Knurów)' },
      strefa3: { net: 300, label: 'Strefa III (Katowice/Gliwice/Bielsko)' },
    };

    let state = {
      product: 'gruz-7',
      transport: 'strefa1',
      city: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      date: ''
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

    ['name','email','phone','address','date','city'].forEach(field => {
      const el = orderForm.querySelector(`[name="${field}"]`);
      if (el) {
        el.addEventListener('input', () => {
          state[field] = el.value;
        });
      }
    });

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

  /* ============== FAQ accordion ============== */
  document.querySelectorAll('[data-faq]').forEach(item => {
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
