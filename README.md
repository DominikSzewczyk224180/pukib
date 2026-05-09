# PUKiB — strona internetowa

Statyczna strona w czystym HTML/CSS/JS, gotowa do wdrożenia na GitHub Pages, Netlify, Vercel lub dowolny hosting plików.

## Struktura

```
pukib/
├── index.html              ← strona główna (drone hero, 3D kontener, mapa Śląska)
├── cennik.html             ← cennik 2026 + formularz zamówienia
├── o-firmie.html           ← historia, zespół, wartości
├── dla-biznesu.html        ← oferta B2B
├── faq.html                ← 9 najczęstszych pytań
├── kontakt.html            ← kontakty, adresy, mapy
├── blog.html               ← placeholder na FB feed
├── css/
│   ├── style.css           ← design system (kolory, fonty, header, footer)
│   ├── home.css            ← style strony głównej
│   └── pages.css           ← style podstron
├── js/
│   └── main.js             ← interakcje (menu, accordion, formularz, scroll)
└── assets/
    ├── img/                ← logo, ciężarówka, plakaty
    ├── videos/             ← drone footage (hero.mp4, secondary.mp4)
    └── posters/            ← klatki z filmów (poster do <video>)
```

## Wdrożenie na GitHub Pages

1. Stwórz nowe repozytorium `pukib-website` (lub jak chcesz)
2. Wypakuj zawartość foldera `pukib/` do roota repo (nie wrzucaj samego foldera, tylko jego zawartość)
3. Wrzuć na GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin git@github.com:USERNAME/pukib-website.git
   git push -u origin main
   ```
4. W ustawieniach repo: `Settings → Pages → Source: main / (root) → Save`
5. Po 1–2 minutach strona dostępna pod `https://USERNAME.github.io/pukib-website/`

### Własna domena (pukib.pl)

W ustawieniach Pages dodaj `pukib.pl` jako custom domain. W panelu rejestratora ustaw rekordy DNS:
- `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `CNAME` (dla `www`) → `USERNAME.github.io`

## Formularz zamówienia

Formularz na `cennik.html#zamow` używa `mailto:` — po kliknięciu "Wyślij" otwiera klienta poczty z prefillowaną wiadomością na `kontenery@pukib.pl`. Nie wymaga backendu.

**Jeśli chcecie prawdziwe zamówienia online** (zapis do bazy / dashboard), trzeba dodać:
- **Formspree** — najprostsze, kilka linijek atrybutów na `<form>`, plan free 50/m
- **Netlify Forms** — jeśli zmienicie hosting na Netlify
- **Własny backend** — Node/PHP/Python, przyjmujący POST i wysyłający e-mail

W kodzie formularza (`cennik.html`, sekcja `#zamow`) wystarczy podmienić `onsubmit` z generowania mailto na fetch do endpointu.

## Integracja z Facebookiem (blog)

Strona `blog.html` ma gotowy placeholder na live feed. Żeby podpiąć posty z FB:

1. Załóż Facebook App na https://developers.facebook.com
2. Wygeneruj Page Access Token z uprawnieniem `pages_read_engagement`
3. W `blog.html` dodaj skrypt fetchujący `https://graph.facebook.com/v19.0/PAGE_ID/posts?fields=message,full_picture,created_time,permalink_url&access_token=TOKEN`
4. Renderuj wynik do `<div class="blog-grid">` używając istniejącego komponentu `.blog-card`

Token NIE może być w kodzie front-endu — zrób cienki proxy backend lub użyj Facebook Page Plugin (iframe) jako tymczasowe rozwiązanie.

## Mapy

`kontakt.html` używa OpenStreetMap embed iframes (bez klucza API). Działają od razu po wdrożeniu, nie wymagają konfiguracji.

Jeśli chcecie Google Maps zamiast OSM:
1. Wygenerujcie API key na https://console.cloud.google.com → Maps Embed API
2. Podmieńcie `<iframe src="https://www.openstreetmap.org/export/...">` na `<iframe src="https://www.google.com/maps/embed/v1/place?key=KLUCZ&q=...">`

## Co warto sprawdzić przed wdrożeniem

- [ ] Logo PUKiB w `assets/img/logo.png` — czy ma wystarczająco wysoką rozdzielczość
- [ ] Numery telefonów i e-maile we wszystkich miejscach (header, footer, kontakt)
- [ ] Adresy w footerze i `kontakt.html`
- [ ] Cennik na `cennik.html` — aktualne stawki 2026
- [ ] Linki do FB w `blog.html` (na razie `href="#"`)
- [ ] favicon — używamy `logo.png`, można zrobić dedykowany .ico

## Wersje przeglądarek

Testowane na Chromium 1.56. Powinno działać na:
- Chrome / Edge / Opera (od ~90)
- Firefox (od ~88)
- Safari (od ~14)
- Wszystkie nowoczesne mobile (iOS Safari, Android Chrome)

CSS używa: custom properties, grid, flexbox, aspect-ratio. JS: IntersectionObserver, ES2020.

## Optymalizacja po wdrożeniu

- Filmy są skompresowane (hero 2.6MB, secondary 3.5MB) — można jeszcze obniżyć przez `crf 28` jeśli za wolno na 3G
- Włączcie cachowanie statyków przez `.htaccess` lub Cloudflare jeśli używacie
- Dodajcie Google Search Console + sitemap.xml
- Pixel FB / Google Analytics jeśli chcecie tracking — wstawcie `<script>` w `<head>` każdej strony

---

**Stack:** HTML5, CSS3 (custom properties, grid), Vanilla JS, Google Fonts (Big Shoulders Display, Archivo, JetBrains Mono).

**Brak zależności**, brak buildów, brak npm — czyste pliki statyczne.
