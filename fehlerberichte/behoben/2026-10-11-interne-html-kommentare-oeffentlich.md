# Interne Arbeitsnotizen stehen als HTML-Kommentare in den ausgelieferten Seiten

- **Seite:** fast alle Seiten (Quelltext-Ansicht im Browser)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Quelltext der ausgelieferten Seiten
- **Sprache / Darstellung:** —
- **Status:** behoben
- **Art:** Verbesserung
- **Gewicht:** niedrig

## Was passiert

GitHub Pages liefert HTML-Kommentare mit aus; jeder Besucher sieht sie mit „Seitenquelltext
anzeigen“. Viele Seiten tragen Arbeitsnotizen, die für Besucher nicht gedacht sind, z. B.

- unternehmen.html / en/company.html: „Ueberschrift = Julians eigener Satz vom
  19.09.2026 (Kehrtwende: JKHD verkauft nichts) …“
- impressum.html / en/imprint.html: Begründung zum zweiten Kontaktweg mit Paragraph und
  Urteil, „Wer den Kasten dort entfernt …“
- pruefung.html, sicherheit.html, system.html: Zitate aus Julians Aufträgen („alles
  wegmachen und stattdessen eine Animation …“)
- kontakt.html, partnerzugang.html, partner.html: Beschreibung des Anmeldeablaufs und
  woran die Seite technisch hängt
- Formelseiten: lokale Pfade („C:\Quant Arbeit\JKHD-Formeln …“)

Für die Datenschutzerklärung wurde das am 26.09. schon so gelöst (Belege ins README statt
in den Quelltext) — bei den übrigen Seiten noch nicht.

## Was erwartet wird

In den ausgelieferten Seiten nur Kommentare, die auch ein Fremder lesen darf (oder gar
keine); die Notizen ins README bzw. in die Commit-Nachrichten.

## Belege

Auswertung aller Kommentare per Skript; Beispiele oben.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Arbeitsnotizen wurden beim Bauen direkt in die Seiten geschrieben.
- **Änderung:** 16 Kommentare ersetzt oder entfernt: Impressum/Imprint (Begründung des zweiten Kontaktwegs), Startseite DE/EN (Julians Wortlaut), Prüfungen/Sicherheit/System DE/EN (Julians Aufträge), Unternehmen/Company (Herkunft der Überschrift), Kontakt/Contact, Partnerzugang/Partner-access, Partner (Anmeldeablauf, Serverdetails); die Formelseiten über bauen.js ohne lokalen Pfad. Alle Inhalte stehen jetzt im README, Abschnitt „Herkunft der Seiteninhalte“. Geblieben sind Abschnittsmarken und technische Hinweise ohne Zitate, Pfade oder Betriebsdetails (Hero-Messung, Simulation, 404, FORMELHINTERGRUND). Commit 20321ce, Cache-Stempel 20261011o.
- **Geprüft mit:** Kommentar-Inventar per Skript vor (64) und nach der Änderung durchgesehen; keine Julian-Zitate, keine lokalen Pfade, keine Serverdetails mehr in den ausgelieferten Seiten.
