# JKHD-App (Android)

Stand 21.10.2026 (Fassung 0.5): Beim Öffnen zuerst der Ladebildschirm — schwarz, in der Mitte das
Marken-Lockup groß, unten ein Ladebalken, der in gut einer Sekunde volläuft (länger, wenn das Laden
länger dauert) und dann ausblendet. Dahinter das Kontrollzentrum: oben links klein dasselbe Lockup
(Zeichen, JKHD, „Quant Systems / Just Know How to Dominate.“), darunter die Überschrift
„Kontrollzentrum“ und die Vierecke, je eines pro Bereich — „Webseite“ (Dashboard, Partnerzugänge)
und „Quant System“ (Steuerung); zwei Plätze sind frei für weitere Bereiche. Ein Tipp auf ein Viereck
öffnet die Seite des Bereichs, bisher ein Platzhalter („In Vorbereitung“) — dort entstehen später
die Dashboards. Schriften wie auf der Website (Playfair Display für Überschriften, Manrope sonst).
Auf dem Handy heißt die App „JKHD“ und trägt das Zeichen (drei Balken) als Symbol.

```
app/src/main/AndroidManifest.xml          zwei Activities (Start, Bereich), Startsymbol, Thema
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
installierte App annimmt und deren Daten und Rechte übernimmt. Für die jetzige App ohne Daten ist
das tragbar — deshalb nur APKs von der eigenen Release-Seite oder aus diesem Gespräch installieren.
**Bevor die App Zugänge speichert oder der Download-Link weitergegeben wird**, einen eigenen,
privaten Schlüssel anlegen (`keytool -genkeypair …`, Datei **nicht** ins Repository — die
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
Keine Abhängigkeiten, kein Kotlin, kein AndroidX — die APK ist rund 230 KB groß (davon rund
125 KB die drei Schriftdateien und 70 KB die Lockup-Bilder).
