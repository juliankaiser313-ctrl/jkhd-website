# Impressum und Datenschutz sind auf dem Handy nicht im Menü — auf der Startseite erst nach rund 23.000 px

- **Seite:** https://jkhd.de/ (Startseite), grundsätzlich alle Seiten unter 1141 px Breite
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, Handy-Ansicht 390×844
- **Sprache / Darstellung:** Deutsch und Englisch; hell und dunkel
- **Status:** offen
- **Art:** Fehler (rechtliches Risiko)
- **Gewicht:** mittel

## Was passiert

Unter 1141 px Breite (Handy, Tablet, kleine Fenster) enthält das Menü bewusst keine Links
auf Impressum und Datenschutz — sie stehen nur in der Fußzeile (README: „auf dem Handy
führt sie die Fußzeile“). Auf den normalen Seiten ist das nach kurzem Scrollen erreicht.
Auf der **Startseite** liegt die Fußzeile aber hinter der Universum-Animation: auf dem
Handy erst nach **23.195 px** Scrollweg (rund 27 Bildschirmhöhen). Wer dort das Impressum
sucht, findet es weder im Menü noch in vertretbarer Nähe.

§ 5 DDG verlangt, dass die Anbieterkennzeichnung „leicht erkennbar, unmittelbar erreichbar
und ständig verfügbar“ ist. Ob „Menü → andere Seite → runterscrollen → Impressum“ dafür
reicht, ist eine Frage der Auslegung (kein Rechtsrat) — sicherer und einfacher ist ein
direkter Link.

## Was erwartet wird

Impressum und Datenschutz sind von jeder Seite und auf jeder Breite mit einem Klick
erreichbar, z. B. als zwei kleine Einträge unten im Handy-Menü (auf breiten Schirmen gibt
es sie im Klappfeld ja schon).

## Schritte zum Nachstellen

1. https://jkhd.de/ auf dem Handy (oder Fenster < 1141 px) öffnen.
2. Menü öffnen: Startseite … Partnerzugang, Sprachen, Darstellung, Kontakt — kein
   Impressum, kein Datenschutz.
3. Auf der Startseite bis zur Fußzeile scrollen: rund 27 Bildschirmhöhen.

## Belege

Messung: Seitenhöhe der Startseite bei 390×844 = 23.195 px (bei 1280×720 = 23.835 px).
Die Regel steht in `css/style.css`: `.nav-legal { display: none; }`, eingeblendet erst
im Block `@media (min-width: 1141px)`.

## Vorschlag

`.nav-legal` auch im Handy-Menü zeigen (klein, unter „Kontakt“ oder über Sprachen/
Darstellung). Alternativ ein dezenter Textlink „Impressum · Datenschutz“ im Hero der
Startseite.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**
