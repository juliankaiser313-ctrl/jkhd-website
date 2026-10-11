# Suchmaschinen-Angaben: doppelte Beschreibungen, fehlendes og:locale, uneinheitliches og:type

- **Seite:** alle Seiten (Kopfbereich)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Quelltext aller 41 HTML-Dateien
- **Sprache / Darstellung:** Deutsch und Englisch
- **Status:** behoben
- **Art:** Verbesserung (Suchmaschinen, Vorschaukarten)
- **Gewicht:** niedrig

Geprüft und **in Ordnung**: jede Seite hat genau eine sichtbare h1, Titel, `lang`,
Viewport; alle internen Links und Anker führen auf vorhandene Ziele; hreflang ist auf
allen Seitenpaaren gegenseitig; die Sitemap enthält genau die indexierbaren Seiten;
das JSON-LD ist gültig; Sprachschalter zeigen überall auf das richtige Gegenstück.

## Was auffällt

1. **Doppelte Beschreibung:** `index.html` und `was-wir-machen.html` haben dieselbe
   `meta description` („JKHD baut quantitative Systeme und betreibt sie selbst. Hier
   erklären wir …“), ebenso `en/index.html` und `en/what-we-do.html`. Suchmaschinen
   werten doppelte Beschreibungen ab bzw. ersetzen sie.
2. **og:locale fehlt auf allen deutschen Seiten** (die englischen haben `en_GB`). Für
   Vorschaukarten: `<meta property="og:locale" content="de_DE">` und je
   `og:locale:alternate`.
3. **og:type uneinheitlich:** kontakt.html, unternehmen.html, partnerzugang.html,
   was-wir-machen.html sind `website`, ihre englischen Gegenstücke `article`.
4. **Keine `twitter:card`**: X/Twitter nimmt dann die kleine Karte; mit
   `<meta name="twitter:card" content="summary_large_image">` erscheint das große Bild.
5. **Sitemap ohne `<lastmod>`**: bei einer Website, die sich gerade oft ändert, hilft das
   Suchmaschinen beim Neuabruf.
6. **Kurze Adressen ohne Endung** (z. B. https://jkhd.de/system) liefern dieselbe Seite
   aus; das ist durch `canonical` abgedeckt — nur zur Kenntnis.

## Was erwartet wird

Je Seite eine eigene Beschreibung; vollständige und einheitliche Open-Graph-Angaben.

## Belege

Auswertung aller `<head>`-Bereiche per Skript.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Angaben aus verschiedenen Bauphasen.
- **Änderung:** Alle 26 Seiten mit Open-Graph-Angaben: og:type website, og:locale de_DE bzw. en_GB mit og:locale:alternate, twitter:card summary_large_image; eigene description und og:description für was-wir-machen.html und en/what-we-do.html; sitemap.xml mit lastmod je Seite (Datum des letzten Commits, der mehr als den Cache-Stempel änderte). Punkt 6 (kurze Adressen) bleibt zur Kenntnis, canonical deckt es ab. Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** Zählung der Meta-Angaben per grep vor und nach der Änderung (og:type: 17 article + 9 website → 26 website; og:locale: 12 → 26 + 26 alternate; twitter:card: 0 → 26); sitemap.xml mit 24 lastmod-Einträgen.
