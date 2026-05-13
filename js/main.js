/* PUKiB site interactions */

(function () {
  'use strict';

  /* ============== Working hours indicator (topbar dot + label) ==============
     Praca: pn-pt 6:00-15:30. Poza tym czasem dioda zmienia kolor na czerwony,
     a etykieta "Pracujemy" zostaje zastąpiona przez "Po godzinach". */
  const hoursDots = document.querySelectorAll('[data-hours-dot]');
  const hoursLabels = document.querySelectorAll('[data-hours-label]');
  if (hoursDots.length || hoursLabels.length) {
    const updateWorkStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = niedziela, 1 = pn, ... 6 = sob
      const minutes = now.getHours() * 60 + now.getMinutes();
      const startMin = 6 * 60;        // 6:00
      const endMin   = 15 * 60 + 30;  // 15:30
      const isWeekday = day >= 1 && day <= 5;
      const isWorking = isWeekday && minutes >= startMin && minutes < endMin;
      hoursDots.forEach(d => d.classList.toggle('off-hours', !isWorking));
      hoursLabels.forEach(l => { l.textContent = isWorking ? 'Pracujemy' : 'Po godzinach'; });
    };
    updateWorkStatus();
    // Odświeżaj co minutę na wypadek długo otwartej karty
    setInterval(updateWorkStatus, 60 * 1000);
  }

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

  /* ============== Container showcase, SVG isometric switcher ============== */
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

    // Ceny i strefy pobierane dynamicznie z konfiguracji admina (window.PUKiB_CONFIG).
    // Jeśli konfig nie istnieje, padają domyślne wartości.
    function getCfg() { return window.PUKiB_CONFIG || null; }

    function getPrice(key) {
      const cfg = getCfg();
      if (cfg && cfg.prices && cfg.prices[key]) {
        const p = cfg.prices[key];
        return { net: typeof p.value === 'number' ? p.value : 0, label: p.label };
      }
      // Fallback domyślne
      const FALLBACK = {
        'gruz-7':  { net: 900,  label: 'Gruz · KP 7' },
        'mix-7':   { net: 1300, label: 'Odpady budowlane zmieszane · KP 7' },
        'mix-10':  { net: 1800, label: 'Odpady budowlane zmieszane · KP 10' },
        'mix-36':  { net: 3700, label: 'Odpady budowlane zmieszane · KP 36' },
      };
      return FALLBACK[key] || { net: 0, label: key };
    }

    function getTransport(key) {
      const cfg = getCfg();
      if (cfg && cfg.zones && cfg.zones[key]) {
        const z = cfg.zones[key];
        const sampleCities = z.cities.slice(0, 3).join(' · ');
        return { net: z.price, label: `${z.name}, ${sampleCities || z.name}` };
      }
      const FALLBACK = {
        strefa1: { net: 100, label: 'Strefa I' },
        strefa2: { net: 200, label: 'Strefa II' },
        strefa3: { net: 300, label: 'Strefa III' },
        strefa4: { net: 400, label: 'Strefa IV' },
      };
      return FALLBACK[key] || { net: 0, label: key };
    }

    let state = {
      product: 'gruz-7',
      transport: 'strefa1',
    };

    const fmt = (n) => new Intl.NumberFormat('pl-PL').format(n);

    const recalc = () => {
      const p = getPrice(state.product);
      const t = getTransport(state.transport);
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

    // File upload - trzymamy obiekt File globalnie zeby przekazac do backendu
    const fileInput = orderForm.querySelector('[data-form-file]');
    const fileLabel = orderForm.querySelector('[data-upload-label]');
    window.PUKiB_ORDER_FILE = null;
    if (fileInput && fileLabel) {
      const defaultLabel = fileLabel.textContent;
      fileInput.addEventListener('change', () => {
        const f = fileInput.files && fileInput.files[0];
        if (f) {
          if (f.size > 5 * 1024 * 1024) {
            alert('Plik za duży, maksymalnie 5 MB.');
            fileInput.value = '';
            window.PUKiB_ORDER_FILE = null;
            fileLabel.textContent = defaultLabel;
            fileLabel.parentElement.classList.remove('has-file');
            return;
          }
          window.PUKiB_ORDER_FILE = f;
          fileLabel.textContent = f.name;
          fileLabel.parentElement.classList.add('has-file');
        } else {
          window.PUKiB_ORDER_FILE = null;
          fileLabel.textContent = defaultLabel;
          fileLabel.parentElement.classList.remove('has-file');
        }
      });
    }

    if (submitBtn) {
      const initialBtnText = submitBtn.textContent;

      submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const p = getPrice(state.product);
        const t = getTransport(state.transport);
        const name    = orderForm.querySelector('[name="name"]')?.value || '';
        const phone   = orderForm.querySelector('[name="phone"]')?.value || '';
        const email   = orderForm.querySelector('[name="email"]')?.value || '';
        const address = orderForm.querySelector('[name="address"]')?.value || '';
        const date    = orderForm.querySelector('[name="date"]')?.value || '';
        const city    = orderForm.querySelector('[name="city"]')?.value || '';
        const notes   = orderForm.querySelector('[name="notes"]')?.value || '';

        if (!phone || !email || !city) {
          alert('Wypełnij obowiązkowe pola: telefon, e-mail i miejscowość.');
          return;
        }

        const total = Math.round((p.net + t.net) * 1.08);

        // FormData zeby moc dolaczyc PDF jako multipart
        const fd = new FormData();
        fd.append('subject', `Zamówienie kontenera, ${p.label}`);
        fd.append('container', `${p.label} - ${fmt(p.net)} zł netto`);
        fd.append('transport', `${t.label} - ${fmt(t.net)} zł netto`);
        fd.append('total', `${fmt(total)} zł brutto`);
        fd.append('name', name);
        fd.append('phone', phone);
        fd.append('email', email);
        fd.append('address', address);
        fd.append('city', city);
        fd.append('date', date);
        fd.append('notes', notes);

        // Dolacz wgrany formularz PDF jesli istnieje (przechowywany w window.PUKiB_ORDER_FILE)
        if (window.PUKiB_ORDER_FILE instanceof File) {
          fd.append('attachment', window.PUKiB_ORDER_FILE);
        }

        // Status UI
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wysyłanie...';
        submitBtn.classList.add('is-loading');

        try {
          if (!window.PUKiB_API) throw new Error('Backend API niedostępne (admin.js nie załadowane)');
          const result = await window.PUKiB_API.sendOrder(fd);

          submitBtn.textContent = '✓ Wysłano';
          submitBtn.classList.remove('is-loading');
          submitBtn.classList.add('is-success');
          const attachMsg = result.attachment_count > 0 ? ' z załączonym formularzem PDF' : '';
          showOrderStatus('Dziękujemy, zamówienie wysłane' + attachMsg + ' na kontenery@pukib.pl. Skontaktujemy się z Tobą wkrótce.', 'success');

          // Wyczysc wgrany plik po sukcesie
          window.PUKiB_ORDER_FILE = null;
          const fileLabel = orderForm.querySelector('[data-upload-label]');
          if (fileLabel) fileLabel.textContent = 'Wgraj wypełniony PDF';

          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = initialBtnText;
            submitBtn.classList.remove('is-success');
          }, 6000);

        } catch (err) {
          console.warn('Backend send failed, fallback mailto:', err);
          submitBtn.disabled = false;
          submitBtn.textContent = initialBtnText;
          submitBtn.classList.remove('is-loading');

          // Fallback do mailto jesli backend nie odpowiada
          const plainBody =
`Dzień dobry,

Chciał(a)bym zamówić kontener:

- Kontener: ${p.label} (${fmt(p.net)} zł netto)
- Transport: ${t.label} (${fmt(t.net)} zł netto)
- RAZEM Z VAT 8%: ${fmt(total)} zł brutto

Dane kontaktowe:
- Imię i nazwisko: ${name || '-'}
- Telefon: ${phone}
- E-mail: ${email}
- Adres podstawienia: ${address || '-'}
- Miejscowość: ${city}
- Preferowany termin: ${date || '-'}

Dodatkowe informacje:
${notes || '-'}

Pozdrawiam.`;
          showOrderStatus('Bezpośrednia wysyłka nie powiodła się (' + err.message + '). Otwieramy klient pocztowy z gotowym zamówieniem.', 'warn');
          const mailto = 'mailto:kontenery@pukib.pl?subject=' + encodeURIComponent(`Zamówienie kontenera, ${p.label}`) + '&body=' + encodeURIComponent(plainBody);
          setTimeout(() => { window.location.href = mailto; }, 800);
        }
      });
    }

    function showOrderStatus(msg, level) {
      let bar = orderForm.querySelector('[data-order-status]');
      if (!bar) {
        bar = document.createElement('div');
        bar.setAttribute('data-order-status', '');
        bar.className = 'order-status-bar';
        const submitWrap = submitBtn.parentNode;
        submitWrap.insertBefore(bar, submitBtn.nextSibling);
      }
      bar.textContent = msg;
      bar.dataset.level = level || 'info';
      bar.classList.add('visible');
      clearTimeout(showOrderStatus._t);
      showOrderStatus._t = setTimeout(() => bar.classList.remove('visible'), 10000);
    }

    recalc();
  }

  /* ============== FAQ accordion (FIXED, iterates over each .faq-item) ============== */
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
