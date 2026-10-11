# Menü per Tastatur: nach dem Öffnen springt Tab in den Seiteninhalt statt ins Menü

- **Seite:** alle Seiten, Fensterbreite unter 1141 px (auf breiten Schirmen das Klappfeld)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 390×844 und 1280×720, Bedienung nur mit der Tastatur
- **Sprache / Darstellung:** Deutsch und Englisch; hell
- **Status:** offen
- **Art:** Fehler (Barrierefreiheit)
- **Gewicht:** mittel

## Was passiert

1. Der Menüknopf steht im Quelltext **hinter** der Navigation (`<nav class="site-nav">`
   kommt zuerst, dann `<button class="nav-toggle">`). Öffnet man das Menü mit Enter und
   drückt dann Tab, landet der Fokus im Seiteninhalt (gemessen auf unternehmen.html:
   „Kontaktseite“, „Partnerzugang“, „Prüfungen“ …), nicht im gerade geöffneten Menü. Das
   Menü erreicht man nur rückwärts mit Umschalt+Tab — darauf kommt kaum jemand.
2. Der Knopf heißt für Bildschirmleser immer „Menü öffnen“ / „Open menu“, auch wenn das
   Menü offen ist (`aria-expanded` wechselt richtig, die Beschriftung nicht).
3. Der Knopf hat kein `aria-controls`, das auf die Navigation zeigt.

## Was erwartet wird

Nach dem Öffnen führt Tab in die Menüpunkte; der Knopf heißt im offenen Zustand
„Menü schließen“ / „Close menu“; `aria-controls` verweist auf die Navigation.

## Schritte zum Nachstellen

1. https://jkhd.de/unternehmen.html in einem schmalen Fenster öffnen.
2. Mit Tab bis zum Menüknopf (☰), Enter drücken — das Menü geht auf.
3. Tab drücken: der Fokus springt in den Text der Seite, nicht in das Menü.

## Belege

Tastaturtest mit echten Tastendrücken (Chrome DevTools-Protokoll): nach Enter
`aria-expanded="true"`, `aria-label="Menü öffnen"`, danach Tab → „Kontaktseite“
(Link im Abschnitt „Austausch“).

## Vorschlag

Den Knopf im Markup vor die `<nav>` stellen (Optik per CSS-`order` unverändert) oder beim
Öffnen den Fokus auf den ersten Menüpunkt setzen; in `js/main.js` in `zeigen(auf)` auch
`aria-label` umschalten; `aria-controls` + `id` an der Navigation ergänzen.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**
