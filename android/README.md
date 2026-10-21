# JKHD-App (Android)

Stand 21.10.2026 (Fassung 0.2): schwarzer Startbildschirm mit Vierecken, je eines pro Bereich —
„Webseite“ (Dashboard, Partnerzugänge) und „Quant System“ (Steuerung); zwei Plätze sind frei für
weitere Bereiche. Ein Tipp auf ein Viereck öffnet die Seite des Bereichs, bisher ein Platzhalter
(„In Vorbereitung“) — dort entstehen später die Dashboards. Auf dem Handy heißt die App „JKHD“ und
trägt das Zeichen (drei Balken) als Symbol.

```
app/src/main/AndroidManifest.xml          zwei Activities (Start, Bereich), Startsymbol, Thema
app/src/main/java/de/jkhd/app/
  Bereich.java                            die Bereiche: Titel, Untertitel, Beschreibung (Texte in strings.xml);
                                          neuer Bereich = ein Eintrag hier, Platz auf dem Start ist für vier
  MainActivity.java                       Startbildschirm, belegt die vier Plätze mit den Bereichen
  BereichActivity.java                    Seite eines Bereichs (Platzhalter), Zurück
  QuadratKachel.java                      FrameLayout, das immer quadratisch bleibt
app/src/main/res/layout/activity_main.xml 2 × 2 Plätze (include kachel.xml), zentriert, scrollbar
app/src/main/res/layout/kachel.xml        ein Viereck: Nummer, Titel, Untertitel
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
gültig bis 2054). Der liegt im öffentlichen Repository und ist deshalb nur zum Ausprobieren gedacht,
nicht für den Play Store. Für eine echte Veröffentlichung einen eigenen Schlüssel anlegen
(`keytool -genkeypair …`) und dem Bau über Umgebungsvariablen geben — lokal direkt, auf GitHub als
Secrets, die der Workflow `.github/workflows/android.yml` von selbst durchreicht:

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
Keine Abhängigkeiten, kein Kotlin, kein AndroidX — die APK ist rund 35 KB groß.
