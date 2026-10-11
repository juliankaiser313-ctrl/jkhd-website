# Knopf „Kontakt“ in der Kopfzeile: graue Schrift auf Schwarz, beim Überfahren unsichtbar

- **Seite:** alle Seiten mit Kopfzeile (DE „Kontakt“, EN „Contact“), z. B. https://jkhd.de/system.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720 und 1920×1050; Handy 390×844 (im aufgeklappten Menü)
- **Sprache / Darstellung:** Deutsch und Englisch; hell und dunkel
- **Status:** behoben
- **Art:** Fehler
- **Gewicht:** hoch

## Was passiert

Der schwarze Knopf „KONTAKT“ oben rechts trägt keine helle, sondern graue Schrift:

- hell: Schrift rgb(96, 95, 91) auf rgb(16, 16, 18) — Kontrast **2,97 : 1**
- dunkel: Schrift rgb(157, 157, 153) auf rgb(244, 242, 238) — Kontrast **2,43 : 1**
- Fährt man mit der Maus darüber, bekommt die Schrift **genau die Farbe des
  Hintergrunds** — der Knopf ist dann ein leerer schwarzer (bzw. heller) Kasten.
- Der Knopf hat keinen Innenabstand: die Schrift reicht links und rechts bis an den Rand.

Auf dem Handy steht derselbe Knopf unten im aufgeklappten Menü, ebenfalls mit grauer
Schrift auf Schwarz. Gefordert sind für so kleine Schrift mindestens 4,5 : 1 (WCAG AA).

## Was erwartet wird

Weiße (hell) bzw. schwarze (dunkel) Schrift wie bei allen anderen `.btn-primary`-Knöpfen
der Website (z. B. „Was wir machen“ auf der Startseite), mit Innenabstand, und beim
Überfahren lesbar.

## Schritte zum Nachstellen

1. https://jkhd.de/system.html in einem Fenster ab 1141 px Breite öffnen.
2. Den Knopf „KONTAKT“ oben rechts ansehen: graue Schrift auf Schwarz.
3. Mit der Maus darüberfahren: die Schrift verschwindet.

## Belege

`2026-10-11-kontakt-knopf-kopfzeile-kaum-lesbar-1.png` (oben: dunkle Darstellung in Ruhe;
Mitte: helle Darstellung beim Überfahren — leer; unten: Handy-Menü).

Ursache im Quelltext nachgesehen (`css/style.css`): `.site-nav a { color: var(--muted);
padding: … }` ist spezifischer (Klasse + Element) als `.btn-primary { color: var(--bg) }`
und gewinnt deshalb; beim Überfahren gewinnt `.site-nav a:hover { color: var(--text) }`
gegen `.btn-primary:hover` — `--text` ist zugleich die Hintergrundfarbe des Knopfs.

## Vorschlag

Eine Regel `.site-nav .btn-primary, .site-nav .btn-primary:hover { color: var(--bg); }`
plus den Innenabstand von `.btn-sm` für `.site-nav .btn` wiederherstellen — oder
`.site-nav a:not(.btn)` für die Linkfarben verwenden.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Wie im Bericht nachgesehen: `.site-nav a` (Klasse + Element) schlug `.btn-primary`, `.site-nav a:hover` färbte die Schrift in die Knopffarbe, und der Innenabstand war durch `.site-nav a { padding: 0 }` weg.
- **Änderung:** css/style.css: `.site-nav a.btn { padding: 10px 20px; font-size: 0.7rem; font-weight: 800; }` und `.site-nav a.btn-primary, .site-nav a.btn-primary:hover { color: var(--bg); }`. Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** pruefung_fehler.js, Prüfung „Kontakt-Knopf hell/dunkel“ (Schriftfarbe, Hintergrund, Hover per bewegtem Mauszeiger, Innenabstand): vorher rgb(96, 95, 91) auf rgb(16, 16, 18), beim Überfahren = Hintergrund, Innenabstand 0; nachher rgb(247, 246, 243) bzw. dunkel rgb(11, 11, 12) auf rgb(244, 242, 238), beim Überfahren gleich, Innenabstand 20 px — derselbe Kontrast wie bei allen anderen .btn-primary.
