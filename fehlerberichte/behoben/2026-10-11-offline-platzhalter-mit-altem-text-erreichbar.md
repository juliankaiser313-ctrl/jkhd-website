# Der alte Offline-Platzhalter ist öffentlich erreichbar und sagt „vorübergehend offline“

- **Seite:** https://jkhd.de/offline/
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720
- **Sprache / Darstellung:** Deutsch und Englisch; hell
- **Status:** behoben
- **Art:** Verbesserung
- **Gewicht:** niedrig

## Was passiert

Weil der Pages-Lauf das ganze Verzeichnis hochlädt, ist auch `offline/index.html`
erreichbar (Status 200). Die Seite sagt: „Diese Webseite ist derzeit nicht erreichbar.
Wir überarbeiten unseren Auftritt …“ und auf Englisch „We are not taking on work in the
meantime; enquiries by e-mail are welcome“ — beides passt nicht zur laufenden Website und
zum heutigen Geschäftsmodell (JKHD nimmt keine Aufträge an, auch nicht nach dem Umbau).

Sie trägt `noindex` und ist nirgends verlinkt (so gewollt, README „Wieder offline“). Wer
die Adresse aber kennt oder rät, bekommt einen falschen Eindruck.

## Was erwartet wird

Entweder den englischen Satz an das Modell ohne Aufträge anpassen (der Platzhalter bleibt
ja für einen künftigen Offline-Fall im Repository), oder `offline/` beim Hochladen
auslassen, solange die Seite live ist.

## Schritte zum Nachstellen

1. https://jkhd.de/offline/ öffnen.

## Belege

keine (Text der Seite).

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Der englische Satz stammte aus der Zeit des alten Angebots; der Platzhalter ist zugleich der Offline-Schalter (README „Wieder offline“) und bleibt deshalb im Repository.
- **Änderung:** offline/index.html: der englische Kasten sagt jetzt wie der deutsche „Messages still reach us by e-mail — we will get back to you.“ Die Datei bleibt erreichbar (noindex, nirgends verlinkt); sie beim Hochladen auszulassen hieße, den Offline-Schalter umzubauen — nicht nötig, der Text stimmt jetzt. Commit 20321ce, Cache-Stempel 20261011o.
- **Geprüft mit:** Text im Diff gelesen; nach der Veröffentlichung https://jkhd.de/offline/ per curl.
