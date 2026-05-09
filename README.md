# PUKiB.pl — strona internetowa

Statyczna strona dla **PUKiB Sp. z o.o.** — wynajem kontenerów i wywóz odpadów na terenie całego Śląska.
Zaprojektowana do hostowania na **GitHub Pages** (lub dowolnym statycznym serwerze).

---

## Struktura

5 stron HTML — w v2 zredukowane z 7 (wywalone Blog i FAQ jako osobne sekcje):

```
pukib/
├── index.html           # Strona główna — hero, usługi, kontenery, cały Śląsk, FAQ, FB, CTA
├── cennik.html          # Cennik 2026 — formularz zamówienia NA GÓRZE, potem tabele cen i strefy
├── o-firmie.html        # O firmie — krótki intro, statystyki, zespół (skrócone z poprzedniej wersji)
├── dla-biznesu.html     # Dla biznesu — audience, 4-step process (skrócone)
├── kontakt.html         # Kontakt — telefony, e-maile, dwie lokalizacje na Google Maps
│
├── css/
│   ├── style.css        # Design system (tokeny, header, footer, buttony, marquee, page-hero)
│   ├── home.css         # Style strony głównej (hero split, isometric containers, FB section, FAQ embed)
│   └── pages.css        # Style podstron (cennik, formularz, about, biznes audience, kontakt)
│
├── js/
│   └── main.js          # Mobile menu, hero video poster fade, scroll reveal, container switcher,
│                        # FAQ accordion (FIXED), order form recalc, marquee duplication
│
└── assets/
    ├── img/             # logo (transparent bg), truck, postery
    ├── posters/         # poster frames dla video
    └── videos/          # hero.mp4 (drone), secondary.mp4 (top-down drone)
```

---

## Co się zmieniło w v2 (na podstawie feedbacku)

### Wywalone
- `blog.html` (osobna strona) — zastąpiona sekcją FB na home
- `faq.html` (osobna strona) — 6 pytań wbudowanych na home
- Sekcja "Wartości" (4 wartości) z o-firmie
- Sekcja "Dla kogo" (audience cards) z o-firmie
- Sekcja "Czas. Niezawodność." (6 punktów) z dla-biznesu
- Sekcja "Pojemności na każdą skalę" (4 kontenery) z dla-biznesu
- Mapa Śląska na home (sekcja "Cały Śląsk") — zastąpiona czystą typografią z 3 strefami i listami miast
- ~480 linii nieużywanego CSS w pages.css

### Naprawione / przebudowane
- **Logo** — wycięte czarne tło flood-fillem od krawędzi (czarne shading w literach zachowany)
- **FAQ accordion** — JS poprawiony, klikanie pytania otwiera odpowiedź (bug: poprzednio działało tylko pierwsze)
- **Hero strony głównej** — z full-screen video → split layout: duża typografia po lewej, video w 16:9 framed boxie z 12px hard shadow po prawej. Mniej dominujący video, więcej oddechu i czytelności.
- **3D kontenery** — z CSS 3D cube (glitchy) → **SVG izometryczny widok 30°/30°**:
  - 3 kontenery (7/10/36 m³) w prawdziwych proporcjach
  - sylwetka człowieka 1.80 m dla skali (człowiek wyższy od 7m³, znacznie niższy od 36m³)
  - linie wymiarowe z czerwonymi mono labelkami
  - stencil "PUKiB.pl" + badge "97" na boku
  - drop shadow, vertical ribs (industrial detail)
  - background siatka jak na rysunku architektonicznym
  - duża etykieta "X m³ / typ kontenera" w rogu + volume bar
- **Mapy Google** w kontakcie zamiast OSM (no API key — używa "share embed")

### Przesunięte
- Formularz "Zamów" — w cenniku przeniesiony NAD tabele cen (na górę strony)

---

## Dane firmy (twarde fakty w stopce + kontakcie)

```
PUKiB Sp. z o.o.
Siedziba: ul. Chudoby 4/1, 44-100 Gliwice
Baza:     ul. Dębina 16, 44-335 Jastrzębie-Zdrój
NIP: 631 262 02 53 · KRS: 0003645589 · BDO: 000011532 · Kapitał: 100 000 PLN

Tel:    503 759 504 (Przemysław Pilorz, Dyr. Handlowy)
E-mail: kontenery@pukib.pl · dyspozytor@pukib.pl · bok@pukib.pl
FB:     facebook.com/people/PUKiB-Sp-zoo/61550223431423/
```

---

## Uruchomienie lokalnie

Strona jest w 100% statyczna. Aby zobaczyć ją lokalnie:

```bash
cd pukib
python3 -m http.server 8000
# otwórz http://localhost:8000
```

Lub otwórz `index.html` bezpośrednio w przeglądarce (pamiętając, że niektóre zasoby — fonty Google, embed Google Maps — wymagają połączenia z internetem).

---

## Deploy na GitHub Pages

1. Utwórz repo na GitHub i wgraj zawartość katalogu `pukib/`
2. W Settings → Pages wybierz branch `main` i folder `/` (root)
3. Po kilku minutach strona będzie dostępna pod `https://<user>.github.io/<repo>/`

Dla domeny `pukib.pl` — w Settings → Pages → Custom domain wpisać domenę i ustawić rekordy A/CNAME u rejestratora.

---

## Stack

- **HTML5** semantyczny
- **CSS3** (custom properties, grid, clamp(), container queries gdzie potrzeba)
- **Vanilla JS** — bez frameworka i bundlera, ~200 linii
- **Fonty Google**: Big Shoulders Display (display), Archivo (body), JetBrains Mono (technical labels)
- **Brak zależności**, brak builda, brak node_modules — czysty static site

Design opiera się na palecie: czerwony `#dc2626`, czarny `#0a0a0a`, kremowy `#f4f1ea`, zielony `#4d8c2f` (kolor prawdziwych kontenerów PUKiB).
