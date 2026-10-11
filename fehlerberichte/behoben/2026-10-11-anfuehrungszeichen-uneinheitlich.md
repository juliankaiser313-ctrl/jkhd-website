# Anführungszeichen: „…" statt „…“ an vielen Stellen, im Englischen gemischt

- **Seite:** mehrere, siehe Liste (vor allem https://jkhd.de/datenschutz.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Quelltext und ausgelieferte Seiten (Chrome 155)
- **Sprache / Darstellung:** Deutsch und Englisch
- **Status:** behoben
- **Art:** Fehler (Typografie)
- **Gewicht:** niedrig

## Was passiert

Die Website setzt sonst deutsche Anführungszeichen „so“ (unten 99, oben 66). An folgenden
**sichtbaren** Stellen beginnt das Zitat richtig mit „ und endet mit dem geraden Zeichen ":

| Datei (Zeile) | Stelle |
|---|---|
| datenschutz.html (104) | Näheres unter „Partnerzugang") |
| datenschutz.html (139) | Der Kasten „Nur für Partner" auf den Seiten „Partnerzugang" und „Kontakt" |
| datenschutz.html (157, 161) | Die Seite „Partner" … „Abmelden" löscht … |
| datenschutz.html (186, 187) | Der Knopf „Anfrage" … Mit „Senden" werden … |
| datenschutz.html (204) | Für „Auswahl anfordern" auf der Partnerseite |
| datenschutz.html (221, 236) | siehe „Partnerzugang") |
| datenschutz.html (248) | an den Dienst „AI Endpoints" von OVHcloud |
| kontakt.html (134) | Über „Anfrage" erreichen Sie uns |
| mathematik-grundlagen.html (250) | „dieses Signal sieht gut aus" und „dieses Signal ist besser als Zufall" |
| mathematik-grundlagen.html (277) | „Rückkehr zum Mittelwert" |
| js/main.js (1312) | Geben Sie den Code aus der E-Mail „Ihr Code für den JKHD-Partnerzugang" ein |
| js/main.js (1611) | … und „Passwort vergessen?" wählen |
| js/main.js (2185) | Auswählen und „Auswahl anfordern": … (Partnerseite) |

Innerhalb der Datenschutzerklärung wechselt es sogar: im Abschnitt „Bestenliste“ stehen
die richtigen Zeichen. Die Grundlagen-Seite wird aus `C:\Quant Arbeit\JKHD-Formeln`
gebaut — dort in der Quelle ändern.

Englisch: auf en/privacy.html, en/contact.html, en/partner-access.html stehen gerade
Zeichen ("Partner access", "Enquiry", "Sign out" …), auf en/simulation.html und im
Bestenlisten-Abschnitt von en/privacy.html typografische (“Simulation”).

Verwandt, ebenfalls Typografie: in der Sicherheits-Animation steht „mutiger →␣␣geht
nicht“ bzw. „bolder →␣␣not possible“ mit zwei Leerzeichen (`js/bilder-sicherheit.js`).

## Was erwartet wird

Durchgehend „…“ im Deutschen und “…” (oder durchgehend gerade) im Englischen; ein
Leerzeichen nach dem Pfeil.

## Schritte zum Nachstellen

1. https://jkhd.de/datenschutz.html öffnen, Abschnitt „Partnerzugang“ lesen.

## Belege

Suche im Quelltext nach `„` gefolgt von einem geraden `"` (bzw. `&quot;`); Kommentare im
Quelltext sind in der Liste oben schon herausgenommen.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Texte aus verschiedenen Werkzeugen und Zeitpunkten; ein gerades Schlusszeichen fiel beim Lesen nicht auf.
- **Änderung:** Deutsch „…“: datenschutz.html (14 Stellen), impressum.html (1), kontakt.html (2), js/main.js (38, auch Kommentare). Englisch “…”: en/privacy.html (12), en/contact.html (2), en/partner-access.html (6). Die Grundlagen-Seite über ihre Quelle (JKHD-Formeln, quellen/grundlagen-de_01.json, 3 Stellen, Commit fdb3139 dort) neu gebaut. „mutiger → geht nicht“ mit einem Leerzeichen seit Runde A. Commit 20321ce, Cache-Stempel 20261011o.
- **Geprüft mit:** Suche nach „ gefolgt von einem geraden Schlusszeichen in allen ausgelieferten HTML-Dateien und js/main.js nach der Änderung: 0 Treffer; node --check für js/main.js; Regressionslauf pruefung_fehler.js (29 Prüfungen grün).
