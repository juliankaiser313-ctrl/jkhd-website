# JKHD-Website — jkhd.de

Statische Webseite für JKHD (HTML/CSS/JS, keine Build-Tools nötig).
Design: monochrom Schwarz/Weiß, Serifen-Headlines (Playfair Display),
Markenzeichen (drei Balken), Hell/Dunkel-Umschaltung. Zweisprachig:
Deutsch in der Wurzel, Englisch unter `/en/`.

## Struktur

```
index.html         Startseite = Menü: Hero mit Marken-Lockup und zwei Knöpfen, leere Laufleiste
was-wir-machen.html  Was wir machen: ein Satz, ein Absatz in einfacher Sprache, Bäcker-Kasten, Kontaktkasten
system.html        Aufbau eines Systems (derzeit nur Kontaktkasten — Inhalt folgt)
pruefung.html      Wie geprüft wird: Grundsätze, Modulprüfung, 6 Stufen, Belastungsproben
sicherheit.html    Sicherheit & Vertraulichkeit: Grundsätze, 6 Bereiche, Ablauf NDA→Löschung,
                   offener Abschnitt über fehlende Zertifizierungen
mathematik.html    Verfahren und Formeln, je mit Nutzen und Fallstrick
unternehmen.html   Wer wir sind, Auf einen Blick, Einblicke, der Gründer
kontakt.html       Drei Kacheln (kontakt@ / service@ / info@) + Partnerzugang (siehe unten)
impressum.html     Impressum (§ 5 DDG)
datenschutz.html   Datenschutzerklärung
404.html           Fehlerseite (zweisprachig)
ueber/leistungen/projekte/technologie/ansatz.html   Weiterleitungen auf die neuen Seiten
holding/           Eigenständige Holding-Variante, aus der Navigation nicht verlinkt

en/index.html      Englische Fassung der Startseite
en/system.html     "How a system is built"
en/testing.html    "How we test, before anything runs"
en/security.html   "What you give us stays yours"
en/mathematics.html
en/company.html
en/contact.html
en/imprint.html    Servicefassung, deutsche Fassung ist maßgeblich
en/privacy.html    Servicefassung, deutsche Fassung ist maßgeblich

robots.txt         Suchmaschinen-Regeln (Sitemap-Verweis auf jkhd.de)
sitemap.xml        Sitemap inkl. hreflang-Paare DE/EN
assets/og-image.png  Vorschaubild für Link-Teilen
assets/fonts/      Self-hosted Schriften (DSGVO)
css/style.css      Gesamtes Design (Farben oben als CSS-Variablen)
js/main.js         Mobile-Nav, Hell/Dunkel, Fragen-Blase, Partnerzugang
favicon.svg        Browser-Tab-Icon (drei Balken)
```

## Zweisprachigkeit — was beim Ändern zu beachten ist

Es gibt keine Übersetzungsschicht: jede Seite existiert zweimal als echte
Datei. Wer einen Text ändert, ändert ihn in **beiden** Fassungen.

- **Die Kopfzeile verhält sich nach Breite unterschiedlich:**
  - **bis 1140 px:** alles hinter dem Menüknopf, das Feld klappt über die volle
    Breite auf — Seitenlinks, Sprache, Darstellung, Kontakt.
  - **ab 1141 px:** die Seitenlinks und der Kontakt-Knopf stehen offen in der
    Kopfzeile; hinter dem Menüknopf liegen nur noch Sprache und Darstellung,
    als 264-px-Feld bündig unter ihm (dafür ist `.nav-wrap` dort
    `position: relative`, das Feld hängt mit `right: 48px` am Innenabstand des
    Rahmens).
  Das Menü schließt per Escape und Klick daneben; ein Klick auf ein Segment
  darin lässt es offen.
- **Sprache und Darstellung** (`.nav-lang`, `.nav-theme`) stecken zusammen in
  `.nav-prefs` — nur dieser Behälter lässt sich auf breiten Schirmen aus der
  Menüzeile herauslösen. Jeweils Beschriftung links, Segmentpaar rechts:
  „Sprachen"/„Languages" und „Darstellung"/„Appearance".
- **Impressum und Datenschutz** stehen im Klappfeld als `.nav-legal` und sind
  **nur ab 1141 px sichtbar** — auf dem Handy führt sie die Fußzeile, das
  Menü bliebe sonst unnötig lang. In der Fußzeile hat beides eine eigene
  Spalte (`.footer-legal-nav`, „Rechtliches"/„Legal"); die schmale Zeile ganz
  unten trägt nur noch das Copyright. Die Rechtsseiten selbst
  (impressum/datenschutz/404) haben weiterhin ihre verkürzte Fußzeile mit
  `.footer-links`.
- **Sprachschalter** (`.nav-lang`): aktive Sprache als
  `<span class="lang-current">`, die andere ein Link auf das Gegenstück. Kein
  JavaScript, keine automatische Weiterleitung, keine Spracherkennung — und
  dadurch auch nichts, was gespeichert wird.
- **Hell/Dunkel** (`.nav-theme`): zwei Knöpfe mit `data-theme-set="light|dark"`,
  der geltende trägt `.is-on`. Gewählt wird in `localStorage` unter
  `jkhd-theme` gemerkt; ohne eigene Wahl folgt die Seite dem Betriebssystem.
- **Zwei Ebenen der Navigation:** In der offenen Kopfzeile stehen nur die
  Seiten, die zuerst gesehen werden sollen (derzeit Leistungen, System,
  Prüfung + Kontakt-Knopf). Alles Weitere liegt im Klappfeld: `<a>`-Zeilen als
  direkte Kinder von `.nav-prefs`, oberhalb von Sprache und Darstellung. Auf
  dem Handy ändert das nichts — dort steht ohnehin alles untereinander in
  derselben Reihenfolge.
- **Kommen neue Seitenlinks in die Kopfzeile**, wird sie ab 1141 px breiter —
  dann entweder einen Punkt ins Klappfeld verschieben oder die Schwelle im
  Block `@media (min-width: 1141px)` anheben, sonst schiebt die Zeile die
  Seite waagerecht hinaus. Stand jetzt (inkl. Sicherheit) bleiben bei 1141 px
  rund 244 px Luft — das reicht für etwa einen weiteren Eintrag.
- **Inhaltliche Zusagen auf `sicherheit.html`** sind bewusst so formuliert,
  dass sie ohne Zertifikat haltbar sind: keine Meldefrist in Stunden (die
  gehört in den Vertrag), keine behaupteten Audits, und ein eigener Abschnitt
  „Was wir nicht vorweisen können". Beim Ändern diese Linie halten — eine
  Zusage zu viel fällt im Prüffall auf die Seite zurück. Sprache und
  Darstellung kosten dort keine Breite mehr, die liegen im Feld. Der Block ist
  von den übrigen 940-px-Umbrüchen getrennt.
- **Seitenpaare:** `pruefung.html ↔ en/testing.html`,
  `sicherheit.html ↔ en/security.html`,
  `mathematik.html ↔ en/mathematics.html`,
  `unternehmen.html ↔ en/company.html`, `kontakt.html ↔ en/contact.html`,
  `impressum.html ↔ en/imprint.html`, `datenschutz.html ↔ en/privacy.html`,
  `index.html` und `system.html` heißen in beiden Sprachen gleich.
- **hreflang:** drei `<link rel="alternate">` im `<head>` jeder Seite
  (de, en, x-default) — plus dieselben Paare in `sitemap.xml`. Bei einer neuen
  Seite beides mitziehen.
- **Texte aus dem JavaScript** (Fragen-Blase, Formular-Hinweise) stehen in `js/main.js` doppelt und werden über
  `T("deutsch", "english")` ausgewählt. Maßgeblich ist das `lang`-Attribut
  der Seite.
- **Anker-IDs bleiben deutsch** (`#leistungen`, `#anfrage`), damit
  Verweise in beiden Sprachen identisch funktionieren. Nicht umbenennen.
  Den Anker `#leistungen` gibt es seit 19.09.2026 nicht mehr: der Menüpunkt
  heißt „Was wir machen" und führt auf `was-wir-machen.html` (EN
  `en/what-we-do.html`); `leistungen.html` leitet dorthin weiter. Seit
  demselben Tag gibt es keine Preise und keinen Konfigurator mehr — JKHD
  bietet nichts zum Kauf an.
- **Nach Änderungen an `css/style.css` oder `js/main.js`** den Versionsstempel
  `?v=...` in allen HTML-Dateien hochzählen, sonst bekommen wiederkehrende
  Besucher die alte Datei aus dem Browser-Cache.

## Partnerzugang (Kontaktseite) — Server läuft unter https://api.jkhd.de

Der Kasten „Nur für Partner" auf `kontakt.html` / `en/contact.html` führt den
Ablauf **E-Mail eingeben → Code per E-Mail → Code eingeben → hinterlegte Daten
sehen**. Das Frontend dafür ist fertig (`js/main.js`, Abschnitt Partnerzugang).
Der Server dazu liegt im eigenen Repo `C:\Quant Arbeit\JKHD-Partner-Server`
(PHP auf IONOS Webhosting Plus, Vertrag 300371840) und ist als
`https://api.jkhd.de` angebunden (`data-api` am `.partner`-Element, seit
20.09.2026). Steht `data-api` leer, wird nichts gesendet und der Kasten sagt
das dem Besucher offen.

Was der Server können muss (Vorschlag, klein gehalten):

- `POST {api}/code` mit `{"email": "…"}` — prüft die Adresse gegen die
  Partnerliste, erzeugt einen kurzlebigen Code (z. B. 6 Ziffern, 10 Minuten,
  einmal gültig), schickt ihn von `elite@jkhd.de` und antwortet **immer** mit
  `204` — auch für unbekannte Adressen, damit niemand ausprobieren kann, wer
  Partner ist. Anfragen pro Adresse und IP begrenzen.
- `POST {api}/login` mit `{"email": "…", "code": "…"}` — bei gültigem Code
  `200` mit `{"name": "…", "felder": [{"label": "…", "wert": "…"}, …]}`,
  sonst `401`. Was in `felder` steht, pflegt Julian je Partner.
- CORS für `https://www.jkhd.de`, sonst nichts.

Partner pflegen = `api-daten/partner.json` auf dem Webspace (siehe README des
Server-Repos). Die Datenschutzerklärung beschreibt die Verarbeitung im
Abschnitt „Partnerzugang".

## Lokal ansehen

```
python -m http.server 8090 --directory "C:\Quant Arbeit\JKHD-Website"
```

Dann im Browser: http://localhost:8090

## Zurzeit offline — nur ein Platzhalter ist veröffentlicht

**Stand: die Seite ist absichtlich nicht live.** Unter `www.jkhd.de` steht eine
einzelne Platzhalterseite; die eigentliche Website liegt vollständig und
unverändert im Repository, wird aber nicht ausgeliefert.

So ist das gemacht:

- `offline/index.html` — der Platzhalter. Eigenständig: eigene Farben und
  Maße inline, keine Schriften, keine Stylesheets, kein Skript von außen.
  Enthält das Impressum nach § 5 DDG, damit die Pflichtangaben trotz
  abgeschalteter `impressum.html` erreichbar bleiben.
- `offline/robots.txt` — erlaubt Crawlen **absichtlich weiter**. Nur so lesen
  Suchmaschinen das `noindex` des Platzhalters und den 404 der alten Adressen
  und nehmen die Seite aus dem Index. Ein `Disallow: /` würde das verhindern
  und die alten Treffer länger stehen lassen.
- `.github/workflows/pages.yml` — lädt `./offline` hoch statt `.` und kopiert
  vorher `CNAME`, `favicon.svg` und `index.html` → `404.html` hinein. Dadurch
  bleibt die Domain am Repository und jede beliebige Adresse zeigt den
  Platzhalter.

**Wieder live schalten:** im Workflow den Schritt „Platzhalter
vervollständigen" löschen und `path: ./offline` zurück auf `path: .` setzen —
das ist alles. Danach auf `main` pushen, der Deploy läuft von selbst. Der
Ordner `offline/` kann liegen bleiben (er wird dann mit ausgeliefert, ist
über keinen Link erreichbar und trägt `noindex`) oder mit gelöscht werden.

Nicht vergessen: der Deploy hängt an Pushes auf `main`. Ein Commit auf einem
Arbeitsbranch ändert an der Live-Seite nichts, bis er in `main` liegt.

## Livegang: GitHub Pages + IONOS-Domain (jkhd.de)

Live seit August 2026 (siehe Abschnitt oben — derzeit ausgesetzt). Repo
`juliankaiser313-ctrl/jkhd-website`, GitHub Pages auf Branch `main`, Custom
Domain `www.jkhd.de` (CNAME-Datei im Repo), IONOS-DNS zeigt auf GitHub.

Erledigt:
- [x] Impressum ausgefüllt (§ 5 DDG, Name + ladungsfähige Anschrift)
- [x] Datenschutzerklärung inkl. GitHub-Pages-Hosting
- [x] Fonts self-hosted (assets/fonts + css/fonts.css, DSGVO erledigt)
- [x] Englische Fassung unter /en/ mit hreflang

Offen:
- [ ] Telefonnummer und USt-IdNr im Impressum
- [ ] Fotos für „Einblicke" auf der Unternehmensseite (bis dahin Platzhalter)
- [ ] `holding/` verweist auf `css/…` statt `../css/…` — dort fehlt das Design
