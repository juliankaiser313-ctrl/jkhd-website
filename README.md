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
pruefung.html      Wie wir das EIGENE System prüfen: 5 Stufen, 6 Belastungsproben mit
                   „Erwartet", 6 Lehren aus eigenen Fehlschlägen, Empfehlung in 5 Schritten
                   (24 Stichpunkte), ehrlicher Schluss (23.09.2026)
sicherheit.html    Sicherheit am EIGENEN System: 7 Sperren am Geldweg, 3 Karten „Spuren",
                   3 Karten „Daten", 5 Karten „Was wir nicht vorweisen können" —
                   kein Mandanten-, NDA- oder Übergabe-Bezug mehr (23.09.2026)
mathematik.html    Verfahren und Formeln, je mit Nutzen und Fallstrick
unternehmen.html   Seit 26.09.2026 ohne altes Angebot: Julians Satz als Überschrift, Profil +
                   Auf einen Blick, „Was JKHD nicht tut", Austausch, 4 Grundsätze (.creed),
                   Gründer, Kontakt; die leeren Bildkästen („Einblicke") sind weg
kontakt.html       Drei Kacheln (kontakt@ / service@ / info@) + Partnerzugang (siehe unten)
partnerzugang.html Partnerzugang als eigene Seite (26.09.2026): wofür, Mindestvoraussetzungen,
                   unten derselbe Anmeldekasten; im Menü hinter dem Knopf (breit) bzw. in
                   der Liste (Handy), in Fußzeile und Sitemap
partner.html       Partnerseite: nur nach Anmeldung, noindex, nicht im Menü (siehe unten)
impressum.html     Impressum (§ 5 DDG)
datenschutz.html   Datenschutzerklärung
404.html           Fehlerseite (zweisprachig)
ueber/leistungen/projekte/technologie/ansatz.html   Weiterleitungen auf die neuen Seiten
holding/           Eigenständige Holding-Variante, aus der Navigation nicht verlinkt

en/index.html      Englische Fassung der Startseite
en/system.html     "How a system is built"
en/testing.html    "How we test our own system"
en/security.html   "There are no client files here"
en/mathematics.html
en/company.html
en/contact.html
en/partner-access.html
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
  dass sie ohne Zertifikat haltbar sind: nichts zusagen, was nicht im eigenen
  Quelltext belegt ist, keine behaupteten Audits, und ein eigener Abschnitt
  „Was wir nicht vorweisen können" — dort steht seit dem 23.09.2026 auch, dass
  keine der Sperren je echtes Geld gehalten hat. Zweite Linie: **Prinzip statt
  Bauplan.** Keine Pfade, keine Fristen, keine Code-Formate, keine
  Ablagearten, keine Kopfzahl, kein Meldeweg, kein Betriebsort — eine
  Gegenprüfung aus der Sicht eines Angreifers hat am 23.09. genau dort vier
  Stellen gefunden. Beim Ändern diese Linie halten — eine Zusage zu viel fällt
  im Prüffall auf die Seite zurück. Sprache und
  Darstellung kosten dort keine Breite mehr, die liegen im Feld. Der Block ist
  von den übrigen 940-px-Umbrüchen getrennt.
- **Seitenpaare:** `pruefung.html ↔ en/testing.html`,
  `sicherheit.html ↔ en/security.html`,
  `mathematik.html ↔ en/mathematics.html`,
  `unternehmen.html ↔ en/company.html`, `kontakt.html ↔ en/contact.html`,
  `partnerzugang.html ↔ en/partner-access.html`,
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
- **Die KI der Fragen-Blase kennt Texte dieser Website wörtlich** (Startseite,
  Was wir machen, System, Unternehmen, Partnerzugang, Kontakt, Impressum — je
  DE/EN — und die festen Antworten in `js/main.js`). Nach Textänderungen dort das
  Wissen im Repo JKHD-Partner-Server neu bauen (`pruefung/wissen_bauen.py`, siehe
  dessen README, Abschnitt „KI-Fragen") und `api/ki_wissen.md` hochladen — sonst
  antwortet die KI mit dem alten Stand.

## Partnerzugang — Server läuft unter https://api.jkhd.de

Der Kasten „Nur für Partner" steht auf `partnerzugang.html` /
`en/partner-access.html` (eigene Seite seit 26.09.2026, unten nach
„Mindestvoraussetzungen") und weiter auf `kontakt.html` / `en/contact.html` —
beide Male dasselbe Markup, `js/main.js` bedient, was die Seite trägt. Wer schon
angemeldet ist, sieht statt „Anmelden" den Knopf „Zur Partnerseite". Der Kasten (ein
Knopf „Anmelden", in Tinte gesetzt) führt den Ablauf **E-Mail eingeben → Code
per E-Mail → Code eingeben → weiter auf `partner.html`**. Seit 25.09.2026 steht
im selben Formular ein freiwilliges Passwortfeld: leer = genau der Code-Weg von
vorher, gefüllt = `POST {api}/passwort_login`. „Passwort vergessen?" ist der
Code-Weg mit einem Merker (Modulvariable, kein Speicher), danach öffnet
`partner.html#neues-passwort` die Passwortkarte oben. Festlegen, ändern und
entfernen geschieht auf der Partnerseite (Karte „Anmeldung"); ohne das bisherige
Passwort nur in den ersten 15 Minuten nach einer Anmeldung per Code.
`partnerzugang.html#partner-passwort` öffnet den Kasten mit gesetztem Merker (dorthin
führt „Abmelden und Code anfordern" von der Partnerseite). Die Partnerseite
(`partner.html` / `en/partner.html`, `noindex`, nicht im Menü und nicht in der
Sitemap) zeigt die hinterlegten Daten und darunter in einem roten Kasten die
**VIP-E-Mail-Adresse** — verdeckt, bis der Partner sie aufdeckt. Die Adresse
steht in keiner Datei dieser Website; sie kommt nur vom Server an Angemeldete.
Dazwischen der **VIP-Bereich „Zugänge"**: der Katalog aus `api-daten/vip.json`
des Servers (je Modul `id`, `name`, `kurz`, `kurz_en`, `neu`, `status`
`anfrage`|`bald`, optional `link`), je Partner die `freigaben` aus
`partner.json`. Freigeschaltete Module zeigen „Öffnen" (wenn `link` gesetzt),
anforderbare ein Häkchen, `bald` nur den Status (`bald` schlägt eine Freigabe);
„Auswahl anfordern" öffnet per `mailto:` das E-Mail-Programm mit den gewählten
Modulen an die VIP-Adresse. Der Server gibt `link` nur für freigeschaltete
Module heraus.
Frontend: `js/main.js`, Abschnitte „Partnerzugang" und „Partnerseite".
Daneben „Anfrage": ein fester Fragebogen (Name, E-Mail, Rolle, Anliegen,
Profil, Nachricht — `FRAGEN()` in `js/main.js`). **Seit 24.09.2026 geht er an
den Server** (`POST {api}/anfrage`): der leitet die Anfrage an `service@`
weiter und schickt dem Einsender sofort eine Eingangsbestätigung mit der
Zusage von 24 Stunden (Julians Wunsch; Absender `service@`). Die Auswahlfelder
senden **stabile Schlüssel** (`quant|trader|firma|anderes` bzw.
`partnerschaft|austausch|zugang|anderes`), nicht die übersetzten
Beschriftungen — sonst könnte die Prüfung auf der englischen Seite nie
greifen. Der alte Weg über das E-Mail-Programm ist der **Rückfall**: ohne
`data-api`, bei Netzfehler, Zeitüberschreitung (12 s) oder `502` öffnet sich
wie früher das Mailprogramm mit dem fertigen Text, dazu ein „Text
kopieren"-Knopf — so verliert niemand, was er geschrieben hat. Die
Erfolgskachel behält den Kopier-Knopf und sagt ehrlich, ob eine Bestätigung
rausgegangen ist (der Server meldet `{"bestaetigung": true|false}`).
Der Server dazu liegt im eigenen (nicht veröffentlichten) Repo
`JKHD-Partner-Server` (PHP auf IONOS Webhosting) und ist als
`https://api.jkhd.de` angebunden (`data-api` am `.partner`-Element, seit
20.09.2026). Steht `data-api` leer, wird nichts gesendet und der Kasten sagt
das dem Besucher offen.

Schnittstelle (so gebaut, Stand 25.09.2026 — Einzelheiten im README des Server-Repos):

- `POST {api}/code` mit `{"email": "…"}` — prüft die Adresse gegen die
  Partnerliste, erzeugt einen kurzlebigen Code (z. B. 6 Ziffern, 10 Minuten,
  einmal gültig), schickt ihn von der Partner-Adresse und antwortet mit `204` —
  auch für unbekannte Adressen, damit niemand ausprobieren kann, wer Partner
  ist. Nur wenn die Grenze des eigenen Netzes voll ist: `429 {"grenze": "netz"}`
  (hängt nicht an der Adresse; die Seite sagt dann, dass auch kein Code käme).
- `POST {api}/login` mit `{"email": "…", "code": "…"}` — bei gültigem Code
  `200` mit `{"token": "…"}` (64 Hex-Zeichen, eine Stunde gültig), sonst `401`;
  `429`, wenn die IP-Grenze erreicht ist. Das Zeichen liegt im Browser nur im
  `sessionStorage` (`jkhd-partner`).
- `POST {api}/passwort_login` mit `{"email": "…", "passwort": "…"}` — `200`
  `{"token"}`; `401 {"fehler": "falsch"}` für unbekannte Adresse, Partner ohne
  Passwort und falsches Passwort gleichermaßen, `401 {"fehler": "bestaetigen"}`
  wenn die letzte Code-Anmeldung über 180 Tage her ist; `429 {"grenze": "netz" |
  "konto" | "last"}`. Außer bei `netz` bietet die Seite immer „Code per E-Mail
  schicken" an.
- `POST {api}/daten` mit `{"token": "…"}` — `200` mit `{"name": "…",
  "email": "…", "felder": [{"label": "…", "wert": "…"}, …], "vip": "…",
  "module": [...], "freigaben": ["…"], "dateien": [...], "ansicht": {...},
  "passwort": {"gesetzt", "seit", "ohne_altes_bis"} | null}`, sonst `401`; `429`, wenn unbekannte Zeichen die
  IP-Grenze erreicht haben. Was in `felder` und `freigaben` steht, pflegt
  Julian je Partner; `module` ist der Katalog aus `vip.json`.
- `POST {api}/passwort_setzen` mit `{"token", "passwort", "altes_passwort"?}` —
  `200 {"ok", "passwort"}`; `400 {"fehler": zu_kurz|zu_lang|zu_einfach|
  gleich_adresse|ungueltig}`, `403 {"fehler": neu_anmelden|altes_passwort_noetig|
  altes_passwort_falsch}`, `409 {"fehler": "geaendert"}`, `429 {"grenze":
  aenderung|konto|last|netz}`, `401`. `POST {api}/passwort_entfernen` mit
  `{"token", "altes_passwort"?}` — `200 {"entfernt", "passwort"}`, Fehler ebenso.
  Die Passwortregeln (10–128 Zeichen nach NFC, nicht nur Leerraum, nicht ein
  Zeichen wiederholt, nicht in der kleinen Liste, nicht die eigene Adresse)
  prüft `passwortRegel()` in `js/main.js` genau wie der Server.
- `POST {api}/abmelden` mit `{"token": "…"}` — `204`, Zeichen ist weg
  (`429` wie bei /daten).
- `POST {api}/anfrage` mit `{name, email, rolle, anliegen, profil, nachricht,
  sprache}` — `200` mit `{"ok": true, "bestaetigung": true|false}`, `400` bei
  fehlender Angabe, `429` wenn eine der vier Bremsen greift (Netz, Adresse,
  Mail-Domain, Gesamt), `403` ohne erlaubten `Origin`, `502` wenn die Anfrage
  nicht rausgeht. **Anders als /code antwortet diese Route ehrlich** — es gibt
  hier kein Geheimnis zu schützen, jeder darf anfragen. Nur die Bestätigung
  fällt still aus, wenn dieselbe Adresse in derselben Stunde schon eine
  bekommen hat (`bestaetigung: false`); sonst wäre die Antwort ein Messgerät
  für jemanden, der fremde Postfächer zumüllen will.
- CORS für `https://www.jkhd.de`, `https://jkhd.de` und die lokale Vorschau
  `http://localhost:8090`, sonst nichts.

Partner pflegen = `api-daten/partner.json` auf dem Webspace (siehe README des
Server-Repos). Die Datenschutzerklärung beschreibt die Verarbeitung im
Abschnitt „Partnerzugang".

## Lokal ansehen

```
python -m http.server 8090 --directory "C:\Quant Arbeit\JKHD-Website"
```

Dann im Browser: http://localhost:8090

## Live seit 20.09.2026 — und der Offline-Schalter

**Stand: die Seite ist live** (`path: .` im Workflow). Vom 03.09. bis 20.09.2026 stand
unter `www.jkhd.de` nur ein Platzhalter; der Mechanismus bleibt im Repository,
damit die Seite jederzeit wieder abgeschaltet werden kann.

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

**Wieder offline:** im Workflow `path: .` auf `path: ./offline` setzen und davor
diesen Schritt einsetzen, dann auf `main` pushen:

```yaml
      - name: Platzhalter vervollstaendigen
        run: |
          cp CNAME       offline/CNAME          # Domain bleibt am Repository
          cp favicon.svg offline/favicon.svg
          cp offline/index.html offline/404.html  # jede Adresse zeigt den Platzhalter
```

**Wieder live:** den Schritt löschen, `path: .` — das ist alles. Der Ordner
`offline/` bleibt liegen (wird mit ausgeliefert, ist über keinen Link erreichbar
und trägt `noindex`).

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
- [ ] USt-IdNr. bzw. Wirtschafts-Identifikationsnummer (§ 139c AO) ins Impressum, SOBALD eine
      zugeteilt ist (§ 5 Abs. 1 Nr. 6 DDG) — Julian prüft ELSTER-Postfach/BZSt-Post; die W-IdNr.
      kommt ohne Antrag. Zweiter Kontaktweg steht seit 26.09.2026 (Anfrageformular)
- [ ] Fotos für die Unternehmensseite — der Platzhalter-Abschnitt „Einblicke" ist seit 26.09.2026 weg
- [ ] `holding/` verweist auf `css/…` statt `../css/…` — dort fehlt das Design

## Belege zur Datenschutzerklärung: KI-Fragen und Zugriffsprotokolle (26.09.2026)

Stand aus den früheren HTML-Kommentaren von `datenschutz.html` / `en/privacy.html` — hier statt
im Quelltext, weil GitHub Pages Kommentare öffentlich mit ausliefert. **Offen:** im Verzeichnis
`logs/` des IONOS-Webspace prüfen, ob die IP-Adressen dort wirklich gekürzt sind und wie weit die
Protokolle zurückreichen (der Text sagt „Laut IONOS“ und stützt sich auf deren Hilfeseite).

```
<!-- Zugriffsprotokolle von api.jkhd.de (Zweig ki-chat, 26.09.2026). Die
           Angaben stammen aus der IONOS-Hilfe „Datenverarbeitung durch Webhosting
           Produkte" (https://www.ionos.com/help/data-protection/data-processing-of-website-visitors-of-your-ionos-product/data-processing-by-web-hosting-products/,
           abgerufen 26.09.2026), nicht aus einer eigenen Messung. Vor dem
           Livegang im Verzeichnis logs/ des Webspace nachsehen, ob die
           IP-Adressen dort wirklich gekuerzt sind und wie weit die Protokolle
           zurueckreichen; weicht etwas ab, diesen Absatz und en/privacy.html
           anpassen. -->
```

```
<!-- Fragen an die KI (Stand 26.09.2026). Anbieter: OVHcloud AI Endpoints.
           Belege, alle abgerufen am 26.09.2026:
           - OVH GmbH, Oskar-Jaeger-Str. 173/K6, 50825 Koeln: AGB Stand 17.01.2025,
             Abschnitt „Vertragsgegenstand" und Widerrufsformular in 12.4
             (https://contract.eu.ovhapis.com/1.0/pdf/contrat_genServices-de.pdf).
           - Auftragsverarbeitung: AVV Version 17.10.2025
             (https://contract.eu.ovhapis.com/1.0/pdf/OVH_Data_Protection_Agreement-de.pdf),
             nach den AGB Teil jedes Vertrags.
           - Vertragsbedingungen: Besondere Vertragsbedingungen Public Cloud,
             Stand 26.08.2026, Anhang 10
             (https://contract.eu.ovhapis.com/1.0/pdf/Conditions_particulieres_OVH_Stack-de.pdf).
             Nr. 5 im Wortlaut: „OVHcloud hat keine Kenntnis von den Inputs und
             Outputs und verwendet diese in keiner Weise weiter. OVHcloud führt
             kein Backup der Inputs oder Outputs durch." Nr. 2 im Wortlaut:
             „Der AI Endpoints Dienst beinhaltet keine Backups oder Storages,
             auch nicht für kurze Zeit". Beides gilt nicht fuer die
             „AI Endpoint Batch API", die der Server nicht nutzt.
           - Weder gespeichert noch weitergegeben, Standort Gravelines:
             https://docs.ovhcloud.com/en/guides/public-cloud/ai-machine-learning/ai-endpoints-capabilities
             („Data is not stored or shared during or after model use";
             „Our infrastructure, located in Gravelines, France").
           - Nur Abrechnungsdaten, nie Training:
             https://www.ovhcloud.com/de/public-cloud/ai-endpoints/
           Weitere Hinweise: README des Repos JKHD-Partner-Server, Abschnitt
           „KI-Fragen". Jeder Satz hier haengt an api/index.php (Aktion frage,
           Repo JKHD-Partner-Server) und js/main.js -- wer dort etwas aendert,
           prueft diesen Abschnitt und en/privacy.html mit. -->
```
