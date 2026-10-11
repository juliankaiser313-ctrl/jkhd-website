# Startseite lädt beim Öffnen sofort 2,3 MB Erdbilder, obwohl die Erde erst nach langem Scrollen kommt

- **Seite:** https://jkhd.de/ und https://jkhd.de/en/index.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720 und 1920×1050; Handy 390×844
- **Sprache / Darstellung:** Deutsch und Englisch; hell und dunkel
- **Status:** offen
- **Art:** Fehler (Ladezeit)
- **Gewicht:** mittel

## Was passiert

Laut README und Quelltext sollen die NASA-Bilder für die Erde in der Universum-Animation
erst geladen werden, „sobald der Abschnitt in die Nähe kommt (einen Bildschirm davor)“.
Seit dem 11.10. liegt der Hero aber selbst im Abschnitt `#universum` — der Abschnitt ist
also schon beim Öffnen im Bild, und alle Erdbilder werden sofort geladen, ohne dass
jemand scrollt. Die Erde erscheint erst nach etwa der Hälfte des 32 Bildschirme langen
Scrollwegs; wer nur kurz auf die Startseite schaut, lädt die Bilder umsonst.

Gemessen 2,5 s nach dem Laden, ohne zu scrollen:

| Fenster | übertragen | davon Erdbilder |
|---|---|---|
| 1280×720 | 2.441 KB | ziel-nacht.jpg 930 KB, europa-nacht.jpg 496 KB, europa-tag.jpg 303 KB, welt-tag.jpg 213 KB, … |
| 390×844 | 857 KB | ziel-nacht-k.jpg 321 KB, … |

Zum Vergleich: jede andere Seite der Website überträgt 150–360 KB.

## Was erwartet wird

Die Erdbilder kommen erst, wenn der Flug sich der Erde nähert (z. B. ab einem bestimmten
Fortschritt der Animation), oder spätestens nach dem ersten Scrollen — nicht beim Öffnen.

## Schritte zum Nachstellen

1. https://jkhd.de/ mit geöffneten Entwicklerwerkzeugen (Netzwerk, Cache aus) laden.
2. Nicht scrollen.
3. In der Liste erscheinen `assets/erde/*.jpg` mit zusammen rund 2,3 MB.

## Belege

Netzwerkmitschnitt wie oben. Stelle im Quelltext: `js/universum.js`, der zweite
`IntersectionObserver` mit `rootMargin: "100% 0px"` auf dem Abschnitt, der `erdeLaden()`
aufruft — er feuert sofort, weil der Abschnitt seit der elften Fassung oben beginnt.

## Vorschlag

`erdeLaden()` aus der Zeichenschleife heraus anstoßen, sobald der Fortschritt `p` eine
Schwelle vor dem Erscheinen der Erde erreicht (genug Vorlauf für 2,3 MB), statt am
Abschnitt. Zusätzlich lohnt ein Blick auf `ziel-nacht.jpg` (930 KB): als WebP/AVIF oder
mit etwas stärkerer Kompression wäre es deutlich kleiner.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**
