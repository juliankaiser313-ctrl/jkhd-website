# JKHD-App (Android)

Stand 26.10.2026 (Fassung 0.8): Beim Öffnen zuerst der Ladebildschirm — schwarz, in der Mitte das
Marken-Lockup groß, unten ein Ladebalken, der in gut einer Sekunde volläuft (länger, wenn das Laden
länger dauert) und dann ausblendet. Dahinter das Kontrollzentrum: oben links klein dasselbe Lockup
(Zeichen, JKHD, „Quant Systems / Just Know How to Dominate.“), darunter die Überschrift
„Kontrollzentrum“ und die Vierecke, je eines pro Bereich — 01 „Webseite“ (Dashboard,
Partnerzugänge), 02 „Quant System“ (Steuerung), 03 „Multi-Broker“ (Trading auf allen Konten); ein
Platz ist frei. **„Webseite“ ist seit Fassung 0.6 die Partnerverwaltung**, **„Multi-Broker“ seit 0.8
die Trading-Oberfläche vom PC** (beides siehe unten), „Quant System“ noch ein Platzhalter
(„In Vorbereitung“). Schriften wie auf der Website (Playfair Display für Überschriften, Manrope
sonst). Auf dem Handy heißt die App „JKHD“ und trägt das Zeichen (drei Balken) als Symbol.

```
app/src/main/AndroidManifest.xml          Activities (Start, Bereich, Webseite, Multi-Broker), INTERNET, Startsymbol, Thema
app/src/main/java/de/jkhd/app/
  Bereich.java                            die Bereiche: Titel, Untertitel, Beschreibung (Texte in strings.xml);
                                          neuer Bereich = ein Eintrag hier, Platz auf dem Start ist für vier
  MainActivity.java                       Startbildschirm: zeigt den Ladebildschirm, lädt im Hintergrund die
                                          Schriften, belegt dann die vier Plätze mit den Bereichen
  Ladebildschirm.java                     steuert den Ladebalken: Grundlauf bis 85 %, voll + ausblenden, wenn die
                                          Arbeit gemeldet ist; später für Anmeldung/Daten wiederverwendbar
  BereichActivity.java                    Seite eines Bereichs (Platzhalter), Zurück
  QuadratKachel.java                      FrameLayout, das quadratisch bleibt (nur bei sehr großer Systemschrift
                                          so viel höher wie nötig, statt Text abzuschneiden)
  Schriften.java                          lädt die Schriften aus assets/fonts (Playfair Display 500, Manrope 500/700)
                                          und setzt sie auf ganze Ansichten (Tag „serif“ = Überschrift, „mono“ = bleibt)
  webseite/                               der Bereich Webseite = Partnerverwaltung (Abschnitt unten)
  multibroker/                            der Bereich Multi-Broker = Trading-Oberfläche vom PC (Abschnitt unten)
app/src/test/java/de/jkhd/app/webseite/  Unit-Tests des Kerns, inkl. Übungsserver für /verwaltung (VerwaltungAttrappe)
app/src/main/assets/fonts/                die Schriften als feste Schnitte, aus den variablen Dateien der Website
                                          (assets/fonts) erzeugt; OFL-Lizenztexte daneben
app/src/main/res/drawable-*dpi/lockup.png das Marken-Lockup, mit Chromium aus dem Website-CSS (.brand, dunkel)
                                          gerendert, je Dichte für 24 dp Höhe (Schriften Manrope + Cascadia Code)
app/src/main/res/drawable-*dpi/lockup_gross.png  dasselbe für den Ladebildschirm, 320 dp breit
app/src/main/res/drawable/ladebalken.xml  der Ladebalken (dunkle Spur, heller Fortschritt)
app/src/main/res/layout/ladebildschirm.xml  Ladebildschirm: Lockup groß in der Mitte, Balken unten
app/src/main/res/layout/activity_main.xml Inhalt (Lockup, Überschrift, 2 × 2 Plätze, scrollbar) + Ladebildschirm darüber;
                                          eine ganz leere zweite Reihe wird ausgeblendet
app/src/main/res/layout-land/activity_main.xml  Querformat: dieselben Ids, die vier Plätze in einer Reihe
app/src/main/res/layout/kachel.xml        ein Viereck: Nummer, dehnbarer Zwischenraum, Titel, Untertitel (mit „…“ bei Platznot)
app/src/main/res/layout/activity_bereich.xml  Platzhalterseite
app/src/main/res/drawable/kachel_hintergrund.xml  Fläche, Rand, runde Ecken, Druck-Schimmer
app/src/main/res/values/{colors,dimens}.xml  Farben (monochrom, wie die Website) und Maße
app/src/main/res/values/styles.xml        Thema: Fenster, Status- und Navigationsleiste schwarz
app/src/main/res/values-v29/styles.xml    ab Android 10: kein Schleier über den Leisten
app/src/main/res/values-v31/styles.xml    ab Android 12: auch der Begrüßungsschirm schwarz, ohne Symbol
app/src/main/res/drawable/ic_launcher_foreground.xml   die drei Balken als Vektor (Vordergrund des Symbols)
app/src/main/res/mipmap-anydpi-v26/       anpassbares Symbol (Android 8+): Balken auf #060607, dazu Einfarb-Fassung
app/src/main/res/mipmap-*dpi/             feste PNG-Symbole aus assets/logo.png (Android 7)
app/build.gradle.kts                      Paket de.jkhd.app, minSdk 24 (Android 7), targetSdk 35, keine Bibliotheken
signing/jkhd-dev.jks                      Entwicklungsschlüssel (siehe unten)
```

## Bereich Webseite — die Partnerverwaltung auf dem Handy

Seit Fassung 0.6 kann die App unter „Webseite“ dasselbe wie die **Partner-App auf dem PC**
(`JKHD-Partner-Server/verwaltung/`, Analyse in `analyse-partner-app.md`): Partner anlegen,
E-Mail-Adresse, Name, Rolle, Module (Freigaben), Angaben, Dateien hochladen, Ansicht (Begrüßung,
vier Schalter, „für alle übernehmen“), interne Notiz, Partner entfernen, Rollen pflegen, Passwort
eines Partners entfernen, Vorschau der Partnerseite. Es gibt keine eigene Schnittstelle fürs Handy —
die App spricht genau wie die PC-App mit `POST https://api.jkhd.de/verwaltung` (Aktionen `lesen`,
`schreiben`, `datei_hochladen`, `passwort_entfernen`), jede Anfrage HMAC-SHA256-unterschrieben, mit
Zeitstempel (Uhr über `GET /ping` abgeglichen), Einmal-Wert, ohne Origin-Kopf. Am Server war nichts
zu ändern.

**Der Schlüssel.** Die Unterschrift braucht denselben Schlüssel wie die PC-App (64 Hex-Zeichen).
Beim ersten Öffnen fragt die App danach. Am PC ausgeben:

```
python verwaltung\partnerverwaltung.py --schluessel-ausgeben DATEI
```

Inhalt der Datei in die App eintippen oder einfügen, Datei danach löschen (nie per Mail oder
Messenger schicken). Die App legt den Schlüssel mit einem Schlüssel aus dem **Android-Keystore**
verschlüsselt ab, der nur kurz nach einer Bestätigung der **Bildschirmsperre** benutzbar ist — ohne
Bildschirmsperre speichert die App ihn nicht. Beim Öffnen des Bereichs fragt Android deshalb nach
PIN/Muster/Fingerabdruck. „Schlüssel vom Handy entfernen“ unten in der Liste löscht ihn wieder.
Besser als derselbe Schlüssel auf PC und Handy wäre ein eigener je Gerät, einzeln widerrufbar —
das ist eine kleine Server-Ergänzung (Bericht, Abschnitt 7.2, „Weg B“), bislang nicht umgesetzt.

**So läuft es** (`webseite/`):

```
WebseiteActivity.java      die Partnerliste: Suche, „+ Partner“, Rollen, Neu laden, Speicherleiste
                           (n Änderungen, Verwerfen, Speichern mit Änderungsliste), Marken ● geändert / ! Beanstandung;
                           beim Öffnen Schlüssel holen → Sperre bestätigen → Liste laden (Ladebildschirm)
PartnerActivity.java       ein Partner: Adresse, Name, Rolle, Passwortstatus (+ sofort entfernen), Module,
                           Angaben, Dateien (sofort hochladen, zugeordnet erst mit Speichern), Ansicht, Vorschau,
                           Notiz, bisherige Adresse, Partner entfernen, Fertig
RollenActivity.java        Rollen: umbenennen (zieht die Angabe bei allen Partnern mit), „alle Module“, entfernen, neu
VorschauActivity.java      die echte partner.html der Website in einer WebView (Dateien aus assets/website, beim Bau
                           aus dem Website-Repo kopiert — Gradle-Task websiteVorschauKopieren), data-api="",
                           window.JKHD_VORSCHAU = true, Daten als message-Ereignis wie von /daten
SchluesselActivity.java    Schlüssel eingeben; Schluesselspeicher.java verschlüsselt ihn (Keystore, Bildschirmsperre)
WebseiteSitzung.java       Zustand, solange die App läuft: Schlüssel im Speicher, Stand, Arbeitskopie (geschlossen = weg)
Verwaltung.java            der Client für /verwaltung; Unterschrift.java die Unterschrift; Stand.java die Antwort von „lesen“
Partnerliste/Partner/…     das Datenmodell wie partner.json (Rolle = erste Angabe „Rolle“, Rollen mit „alle Module“
                           bekommen beim Bauen alle Katalog-IDs, fremde Freigaben bleiben)
Pruefung.java              Prüfung vor dem Speichern mit den Grenzen des Servers; Aenderungen.java die Änderungsliste
VorschauDaten.java         baut aus einem Eintrag die Form von /daten für die Vorschau
```

Gespeichert wird immer die **ganze Liste** mit der Fassung (`basis`) des letzten Lesens
(`Speichervorgang.java`). Geht die Antwort verloren (Netz) oder sagt der Server 409, liest die App
nach: steht inhaltlich genau das Gesendete schon auf dem Server, war es das eigene Speichern und gilt
als gelungen; sonst hat die PC-App inzwischen gespeichert, und die App bietet „Neu laden“ an. Nach
einer 408 („zu alt“) gleicht der Client die Uhr neu ab und wiederholt einmal. Dateien gehen
stückweise hinaus (die Datei liegt nur einmal im Speicher).

Sicherheit und Ablauf (seit 0.7): Beim **Verlassen des Bereichs** und nach **15 Minuten im
Hintergrund** wird der Schlüssel aus dem Speicher genommen und alles Ungespeicherte vergessen (wie
die PC-App, die sich nach 15 Minuten ohne Lebenszeichen beendet); mit ungespeicherten Änderungen
fragt die App vorher. Solange ein Upload, Laden, Speichern oder „Passwort entfernen“ läuft, sind
Speichern, Verwerfen, Neu laden und Verlassen gesperrt. Laden, Speichern und Uploads überleben das
Drehen des Handys; ein fertiger Upload landet beim richtigen Partner. Die Schlüsseleingabe erlaubt
keine Bildschirmfotos. Links in der Vorschau öffnen die Website im Browser. Nicht übernommen wurde der Spiegel-Commit von
`partner.json` ins Server-Repo (das macht die PC-App beim nächsten Start). Was die PC-App nicht
kann (VIP-Katalog pflegen, Anfragen lesen, Mails schreiben), kann die App auch nicht — dafür müsste
der Server neue Aktionen bekommen (Bericht, Abschnitt 7.5).

Tests: `cd android && ./gradlew :app:testReleaseUnitTest` — Unterschrift (bekannter HMAC-Vektor,
Umlaute), Adressen, Lesen/Bauen der Liste, Prüfung, Änderungsliste, Vorschaudaten und der Client
gegen einen Übungsserver (`VerwaltungAttrappe`), der Unterschrift, Zeitfenster, Einmal-Wert,
Origin-Verbot, 409/400/503 nachbildet. GitHub Actions lässt sie vor jedem Bau laufen.

## Bereich Multi-Broker — die Trading-Oberfläche vom PC (seit 0.8)

Der Multi-Broker ist eine Webseite, die auf dem PC läuft (Port 8800, nur `127.0.0.1`) und über
Tailscale ans Handy kommt: auf dem PC einmal `tailscale serve --bg 8800`, dann ist sie unter
`https://<pc-name>.<tailnet>.ts.net` erreichbar — mit gültigem HTTPS und nur für die eigenen Geräte.
Die App zeigt sie in einer WebView im Vollbild (`multibroker/MultiBrokerActivity.java`). Am
Multi-Broker und an api.jkhd.de ist dafür nichts geändert.

- **Adresse:** Beim ersten Tipp aufs Viereck fragt die App nach der Adresse (Beispiel
  `https://mein-pc.tail1234.ts.net`; die echte steht nur auf dem Handy, in SharedPreferences
  „multibroker“ unter `multibroker_url`). Angenommen wird nur https; fehlt „https://“, wird es
  ergänzt, „http://“ wird abgelehnt. **Langes Drücken aufs Viereck** öffnet den Dialog erneut.
  Prüfung und Link-Regel: `multibroker/MultiBrokerAdresse.java`, Tests `MultiBrokerAdresseTest`.
- **Anmeldung:** Der Multi-Broker hat seinen eigenen Login (`/login`, Sitzungs-Cookie 30 Tage,
  HttpOnly). Die App speichert **kein Passwort**; sie nimmt Cookies an (keine von Dritten) und
  schreibt sie nach jedem Laden und beim Verlassen auf die Platte (`CookieManager.flush()`), damit
  die Anmeldung einen Neustart der App übersteht.
- **Links:** Nur Seiten auf genau diesem Rechner (https, gleicher Host und Port) laden in der App;
  fremde Links, E-Mail- und Telefonlinks öffnen sich im Browser bzw. der passenden App;
  `javascript:`, `file:`, `intent:` und Ähnliches werden nicht geöffnet. Eingebettete Inhalte (z. B.
  Charts in einem iframe) dürfen von anderswo kommen.
- **Fehler:** Lädt die Hauptseite nicht (kein Netz, PC aus, Tailscale aus, HTTP ab 500 — z. B. 502,
  wenn `tailscale serve` läuft, der Multi-Broker aber nicht, ungültiges Zertifikat), zeigt die App
  statt eines schwarzen Bildes „PC nicht erreichbar — Läuft der Multi-Broker? Ist Tailscale auf dem
  Handy eingeschaltet?“ mit „Erneut versuchen“ und „Adresse ändern“. Beim Laden läuft oben ein
  dünner Ladebalken im App-Design.
- **Bedienung:** Zurück geht erst in der Seite zurück, dann zum Kontrollzentrum. Beim Drehen wird
  die Seite nicht neu aufgebaut (`configChanges`), Eingaben bleiben stehen. JavaScript-Rückfragen
  der Seite (`confirm`, `alert`) erscheinen als Android-Dialog. Kein Klartext-Verkehr
  (`usesCleartextTraffic` ist nicht gesetzt, Standard: aus), kein Dateizugriff aus der Seite.

## Auf das Handy bekommen

- **Von GitHub:** Jeder Push auf `main`, der `android/` berührt, baut die APK und legt sie als
  Veröffentlichung „app-aktuell“ ab: `https://github.com/juliankaiser313-ctrl/jkhd-website/releases/tag/app-aktuell`
  → `JKHD.apk` auf dem Handy herunterladen und öffnen. Beim ersten Mal fragt Android, ob Apps
  aus dieser Quelle (Browser oder Dateien-App) installiert werden dürfen — zulassen.
  Auf anderen Zweigen hängt die APK als Artefakt am Lauf „Android-App“ unter „Actions“.
- **Selbst bauen:** Android Studio → „Open“ → Ordner `android/` → Run. Oder auf der Kommandozeile
  (JDK 17): `cd android && ./gradlew :app:assembleRelease`, Ergebnis unter
  `app/build/outputs/apk/release/app-release.apk`.
- **iPhone:** geht so nicht — Apple lässt nur Apps aus dem App Store oder über Xcode zu. Diese App
  ist reines Android.

Eine neue Fassung lässt sich über die alte installieren, solange derselbe Schlüssel signiert hat
und die Laufnummer (`versionCode`) nicht kleiner ist; GitHub setzt sie auf die Nummer des Laufs.

## Signatur

Android installiert nur signierte APKs. Ohne weitere Angaben signiert der Bau mit dem
mitgelieferten Entwicklungsschlüssel `signing/jkhd-dev.jks` (Alias `jkhd`, Passwort `jkhd-dev`,
gültig bis 2054). **Der Schlüssel liegt samt Passwort im öffentlichen Repository.** Das heißt:
Jeder kann damit eine APK mit dem Paketnamen `de.jkhd.app` bauen, die Android als Update über die
installierte App annimmt und deren Daten und Rechte übernimmt. **Seit Fassung 0.6 bewahrt die App
den Schlüssel der Partnerverwaltung auf** (verschlüsselt, hinter der Bildschirmsperre). Ein
untergeschobenes „Update“ mit dem öffentlichen Signaturschlüssel erbte diesen Speicher und könnte
selbst nach der Bildschirmsperre fragen. Deshalb: nur APKs von der eigenen Release-Seite oder aus
dem Gespräch mit Claude installieren, und **bald** einen eigenen, privaten Signaturschlüssel
anlegen (`keytool -genkeypair …`, Datei **nicht** ins Repository — die
`.gitignore` hier blockt `*.jks`) und dem Bau über Umgebungsvariablen geben — lokal direkt, auf
GitHub als Secrets, die der Workflow `.github/workflows/android.yml` nur den zwei Schritten gibt,
die sie brauchen:

| Variable / Secret        | Bedeutung                                              |
|--------------------------|--------------------------------------------------------|
| `JKHD_KEYSTORE_FILE`     | Pfad zur Keystore-Datei (lokal)                        |
| `JKHD_KEYSTORE_BASE64`   | dieselbe Datei base64-kodiert (nur GitHub-Secret)      |
| `JKHD_KEYSTORE_PASSWORD` | Passwort des Keystores                                 |
| `JKHD_KEY_ALIAS`         | Name des Schlüssels im Keystore                        |
| `JKHD_KEY_PASSWORD`      | Passwort des Schlüssels                                |

Wechselt der Schlüssel, muss die alte App einmal vom Handy gelöscht werden — Android lässt kein
Update mit fremder Signatur zu.

## Werkzeuge

Android Gradle Plugin 8.13.2, Gradle 8.14.3 (über `gradlew`), JDK 17, compileSdk 35.
Keine Abhängigkeiten, kein Kotlin, kein AndroidX (nur JUnit 4 und org.json für die Tests auf dem
Rechner) — die APK ist rund 480 KB groß (davon rund 125 KB die drei Schriftdateien, 70 KB die
Lockup-Bilder und 230 KB die Website-Dateien für die Vorschau).
