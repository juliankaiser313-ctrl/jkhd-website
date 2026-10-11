# Sicherheit, Bild „Daten“: „Diese Website speichert nichts über Sie“ stimmt so nicht mehr

- **Seite:** https://jkhd.de/sicherheit.html, Bild „Daten“ (ebenso https://jkhd.de/en/security.html: „This website stores nothing about you.“)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720
- **Sprache / Darstellung:** Deutsch und Englisch; hell
- **Status:** behoben
- **Art:** Fehler (Text)
- **Gewicht:** mittel

## Was passiert

Im Bild „Daten“ steht: „Diese Website speichert nichts über Sie. Der Partnerzugang behält,
was ein Partner gegeben hat, und sonst nur Prüfsummen und Anmeldungen, die von selbst
verfallen.“ In der Zeichnung daneben: „diese Website: keine Cookies, keine Tracker, nichts
von fremden Servern, keine Fragen, keine Antworten gespeichert“.

Die Datenschutzerklärung derselben Website beschreibt aber mehr:

- **Bestenliste der Simulation:** Spitzname, Spielzeit, Spielnummer, Tempo und Datum
  werden gespeichert und öffentlich angezeigt (bis zu 100 Einträge).
- **Anfrage-Formular:** die Anfrage wird bis zu 30 Tage auf dem Server abgelegt und per
  E-Mail weitergeleitet.
- **Zugriffsprotokolle** von api.jkhd.de (laut IONOS acht Wochen, IP gekürzt).
- **Prüfsummen** von IP-Adressen gegen Missbrauch (bis zum Folgetag).
- Im eigenen Browser: die gewählte Darstellung (localStorage).

Wer beides liest, findet einen Widerspruch — gerade auf der Seite, die Vertrauen schaffen
soll. Die übrigen Aussagen des Bildes (keine Cookies, keine Tracker, nichts von fremden
Servern) stimmen: gemessen auf allen Seiten keine Cookies, nur Anfragen an www.jkhd.de
und api.jkhd.de.

## Was erwartet wird

Eine Formulierung, die zur Datenschutzerklärung passt, z. B. „Diese Website legt kein
Profil über Sie an: keine Cookies, keine Tracker. Gespeichert wird nur, was Sie selbst
schicken (Anfrage, Spitzname in der Bestenliste) — Einzelheiten in der
Datenschutzerklärung.“ (Wortlaut entscheidet Julian.)

## Schritte zum Nachstellen

1. https://jkhd.de/sicherheit.html bis zum Bild „Daten“ scrollen.
2. Mit https://jkhd.de/datenschutz.html, Abschnitte „Anfrage über den Fragebogen“ und
   „Bestenliste der Simulation“, vergleichen.

## Belege

Zitate oben; Netzwerk- und Speicherprüfung aller Seiten (keine Cookies, nur eigene Hosts).

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Der Satz stammte aus der Zeit vor Anfrage-Formular und Bestenliste.
- **Änderung:** sicherheit.html / en/security.html, Bild „Daten“: „Diese Website legt kein Profil über Sie an: keine Cookies, keine Tracker. Gespeichert wird nur, was Sie selbst schicken — eine Anfrage, ein Spitzname in der Bestenliste. Der Partnerzugang behält …“ (englisch entsprechend). Die Zeichnung bleibt (keine Cookies, keine Tracker, nichts von fremden Servern, keine Fragen und Antworten gespeichert — alles belegt). Der Wortlaut ist ein Vorschlag im Sinne der Datenschutzerklärung; Julian kann ihn ändern. Commit 20321ce, Cache-Stempel 20261011o.
- **Geprüft mit:** Abgleich mit der Datenschutzerklärung (Anfrage bis 30 Tage, Bestenliste, Prüfsummen, Protokolle): kein Widerspruch mehr; Text im Diff gelesen.
