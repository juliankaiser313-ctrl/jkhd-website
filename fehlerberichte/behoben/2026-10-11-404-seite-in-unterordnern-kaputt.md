# Fehlerseite (404) ist in jedem Unterordner ohne Gestaltung und mit falschen Links

- **Seite:** jede nicht vorhandene Adresse unterhalb eines Ordners, z. B. https://jkhd.de/en/gibt-es-nicht, https://jkhd.de/fehlerberichte/, https://jkhd.de/assets/x, https://jkhd.de/holding/x
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720 (ebenso 1920×1050 und 390×844)
- **Sprache / Darstellung:** Deutsch und Englisch; hell und dunkel
- **Status:** behoben
- **Art:** Fehler
- **Gewicht:** hoch

## Was passiert

Ruft man eine Adresse auf, die es nicht gibt und die in einem Unterordner liegt, zeigt
GitHub Pages die `404.html` der Wurzel — unter der falschen Adresse. Die Seite lädt ihre
Dateien aber über relative Pfade (`css/style.css`, `css/fonts.css`, `js/main.js`). Unter
`/en/…` sucht der Browser deshalb `/en/css/style.css` usw., bekommt jeweils wieder eine
404 und zeigt die Seite **ohne jede Gestaltung**: das Markenzeichen (SVG) füllt den ganzen
Bildschirm als drei riesige schwarze Balken, auch in der dunklen Darstellung auf Weiß.

Auch alle Links der Seite zeigen ins Leere, weil sie relativ zur falschen Adresse
aufgelöst werden. Gemessen auf https://jkhd.de/en/gibt-es-nicht:

- „Was wir machen“ → `/en/was-wir-machen.html` (404), ebenso Prüfungen, Sicherheit,
  Mathematik, Unternehmen, Partnerzugang, Kontakt, Impressum, Datenschutz
- „English home“ → `/en/en/index.html` (404)
- Konsole: `404 /en/css/fonts.css`, `404 /en/css/style.css`, `404 /en/js/main.js`

Betroffen ist auch die Adresse des öffentlichen Ordners selbst,
https://jkhd.de/fehlerberichte/ (dort gibt es keine index-Datei).

## Was erwartet wird

Die Fehlerseite sieht unter jeder Adresse aus wie unter https://jkhd.de/gibt-es-nicht
(dort ist sie in Ordnung), und alle Links führen auf vorhandene Seiten.

## Schritte zum Nachstellen

1. https://jkhd.de/en/gibt-es-nicht öffnen.
2. Statt der Fehlerseite erscheinen drei große schwarze Balken.
3. Entwicklerwerkzeuge → Netzwerk: drei Anfragen mit 404 auf `/en/css/…` und `/en/js/…`.

## Belege

`2026-10-11-404-seite-in-unterordnern-kaputt-1.png` (1280×720, https://jkhd.de/en/gibt-es-nicht).

## Vorschlag

In `404.html` alle Pfade absolut schreiben (`/css/fonts.css`, `/css/style.css`,
`/js/main.js`, `/index.html`, `/en/index.html`, `/impressum.html` …) — die Favicons
stehen dort schon absolut. Die Links der Fragen-Blase in `js/main.js` (`kontakt.html`,
`unternehmen.html`) sind ebenfalls relativ und zeigen auf der Fehlerseite in
Unterordnern ins Leere; dort ggf. ebenfalls absolut.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** 404.html verweist relativ auf css/, js/ und die Seiten. GitHub Pages liefert die Datei unter jeder fehlenden Adresse aus, also auch unter /en/… — dort lösten sich die Pfade falsch auf.
- **Änderung:** `<base href="/">` im Kopf der 404.html: Stylesheet, Skript, alle Links und auch die Links der Fragen-Blase zeigen damit von der Wurzel aus. Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** pruefung_fehler.js, Prüfung „404 in Unterordner“ (Seite /en/gibt-es-nicht, Testserver liefert wie Pages die 404.html mit Status 404): vorher Schrift Times New Roman, Links auf /en/index.html, drei fehlgeschlagene Anfragen (/en/css/fonts.css, /en/css/style.css, /en/js/main.js); nachher Manrope, Links auf /index.html, keine fehlgeschlagene Anfrage.
