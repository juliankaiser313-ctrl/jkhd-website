# Auftrag: Partner-App analysieren, Bericht für die Android-App ablegen

*Für eine Claude-Sitzung auf dem PC (im lokalen Klon von jkhd-website, mit Zugriff auf den Ordner
der Partner-App). Den Text unten ab „Du arbeitest …“ komplett in die neue Sitzung einfügen.*

---

Du arbeitest im lokalen Klon des Repos juliankaiser313-ctrl/jkhd-website. Eine Cloud-Sitzung
(session_017PwvahVVV1Mav1XrbhwgBV) baut dort die JKHD-Android-App (Ordner `android/`, Zweig
`ccr-882e1add-b23dtn`). Julian möchte, dass er in der Android-App unter dem Bereich „Webseite“
dasselbe machen kann wie mit der **„Partner-App“ am PC**: Partner anlegen, E-Mail-Adressen
eintippen, Felder/Freigaben/Dateien pflegen, Vorschau — alles fürs Handy bedienbar. Die
Cloud-Sitzung hat keinen Zugriff auf das private Repo **JKHD-Partner-Server** (PHP auf IONOS,
angebunden als https://api.jkhd.de), in dem die Partner-App und der Server vermutlich liegen.
Deine Aufgabe: reine **Analyse** und ein **Bericht als Datei** — nichts an App oder Server ändern,
nichts auf Server hochladen.

## Wo liegt der Code?

Suche neben dem Website-Klon (im selben Elternordner, z. B. `C:\Quant Arbeit\`) nach Ordnern wie
`JKHD-Partner-Server`, `JKHD-Partner-App`, `*Partner*`. Frage Julian nach dem Pfad, wenn du nichts
findest. Hinweise aus dem Website-Code (`js/main.js`, Abschnitt „Partnerseite“, ab Zeile ~1423;
`README.md`, Abschnitt „Partnerzugang“): Die Partner-App lädt `partner.html` lokal auf 127.0.0.1
mit `window.JKHD_VORSCHAU = true` und schickt Daten per `postMessage`; der Server liefert je
Partner `name`, `email`, `felder` [{label, wert}], `vip`, `module` (aus `api-daten/vip.json`),
`freigaben`, `dateien` [{id, name, typ, groesse, datum, text}], `ansicht` {begruessung, daten,
dateien, module, vip}, `passwort` {gesetzt, seit, ohne_altes_bis}; Partner pflegt Julian in
`api-daten/partner.json` auf dem Webspace.

## Was der Bericht beantworten muss

Mit Dateipfaden relativ zum jeweiligen Repo und Zeilenangaben, wo sinnvoll:

1. **Überblick Repo(s):** Aufbau, Technik (PHP-Version, Frameworks, wie der Server auf IONOS
   kommt, Deploy-Skripte), Kernaussagen des README.
2. **Die Partner-App (PC):** Wo sie liegt, Technik (Python/Tkinter, Electron, Browser-Oberfläche,
   PHP-Adminseite …), wie sie gestartet wird. **Alle** Bildschirme und Funktionen: Partner
   anlegen/bearbeiten/löschen (welche Felder genau), Dateien hochladen, VIP-Katalog pflegen,
   Vorschau der Partnerseite, Anfragen ansehen, KI-Fragen, Protokolle, Mails (was heißt „Mails
   eintippen“ konkret — Partner-Adressen eintragen? Mails an Partner schreiben? Vorlagen?). Je
   Funktion: Was passiert technisch (welche Datei wird geändert, welcher Aufruf geht an welchen
   Server).
3. **Wie die App Daten auf den Server bringt:** Admin-API (Routen, Authentifizierung:
   Token/Passwort/IP-Liste/Origin) oder Upload per FTP/SFTP/WebDAV (welche Dateien, wohin, welche
   Bibliothek) oder lokal bearbeiten + Deploy-Skript. Wo die Zugangsdaten liegen — **nur den Ort
   nennen, niemals Werte kopieren** (keine Passwörter, Tokens, Schlüssel, FTP-Daten, Salts in den
   Bericht).
4. **Der Server (api.jkhd.de):** Vollständige Routenliste mit Methode, Eingabe-JSON,
   Antworten/Statuscodes, Bremsen (Rate-Limits), Origin/CORS-Prüfungen (käme ein nativer
   Android-Client ohne Origin-Header durch?), Token-Mechanik, Mailversand (SMTP/mail(),
   Absender). Besonders: Routen nur für Julian/Admin.
5. **Datenmodell:** Exaktes Schema von `api-daten/partner.json` und `api-daten/vip.json` (alle
   Felder, Typen, Pflicht/optional, Beispiel mit erfundenen Werten), weitere Datendateien
   (Anfragen, Protokolle, Partner-Dateien, Passwort-Hashes — nur Struktur).
6. **Regeln für einen mobilen Client:** Rate-Limits, Token-Laufzeiten, Fehlerverhalten,
   Datenschutz-Hinweise im Repo.
7. **Empfehlung:** Was fehlt, damit ein Handy-Client dasselbe kann wie die PC-App? Ohne
   Admin-API: Vorschlag für eine minimale Admin-Schnittstelle auf dem bestehenden Server (Routen,
   Auth-Idee passend zum Code, betroffene PHP-Dateien, Aufwand). Mit Admin-API: genaue
   Aufrufreihenfolge eines typischen Ablaufs (Anmelden → Partner anlegen → Freigabe setzen → Datei
   hochladen → Vorschau).

Lies alle relevanten Dateien selbst; nichts aus dem Gedächtnis.

## Abgabe

1. Bericht auf Deutsch, gegliedert nach 1–7, als Datei `android/analyse-partner-app.md` im
   Website-Repo. Vorher `git fetch origin ccr-882e1add-b23dtn` und auf diesen Zweig wechseln
   (`git checkout ccr-882e1add-b23dtn`), damit der Bericht neben dem App-Code landet. Nur diese
   eine Datei anlegen, sonst nichts ändern.
2. Vor dem Commit prüfen, dass keine Geheimnisse im Bericht stehen (nach `passw`, `token`, `ftp`,
   `key`, `@` mit echten Adressen suchen; erfundene Beispielwerte sind in Ordnung).
3. Commit mit Nachricht „Analyse der Partner-App für die Android-App (Bericht)“ und
   `git push origin ccr-882e1add-b23dtn`.
4. Wenn dir ein Werkzeug zum Senden an andere Claude-Sitzungen zur Verfügung steht, schicke
   zusätzlich eine kurze Nachricht an die Sitzung `session_017PwvahVVV1Mav1XrbhwgBV`: „Bericht
   liegt in android/analyse-partner-app.md auf ccr-882e1add-b23dtn“. Sonst genügt der Push;
   Julian sagt der Cloud-Sitzung Bescheid.

Fertig ist die Aufgabe, wenn die Datei gepusht ist und Julian weiß, dass er der Cloud-Sitzung
„Bericht ist da“ schreiben kann.
