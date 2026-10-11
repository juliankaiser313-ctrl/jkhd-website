# Beschriftungen in den Bildlauf-Zeichnungen laufen auf dem Handy über den Bildrand

- **Seite:** https://jkhd.de/pruefung.html (Bild 05 und „Grenze“), https://jkhd.de/sicherheit.html (Bild 05 „Handgeschäfte“ und „Spuren“)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, Handy-Ansicht 390×844
- **Sprache / Darstellung:** Deutsch; hell (englisch vermutlich ebenso, nicht einzeln geprüft)
- **Status:** offen
- **Art:** Fehler
- **Gewicht:** mittel

## Was passiert

In den gezeichneten Bildern (Leinwand) stehen einige Beschriftungen so weit rechts oder
sind so lang, dass sie am schmalen Bildschirm abgeschnitten werden:

| Seite / Bild | sichtbar | gemeint |
|---|---|---|
| Prüfungen, 05 · Überwachter Dauerbetrieb | „Proz“ (rot, am rechten Rand) | „Prozess läuft, Arbeit steht“ |
| Prüfungen, Grenze | „echter Broker: no“ | „echter Broker: noch keiner“ |
| Sicherheit, 05 · Handgeschäfte | „sonst nicht mehr prü“ | „sonst nicht mehr prüfbar“ |
| Sicherheit, Spuren | „ette gebrochen → beim Start gemeldet; ein Beweislauf bricht a“ | „Kette gebrochen → … bricht ab“ (an beiden Rändern abgeschnitten) |

Gerade die zwei wichtigsten Aussagen („echter Broker: noch keiner“, „sonst nicht mehr
prüfbar“) sind so nicht lesbar.

## Was erwartet wird

Jede Beschriftung steht vollständig im Bild — am Handy notfalls in zwei Zeilen oder in
der kurzen Fassung, wie es bei anderen Bildern schon gemacht wird (`klein ? … : …`).

## Schritte zum Nachstellen

1. https://jkhd.de/pruefung.html auf dem Handy öffnen.
2. Bis zum letzten Bild „Was diese Prüfungen nicht leisten.“ scrollen.
3. Rechts am Strich steht „echter Broker: no“.

## Belege

`2026-10-11-bildlauf-beschriftungen-am-handy-abgeschnitten-1.png` (Prüfungen 05,
Belastungsproben, Grenze) und `…-2.png` (Sicherheit Handgeschäfte und Spuren), je 390×844.

## Vorschlag

In `js/bilder-pruefung.js` und `js/bilder-sicherheit.js` für die genannten Texte eine
Handy-Fassung (kürzer oder zweizeilig) bzw. die x-Position auf `B - Textbreite - Rand`
begrenzen; allgemein könnte der Werkzeugkasten `k.text` eine Option „im Bild halten“
bekommen, die den Text an den Rändern einrückt.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**
