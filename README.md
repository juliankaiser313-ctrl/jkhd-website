# JKHD-Website — jkhd.de

Statische Webseite für JKHD (HTML/CSS/JS, keine Build-Tools nötig).
Design: monochrom Schwarz/Weiß, Serifen-Headlines (Playfair Display),
Markenzeichen (drei Balken) statisch im Hintergrund, davor ein rohes
Time-&-Sales-Tape (Tick-Feed: Zeit/Preis/Volumen/Seite) als „lebendiger"
Daten-Hintergrund im Hero — Rohdaten statt Chart.

## Struktur

```
index.html        Startseite (Hero mit Rohdaten-Tape + Live-Status, Ticker, Was-ist-JKHD, Pipeline)
system.html       Das System im Detail (5 Pipeline-Schritte + Der Bot im Betrieb)
leistungen.html   Leistungen (3 Säulen)
projekte.html     Projekt-Showcase (u. a. Multi-Prop Alpha System)
ueber.html        Über JKHD
kontakt.html      Kontakt (elite@jkhd.de)
impressum.html    Impressum  — TODO vor Livegang ausfüllen!
datenschutz.html  Datenschutz — TODO vor Livegang ausfüllen!
404.html          Fehlerseite (beim Hoster als 404-Seite eintragen)
robots.txt        Suchmaschinen-Regeln (Sitemap-Verweis auf jkhd.de)
sitemap.xml       Sitemap für Google (URLs zeigen auf jkhd.de)
assets/og-image.png  Vorschaubild für Link-Teilen (WhatsApp/LinkedIn etc.)
css/style.css     Gesamtes Design (Farben oben als CSS-Variablen)
js/main.js        Mobile-Nav, Rohdaten-Tape, Tiefen-Raster, Scroll-Effekte
favicon.svg       Browser-Tab-Icon (drei Balken)
```

## Lokal ansehen

```
python -m http.server 8090 --directory "C:\Quant Arbeit\JKHD-Website"
```

Dann im Browser: http://localhost:8090

## Livegang: GitHub Pages + IONOS-Domain (jkhd.de)

Deploy-Weg (vorbereitet, CNAME-Datei zeigt auf www.jkhd.de):
1. GitHub-Repo erstellen (public) und pushen: `gh repo create jkhd-website --public --source . --push`
2. Pages aktivieren: Branch `master`, Ordner `/ (root)` — oder `gh api`
3. Bei IONOS (Domains → jkhd.de → DNS) diese Einträge setzen:
   - `A`-Records für `@` (jkhd.de): 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - `CNAME` für `www`: `<github-benutzername>.github.io.`
4. In den Repo-Settings unter Pages: Custom Domain `www.jkhd.de` + „Enforce HTTPS" (Zertifikat dauert bis ~1 h)

Vor dem Livegang unbedingt:
- [ ] Impressum ausfüllen (Pflicht in Deutschland, § 5 DDG) — Name + ladungsfähige Anschrift
- [ ] Datenschutzerklärung vervollständigen (inkl. GitHub-Pages-Hosting)
- [x] Fonts self-hosted (assets/fonts + css/fonts.css, DSGVO erledigt)
- [ ] Platzhalter-Texte (mit `TODO` markiert) ersetzen
- [x] E-Mail-Postfach elite@jkhd.de eingerichtet
