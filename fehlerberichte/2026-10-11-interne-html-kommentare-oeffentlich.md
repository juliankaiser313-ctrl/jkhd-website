# Interne Arbeitsnotizen stehen als HTML-Kommentare in den ausgelieferten Seiten

- **Seite:** fast alle Seiten (Quelltext-Ansicht im Browser)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Quelltext der ausgelieferten Seiten
- **Sprache / Darstellung:** —
- **Status:** offen
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

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**
