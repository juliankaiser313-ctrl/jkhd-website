# JKHD-Website — jkhd.de

Statische Webseite für JKHD (HTML/CSS/JS, keine Build-Tools nötig).
Design: monochrom Schwarz/Weiß, Serifen-Headlines (Playfair Display),
Markenzeichen (drei Balken), Hell/Dunkel-Umschaltung. Zweisprachig:
Deutsch in der Wurzel, Englisch unter `/en/`.

## Struktur

```
index.html         Startseite (Hero, Ticker, Zusammenarbeit 01-03, Systemarten, Konfigurator)
system.html        Aufbau eines Systems (6 Schichten, "Was ein System nicht leistet")
mathematik.html    Verfahren und Formeln, je mit Nutzen und Fallstrick
unternehmen.html   Wer wir sind, Auf einen Blick, Einblicke, die Köpfe
kontakt.html       Drei Adressen + Anfrageformular (mailto, kein Server)
impressum.html     Impressum (§ 5 DDG)
datenschutz.html   Datenschutzerklärung
404.html           Fehlerseite (zweisprachig)
ueber/leistungen/projekte/technologie/ansatz.html   Weiterleitungen auf die neuen Seiten
holding/           Eigenständige Holding-Variante, aus der Navigation nicht verlinkt

en/index.html      Englische Fassung der Startseite
en/system.html     "How a system is built"
en/mathematics.html
en/company.html
en/contact.html
en/imprint.html    Servicefassung, deutsche Fassung ist maßgeblich
en/privacy.html    Servicefassung, deutsche Fassung ist maßgeblich

robots.txt         Suchmaschinen-Regeln (Sitemap-Verweis auf jkhd.de)
sitemap.xml        Sitemap inkl. hreflang-Paare DE/EN
assets/og-image.png  Vorschaubild für Link-Teilen
assets/fonts/      Self-hosted Schriften (DSGVO)
css/style.css      Gesamtes Design (Farben oben als CSS-Variablen)
js/main.js         Mobile-Nav, Hell/Dunkel, Konfigurator, Fragen-Blase, Anfrageformular
favicon.svg        Browser-Tab-Icon (drei Balken)
```

## Zweisprachigkeit — was beim Ändern zu beachten ist

Es gibt keine Übersetzungsschicht: jede Seite existiert zweimal als echte
Datei. Wer einen Text ändert, ändert ihn in **beiden** Fassungen.

- **Die Kopfzeile verhält sich nach Breite unterschiedlich:**
  - **bis 1140 px:** alles hinter dem Menüknopf, das Feld klappt über die volle
    Breite auf — Seitenlinks, Sprache, Darstellung, Kontakt.
  - **ab 1141 px:** die Seitenlinks und der Kontakt-Knopf stehen offen in der
    Kopfzeile; hinter dem Menüknopf liegen nur noch Sprache und Darstellung,
    als 264-px-Feld bündig unter ihm (dafür ist `.nav-wrap` dort
    `position: relative`, das Feld hängt mit `right: 48px` am Innenabstand des
    Rahmens).
  Das Menü schließt per Escape und Klick daneben; ein Klick auf ein Segment
  darin lässt es offen.
- **Sprache und Darstellung** (`.nav-lang`, `.nav-theme`) stecken zusammen in
  `.nav-prefs` — nur dieser Behälter lässt sich auf breiten Schirmen aus der
  Menüzeile herauslösen. Jeweils Beschriftung links, Segmentpaar rechts:
  „Sprachen"/„Languages" und „Darstellung"/„Appearance".
- **Sprachschalter** (`.nav-lang`): aktive Sprache als
  `<span class="lang-current">`, die andere ein Link auf das Gegenstück. Kein
  JavaScript, keine automatische Weiterleitung, keine Spracherkennung — und
  dadurch auch nichts, was gespeichert wird.
- **Hell/Dunkel** (`.nav-theme`): zwei Knöpfe mit `data-theme-set="light|dark"`,
  der geltende trägt `.is-on`. Gewählt wird in `localStorage` unter
  `jkhd-theme` gemerkt; ohne eigene Wahl folgt die Seite dem Betriebssystem.
- **Kommen neue Seitenlinks dazu**, wird die offene Kopfzeile ab 1141 px
  wieder breiter — dann die Schwelle im Block `@media (min-width: 1141px)`
  anheben, sonst schiebt die Zeile die Seite waagerecht hinaus. Sprache und
  Darstellung kosten dort keine Breite mehr, die liegen im Feld. Der Block ist
  von den übrigen 940-px-Umbrüchen getrennt.
- **Seitenpaare:** `mathematik.html ↔ en/mathematics.html`,
  `unternehmen.html ↔ en/company.html`, `kontakt.html ↔ en/contact.html`,
  `impressum.html ↔ en/imprint.html`, `datenschutz.html ↔ en/privacy.html`,
  `index.html` und `system.html` heißen in beiden Sprachen gleich.
- **hreflang:** drei `<link rel="alternate">` im `<head>` jeder Seite
  (de, en, x-default) — plus dieselben Paare in `sitemap.xml`. Bei einer neuen
  Seite beides mitziehen.
- **Texte aus dem JavaScript** (Fragen-Blase, Konfigurator-Meldungen,
  Formular-Hinweise) stehen in `js/main.js` doppelt und werden über
  `T("deutsch", "english")` ausgewählt. Maßgeblich ist das `lang`-Attribut
  der Seite.
- **Anker-IDs bleiben deutsch** (`#leistungen`, `#preise`, `#anfrage`), damit
  Verweise in beiden Sprachen identisch funktionieren. Nicht umbenennen.
- **Preise stehen nur in `data-preis`** der Konfigurator-Zeilen — in beiden
  Sprachen dieselben Zahlen. Angezeigter Betrag und Summe werden daraus
  berechnet.
- **Nach Änderungen an `css/style.css` oder `js/main.js`** den Versionsstempel
  `?v=...` in allen HTML-Dateien hochzählen, sonst bekommen wiederkehrende
  Besucher die alte Datei aus dem Browser-Cache.

## Lokal ansehen

```
python -m http.server 8090 --directory "C:\Quant Arbeit\JKHD-Website"
```

Dann im Browser: http://localhost:8090

## Livegang: GitHub Pages + IONOS-Domain (jkhd.de)

Live seit August 2026. Repo `juliankaiser313-ctrl/jkhd-website`, GitHub Pages
auf Branch `main`, Custom Domain `www.jkhd.de` (CNAME-Datei im Repo), IONOS-DNS
zeigt auf GitHub.

Erledigt:
- [x] Impressum ausgefüllt (§ 5 DDG, Name + ladungsfähige Anschrift)
- [x] Datenschutzerklärung inkl. GitHub-Pages-Hosting
- [x] Fonts self-hosted (assets/fonts + css/fonts.css, DSGVO erledigt)
- [x] Englische Fassung unter /en/ mit hreflang

Offen:
- [ ] Telefonnummer und USt-IdNr im Impressum
- [ ] Fotos für „Einblicke" auf der Unternehmensseite (bis dahin Platzhalter)
- [ ] `holding/` verweist auf `css/…` statt `../css/…` — dort fehlt das Design
