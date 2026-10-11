# Anfrage-Formular: „Pflichtfelder sind markiert“ — sie sind es nicht; EN verlinkt die deutsche Datenschutzerklärung

- **Seite:** https://jkhd.de/kontakt.html und https://jkhd.de/partnerzugang.html, Knopf „Anfrage“ (ebenso en/contact.html, en/partner-access.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720
- **Sprache / Darstellung:** Deutsch und Englisch; hell
- **Status:** offen
- **Art:** Fehler (Text)
- **Gewicht:** niedrig

## Was passiert

1. Unter dem Fragebogen steht „Pflichtfelder sind markiert.“ / „Required fields are
   marked.“ Markiert ist aber nur das **freiwillige** Feld („Website oder Profil
   (optional)“); die fünf Pflichtfelder (Name, E-Mail, Rolle, Anliegen, Nachricht) tragen
   kein Zeichen. Leer abgeschickt kommt richtig „Bitte alle Pflichtfelder ausfüllen.“ und
   der Fokus springt ins erste leere Feld — das funktioniert.
2. Auf den englischen Seiten führt der Link „privacy policy“ im selben Satz auf die
   **deutsche** `datenschutz.html` statt auf `en/privacy.html`.

## Was erwartet wird

Entweder ein Sternchen o. Ä. an den Pflichtfeldern, oder der Satz lautet „Alle Felder außer
‚Website oder Profil‘ sind Pflicht.“ Der englische Link zeigt auf `privacy.html` (die
englische Fassung verweist ihrerseits auf die verbindliche deutsche).

## Schritte zum Nachstellen

1. https://jkhd.de/kontakt.html → „Anfrage“.
2. Den Hinweis unter dem Formular lesen und die Feldbeschriftungen ansehen.
3. Auf https://jkhd.de/en/contact.html dasselbe; der Link „privacy policy“ öffnet die
   deutsche Seite.

## Belege

Gemessen mit abgeschaltetem Versand (keine Anfrage ging an den Server). Quelle:
`js/main.js`, Funktion `anfrageSchritt()` — der englische Text enthält fest
`../datenschutz.html`; in `style.css` gibt es keine Regel, die `[required]`-Felder
kennzeichnet.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**
