/* PUKiB Admin Panel + Config Loader
   Backend: https://api.pukib.pl/pukib_backend/
   Konfig prices/zones odczytywany z /config, edycje zapisywane przez admin endpointy. */
(function () {
  'use strict';

  const API_BASE = 'https://api.pukib.pl/pukib_backend';

  const CONFIG_CACHE_KEY = 'pukib_config_cache_v2';
  const TOKEN_KEY = 'pukib_admin_token_v1';
  const TOKEN_EXP_KEY = 'pukib_admin_token_exp_v1';
  const PRICE_MODE_KEY = 'pukib_price_mode_v1';
  const VAT_RATE = 0.08;

  const DEFAULT_CONFIG = {
    prices: {
      'gruz-7':  { value: 900,  label: 'Gruz · KP 7' },
      'mix-7':   { value: 1300, label: 'Odpady budowlane zmieszane · KP 7' },
      'mix-10':  { value: 1800, label: 'Odpady budowlane zmieszane · KP 10' },
      'mix-36':  { value: 3700, label: 'Odpady budowlane zmieszane · KP 36' },
      'rent-daily': { value: 25, label: 'Dzierżawa kontenera / dzień (powyżej 5 dni)' },
      'budowlane-segregacja-1': { value: 1200, label: 'Odpady budowlane do segregacji, do 1 Mg' },
      'budowlane-segregacja-n': { value: 1000, label: 'Odpady budowlane do segregacji, każda kolejna Mg' },
      'wielkogabarytowe-1':     { value: 1200, label: 'Odpady wielkogabarytowe, do 1 Mg' },
      'wielkogabarytowe-n':     { value: 1100, label: 'Odpady wielkogabarytowe, każda kolejna Mg' },
      'materialy-izolacyjne':   { value: 'do uzgodnienia', label: 'Materiały izolacyjne (styropian, wełna mineralna)' },
      'papa':                   { value: 'do uzgodnienia', label: 'Papa' },
      'pozostale':              { value: 'Indywidualna wycena', label: 'Pozostałe odpady (makulatura, tworzywa, szkło)' },
    },
    zones: {
      strefa1: { name: 'Strefa I',   price: 100, cities: ['Jastrzębie-Zdrój','Mszana','Godów','Gorzyce','Świerklany','Wodzisław Śląski','Pawłowice','Rybnik','Żory','Suszec','Strumień','Zebrzydowice','Hażlach'] },
      strefa2: { name: 'Strefa II',  price: 200, cities: ['Hażlach','Dębowiec','Skoczów','Chybie','Pszczyna','Goczałkowice-Zdrój','Orzesze','Radlin','Knurów','Czerwionka-Leszczyny','Pszów','Pilchowice','Gierałtowice'] },
      strefa3: { name: 'Strefa III', price: 300, cities: ['Cieszyn','Goleszów','Ustroń','Jasienica','Czechowice-Dziedzice','Bielsko-Biała','Miedźna','Bojszowy','Kobiór','Gliwice','Tychy','Mikołów','Ruda Śląska','Zabrze','Kornowac','Racibórz','Krzanowice','Nędza','Bieruń','Lędziny','Mysłowice','Wyry'] },
      strefa4: { name: 'Strefa IV',  price: 400, cities: ['Katowice'] },
    },
    _pdf: { available: false },
  };

  const deepClone = (o) => JSON.parse(JSON.stringify(o));
  const fmtNum = (n) => new Intl.NumberFormat('pl-PL').format(n);

  function mergeConfig(remote) {
    const result = deepClone(DEFAULT_CONFIG);
    if (!remote || typeof remote !== 'object') return result;
    if (remote.prices) {
      Object.keys(remote.prices).forEach(k => {
        if (result.prices[k]) result.prices[k].value = remote.prices[k].value;
        else result.prices[k] = remote.prices[k];
      });
    }
    if (remote.zones) {
      Object.keys(remote.zones).forEach(k => {
        if (result.zones[k]) {
          if (remote.zones[k].name) result.zones[k].name = remote.zones[k].name;
          if (typeof remote.zones[k].price === 'number') result.zones[k].price = remote.zones[k].price;
          if (Array.isArray(remote.zones[k].cities)) result.zones[k].cities = remote.zones[k].cities.slice();
        } else {
          result.zones[k] = remote.zones[k];
        }
      });
    }
    if (remote._pdf) result._pdf = remote._pdf;
    return result;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getToken() {
    const exp = parseInt(localStorage.getItem(TOKEN_EXP_KEY) || '0', 10);
    if (exp && exp < Date.now()) { clearToken(); return null; }
    return localStorage.getItem(TOKEN_KEY);
  }
  function setToken(token, expiresInSec) {
    localStorage.setItem(TOKEN_KEY, token);
    if (expiresInSec) localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresInSec * 1000));
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
  }

  async function apiGetConfig() {
    const r = await fetch(API_BASE + '/config', { cache: 'no-cache' });
    if (!r.ok) throw new Error('GET config HTTP ' + r.status);
    return r.json();
  }
  async function apiLogin(password) {
    const r = await fetch(API_BASE + '/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'HTTP ' + r.status);
    return data;
  }
  async function apiLogout() {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(API_BASE + '/admin/logout', { method: 'POST', headers: { 'X-Admin-Token': token } });
    } catch (e) {}
    clearToken();
  }
  async function apiSaveConfig(config) {
    const token = getToken();
    if (!token) throw new Error('Brak tokenu admina');
    const payload = {
      prices: Object.fromEntries(Object.entries(config.prices).map(([k, v]) => [k, { value: v.value }])),
      zones: Object.fromEntries(Object.entries(config.zones).map(([k, v]) => [k, { name: v.name, price: v.price, cities: v.cities }])),
    };
    const r = await fetch(API_BASE + '/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401) { clearToken(); throw new Error('Sesja wygasła, zaloguj się ponownie'); }
      throw new Error(data.error || 'HTTP ' + r.status);
    }
    return data;
  }
  async function apiUploadPdf(file) {
    const token = getToken();
    if (!token) throw new Error('Brak tokenu admina');
    const fd = new FormData();
    fd.append('pdf', file);
    const r = await fetch(API_BASE + '/admin/pdf-upload', {
      method: 'POST',
      headers: { 'X-Admin-Token': token },
      body: fd,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401) { clearToken(); throw new Error('Sesja wygasła, zaloguj się ponownie'); }
      throw new Error(data.error || 'HTTP ' + r.status);
    }
    return data;
  }

  function loadCachedConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_CACHE_KEY);
      if (!raw) return null;
      return mergeConfig(JSON.parse(raw));
    } catch (e) { return null; }
  }
  function cacheConfig(remote) {
    try { localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(remote)); } catch (e) {}
  }

  window.PUKiB_CONFIG = loadCachedConfig() || deepClone(DEFAULT_CONFIG);

  async function refreshConfigFromBackend() {
    try {
      const remote = await apiGetConfig();
      window.PUKiB_CONFIG = mergeConfig(remote);
      cacheConfig(remote);
      applyConfig();
      window.dispatchEvent(new CustomEvent('pukib:config-updated', { detail: window.PUKiB_CONFIG }));
    } catch (e) {
      console.warn('Backend config fetch failed, używam cache/domyślnych:', e.message);
    }
  }

  function getPriceMode() {
    return localStorage.getItem(PRICE_MODE_KEY) === 'brutto' ? 'brutto' : 'netto';
  }
  function setPriceMode(mode) {
    if (mode !== 'netto' && mode !== 'brutto') return;
    localStorage.setItem(PRICE_MODE_KEY, mode);
    applyConfig();
  }

  function applyConfig() {
    const cfg = window.PUKiB_CONFIG;
    const mode = getPriceMode();
    const factor = mode === 'brutto' ? (1 + VAT_RATE) : 1;

    document.querySelectorAll('[data-pukib-price]').forEach(el => {
      const key = el.dataset.pukibPrice;
      const price = cfg.prices[key];
      if (!price) return;
      const suffix = el.dataset.pukibSuffix || '';
      if (typeof price.value === 'number') {
        const v = Math.round(price.value * factor);
        el.textContent = fmtNum(v) + ' zł' + suffix;
      } else {
        el.textContent = String(price.value);
      }
    });

    document.querySelectorAll('[data-pukib-price-header]').forEach(el => {
      const isBrutto = mode === 'brutto';
      el.innerHTML =
        '<span class="price-header-label">Cena:</span>' +
        '<span class="price-mode-switch" role="group">' +
          '<button type="button" data-pukib-mode="netto" class="' + (!isBrutto ? 'active' : '') + '" aria-pressed="' + (!isBrutto) + '">netto</button>' +
          '<button type="button" data-pukib-mode="brutto" class="' + (isBrutto ? 'active' : '') + '" aria-pressed="' + isBrutto + '">brutto</button>' +
        '</span>';
    });

    document.querySelectorAll('[data-pukib-zone-price]').forEach(el => {
      const key = el.dataset.pukibZonePrice;
      const zone = cfg.zones[key];
      if (!zone) return;
      el.textContent = fmtNum(zone.price) + ' zł';
    });

    document.querySelectorAll('[data-pukib-zone-name]').forEach(el => {
      const key = el.dataset.pukibZoneName;
      const zone = cfg.zones[key];
      if (!zone) return;
      const isUpper = el.textContent === el.textContent.toUpperCase() && el.textContent.length > 0;
      el.textContent = isUpper ? zone.name.toUpperCase() : zone.name;
    });

    document.querySelectorAll('[data-pukib-zone-cities]').forEach(el => {
      const key = el.dataset.pukibZoneCities;
      const zone = cfg.zones[key];
      if (!zone) return;
      el.innerHTML = zone.cities.map(c => '<span>' + escapeHtml(c) + '</span>').join('');
    });

    document.querySelectorAll('[data-pukib-pdf]').forEach(el => {
      if (cfg._pdf && cfg._pdf.available) {
        el.setAttribute('href', API_BASE + '/' + cfg._pdf.url);
      } else {
        el.setAttribute('href', 'assets/forms/formularz-zamowienia.pdf');
      }
      el.setAttribute('download', 'formularz-zamowienia.pdf');
    });
  }

  /* === MODAL ADMINA === */
  let modalEl = null;

  function buildModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'admin-modal';
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML =
      '<div class="admin-overlay" data-admin-close></div>' +
      '<div class="admin-shell" role="dialog" aria-label="Panel administratora">' +
        '<button class="admin-close-x" data-admin-close aria-label="Zamknij">×</button>' +
        '<div class="admin-login" data-admin-screen="login">' +
          '<div class="admin-kicker">/ Tylko dla administratora</div>' +
          '<h2 class="admin-h">Panel <em>admina</em>.</h2>' +
          '<p class="admin-intro">Edycja cen, stref i formularza PDF. Zmiany zapisywane na serwerze, widoczne dla wszystkich.</p>' +
          '<form class="admin-login-form" data-admin-login-form>' +
            '<label class="admin-field"><span>Hasło</span><input type="password" data-admin-pw autocomplete="current-password" required></label>' +
            '<button type="submit" class="admin-btn admin-btn-primary" data-admin-login-btn>Zaloguj</button>' +
          '</form>' +
          '<p class="admin-error" data-admin-error hidden></p>' +
        '</div>' +
        '<div class="admin-content" data-admin-screen="content" hidden>' +
          '<div class="admin-kicker">/ Panel administratora</div>' +
          '<h2 class="admin-h">Panel <em>admina</em>.</h2>' +
          '<div class="admin-tabs" role="tablist">' +
            '<button data-admin-tab="prices" class="active" role="tab">Ceny</button>' +
            '<button data-admin-tab="zones" role="tab">Strefy</button>' +
            '<button data-admin-tab="pdf" role="tab">Formularz PDF</button>' +
            '<button data-admin-tab="data" role="tab">Dane</button>' +
          '</div>' +
          '<div class="admin-panel" data-admin-panel="prices"></div>' +
          '<div class="admin-panel" data-admin-panel="zones" hidden></div>' +
          '<div class="admin-panel" data-admin-panel="pdf" hidden></div>' +
          '<div class="admin-panel" data-admin-panel="data" hidden></div>' +
          '<div class="admin-status" data-admin-status></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modalEl);

    modalEl.querySelectorAll('[data-admin-close]').forEach(b => b.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl.classList.contains('open')) closeModal();
    });

    const loginForm = modalEl.querySelector('[data-admin-login-form]');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwInput = modalEl.querySelector('[data-admin-pw]');
      const btn = modalEl.querySelector('[data-admin-login-btn]');
      const errEl = modalEl.querySelector('[data-admin-error]');
      errEl.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Sprawdzanie...';
      try {
        const data = await apiLogin(pwInput.value);
        setToken(data.token, data.expires_in);
        await refreshConfigFromBackend();
        showContent();
      } catch (err) {
        errEl.textContent = err.message || 'Logowanie nie powiodło się';
        errEl.hidden = false;
        pwInput.value = '';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Zaloguj';
      }
    });

    modalEl.querySelectorAll('[data-admin-tab]').forEach(t => {
      t.addEventListener('click', () => {
        const name = t.dataset.adminTab;
        modalEl.querySelectorAll('[data-admin-tab]').forEach(x => x.classList.toggle('active', x === t));
        modalEl.querySelectorAll('[data-admin-panel]').forEach(p => { p.hidden = p.dataset.adminPanel !== name; });
      });
    });

    return modalEl;
  }

  function openModal() {
    const m = buildModal();
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (getToken()) showContent();
    else showLogin();
  }
  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function showLogin() {
    modalEl.querySelector('[data-admin-screen="login"]').hidden = false;
    modalEl.querySelector('[data-admin-screen="content"]').hidden = true;
    setTimeout(() => modalEl.querySelector('[data-admin-pw]').focus(), 50);
  }
  function showContent() {
    modalEl.querySelector('[data-admin-screen="login"]').hidden = true;
    modalEl.querySelector('[data-admin-screen="content"]').hidden = false;
    renderPanels();
  }

  function renderPanels() {
    renderPricesPanel();
    renderZonesPanel();
    renderPdfPanel();
    renderDataPanel();
  }

  function renderPricesPanel() {
    const root = modalEl.querySelector('[data-admin-panel="prices"]');
    const cfg = window.PUKiB_CONFIG;
    const rows = Object.keys(cfg.prices).map(key => {
      const p = cfg.prices[key];
      const isText = typeof p.value !== 'number';
      return '<div class="admin-row">' +
        '<label class="admin-row-label">' + escapeHtml(p.label) + '</label>' +
        '<div class="admin-row-input">' +
          '<input type="text" data-price-key="' + escapeHtml(key) + '" value="' + escapeHtml(String(p.value)) + '">' +
          '<span class="admin-input-hint">' + (isText ? 'tekst (np. "do uzgodnienia")' : 'liczba w zł (np. 900)') + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
    root.innerHTML =
      '<p class="admin-panel-intro">Wpisz liczbę (cena w złotych) lub tekst (np. "do uzgodnienia"). Po zapisaniu zmiany pojawiają się dla wszystkich odwiedzających serwis.</p>' +
      '<div class="admin-rows">' + rows + '</div>' +
      '<div class="admin-actions"><button class="admin-btn admin-btn-primary" data-save-prices>Zapisz ceny na serwerze</button></div>';
    root.querySelector('[data-save-prices]').addEventListener('click', savePrices);
  }

  async function savePrices() {
    const root = modalEl.querySelector('[data-admin-panel="prices"]');
    const btn = root.querySelector('[data-save-prices]');
    const cfg = window.PUKiB_CONFIG;
    root.querySelectorAll('[data-price-key]').forEach(input => {
      const key = input.dataset.priceKey;
      const raw = input.value.trim();
      const asNum = Number(raw.replace(/\s/g, '').replace(',', '.'));
      if (raw !== '' && !isNaN(asNum) && /^[\d\s.,]+$/.test(raw)) {
        cfg.prices[key].value = asNum;
      } else {
        cfg.prices[key].value = raw;
      }
    });
    btn.disabled = true;
    btn.textContent = 'Zapisywanie...';
    try {
      await apiSaveConfig(cfg);
      applyConfig();
      flashStatus('Ceny zapisane na serwerze. Strona zaktualizowana.', 'success');
    } catch (err) {
      flashStatus('Błąd zapisu: ' + err.message, 'error');
      if (err.message.includes('Sesja')) { clearToken(); showLogin(); }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Zapisz ceny na serwerze';
    }
  }

  function renderZonesPanel() {
    const root = modalEl.querySelector('[data-admin-panel="zones"]');
    const cfg = window.PUKiB_CONFIG;
    const cards = Object.keys(cfg.zones).map(zid => {
      const z = cfg.zones[zid];
      return '<div class="admin-zone-card" data-zone-id="' + escapeHtml(zid) + '">' +
        '<div class="admin-zone-head"><strong>' + escapeHtml(zid).toUpperCase() + '</strong></div>' +
        '<div class="admin-row"><label class="admin-row-label">Nazwa</label><div class="admin-row-input"><input type="text" data-zone-field="name" value="' + escapeHtml(z.name) + '"></div></div>' +
        '<div class="admin-row"><label class="admin-row-label">Cena netto (zł)</label><div class="admin-row-input"><input type="number" data-zone-field="price" value="' + z.price + '" min="0" step="10"></div></div>' +
        '<div class="admin-row"><label class="admin-row-label">Miasta (jedno w wierszu)</label><div class="admin-row-input"><textarea data-zone-field="cities" rows="8">' + escapeHtml(z.cities.join('\n')) + '</textarea></div></div>' +
      '</div>';
    }).join('');
    root.innerHTML =
      '<p class="admin-panel-intro">Każda strefa ma nazwę, cenę transportu i listę miast (jedno miasto w wierszu).</p>' +
      '<div class="admin-zones-grid">' + cards + '</div>' +
      '<div class="admin-actions"><button class="admin-btn admin-btn-primary" data-save-zones>Zapisz strefy na serwerze</button></div>';
    root.querySelector('[data-save-zones]').addEventListener('click', saveZones);
  }

  async function saveZones() {
    const root = modalEl.querySelector('[data-admin-panel="zones"]');
    const btn = root.querySelector('[data-save-zones]');
    const cfg = window.PUKiB_CONFIG;
    root.querySelectorAll('[data-zone-id]').forEach(card => {
      const zid = card.dataset.zoneId;
      const z = cfg.zones[zid];
      const name = card.querySelector('[data-zone-field="name"]').value.trim();
      const price = Number(card.querySelector('[data-zone-field="price"]').value);
      const citiesText = card.querySelector('[data-zone-field="cities"]').value;
      const cities = citiesText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (name) z.name = name;
      if (!isNaN(price)) z.price = price;
      z.cities = cities;
    });
    btn.disabled = true;
    btn.textContent = 'Zapisywanie...';
    try {
      await apiSaveConfig(cfg);
      applyConfig();
      flashStatus('Strefy zapisane na serwerze. Strona zaktualizowana.', 'success');
    } catch (err) {
      flashStatus('Błąd zapisu: ' + err.message, 'error');
      if (err.message.includes('Sesja')) { clearToken(); showLogin(); }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Zapisz strefy na serwerze';
    }
  }

  function renderPdfPanel() {
    const root = modalEl.querySelector('[data-admin-panel="pdf"]');
    const cfg = window.PUKiB_CONFIG;
    const pdfInfo = cfg._pdf || {};
    const current = pdfInfo.available
      ? 'Aktualny PDF na serwerze: <strong>' + Math.round((pdfInfo.size || 0) / 1024) + ' KB</strong>' +
        (pdfInfo.updated_at ? ' (wgrany ' + new Date(pdfInfo.updated_at).toLocaleString('pl-PL') + ')' : '') +
        ' &nbsp; <a href="' + API_BASE + '/formularz" target="_blank" style="color:var(--red); border-bottom:1px solid var(--red);">Podgląd</a>'
      : 'Backend nie ma jeszcze wgranego PDF. Używany jest lokalny fallback.';
    root.innerHTML =
      '<p class="admin-panel-intro">Wgraj nowy plik PDF, który zastąpi formularz zamówienia. Plik trafia na serwer, dostępny dla wszystkich odwiedzających.</p>' +
      '<p class="admin-current">' + current + '</p>' +
      '<div class="admin-pdf-actions">' +
        '<label class="admin-btn admin-btn-secondary">Wybierz plik PDF<input type="file" accept="application/pdf,.pdf" data-pdf-upload hidden></label>' +
      '</div>' +
      '<p class="admin-warn">Maksymalny rozmiar 5 MB. Plik musi mieć rozszerzenie .pdf i poprawny nagłówek %PDF.</p>';
    root.querySelector('[data-pdf-upload]').addEventListener('change', uploadPdf);
  }

  async function uploadPdf(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      flashStatus('Plik musi być w formacie PDF.', 'error'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      flashStatus('Plik za duży, maksymalnie 5 MB.', 'error'); return;
    }
    flashStatus('Wgrywanie PDF...', 'info');
    try {
      const res = await apiUploadPdf(file);
      await refreshConfigFromBackend();
      renderPdfPanel();
      flashStatus('Nowy PDF zapisany na serwerze (' + Math.round(res.size / 1024) + ' KB).', 'success');
    } catch (err) {
      flashStatus('Błąd uploadu: ' + err.message, 'error');
      if (err.message.includes('Sesja')) { clearToken(); showLogin(); }
    }
    e.target.value = '';
  }

  function renderDataPanel() {
    const root = modalEl.querySelector('[data-admin-panel="data"]');
    root.innerHTML =
      '<p class="admin-panel-intro">Pobierz aktualny konfig z serwera lub wyloguj się.</p>' +
      '<div class="admin-data-actions">' +
        '<button class="admin-btn admin-btn-secondary" data-export>Pobierz konfig (JSON)</button>' +
        '<button class="admin-btn admin-btn-secondary" data-refresh>Odśwież z serwera</button>' +
        '<button class="admin-btn admin-btn-ghost" data-logout>Wyloguj</button>' +
      '</div>' +
      '<p class="admin-warn">Konfig serwera (ceny, strefy) trzymany jest w pliku JSON na api.pukib.pl. Zmiany są natychmiast widoczne dla wszystkich odwiedzających.</p>';
    root.querySelector('[data-export]').addEventListener('click', async () => {
      try {
        const remote = await apiGetConfig();
        const blob = new Blob([JSON.stringify(remote, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'pukib-config-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        flashStatus('Konfig pobrany.', 'success');
      } catch (err) { flashStatus('Błąd pobrania: ' + err.message, 'error'); }
    });
    root.querySelector('[data-refresh]').addEventListener('click', async () => {
      flashStatus('Odświeżanie z serwera...', 'info');
      await refreshConfigFromBackend();
      renderPanels();
      flashStatus('Konfig odświeżony.', 'success');
    });
    root.querySelector('[data-logout]').addEventListener('click', async () => {
      await apiLogout();
      closeModal();
    });
  }

  function flashStatus(msg, level) {
    if (!modalEl) return;
    const el = modalEl.querySelector('[data-admin-status]');
    el.textContent = msg;
    el.dataset.level = level || 'info';
    el.classList.add('visible');
    clearTimeout(flashStatus._t);
    flashStatus._t = setTimeout(() => el.classList.remove('visible'), 5000);
  }

  // Eksponowane API dla main.js
  window.PUKiB_API = {
    base: API_BASE,
    sendOrder: async function (formData) {
      const r = await fetch(API_BASE + '/send-order', { method: 'POST', body: formData });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'HTTP ' + r.status);
      return data;
    },
  };

  function init() {
    applyConfig();
    document.querySelectorAll('[data-admin-trigger]').forEach(b => {
      b.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    });
    document.querySelectorAll('[data-pukib-price-header]').forEach(el => {
      el.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-pukib-mode]');
        if (!btn) return;
        setPriceMode(btn.dataset.pukibMode);
      });
    });
    refreshConfigFromBackend();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
