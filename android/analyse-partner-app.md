# Analyse der Partner-App für die Android-App

*Bericht vom 22.10.2026 für die Cloud-Sitzung, die die JKHD-Android-App baut. Nur Analyse: an App und
Server wurde nichts geändert, nichts hochgeladen. Alle Angaben stammen aus dem Quelltext der beiden
Repos (gelesen am 22.10.2026), nicht aus dem Gedächtnis.*

**Pfade:** `Server:` meint das private Repo `JKHD-Partner-Server` (lokal `C:\Quant Arbeit\JKHD-Partner-Server`,
Zweig `master`, letzter Commit `c2375c8` vom 14.10.2026). `Website:` meint dieses Repo (`jkhd-website`).
Zeilennummern beziehen sich auf diesen Stand.

**Geheimnisse:** Dieser Bericht nennt nur Orte, nie Werte. Beispielwerte (Adressen, Kennungen, Hashes)
sind erfunden. Die interne Partner-Kontaktadresse („VIP-Adresse“) steht absichtlich nicht hier; sie
erscheint nur in der Antwort des Servers an angemeldete Partner und darf nie in dieses (öffentliche)
Repo.

---

## Kurzfassung (für Eilige)

1. Die PC-„Partner-App“ ist **kein eigenständiges Programm mit Datenbank**, sondern ein kleiner
   Python-Server auf `127.0.0.1:8095`, der eine HTML-Seite in einem Edge-App-Fenster öffnet. Alles,
   was sie am Server tut, läuft über **genau eine Admin-Schnittstelle: `POST https://api.jkhd.de/verwaltung`**
   mit vier Aktionen (`lesen`, `schreiben`, `datei_hochladen`, `passwort_entfernen`).
2. Diese Schnittstelle ist bereits **für einen nativen Client gebaut**: HMAC-SHA256-Unterschrift über
   den rohen JSON-Text, Zeitstempel (±5 min), Einmal-Wert, **kein Origin-Kopf erlaubt** (ein Browser
   käme damit nie durch, ein natives Android-Programm ohne Origin-Kopf schon).
3. Ein Android-Client kann damit **alles, was die PC-App kann**, ohne eine Zeile am Server zu ändern.
   Einzige Abweichungen: der Spiegel-Commit von `partner.json` ins Server-Repo (entfällt auf dem
   Handy, die PC-App zieht ihn beim nächsten Start nach) und die **Vorschau**, die auf dem Handy
   nachgebaut werden muss (Abschnitt 7).
4. Was Julian zusätzlich entscheiden muss: **wie der Schlüssel aufs Handy kommt** und ob das Handy
   einen **eigenen, einzeln widerrufbaren Schlüssel** bekommt (kleine Server-Erweiterung, Abschnitt 7).
5. Funktionen, die die PC-App **nicht** hat (VIP-Katalog pflegen, Anfragen lesen, Protokolle,
   KI-Fragen, Mails schreiben) brauchen neue Server-Aktionen; Vorschläge mit Aufwand in Abschnitt 7.

---

## 1. Überblick: Repos, Aufbau, Technik

### 1.1 Das Server-Repo `JKHD-Partner-Server` (privat)

```
README.md                      787 Zeilen, die Betriebsanleitung (Kernaussagen unten)
.gitignore / .gitattributes    alles Geheime und alle Laufzeitdaten sind ausgeschlossen (s. 3.4)
api/                           <- Webverzeichnis der Subdomain api.jkhd.de
  index.php                    DER GANZE SERVER in einer Datei, 4355 Zeilen, PHP 8.4
  .htaccess                    http->https (301), Rewrites /code … /frage -> index.php?aktion=…,
                               HSTS, keine .json/.jsonl/.tmp/.bak/.md/.log/.lock ausliefern
  ki_wissen.md                 Wissen für die KI-Fragen (/frage); ohne diese Datei ist /frage 503
api-daten/                     <- liegt NEBEN dem Webverzeichnis, nie erreichbar (.htaccess: Require all denied)
  partner.json                 die Partnerliste (Spiegel der Serverfassung, s. 2.6)
  vip.json                     der Modul-Katalog (pflegt Julian von Hand)
  aufraeumen.php               täglicher Cronjob (IONOS Cronjobs, nachts, /usr/bin/php8.4 …)
  smtp.beispiel.json           Vorlage für smtp.json (die echte Datei liegt nur auf dem Server)
verwaltung/                    <- DIE PARTNER-APP (PC)
  partnerverwaltung.py         703 Zeilen Python 3, nur Standardbibliothek
  seite.html                   877 Zeilen HTML/CSS/JS, die Oberfläche
  Partnerverwaltung.vbs        Starter für den Desktop-Knopf
  probe_server.py              Probe gegen den ECHTEN Server nach jedem Hochladen
  test_partnerverwaltung.py    56 Tests gegen einen Übungsserver, der /verwaltung nachbildet
  jkhd.ico                     Fenstersymbol
  geheim/                      gitignored: Schlüssel (DPAPI) und Sitzungszeichen
  edge_profil/                 gitignored: eigenes Edge-Profil des App-Fensters
pruefung/                      Ende-zu-Ende-Prüfung auf dem echten Server gegen eine Wegwerf-Kopie
  server_e2e.py, pruef_vorlage.php, pruef_mock_vorlage.php, ki_faelle.py, ki_filter_nachbau.py,
  wissen_bauen.py, wissen_pruefen.py
```

**Technik des Servers:** PHP 8.4 auf IONOS Webhosting Plus, als `cgi-fcgi` (deshalb der
Versand-Umweg in 4.5). **Keine Frameworks, kein Composer, keine Datenbank** – alles sind
JSON-Dateien unter `api-daten/`, geschrieben atomar (Tempdatei + `rename`) und unter `flock`-Sperren
(`aendere()`, `Server: api/index.php:837-882`). Genutzte PHP-Bausteine: `hash_hmac`, `password_hash`
mit Argon2id, `Normalizer` (intl), `stream_socket_client` für SMTP und für die Übergabe an sich
selbst, cURL für die KI. Die Subdomain `api.jkhd.de` zeigt auf `/api`; `api-daten` liegt auf
derselben Ebene wie `api` (Explorer-Liste: `api`, `api-daten`, `public`).

**Wie der Server auf IONOS kommt – es gibt KEIN Deploy-Skript.** Hochgeladen wird von Hand:
- über den **Webspace Explorer** im IONOS-Kundenbereich (Browser; die Seite hat eine interne
  Schnittstelle `PUT …/explorer/core?path=/api/index.php&overwrite=true`, Rezept im
  `Server: README.md`, Abschnitt „Hochladen ohne SFTP“), zurückgelesen per `GET` und SHA-256-Vergleich;
- oder per **SFTP** mit einem im Kundenbereich angelegten SFTP-Benutzer (Abschnitt „Hochladen per SFTP“).
- Regel aus dem README: **nie `api-daten/` als ganzen Ordner hochladen** (dort liegen Passwörter,
  Sitzungen, Zähler, die es nur auf dem Server gibt) und **`partner.json` nie mehr aus dem Repo
  hochladen** – der Server ist die Wahrheit, die App spiegelt nur zurück.

**Technik der Partner-App:** Python 3 (gestartet mit `pyw -3`, also ohne Konsole), nur
Standardbibliothek (`http.server.ThreadingHTTPServer`, `urllib`, `hmac`, `ctypes` für Windows-DPAPI).
Die Oberfläche ist eine einzige HTML-Seite, geöffnet in **Microsoft Edge im `--app`-Modus** mit eigenem
Profilordner. Kein Tkinter, kein Electron, keine PHP-Adminseite.

### 1.2 Das Website-Repo (dieses Repo)

- `Website: js/main.js`, Block „Partnerzugang“ ab Zeile 811 (Anmeldekasten: Code, Passwort, Anfrage)
  und Block „Partnerseite“ ab Zeile 1423 (`partner.html`: Daten, Module, Dateien, Passwortkarte,
  Vorschau-Schalter).
- `Website: partner.html` (167 Zeilen; der Inhalt wird von `main.js` nach der Anmeldung gerendert,
  `.partner-seite[data-api="https://api.jkhd.de"]`), `partnerzugang.html`, `kontakt.html`.
- `Website: README.md`, Abschnitt „Partnerzugang – Server läuft unter https://api.jkhd.de“ ab Zeile 245:
  die Partner-Schnittstelle aus Sicht der Website.
- `Website: datenschutz.html`, Abschnitt „Partnerzugang“ ab Zeile 139 (relevant für 6.4).

### 1.3 Kernaussagen des Server-README

- **Partnerzugang** = Code per E-Mail (6 Ziffern, 10 min, einmal, 5 Fehlversuche) oder freiwilliges
  Passwort (Argon2id); Anmeldezeichen 64 Hex, eine Stunde, nur als Hash gespeichert.
- **/code antwortet immer 204** und nie schneller als 0,7 s, damit niemand erfährt, wer Partner ist.
- **Gezählt wird das Netz** (IPv6 auf /64 gefaltet), nicht die Adresse.
- **/verwaltung ist der einzige Weg**, auf dem `partner.json` von außen geändert wird; HMAC-Schlüssel
  `api-daten/verwaltung.key` (Server) = `verwaltung/geheim/verwaltung.key.dpapi` (Laptop). Falsch
  unterschrieben, zu alt, wiederholt oder ohne Schlüsseldatei: **404** wie eine unbekannte Adresse.
- **Spiegel:** Nach jedem Lesen/Speichern schreibt die App die Serverfassung nach
  `api-daten/partner.json` und committet NUR diese Datei. partner.json nie mehr hochladen.
- **Dateien** je Partner (15 MB, feste Typliste) liegen als `api-daten/dateien/<32 Hex>` ohne Namen und
  Endung; Partner laden über `POST /datei` herunter, immer als Download.
- **Ansicht** je Partner: Begrüßung und welche Bereiche die Partnerseite zeigt.
- **Vorschau** in der App zeigt die ECHTE `partner.html` aus dem Website-Repo, Daten per `postMessage`.
- **Passwort:** nur auf dem Server (`passwoerter.json`), nie in partner.json; Festlegen ohne altes
  Passwort nur 15 min nach einer Code-Anmeldung; alle 180 Tage einmal Code; jede Änderung → Mail.
- **Versand** über das Postfach aus `smtp.json` (SMTP STARTTLS); PHP `mail()` kommt vom Webspace nicht an.
- **Protokolle** enthalten nie Codes, Passwörter, Klartext-Adressen oder SMTP-Zeilen.
- **Cron `aufraeumen.php`:** Anfragen > 30 Tage, Verlauf > 30 Tage, Zähler > 1 h, abgelaufene Codes/
  Sitzungen/Einmal-Werte, verwaiste Passwörter und Dateien, Marken der Bestenliste.
- Daneben zwei Wege, die mit der Partner-App nichts zu tun haben: **/frage** (KI-Fragen der Website
  über OVHcloud AI Endpoints, mit Sperren und Budget) und die **Bestenliste der Simulation**.
- **E2E-Prüfung** (`pruefung/`): Wegwerf-Kopie des Servers mit eigenem Datenordner `api-daten/pruef-<kennung>/`,
  Testpartnern `@example.com` und Mails in eine Datei; Phase „Verwaltung“ prüft `lesen`,
  `passwort_entfernen`, `schreiben` (`Server: pruefung/server_e2e.py:422-449`).

---

## 2. Die Partner-App (PC): alle Bildschirme und Funktionen

### 2.1 Wo sie liegt, wie sie startet

| Was | Wo |
|---|---|
| Programm | `Server: verwaltung/partnerverwaltung.py` |
| Oberfläche | `Server: verwaltung/seite.html` |
| Starter | `Server: verwaltung/Partnerverwaltung.vbs` (`shell.Run "pyw -3 …partnerverwaltung.py"`, unsichtbar) |
| Desktop-Knopf | `OneDrive\Desktop\JKHD Partner.lnk` → die VBS |
| Lokaler Port | `127.0.0.1:8095` (`PORT`, Zeile 71; Umgebungsvariable `JKHD_VERWALTUNG_PORT`), exklusiv gebunden (`LokalerServer`, Zeile 570) |
| Server-Adresse | `API = "https://api.jkhd.de"` (Zeile 70; `JKHD_API` überschreibbar – so laufen die Tests gegen den Übungsserver) |
| Website für die Vorschau | `WEBSITE = ../JKHD-Website` neben dem Server-Repo (Zeile 65; `JKHD_WEBSITE` überschreibbar) |
| Protokoll | `Server: verwaltung/partnerverwaltung.log` (ohne Adressen; Rotation bei 200 kB, Zeile 85) |

Ablauf von `main()` (Zeile 657): Schlüssel laden (und beim ersten Mal von Klartext in DPAPI umwandeln,
Zeile 140), Sitzungszeichen laden (`geheim/zeichen.txt`, Zeile 174; bleibt über Neustarts gleich),
prüfen, ob die App schon läuft (`GET /gesund` → `{"app": "jkhd-partner"}`, Zeile 624; dann nur ein
neues Fenster), sonst Server binden, Wächter-Thread starten, Edge-Fenster öffnen
(`msedge --app=http://127.0.0.1:8095/#t=<Zeichen> --user-data-dir=verwaltung/edge_profil`, Zeile 587).
Die Seite schickt alle 20 s ein Lebenszeichen (`POST /api/lebt`, `seite.html:271`); bleibt es
**15 min** aus (`RUHE_SEK`, Zeile 76; 180 s für das erste), beendet sich das Programm (Wächter, Zeile
636; erkennt Laptop-Schlaf und beginnt die Frist neu).

**Schutz der lokalen Seite** (`mache_handler`, Zeile 413; `_host_ok` 446, `_api_ok` 450): `Host` muss `127.0.0.1:8095` sein
(gegen DNS-Rebinding), ein `Origin`-Kopf darf nur der eigene sein, jede `/api/…`-Anfrage trägt den Kopf
`X-Sitzung` mit dem Zeichen aus der Adresse (`seite.html:245-266`); strikte CSP, `X-Frame-Options: DENY`
für die Hauptseite. Die Seite selbst kennt den HMAC-Schlüssel nicht – nur das Python-Programm.

**Lokale Routen (Seite ↔ Python-Programm):**

| Route | Zweck | ruft am Server |
|---|---|---|
| `GET /` | liefert `seite.html` | – |
| `GET /gesund` | Erkennung eines zweiten Starts | – |
| `GET /api/stand` | Partnerliste, Fassung, Katalog, Passwortstatus | `/verwaltung lesen` |
| `POST /api/lebt` | Lebenszeichen | – |
| `POST /api/speichern {basis, partner}` | ganze Liste speichern | `/verwaltung schreiben`, danach `lesen` |
| `POST /api/datei_hochladen {name, inhalt}` | Datei (Base64) sofort hochladen | `/verwaltung datei_hochladen` |
| `POST /api/passwort_entfernen {email}` | Passwort eines Partners sofort entfernen | `/verwaltung passwort_entfernen` |
| `GET /vorschau` | die echte `partner.html` der Website, umgebaut für die Vorschau | – |
| `GET /website/<pfad>` | nur css/js/Schriften/Bilder aus dem Website-Ordner | – |

### 2.2 Der eine Bildschirm

Es gibt **ein Fenster** (1340×900) mit festem Gerippe (`seite.html`, ab Zeile 161):

- **Kopfzeile:** Status-Pille („Verbinde …“, „Verbunden · Stand 19:42“, „App läuft nicht – Desktop-Knopf
  drücken“), Knöpfe **Rollen** und **Neu laden**.
- **Linke Spalte:** Suchfeld (Name, Adresse, Rolle), Knopf **+ Partner hinzufügen**, darunter die
  Partnerliste (Name, Adresse, Rolle · Modulzahl; gelber Punkt = ungespeichert).
- **Rechte Spalte, Editor für den gewählten Partner** (`zeichneBereich`, Zeile 566), von oben:
  Titel + Satz zur Anmeldeart, roter Hinweiskasten mit Beanstandungen, dann die Blöcke
  1. **Person:** E-Mail-Adresse (Anmeldung), Name, Rolle (Auswahl), Passwort-Zeile (Status + „Passwort entfernen“)
  2. **Module:** Häkchen je Modul aus `vip.json` (bei Rolle „alle Module“ alle gesetzt und gesperrt;
     Marke „angekündigt“ bei `status: bald`; fremde Freigaben, die der Katalog nicht kennt, werden
     sichtbar und nur bewusst entfernt)
  3. **Angaben – sieht der Partner nach der Anmeldung:** Zeilen Bezeichnung/Wert, „+ Angabe“; Vorschläge
     aus der `<datalist>` (Zeile 237): Geboren, Firma, Ansprechpartner, Zweck, Angelegt, Partner seit,
     Status, Telefon
  4. **Dateien – sieht der Partner:** Liste (Typ-Marke, Name, Größe · Datum, Beschreibung), „+ Datei hochladen“
  5. **Ansicht – so sieht der Partner seine Seite:** Begrüßungstext, vier Häkchen (Ihre Daten, Dateien,
     Zugänge/Module, VIP-Adresse), Knöpfe **Vorschau** und **Diese Ansicht für alle Partner übernehmen**
  6. **Interne Notiz – sieht nur JKHD**
  7. Fußzeile: „Bisherige Adresse: …“ (bei Umbenennung) und **Partner entfernen**
- **Speicherleiste** unten (erscheint bei Änderungen): „n ungespeicherte Änderungen“, **Verwerfen**,
  **Speichern …** (gesperrt, solange `pruefen()` Fehler meldet oder ein Upload läuft).
- **Dialoge:** „Änderungen speichern?“ mit vollständiger Änderungsliste (Zeile 198), „Rollen“ (208),
  „Vorschau“ als großer Dialog mit `<iframe>` (219), allgemeine Rückfrage (228).
- **Startbildschirm** „Die Partnerliste wird vom Server geholt …“ mit „Nochmal versuchen“ bei Fehlern.

Die Seite hält **alles im Speicher** (`S`, Zeile 275): Fassung (`version`), Katalog, Einträge,
Passwortstatus (`S.passwoerter`, nie Teil der Liste), Rollen. Nichts wird lokal persistiert außer dem
Sitzungszeichen in `sessionStorage`; geschlossen = weg (`beforeunload` warnt).

### 2.3 Funktionen und was technisch passiert

**(a) Laden** (`laden()`, Zeile 471) → `GET /api/stand` → Python `App.stand()` (Zeile 371) →
`Verbindung.lesen()` (Zeile 267) → `POST /verwaltung {aktion: "lesen"}`. Antwort: `partner_text`
(die Datei als Text), `version` (SHA-256 des Texts; die App rechnet nach und lehnt bei Abweichung ab),
`module` (id, name, status), `katalog` (vollständige Module mit Links, für die Vorschau), `vip`
(die VIP-Adresse), `zeit`, `passwoerter` (`{adresse: {seit, bestaetigt}}`, nur Daten, nie Hashes).
Danach **Spiegel** (2.6). Die Seite zerlegt die Einträge: die Angabe mit Label „Rolle“ wird aus
`felder` herausgezogen und als Rolle geführt (`ausServer`, Zeile 331).

**(b) Partner anlegen** („+ Partner hinzufügen“, Zeile 836): neuer Eintrag mit leerer Adresse,
Rolle „Partner“ (falls vorhanden) und automatisch der Angabe **„Angelegt“ = heutiges Datum**
(TT.MM.JJJJ). Felder genau:

| Feld | Regel in der Seite (`pruefen()`, Zeile 443) | Regel am Server (`verwaltung_pruefe`, `index.php:1795`) |
|---|---|---|
| E-Mail-Adresse | Pflicht, ASCII wie PHP `filter_var`, ≤ 254, eindeutig nach `schluessel()` (Gmail: ohne Punkte/+Zusatz) | gleich; ist der Schlüssel des Eintrags in partner.json |
| Name | Pflicht, ≤ 120, keine Steuerzeichen | 1–120 Zeichen |
| Rolle | Auswahl aus der Rollenliste; wird beim Bauen als erste Angabe `{"label":"Rolle","wert":…}` gespeichert | ist nur eine Angabe; der Server kennt keine Rolle |
| Module | Häkchen; Rolle mit `alle_module` → beim Speichern ALLE Katalog-IDs (`eintragVon`, Zeile 370) | nur IDs aus vip.json, ≤ 50, keine doppelt |
| Angaben | ≤ 19 (+ Rolle = 20), Label 1–60, Wert ≤ 300, Label „Rolle“ verboten | ≤ 20, Label 1–60, Wert 0–300 |
| Dateien | ≤ 50, Beschreibung ≤ 300 | ≤ 50, jede id muss als Datei existieren |
| Ansicht | Begrüßung ≤ 1000, vier Schalter; nur Abweichungen vom Standard werden gespeichert | gleich (`verwaltung_pruefe_extras`, 1988) |
| Notiz | ≤ 2000, Zeilenumbrüche erlaubt | gleich; `/daten` liefert sie nie aus |

Nichts davon geht vor „Speichern“ zum Server – außer Dateien (d).

**(c) Partner bearbeiten / Adresse ändern / entfernen:** alles im Speicher, wirksam erst mit Speichern.
Eine geänderte Adresse mit anderem `schluessel()` ist für den Server **ein neuer Zugang**: der Server
löscht beim Speichern Passwort und Sitzungen des alten Schlüssels (`konten_aufraeumen`, `index.php:2249`);
die Änderungsliste warnt davor (`aenderungen()`, Zeile 404). „Partner entfernen“ fragt nach; der
Server löscht dessen Passwort/Sitzungen sofort beim Speichern und seine Dateien einen Tag später.

**(d) Dateien hochladen** (`hochladen()`, Zeile 735): Prüfung von Endung (`DATEI_ENDUNGEN`, Zeile 306:
pdf, png, jpg, jpeg, webp, gif, txt, csv, docx, xlsx, pptx, zip, mp4), Größe (≤ 15 MB), Name (≤ 120,
kein `/\`, kein Punkt am Anfang). Dann **sofort** `POST /api/datei_hochladen {name, inhalt: Base64}` →
`Verbindung.datei_hochladen()` (Zeile 291, Zeitlimit 240 s) → `POST /verwaltung
{aktion: "datei_hochladen", name, inhalt}` → Server legt `api-daten/dateien/<32 Hex>` an und antwortet
`{id, groesse}` (`index.php` ab 4322). Die Seite hängt `{id, name, groesse, datum: heute, text: "",
neu: true}` an den Partner; **zugeordnet ist die Datei erst mit „Speichern“** (`dateien` im Eintrag).
Nie gespeicherte Dateien löscht der Server nach einem Tag (`dateien_aufraeumen`, 1971, und Cron).
Dateien entfernen = aus der Liste nehmen + Speichern; der Server `touch`t die Datei beim Speichern und
löscht sie einen Tag später.

**(e) Ansicht** (`zeichneAnsicht`, Zeile 710): Begrüßung und vier Bereiche; „für alle übernehmen“
kopiert die Ansicht in jeden Eintrag. Im Eintrag landen nur Abweichungen (`ansichtStandard`).

**(f) Vorschau** (`vorschau()`, Zeile 783; Python `_vorschau()`, Zeile 532, und `_website()`, Zeile 516): Der Dialog
lädt `<iframe src="/vorschau">`. Python liest `JKHD-Website/partner.html`, setzt `<base href="/website/">`,
ersetzt `data-api="https://api.jkhd.de"` durch `data-api=""` und fügt vor `js/main.js` das Skript
`window.JKHD_VORSCHAU = true` ein; CSS/JS/Schriften kommen über `/website/…` (nur diese Typen,
Pfad wird als Text geprüft, bevor das Dateisystem ihn sieht). In `main.js` (Zeile 1449, 2109–2117)
meldet die Seite `postMessage({typ: "jkhd-vorschau-bereit"})` an `window.parent`; die App-Seite
antwortet mit `postMessage({typ: "jkhd-vorschau", daten})` (Zeile 789), `daten` = genau die Form der
`/daten`-Antwort, gebaut aus dem **aktuellen, auch ungespeicherten** Stand (`vorschauDaten`, Zeile 764).
Herunterladen ist in der Vorschau gesperrt (`main.js:1593`), Abmelden ebenso.

**(g) Speichern** (`speichern()`, Zeile 493): Dialog mit Änderungsliste (neu/geändert/entfernt,
Passwort-Warnungen, Dateien neu/entfernt, Rollenliste) → `POST /api/speichern {basis: S.version,
partner: bauen()}` → Python `App.speichern()` (Zeile 386) → `POST /verwaltung {aktion: "schreiben",
basis, partner}` (ganze Liste!). Server: Prüfung, Sicherung der alten Datei nach
`api-daten/verlauf/`, atomares Schreiben nur, wenn die Datei noch die Fassung `basis` ist, sonst
**409** mit der jetzigen `version` (`index.php` ab 4245). Die App behandelt eine verlorene Antwort
(Status 0 oder 409) so: nachlesen; steht genau unsere Liste auf dem Server, gilt es als gespeichert.
Danach `lesen` + Spiegel. Die Seite zeigt bei 409 „Neu laden“ (ungespeicherte Änderungen gehen
verloren). **Speichern verschickt keine E-Mail.**

**(h) Rollen** (Dialog, Zeile 846ff): Liste `{name, alle_module}` in `partner.json` unter `_rollen`.
Umbenennen zieht die Angabe „Rolle“ bei allen Partnern mit; Löschen setzt sie leer. Solange der Server
keine `_rollen` kennt, schlägt die Seite „Partner – Vollzugang (alle Module)“ und „Partner“ plus die
schon vergebenen Rollen vor; gespeichert wird die Liste erst, wenn sie geändert wurde.

**(i) Passwortstatus und „Passwort entfernen“** (`zeichnePasswort`, Zeile 655; `passwortEntfernen`,
671): Statuszeile „Passwort: festgelegt seit … · zuletzt per Code bestätigt …“ / „Kein Passwort“ /
„Passwortstatus unbekannt“. Der Knopf wirkt **sofort** (nicht erst mit Speichern): `POST
/api/passwort_entfernen {email}` → `/verwaltung {aktion: "passwort_entfernen", email}` → Server
beendet alle Sitzungen des Kontos, löscht den Hash, schickt dem Partner eine Mail („JKHD hat
soeben das Passwort … entfernt“), Antwort `{entfernt: true|false}`.

**(j) Neu laden, Verwerfen, Suche:** nur lokal bzw. erneutes `lesen`.

### 2.4 Was „Mails eintippen“ konkret heißt

In der Partner-App gibt es **keinen Mail-Editor, keine Vorlagen und keinen Versand**. „E-Mail-Adressen
eintippen“ heißt: die **Anmeldeadresse eines Partners** in das Feld „E-Mail-Adresse (Anmeldung)“
eintragen – sie ist der Schlüssel des Eintrags in `partner.json` und das, womit sich der Partner auf
der Website anmeldet. Mails verschickt ausschließlich der Server, automatisch:
Code-Mail (`/code`), Anfrage-Weiterleitung und Eingangsbestätigung (`/anfrage`), Passwort-Hinweise
(festgelegt / geändert / entfernt / von JKHD entfernt). Die App löst davon nur eine aus: die Mail bei
„Passwort entfernen“.

### 2.5 Was die PC-App NICHT kann (für die Parität wichtig)

| Gewünscht im Auftrag | Stand der PC-App |
|---|---|
| VIP-Katalog pflegen | **nein** – `api-daten/vip.json` pflegt Julian von Hand und lädt sie per Explorer hoch; die App liest den Katalog nur |
| Anfragen ansehen | **nein** – Anfragen gehen per Mail an service@ und liegen als `api-daten/anfragen.jsonl` nur auf dem Server |
| KI-Fragen | **nein** – kein Bezug; Schalter/Token liegen nur in `api-daten/ki.json` |
| Protokolle | **nur lokal** `verwaltung/partnerverwaltung.log`; die Serverprotokolle `api-daten/verwaltung.log` und `aufraeumen.log` sind nur per Explorer/SFTP lesbar |
| Mails schreiben | **nein** (s. 2.4) |
| Dateien eines Partners herunterladen/ansehen | **nein** – nur der Partner selbst über `/datei` mit seiner Sitzung; die Admin-Schnittstelle hat keinen Download |

### 2.6 Spiegel und Protokoll

`spiegeln()` (Zeile 314): schreibt `partner_text` byte-gleich nach `Server: api-daten/partner.json`
und ruft `git commit -q -m "Partnerliste aus der Partner-App: n Partner" -- api-daten/partner.json`
(nur Commit, kein Push; ohne Konsolenfenster). So ist git auf dem Laptop der Verlauf. Nichts davon
ist für den Server nötig – ein Handy-Client darf das weglassen.

### 2.7 Prüfung

- `python -m unittest verwaltung.test_partnerverwaltung` – **56 Tests** gegen einen Übungsserver in
  Python, der `/verwaltung` nachbildet (Unterschrift, Zeitfenster, Einmal-Wert, Sperre nur für
  Unsignierte, Origin, Größe, Katalog, 409, Adressprüfung, erlaubte Felder, Passwortstatus, Dateien,
  Vorschau). „Der Übungsserver ist der Vertrag in Python“ (Kopf der Datei).
- `python verwaltung/probe_server.py [--schreiben] [--datei] [--pfad …]` – gegen den echten Server:
  404 ohne Unterschrift, 404 falscher Schlüssel, 408 zu alt, `lesen`, Fassung, Wiederholung 404,
  400 ungültige Liste, 409 veraltete Fassung, optional Upload + Typsperre.

---

## 3. Wie die App Daten auf den Server bringt

### 3.1 Der Weg: eine Admin-API, nichts anderes

- **Nur `POST https://api.jkhd.de/verwaltung`** (Rewrite `Server: api/.htaccess:17` →
  `index.php?aktion=verwaltung`; Code `Server: api/index.php:4139-4353`).
- **Kein FTP/SFTP/WebDAV in der App, keine Bibliothek außer `urllib`, kein Deploy-Skript.**
  Hochgeladen (Code, vip.json) wird nur von Hand (1.1).
- Lokale Zwischenschicht: die Seite spricht nie mit api.jkhd.de, nur das Python-Programm (`Verbindung`,
  Zeile 207). Das ist für Android ohne Bedeutung – ein natives Programm ist beides in einem.

### 3.2 Authentifizierung: HMAC über den rohen Text

Rumpf jeder Anfrage (`Verbindung.anfrage()`, Zeile 233):

```json
{"nutzlast": "{\"zeit\":1761158400,\"einmal\":\"3f9a…(32 hex)\",\"aktion\":\"lesen\"}",
 "unterschrift": "<HMAC-SHA256(schluessel, nutzlast-Text) als 64 hex>"}
```

- `nutzlast` ist ein **String**, der JSON enthält; die Unterschrift gilt über **genau diese Bytes**
  (UTF-8). Der Server verformt nichts vor dem Prüfen (`verwaltung_nutzlast`, 1689). Ein Client muss
  also den String signieren, den er tatsächlich sendet – nicht ein Objekt neu serialisieren.
- `zeit`: Unix-Sekunden (int), darf höchstens **300 s** von der Serveruhr abweichen
  (`VERWALTUNG_ZEITFENSTER_SEK`, Zeile 104). Die App gleicht ihre Uhr über den `Date`-Kopf von
  `GET /ping` aus (`versatz()`, Zeile 217; alle 10 min neu).
- `einmal`: 32 Hex, jeder Wert gilt **einmal** (`verwaltung-einmal.json`, aufgehoben 2 × Fenster).
- `aktion`: `lesen` | `schreiben` | `datei_hochladen` | `passwort_entfernen`; weitere Felder je Aktion.
- Schlüssel: 32 Zufallsbytes, als 64 Hex gespeichert (`secrets.token_hex(32)`), auf beiden Seiten
  derselbe. **Kein Token, kein Login, kein Passwort, keine IP-Liste.** Der Besitz des Schlüssels ist die
  Berechtigung.
- **Origin:** Ein `Origin`-Kopf führt sofort zu 404, ohne zu zählen (Zeile 4147) – so kann keine
  Webseite in Julians Browser die App aussperren. Ein nativer Client darf diesen Kopf **nicht** setzen.
- Größe: Rumpf ≤ 24 MiB (`VERWALTUNG_ANFRAGE_MAX`), sonst **413** ohne Fehlschlag-Zählung.
- `User-Agent`: die App schickt `JKHD-Partnerverwaltung/1` (Zeile 298); der Server prüft ihn nicht.

Antworten des Tors (vor jeder Aktion), aus Sicht des Clients:

| Status | Bedeutung | zählt als Fehlschlag? |
|---|---|---|
| 404 | Schlüsseldatei fehlt auf dem Server, Unterschrift falsch, Hülle/Nutzlast unbrauchbar, Einmal-Wert schon gesehen, Origin-Kopf gesetzt | ja (außer bei Origin) |
| 408 | Unterschrift richtig, aber `zeit` außerhalb ±300 s (langsame Leitung oder falsche Uhr) | nein |
| 413 | Rumpf zu groß | nein |
| 429 | 20 Fehlschläge aus diesem Netz in der Stunde (`VERWALTUNG_FEHLER_JE_NETZ`) – trifft **nur** falsch unterschriebene Anfragen; eine gültige Unterschrift kommt immer durch | – |
| 503 | `vip.json` fehlt oder kaputt – dann darf nicht gespeichert werden (Freigaben gingen verloren) | nein |

### 3.3 Die vier Aktionen

| Aktion | Nutzlast zusätzlich | Antwort | Code |
|---|---|---|---|
| `lesen` | – | 200 `{partner_text, version, module:[{id,name,status}], katalog:[Module wie vip_module()], vip, zeit, passwoerter?:{adresse:{seit,bestaetigt}}}`; 500 wenn partner.json kaputt | ab 4180 |
| `schreiben` | `basis` (64 hex, die Fassung, auf der gearbeitet wurde), `partner` (die GANZE Liste als Objekt) | 200 `{version, passwoerter_entfernt}`; 400 `{fehler: Klartext}` aus `verwaltung_pruefe`; 409 `{fehler, version}` wenn die Datei nicht mehr `basis` ist (nichts geschrieben); 500 | ab 4245 |
| `datei_hochladen` | `name` (mit erlaubter Endung), `inhalt` (Base64, striktes Alphabet) | 200 `{id (32 hex), groesse}`; 400 Typ/Name/leer; 413 > 15 MB; 500 | ab 4322 |
| `passwort_entfernen` | `email` | 200 `{entfernt: true|false}`; 400 ungültige Adresse | ab 4213 |

Nebenwirkungen von `schreiben`: Sicherung nach `verlauf/partner-YYYYmmdd-HHMMSS-xxxxxx.json` (30 Stück,
30 Tage), Passwörter/Sitzungen von Konten außerhalb der Liste werden sofort gelöscht, Dateien ohne
Partner bekommen ihre Schonfrist, Protokollzeile in `verwaltung.log` (ohne Adressen, mit 8 Zeichen des
Netz-Hashes).

### 3.4 Wo die Zugangsdaten liegen (nur Orte)

| Geheimnis | Laptop | Server | im Repo? |
|---|---|---|---|
| HMAC-Schlüssel der Verwaltung | `Server: verwaltung/geheim/verwaltung.key.dpapi` – mit Windows-DPAPI (CurrentUser, feste Entropie, `_dpapi()` Zeile 97) verschlüsselt; eine Klartextdatei `verwaltung.key` wird beim ersten Start umgewandelt und gelöscht | `api-daten/verwaltung.key` (64 Hex, eine Zeile) | nein (`.gitignore`: `verwaltung/geheim/`, `api-daten/verwaltung.key`) |
| Export für Schlüsselwechsel | `python verwaltung/partnerverwaltung.py --schluessel-ausgeben DATEI` schreibt den Klartext in eine Datei (danach löschen) | neuen Wert in beide Dateien | – |
| Sitzungszeichen der lokalen Seite | `verwaltung/geheim/zeichen.txt` | – | nein |
| SMTP-Zugang des Postfachs | – | `api-daten/smtp.json` (Vorlage `smtp.beispiel.json` im Repo) | nein |
| OVHcloud-Token der KI | – | `api-daten/ki.json` | nein |
| Versand-Schlüssel (intern) | – | `api-daten/versand.key`, vom Server selbst erzeugt | nein |
| Signaturschlüssel der KI | – | `api-daten/ki-signatur.key`, vom Server selbst erzeugt | nein |
| IONOS-Zugang (Explorer/SFTP) | nur im Browser bzw. Kundenkonto; nichts im Repo | – | nein |
| Git-Push des Server-Repos | Credential Manager / `gh` des Laptops | – | nein |

Der Sicherungsstick lässt `geheim/` und `edge_profil/` aus (`sicherung/AUSSCHLUSSLISTE.ps1` im
MPAS-Repo, laut Server-README).

---

## 4. Der Server api.jkhd.de: alle Routen

### 4.1 Allgemeines

- Alle Routen außer `GET /ping` sind **nur POST** (405 sonst) mit **JSON-Rumpf**; Antworten JSON,
  `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`. `OPTIONS` → 204 (`cors()`, Zeile 682).
- **CORS** (Zeile 42): `Access-Control-Allow-Origin` nur für `https://www.jkhd.de`, `https://jkhd.de`,
  `http://localhost:8090`. Der Code sagt selbst: „CORS ist hier keine Sicherheitsgrenze (kein Cookie,
  kein Geheimnis), nur Höflichkeit.“
- **http → https** ist eine 301-Umleitung (`.htaccess`): ein POST über http verlöre seinen Rumpf.
  Immer `https://` rufen. HSTS 180 Tage.
- Dispatch über `$_GET['aktion']` (Zeile 3343); keine Aktion liest Abfrageparameter, alle lesen
  `php://input`.

### 4.2 Routenliste

**Partner-Routen (öffentlich, ohne Origin-Pflicht – ein nativer Client kommt durch):**

| Route | Eingabe | Antworten | Bremsen | Code |
|---|---|---|---|---|
| `GET /ping` | – | 200 `{"ok": true}`; `Date`-Kopf für den Uhrabgleich | – | 3345 |
| `POST /code` | `{email}` | 204 immer (bekannt, unbekannt, je Adresse gebremst), nie unter 0,7 s; 400 `{fehler:"email"}` bei unbrauchbarer Adresse; 429 `{grenze:"netz"}` nur bei voller Netzgrenze. Mail mit 6-stelligem Code (10 min, einmal, 5 Fehlversuche), asynchron | 20/Netz/h (limit.json), 7 Codes/Adresse/h | 3382 |
| `POST /login` | `{email, code}` | 200 `{token}` (64 hex, 1 h); 401 falsch/abgelaufen/unbekannt; 429 `{grenze:"netz"}` | 20/Netz/h | 3795 |
| `POST /passwort_login` | `{email, passwort}` | 200 `{token}`; 401 `{fehler:"falsch"}` (gleicher Körper und gleiche Rechenzeit für unbekannt/ohne Passwort/falsch – Attrappen-Hash); 401 `{fehler:"bestaetigen"}` wenn die letzte Code-Anmeldung > 180 Tage her ist; 429 `{grenze:"netz"|"konto"|"last"}`; 500 wenn passwoerter.json unlesbar | 20/Netz/h; 10 Fehlversuche je eingegebener Adresse/h (auch unbekannte); 200 gesamt/h; 2 Argon2-Plätze | 3899 |
| `POST /daten` | `{token}` | 200 `{name, email, felder:[{label,wert}], vip, module:[…], freigaben:[ids], dateien:[{id,name,typ,groesse,datum,text}], ansicht:{begruessung,daten,dateien,module,vip}, passwort:{gesetzt,seit,ohne_altes_bis,ohne_altes_rest}|null}` – ausgeblendete Bereiche kommen leer; 401 unbekannt/abgelaufen/Partner entfernt; 429 `{grenze:"netz"}` | nur Fehlversuche zählen (20/Netz/h) | 3852 |
| `POST /datei` | `{token, id}` | 200 die Datei (`application/octet-stream`, `Content-Disposition: attachment`, CSP sandbox) – nur wenn sie DIESEM Partner angehängt ist und seine Ansicht Dateien zeigt; 401; 404 sonst | Fehlversuche 20/Netz/h | 4080 |
| `POST /passwort_setzen` | `{token, passwort, altes_passwort?}` | 200 `{ok, passwort:{…}}`; 400 `{fehler: zu_kurz|zu_lang|zu_einfach|gleich_adresse|ungueltig}`; 403 `{fehler: neu_anmelden|altes_passwort_noetig|altes_passwort_falsch}`; 409 `{fehler:"geaendert"}`; 429 `{grenze: aenderung|konto|last|netz}`; 401. Ohne altes Passwort nur in den ersten 15 min nach einer Code-Anmeldung. Beendet alle anderen Sitzungen, Mail an den Partner | 5 Änderungen/Konto/h; 10 Fehl/Konto/h; 2 Argon2-Plätze | 3987 |
| `POST /passwort_entfernen` | `{token, altes_passwort?}` | 200 `{entfernt, passwort}`; Fehler wie oben ohne 400 | wie oben | 3987 |
| `POST /abmelden` | `{token}` | 204; 429 wenn ein unbekanntes Zeichen die Netzgrenze erreicht | Fehlversuche 20/Netz/h | 4120 |

**Routen mit Origin-Pflicht (403 ohne erlaubten `Origin`):** Ein natives Programm müsste den Kopf
`Origin: https://www.jkhd.de` selbst setzen – technisch möglich, der Server kann es nicht
unterscheiden, aber nicht vorgesehen. Für die Android-Aufgabe nicht nötig.

| Route | Eingabe | Antworten | Bremsen | Code |
|---|---|---|---|---|
| `POST /anfrage` | `{name, email, rolle, anliegen, profil, nachricht, sprache}` (Auswahlfelder als Schlüssel `quant|trader|firma|anderes`, `partnerschaft|austausch|zugang|anderes`) | 200 `{ok:true, bestaetigung:true|false}`; 400 `{fehler:"eingabe"}`; 403; 429 `{fehler:"zu_oft"}`; 502 `{fehler:"versand"}`. Mail an service@ (synchron, Antwort-an = Einsender) + Bestätigung an den Einsender; Zeile in `anfragen.jsonl` | 30 gesamt/h, 10/Netz, 10/Mail-Domain, 3/Adresse, 1 Bestätigung/Adresse/h (`limit-anfrage.json`) | 3432 |
| `POST /frage` | `{frage, sprache, verlauf?:[{frage,antwort,sig}]}` | 200 `{antwort, art:"ki"|"sperre", ki_generiert, sig?}` + `X-KI-Generiert: 1`; 400/403/429 `{grenze: netz|last|tag|budget}`/502/503 `{fehler:"aus"}` | 20/Netz/h, 120/h gesamt, 50/Tag, 5 €/Monat, 3 Plätze, 25 s | 3664 |
| `POST /index.php?aktion=bestenliste` / `bestenliste_marke` / `bestenliste_eintrag` / `bestenliste_ende` | siehe README „Bestenliste“ | 200/400/409/429 | 40 Marken, 6 Einträge je Netz/h | 3513 |

**Nur für Julian / intern:**

| Route | Zugang | Zweck | Code |
|---|---|---|---|
| `POST /verwaltung` | HMAC-Schlüssel (3.2); **Origin-Kopf verboten** | Partnerliste lesen/schreiben, Datei hochladen, Passwort entfernen (3.3) | 4139 |
| `POST /index.php?aktion=versand` | Schlüssel aus `api-daten/versand.key` im Rumpf, sonst 403 | zweite Anfrage für den asynchronen Mailversand; ruft der Server bei sich selbst | 3358 |

### 4.3 Token-Mechanik (Partner-Sitzung)

- `token` = 32 Zufallsbytes als 64 Hex (`bin2hex(random_bytes(32))`), gilt **eine Stunde**
  (`SITZUNG_GUELTIG_SEK`, Zeile 47), **keine Verlängerung** durch Nutzung.
- Gespeichert nur als SHA-256 in `api-daten/sitzungen.json`:
  `{"<sha256(token)>": {"email": "<schluessel>", "bis": <unix>, "art": "code"|"passwort", "seit": <unix>}}`.
- `art`/`seit` entscheiden über „frisch“ (15 min nach Code-Anmeldung → Passwort ohne altes setzen).
- Endet durch: Ablauf, `/abmelden`, Partner aus der Liste entfernt (beim nächsten `/daten` → 401 und
  Sitzung gelöscht), Passwortänderung (alle ANDEREN Sitzungen), Verwaltung `passwort_entfernen` (alle),
  Verwaltung `schreiben` ohne diesen Partner (alle).
- Die Website hält das Zeichen nur im `sessionStorage` (`jkhd-partner`), nie in Cookies.
- Adressvergleich überall über `schluessel()` (Zeile 1006): klein, ohne Rand, Gmail ohne Punkte/+Zusatz.

### 4.4 Bremsen (Rate-Limits), alle gleitend über eine Stunde

| Zähler | Grenze | Datei | Schlüssel |
|---|---|---|---|
| Anfragen je Netz (`/code`, `/login`, `/passwort_login`, Fehlversuche an `/daten`, `/datei`, `/abmelden`, `/passwort_*`) | 20 (`LIMIT_JE_IP`) | `limit.json` | `ip:sha256(IPv4 bzw. IPv6/64)` |
| Codes je Adresse | 7 (`LIMIT_JE_MAIL`) | `limit.json` | `mail:sha256(schluessel)` |
| Passwort-Fehlversuche je Konto | 10 | `limit-passwort.json` | `pw:sha256(schluessel)` – Erfolg wird gutgeschrieben |
| Passwort-Anmeldungen gesamt | 200 | `limit-passwort.json` | `pw:gesamt` |
| Passwort-Änderungen je Konto | 5 | `limit-passwort.json` | `pw-aend:…` – Absagen werden erstattet |
| Argon2 gleichzeitig | 2 Plätze (`argon-N.lock`) | – | – |
| Anfrage-Formular | 30 gesamt, 10/Netz, 10/Domain, 3/Adresse, 1 Bestätigung/Adresse | `limit-anfrage.json` | – |
| Verwaltung: falsch unterschriebene Anfragen je Netz | 20 | `limit-verwaltung.json` | nur Unsignierte |
| KI | 20/Netz, 120/h, 50/Tag, 500 Cent/Monat, 3 Plätze | `limit-ki.json`, `ki-verbrauch.json` | – |
| Bestenliste | 40 Marken, 6 Einträge je Netz | `limit-besten.json` | – |

Gebucht wird **vor** der teuren Arbeit (`grenze_erreicht`, Zeile 903); der Cron räumt alle
`limit*.json` nach einer Stunde.

### 4.5 Mailversand

- `sende_mail()` (Zeile 1140): **SMTP** zu `smtp.ionos.de:587` mit STARTTLS und AUTH LOGIN, Zugangsdaten
  aus `api-daten/smtp.json`; ohne diese Datei Rückfall auf PHP `mail()` (kommt vom Webspace mit
  Absender jkhd.de nicht an). Mails sind `multipart/alternative` (Text + HTML, quoted-printable) im
  JKHD-Signatur-Layout (`mail_rahmen`, 1489).
- **Umschlag** (`MAIL FROM`) ist immer das angemeldete Postfach; sichtbarer Absender nur aus
  `EIGENE_ABSENDER` (Zeile 61: das Partner-Postfach und service@), `Reply-To` setzbar. Alles in
  Kopfzeilen läuft durch `kopfzeile()` (kein CR/LF).
- **Asynchron** für Code- und Passwort-Mails: `/code` übergibt den Auftrag per TLS-Socket an
  `POST /index.php?aktion=versand` auf demselben Server und schließt nach 250 ms
  (`versand_uebergeben`, 728) – weil PHP als cgi-fcgi läuft. Klappt die Übergabe nicht, sendet die
  Anfrage selbst. `/anfrage` sendet **synchron** (das Ergebnis entscheidet 200/502).
- Welche Mails es gibt: Code-Mail (Betreff „Ihr Code für den JKHD-Partnerzugang“), Anfrage an
  service@ (Absender „JKHD Partneranfrage“) + Bestätigung an den Einsender (fester Text, de/en),
  Passwort-Hinweise `festgelegt | geaendert | entfernt | entfernt_jkhd` (Antwort-an kontakt@,
  `hinweis_mail_teile`, 2279).
- Protokoll (`error_log`): nur Schrittname und SMTP-Antwortnummer, nie die gesendete Zeile.

---

## 5. Datenmodell

### 5.1 `api-daten/partner.json` – exaktes Schema

Ein **JSON-Objekt** (keine Liste). Geprüft von `verwaltung_pruefe()` (`index.php:1795-1877`) und
`verwaltung_pruefe_extras()` (1988-2027) bei jedem `schreiben`; der Server selbst liest die Datei nur
(`partner_liste`, 885; fehlend/kaputt = 500 für alle Partner).

| Schlüssel | Typ | Pflicht | Regel |
|---|---|---|---|
| `_hinweis` | string | nein | ≤ 2000 Zeichen, Zeilenumbrüche erlaubt; reine Doku |
| `_rollen` | Liste von `{name: string 1–80, alle_module: bool}` | nein | ≤ 30 Rollen, Namen eindeutig; genau diese zwei Felder |
| andere `_…` | – | – | **verboten** („Unbekannter Eintrag“) |
| `<E-Mail-Adresse>` | Objekt (Partnereintrag) | – | gültig nach `filter_var(FILTER_VALIDATE_EMAIL)` (ASCII), ≤ 254; kein zweiter Eintrag mit gleichem `schluessel()`; höchstens 500 Partner |

Partnereintrag – **nur** diese Schlüssel sind erlaubt (`VERWALTUNG_EINTRAG_FELDER`, Zeile 113):

| Feld | Typ | Pflicht | Regel |
|---|---|---|---|
| `name` | string | **ja** | 1–120 Zeichen, keine Steuerzeichen |
| `felder` | Liste von `{label: string, wert: string}` | nein (Standard `[]`) | ≤ 20; `label` 1–60, `wert` 0–300; genau diese zwei Schlüssel. Konvention der App: erste Angabe `{"label":"Rolle"}`, dazu `{"label":"Angelegt","wert":"TT.MM.JJJJ"}` |
| `freigaben` | Liste von string | nein (Standard `[]`) | ≤ 50, keine doppelt, jede ID muss in `vip.json` stehen |
| `notiz` | string | nein | ≤ 2000, Zeilenumbrüche erlaubt; **intern**, `/daten` liefert sie nie |
| `dateien` | Liste von `{id, name, groesse, datum, text?}` | nein | ≤ 50; `id` 32 Hex und die Datei `api-daten/dateien/<id>` muss existieren; `name` 1–120 mit erlaubter Endung, ohne `/`/`\`, nicht mit `.` beginnend; `groesse` int; `datum` string ≤ 20 (die App schreibt TT.MM.JJJJ); `text` ≤ 300 (optional); keine id doppelt |
| `ansicht` | Objekt `{begruessung?: string, daten?: bool, dateien?: bool, module?: bool, vip?: bool}` | nein | `begruessung` ≤ 1000 mit Zeilenumbrüchen; die vier Bereiche nur als `false` (Standard ist sichtbar); keine anderen Schlüssel |

Was `/daten` daraus macht (`index.php:3852-3897`): `name`, `email` (Schreibweise aus der Datei),
`felder` nur bei `ansicht.daten`, `vip` nur bei `ansicht.vip`, `module`/`freigaben` nur bei
`ansicht.module`, `dateien` (mit `typ` aus der Endung) nur bei `ansicht.dateien`, `ansicht` mit
Standardwerten aufgefüllt, `passwort` aus `passwoerter.json`.

**Beispiel (alle Werte erfunden):**

```json
{
  "_hinweis": "Je Partner ein Eintrag: Schluessel = E-Mail-Adresse. Diese Datei pflegt die Partner-App.",
  "_rollen": [
    {"name": "Partner — Vollzugang (alle Module)", "alle_module": true},
    {"name": "Partner", "alle_module": false}
  ],
  "anna.muster@example.com": {
    "name": "Anna Muster",
    "felder": [
      {"label": "Rolle", "wert": "Partner — Vollzugang (alle Module)"},
      {"label": "Firma", "wert": "Muster Quant GmbH"},
      {"label": "Angelegt", "wert": "22.10.2026"}
    ],
    "freigaben": ["quant-labor", "alpha-fabrik", "prop-firms"],
    "notiz": "Kontakt über die Kontaktseite, Gespräch am 20.10.",
    "dateien": [
      {"id": "0123456789abcdef0123456789abcdef", "name": "Formelsammlung.pdf",
       "groesse": 279060, "datum": "22.10.2026", "text": "Die aktuelle Fassung"}
    ],
    "ansicht": {"begruessung": "Schön, dass Sie dabei sind.", "vip": false}
  },
  "kontakt@beispiel-firma.example": {
    "name": "Beispiel Firma",
    "felder": [{"label": "Rolle", "wert": "Partner"}, {"label": "Angelegt", "wert": "22.10.2026"}],
    "freigaben": []
  }
}
```

Der zweite Eintrag zeigt das Minimum, das die App beim Anlegen erzeugt. Die Datei auf dem Server
wird vom Server selbst mit `JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES` und
einem abschließenden `\n` geschrieben; `version` ist der SHA-256 genau dieses Texts.

### 5.2 `api-daten/vip.json` – exaktes Schema

Gelesen von `vip_module()` (`index.php:1083-1106`) und `verwaltung_module()` (1734). Wird **von Hand**
gepflegt (kein Server-Weg), kaputtes JSON = leerer Katalog für `/daten`, aber **503 für die Verwaltung**
(damit beim Speichern keine Freigaben verschwinden).

```json
{
  "_hinweis": "VIP-Katalog. Je Modul: id (fest, nie recyceln), name, kurz (DE), kurz_en (EN), neu, status 'anfrage' | 'bald', link nur https.",
  "module": [
    {"id": "quant-labor",  "name": "Quant-Labor",          "kurz": "Das Testzentrum …", "kurz_en": "The test centre …", "neu": true},
    {"id": "alpha-fabrik", "name": "Alpha-Fabrik",         "kurz": "Wie Handelsideen entstehen …", "kurz_en": "How trading ideas are born …",
     "link": "https://beispiel.example/alpha"},
    {"id": "prop-firms",   "name": "Prop-Firms-Dashboard", "kurz": "Firmen, Konten, Trades …", "kurz_en": "Firms, accounts, trades …", "status": "bald"}
  ]
}
```

| Feld je Modul | Typ | Pflicht | Regel |
|---|---|---|---|
| `id` | string | **ja** | fest, nie recyceln; Einträge ohne string-`id`/`name` werden übergangen |
| `name` | string | **ja** | – |
| `kurz`, `kurz_en` | string | nein | Beschreibung DE/EN (Standard `""`) |
| `neu` | bool | nein | Abzeichen „NEU“ |
| `status` | `"anfrage"` (Standard) oder `"bald"` | nein | `bald` = nur angekündigt, **schlägt jede Freigabe** |
| `link` | string, nur `https://` | nein | geht **nur** an Partner mit Freigabe (und nie bei `bald`) |

Der Server akzeptiert auch eine nackte Liste statt `{"module": […]}` (`$daten['module'] ?? $daten`).
Die drei Module im echten Katalog sind laut `_hinweis` Platzhalter mit echten Modulnamen.

### 5.3 Weitere Datendateien (nur Struktur)

| Datei (unter `api-daten/`) | Struktur | Entsteht |
|---|---|---|
| `codes.json` | `{"<schluessel>": {"hash": sha256(salz+code), "salz": 16 hex, "bis": unix, "versuche": int}}` | `/code` |
| `sitzungen.json` | `{"<sha256(token)>": {"email": schluessel, "bis", "art": "code"\|"passwort", "seit"}}` | `/login`, `/passwort_login` |
| `passwoerter.json` | `{"<schluessel>": {"hash": "$argon2id$…", "seit": unix, "bestaetigt": unix}}`; nie ins Repo, nie hochladen | `/passwort_setzen` |
| `limit.json`, `limit-passwort.json`, `limit-anfrage.json`, `limit-verwaltung.json`, `limit-ki.json`, `limit-besten.json` | `{"<schlüssel>": [unix, unix, …]}` | Bremsen |
| `verwaltung-einmal.json` | `{"<einmal 32 hex>": unix}` | `/verwaltung` |
| `verlauf/partner-YYYYmmdd-HHMMSS-xxxxxx.json` | die alte partner.json vor jedem `schreiben` (30 Stück, 30 Tage) | `schreiben` |
| `dateien/<32 hex>` | die Partnerdatei roh, ohne Namen und Endung | `datei_hochladen` |
| `anfragen.jsonl` | je Zeile `{"at": ISO-8601, "Name", "E-Mail", "Rolle", "Anliegen", "Profil", "Sprache", "Nachricht"}`; 30 Tage | `/anfrage` |
| `verwaltung.log` | je Zeile `YYYY-MM-DD HH:MM:SSZ schreiben n Partner, Passwoerter entfernt m, Netz xxxxxxxx` u. ä., **ohne Adressen** | `/verwaltung` |
| `aufraeumen.log` | je Lauf eine Zeile `… anfragen=ok verlauf=ok rest=ok zaehler=… codes=… sitzungen=… einmal=… passwoerter=… marken=…` | Cron |
| `ki-verbrauch.json`, `ki-signatur.key`, `ki-platz-N.lock`, `bestenliste.json`, `besten-marken.json`, `besten-statistik.json` | KI und Bestenliste, ohne Bezug zur Partner-App | – |
| `*.json.lock`, `argon-N.lock` | leere Sperrdateien | – |
| `smtp.json`, `ki.json`, `verwaltung.key`, `versand.key` | Geheimnisse (3.4) | – |

Auf dem Laptop: `verwaltung/partnerverwaltung.log` (Zeilen wie `gestartet (PID …, Schluessel da)`,
`gelesen und gespiegelt: n Partner`, `gespeichert: n Partner`, `Datei hochgeladen: n Bytes`,
`Serverfehler 409: …` – nie Adressen).

---

## 6. Regeln für einen mobilen Client

Es gibt zwei denkbare Rollen für die Android-App; die Regeln unterscheiden sich.

### 6.1 Als Admin-Client (das, was die Partner-App tut) – Pflichten

1. **Unterschrift genau wie in 3.2:** HMAC-SHA256 über die UTF-8-Bytes des `nutzlast`-Strings, den
   man tatsächlich sendet; `zeit` als int-Sekunden nach Serveruhr (Versatz aus dem `Date`-Kopf von
   `GET /ping`, bei jeder Sitzung und mindestens alle 10 min neu); `einmal` = 16 Zufallsbytes als Hex,
   nie wiederverwenden; `Content-Type: application/json`; **keinen `Origin`-Kopf** (ein natives
   HTTP-Programm wie OkHttp setzt keinen – eine WebView-`fetch` dagegen schon → 404).
2. **Ganze Liste, optimistische Sperre:** `schreiben` schickt immer das komplette Objekt inklusive
   `_hinweis` und `_rollen` unverändert; `basis` ist die `version` des letzten `lesen`. **409** heißt:
   jemand anders (z. B. die PC-App) hat gespeichert – neu lesen, Änderungen neu anwenden. Bei
   verlorener Antwort (Timeout) wie die PC-App: nachlesen und vergleichen, bevor man wiederholt (ein
   Wiederholen mit altem `basis` wäre 409, ein Wiederholen mit neuem `einmal` nach Erfolg ebenfalls).
3. **Rolle „alle Module“ ist Client-Logik:** der Server kennt keine Rollen. Beim Speichern muss der
   Client für Rollen mit `alle_module` alle Katalog-IDs in `freigaben` eintragen (wie `eintragVon`,
   `seite.html:370`), und Freigaben, die der Katalog nicht kennt, nie still entfernen.
4. **Gültigkeit vorab prüfen** wie `pruefen()` (`seite.html:443`): sonst antwortet der Server 400 mit
   einem Klartext, der anzuzeigen ist.
5. **Dateien:** Base64 im JSON, Rumpf ≤ 24 MiB, Datei ≤ 15 MB, Zeitlimit großzügig (PC-App: 240 s,
   klar unter dem 300-s-Fenster – die Unterschrift muss **vor** dem Senden berechnet und die Anfrage
   innerhalb von 5 min angekommen sein; bei Mobilfunk entsprechend kleinere Dateien oder WLAN).
   Hochgeladene, nie gespeicherte Dateien verschwinden nach einem Tag.
6. **Fehlschläge sind teuer:** 20 falsch unterschriebene Anfragen je Netz und Stunde sperren das Netz
   für unsignierte Anfragen (eine richtige Unterschrift kommt weiter durch). 408 bedeutet Uhr/Leitung,
   nicht Schlüssel.
7. **Schlüssel-Hygiene:** Schlüssel nur im Android Keystore bzw. `EncryptedSharedPreferences`,
   App-Sperre (BiometricPrompt/Gerätesperre) vor jeder Nutzung, kein Backup des Schlüssels
   (`android:allowBackup="false"` oder Backup-Regeln), nie in Logs, nie in Screenshots. Wer den
   Schlüssel hat, kann die Partnerliste beliebig ändern und Passwörter entfernen.
8. **Keine Adressen in Protokollen** (Regel des ganzen Systems), keine Partnerdaten in einem Repo –
   erst recht nicht in diesem öffentlichen. Die VIP-Adresse (`vip` aus `lesen`) nur anzeigen, nie
   speichern.
9. **Nichts cachen, was der Server als Wahrheit führt:** Nach jedem `schreiben` erneut `lesen`
   (die Antwort trägt nur `version`, nicht die Liste; Passwortstatus kann sich geändert haben).

### 6.2 Als Partner-Client (falls die App auch die Partnerseite nachbauen soll)

- Code-Weg: `/code` → `/login`; Passwort-Weg: `/passwort_login`. Token 1 h, keine Verlängerung,
  danach 401 → neu anmelden. Token nur im Arbeitsspeicher/verschlüsselt halten, bei App-Ende
  `/abmelden`.
- Bremsen aus 4.4 beachten; 429 nennt die Grenze (`netz`, `konto`, `last`, `aenderung`).
- `/code` antwortet 204 auch für Unbekannte – die App darf daraus nichts schließen.
- Nach 180 Tagen ohne Code-Anmeldung meldet `/passwort_login` 401 `bestaetigen` → Code-Weg anbieten.
- Download über `/datei` ist ein Rumpf mit `attachment` – in der App als Datei speichern, nicht
  rendern.
- Passwort setzen ohne altes nur in den ersten 15 min nach Code-Anmeldung (`passwort.ohne_altes_rest`
  aus `/daten` nutzen, nicht die Geräteuhr).

### 6.3 Fehlerverhalten des Servers, das der Client kennen muss

- 500 bei fehlender/kaputter `partner.json` (alle Partner gesperrt), bei unlesbarer `passwoerter.json`
  nur die Passwort-Wege (Code-Weg läuft; `/daten` liefert `passwort: null`).
- 503 von `/verwaltung`, wenn `vip.json` kaputt ist – dann nicht speichern.
- Der Server schreibt Dateien atomar und unter Sperren; parallele Clients sind vorgesehen (409).
- Zeitzone für Datumsangaben in `passwoerter`-Status: Europe/Berlin (`datum()`, 2098).

### 6.4 Datenschutz-Hinweise im Repo

- `Website: datenschutz.html` ab Zeile 139 („Partnerzugang“): Adresse/Passwort verschlüsselt an
  api.jkhd.de (IONOS SE, Montabaur); Code nur als Prüfsumme, 10 min, einmal, Löschung spätestens am
  Folgetag; Anmeldezeichen höchstens eine Stunde, nur im Sitzungsspeicher des Browsers und beim Server
  nur als Prüfsumme; Art und Zeitpunkt der Anmeldung werden vermerkt; Passwort nur als Argon2id-Hash,
  JKHD sieht in der Partnerverwaltung nur die Daten; Mail bei jeder Passwortänderung; 180-Tage-Regel.
  **Eine Android-App, die das Zeichen anders speichert (z. B. dauerhaft), weicht von diesem Text ab**
  – dann muss die Erklärung angepasst werden.
- Server-README, Abschnitt „Regeln im Code“: nichts protokollieren, was Code, Passwort, Klartext-Adresse
  oder Zugangsdaten enthält; Anfragen 30 Tage; Verlauf 30 Tage; verwaiste Dateien/Passwörter am
  Folgetag (Cron hält die Zusage „spätestens am folgenden Tag“ wahr).
- `verwaltung/partnerverwaltung.py`, Kopf: „Nach jedem Lesen und Speichern wird die Serverfassung …
  gespiegelt und committet“ – in ein **privates** Repo. Für die Android-App gilt: Partnerdaten gehören
  in kein Repo.

---

## 7. Empfehlung: Was fehlt, damit das Handy dasselbe kann

### 7.1 Befund

**Es gibt bereits eine Admin-API, und sie reicht für die Parität.** `POST /verwaltung` mit `lesen`,
`schreiben`, `datei_hochladen`, `passwort_entfernen` deckt jede Funktion der PC-App ab (Partner anlegen,
Adressen eintragen, Felder/Rolle/Module/Dateien/Ansicht/Notiz pflegen, Rollen, Partner entfernen,
Passwort entfernen). Die PC-App ist nur ein dünner Client darum. **Am Server ist für die Parität
nichts zu ändern.** Zwei Dinge sind Client-Arbeit: die Vorschau (7.3) und das Nachbauen der
Client-Regeln (6.1). Eines ist Julians Entscheidung: der Schlüssel (7.2).

### 7.2 Der Schlüssel aufs Handy – zwei Wege

**Weg A, ohne Serveränderung:** denselben Schlüssel exportieren
(`python verwaltung/partnerverwaltung.py --schluessel-ausgeben DATEI`, dann die Datei per QR-Code
aus einer PC-Anzeige oder per USB in die App übernehmen und löschen). Nachteil: PC und Handy teilen
einen Schlüssel; geht das Handy verloren, muss der Schlüssel auf Server **und** PC gewechselt werden,
und niemand sieht am Server, welches Gerät gespeichert hat.

**Weg B (empfohlen), kleine Serverergänzung – ein Schlüssel je Gerät, einzeln widerrufbar:**
- `api-daten/verwaltung.key` bleibt für den PC. Neu: `api-daten/verwaltung-geraete.json`
  `{"handy-julian": "<64 hex>"}` (oder mehrere Zeilen in derselben Datei).
- `verwaltung_schluessel()` (`index.php:1650`) liefert eine Liste von `[name, schlüssel]`;
  `verwaltung_nutzlast()` (1689) prüft die Unterschrift gegen jeden (bei einer Handvoll Schlüssel ist
  `hash_equals` je Schlüssel billig) und gibt den Namen zurück; `verwaltung_protokoll()` (1894) schreibt
  ihn in die Zeile (`schreiben 4 Partner … Geraet handy-julian`).
- Widerruf = Eintrag löschen. Kein Login, keine Sitzung – derselbe Mechanismus wie heute.
- **Aufwand:** etwa 30–40 Zeilen in `api/index.php`, je ein Test im Übungsserver
  (`verwaltung/test_partnerverwaltung.py`) und in `probe_server.py`, eine Zeile im README. Risiko gering,
  weil der alte Pfad unverändert bleibt. Upload wie immer über den Explorer (1.1).
- Egal welcher Weg: auf dem Handy Keystore + App-Sperre (6.1 Punkt 7).

### 7.3 Vorschau auf dem Handy

Die PC-Vorschau ist „die echte `partner.html` der Website im Rahmen, gefüttert mit dem, was `/daten`
liefern würde“ (2.3 f). Zwei Varianten:

**Variante 1 (empfohlen, originalgetreu):** `WebView` mit `WebViewAssetLoader`. Die Android-App liegt
im Website-Repo – `partner.html`, `css/`, `js/main.js`, Schriften und Bilder können als Assets
mitgebaut werden (oder zur Laufzeit von `https://www.jkhd.de/` geholt werden, dann aber ohne die
nötigen Umbauten). Beim Laden genau das tun, was `_vorschau()` in `partnerverwaltung.py:532` tut:
`<base>` auf den Asset-Ursprung, `data-api=""`, und **vor** `js/main.js` ein `<script>window.JKHD_VORSCHAU = true;</script>`.
Danach die Daten liefern: Die Seite registriert in `main.js:2112` einen `message`-Listener, der nur
Nachrichten vom **eigenen Ursprung** mit `typ: "jkhd-vorschau"` annimmt. In einer WebView ist die Seite
das oberste Fenster, also schickt sie **kein** „bereit“ (`window.parent !== window` ist falsch,
`main.js:2116`). Die App ruft deshalb nach `onPageFinished` selbst
`webView.evaluateJavascript("window.postMessage({typ:'jkhd-vorschau', daten: <JSON>}, location.origin)", null)`
– `window.postMessage` an sich selbst hat `ev.origin === location.origin`, der Listener nimmt es an.
`daten` muss die Form der `/daten`-Antwort haben; die Umrechnung aus dem Eintrag steht in
`vorschauDaten()` (`seite.html:764-782`): `felder` nur bei `ansicht.daten`, `vip` nur bei
`ansicht.vip`, `module` = `katalog` aus `lesen` mit `link` nur für freigegebene, nicht-`bald`-Module,
`dateien` mit `typ` aus der Endung, `passwort` aus `passwoerter` (oder `null`). Herunterladen und
Abmelden sind in der Vorschau bereits gesperrt (`main.js:1593`, `2075`).

**Variante 2:** die Partnerseite nativ in Compose nachbauen. Weniger Abhängigkeit von der WebView,
aber keine echte Vorschau mehr – jede Änderung an `main.js`/`style.css` müsste nachgezogen werden.

### 7.4 Was bewusst entfällt

- **Spiegel/Commit** von `partner.json` (2.6): nicht vom Handy. Die PC-App liest beim nächsten Start
  die Serverfassung und committet sie (`spiegeln()` schreibt nur bei Änderung). Arbeiten PC und Handy
  gleichzeitig, schützt `basis`/409.
- **Edge-Fenster, lokaler Port, Lebenszeichen, DPAPI:** PC-spezifisch, entfällt.

### 7.5 Optional: mehr als die PC-App (neue Server-Aktionen, Julian entscheidet)

Alle als weitere `aktion` in `/verwaltung`, mit derselben Unterschrift; je ein `if ($n['aktion'] === …)`
vor `antwort(400, ['fehler' => 'Unbekannte Aktion.'])` (`index.php:4352`):

| Aktion | Zweck | Umfang |
|---|---|---|
| `anfragen_lesen` | `anfragen.jsonl` als Liste zurückgeben (Anfragen der Kontaktseite ansehen) | ~15 Zeilen; Datei unter `flock` lesen (`anfrage_aufraeumen` zeigt den Zugriff) |
| `datei_lesen {id}` | eine Partnerdatei an den Admin ausliefern (heute nur der Partner selbst über `/datei`) | ~20 Zeilen; Antwort Base64 im JSON oder roh mit `attachment` |
| `katalog_schreiben {module}` | `vip.json` aus der App pflegen (heute von Hand) | ~30 Zeilen; Prüfung wie `vip_module()` (ids fest, `link` nur https), atomar schreiben, Sicherung nach `verlauf/` |
| `protokoll_lesen` | die letzten Zeilen von `verwaltung.log`/`aufraeumen.log` | ~15 Zeilen |
| Mails an Partner | **nicht empfohlen** als freier Versand – der Server versendet bewusst nur feste Texte ohne Zeichen aus der Eingabe (Schutz vor Textschleuder). Falls gewünscht: feste Vorlagen als neue `hinweis_mail_teile`-Arten | je Vorlage ~20 Zeilen |

Jede neue Aktion gehört in den Übungsserver (`test_partnerverwaltung.py`), in `probe_server.py` und in
die E2E-Phase „Verwaltung“ (`pruefung/server_e2e.py:422`). KI-Fragen brauchen keine Admin-Funktion
(Ein/Aus ist eine Datei auf dem Server).

### 7.6 Typischer Ablauf eines Android-Admin-Clients (mit der heutigen API)

Es gibt **keine Anmeldung** – jede Anfrage ist für sich unterschrieben. „Anmelden“ ist in der App die
Gerätesperre vor dem Schlüssel.

```
0. App-Sperre (Biometrie) -> Schlüssel aus dem Keystore laden (32 Bytes).

1. GET https://api.jkhd.de/ping
   -> 200 {"ok":true}; Date-Kopf lesen; versatz = serverzeit - gerätezeit (int Sekunden)

2. POST /verwaltung   nutzlast = {"zeit": jetzt+versatz, "einmal": hex16(random), "aktion": "lesen"}
   Rumpf {"nutzlast": <string>, "unterschrift": hmac_sha256_hex(schlüssel, <string>)}
   -> 200 {partner_text, version, module, katalog, vip, zeit, passwoerter}
   Prüfen: sha256(partner_text) == version; partner = JSON.parse(partner_text) ([] -> {})

3. Partner anlegen (lokal):
   partner["anna.muster@example.com"] = {
     "name": "Anna Muster",
     "felder": [{"label":"Rolle","wert":"Partner"}, {"label":"Angelegt","wert":"22.10.2026"}],
     "freigaben": []
   }
   Vorab prüfen wie pruefen(): Adresse gültig und nicht dasselbe Postfach wie ein anderer Eintrag.

4. Freigabe setzen (lokal):
   partner[...]["freigaben"] = ["quant-labor"]        (ID aus `module`/`katalog`; bei Rolle mit
                                                        alle_module: alle IDs aus `module`)

5. Datei hochladen (sofort zum Server):
   POST /verwaltung   nutzlast = {zeit, einmal, "aktion":"datei_hochladen",
                                  "name":"Formelsammlung.pdf", "inhalt": base64(bytes)}
   -> 200 {"id":"<32 hex>", "groesse": 279060}
   partner[...]["dateien"] = [{"id": id, "name":"Formelsammlung.pdf", "groesse": 279060,
                               "datum":"22.10.2026", "text":"optional"}]
   (Zeitlimit ~240 s; Unterschrift erst unmittelbar vor dem Senden berechnen)

6. Speichern:
   POST /verwaltung   nutzlast = {zeit, einmal, "aktion":"schreiben", "basis": version,
                                  "partner": partner}      (GANZE Liste inkl. _hinweis/_rollen)
   -> 200 {"version": neu, "passwoerter_entfernt": 0}
   -> 409 {"fehler": "...", "version": jetzige}  => zurück zu 2., Änderungen neu anwenden
   -> 400 {"fehler": "<Klartext>"}               => anzeigen, nichts ist geschrieben
   -> 503                                         => vip.json kaputt, nicht speichern

7. Nachlesen:  wie 2. (neue version, aktueller Passwortstatus)

8. Vorschau:   daten = wie vorschauDaten() aus dem Eintrag + katalog + vip + passwoerter
               -> WebView mit partner.html (JKHD_VORSCHAU=true) und window.postMessage (7.3)

9. Passwort eines Partners entfernen (sofort, nicht Teil von 6.):
   POST /verwaltung   nutzlast = {zeit, einmal, "aktion":"passwort_entfernen", "email": "..."}
   -> 200 {"entfernt": true|false}   (Server beendet Sitzungen, löscht Hash, schickt die Mail)
```

Implementierungshinweise für Kotlin: HMAC über `javax.crypto.Mac.getInstance("HmacSHA256")` mit dem
Roh-Schlüssel (32 Bytes aus den 64 Hex), Nutzlast mit einem Serializer erzeugen und **diesen String**
sowohl signieren als auch in das äußere JSON legen (als String-Wert, also einmal escaped); Umlaute
als UTF-8 sind in Ordnung (der Übungsserver prüft genau das: „Umlaute überleben die Unterschrift“).
Kein `Origin`-Kopf, keine Umleitungen folgen (immer `https://`). Bei allen Fehlern den `fehler`-Text
des Servers anzeigen – er ist für Menschen geschrieben.

---

## Anhang: Fundstellen auf einen Blick

| Thema | Datei:Zeile |
|---|---|
| Einstellungen des Servers (Grenzen, Dauer, Typen) | `Server: api/index.php:42-177` |
| Verwaltungs-Konstanten | `Server: api/index.php:104-113`, Dateien/Ansicht `124-143` |
| CORS | `Server: api/index.php:682` |
| Sperren und atomares Schreiben | `Server: api/index.php:802-882` |
| Bremsen (`grenze_erreicht`, `ip_schluessel`) | `Server: api/index.php:903, 1050` |
| Adress-Schlüssel (`schluessel`) | `Server: api/index.php:1006` |
| Mailversand | `Server: api/index.php:1140-1256`, Übergabe `717-755` |
| Verwaltung: Schlüssel, Tor, Prüfung | `Server: api/index.php:1650-1733, 1795-1877, 1988-2027` |
| Dispatch aller Routen | `Server: api/index.php:3343-4355` (Verwaltung ab 4139) |
| Rewrites | `Server: api/.htaccess:10-21` |
| Cron | `Server: api-daten/aufraeumen.php` |
| Partner-App: Verbindung, Spiegel, lokaler Server, Start | `Server: verwaltung/partnerverwaltung.py:207, 314, 413, 657` |
| Partner-App: Zustand, Bauen, Änderungen, Prüfen, Speichern | `Server: verwaltung/seite.html:275, 361-402, 404-441, 443-469, 493-517` |
| Partner-App: Editor, Dateien, Ansicht, Vorschau, Rollen | `Server: verwaltung/seite.html:566, 686, 710, 764-793, 846-870` |
| Tests, Probe, E2E | `Server: verwaltung/test_partnerverwaltung.py`, `verwaltung/probe_server.py`, `pruefung/server_e2e.py:422` |
| Website: Anmeldekasten, Partnerseite, Vorschau-Schalter | `Website: js/main.js:811, 1423-1460, 2109-2117` |
| Website: Schnittstelle aus Sicht der Seite | `Website: README.md:245` |
| Datenschutz Partnerzugang | `Website: datenschutz.html:139` |
