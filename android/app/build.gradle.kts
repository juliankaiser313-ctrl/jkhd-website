// JKHD-App: Kontrollzentrum mit den Bereichen Webseite (Partnerverwaltung) und Quant System.
// Keine Bibliotheken, nur das Android-Grundgeruest — das haelt die APK klein und den Bau einfach.
plugins {
    id("com.android.application")
}

// Umgebungsvariable lesen; leer gesetzt (wie bei fehlenden GitHub-Secrets) zaehlt als nicht gesetzt.
fun umgebung(name: String): String? = System.getenv(name)?.takeIf { it.isNotBlank() }

// Die Vorschau im Bereich Webseite zeigt die echte partner.html der Website. Die noetigen
// Dateien kommen beim Bau aus dem Website-Repo (eine Ebene ueber android/) in die Assets.
val websiteWurzel = rootProject.projectDir.parentFile
val websiteVorschauOrdner = layout.buildDirectory.dir("generated/website-vorschau")
val websiteVorschauKopieren = tasks.register<Copy>("websiteVorschauKopieren") {
    description = "Kopiert partner.html, CSS, main.js, Schriften und Logo der Website fuer die Vorschau in die Assets."
    from(websiteWurzel) {
        // css/*.css, nicht css/** — die KaTeX-Schriften (gut 300 KB) braucht partner.html nicht.
        include("partner.html", "favicon.svg", "css/*.css", "js/main.js", "assets/fonts/**", "assets/logo.png")
    }
    into(websiteVorschauOrdner.map { it.dir("website") })
}

android {
    namespace = "de.jkhd.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.jkhd.app"
        minSdk = 24
        targetSdk = 35
        // Die Laufnummer kann der Bau von aussen hochzaehlen (GitHub Actions: Nummer des Laufs),
        // damit sich eine neue APK ueber die alte installieren laesst.
        versionCode = umgebung("JKHD_VERSION_CODE")?.toIntOrNull() ?: 1
        versionName = "0.8"
    }

    sourceSets.getByName("main").assets.srcDir(websiteVorschauOrdner)

    // Signatur: Ein Schluessel ist zum Installieren Pflicht. Ohne eigene Angaben wird der
    // mitgelieferte Entwicklungsschluessel signing/jkhd-dev.jks genommen (Passwort jkhd-dev).
    // Der liegt im Repository und ist deshalb NICHT fuer den Play Store gedacht — dafuer einen
    // eigenen Schluessel anlegen und ueber die Umgebungsvariablen hereinreichen:
    //   JKHD_KEYSTORE_FILE, JKHD_KEYSTORE_PASSWORD, JKHD_KEY_ALIAS, JKHD_KEY_PASSWORD
    signingConfigs {
        create("jkhd") {
            storeFile = umgebung("JKHD_KEYSTORE_FILE")?.let { file(it) }
                ?: rootProject.file("signing/jkhd-dev.jks")
            storePassword = umgebung("JKHD_KEYSTORE_PASSWORD") ?: "jkhd-dev"
            keyAlias = umgebung("JKHD_KEY_ALIAS") ?: "jkhd"
            keyPassword = umgebung("JKHD_KEY_PASSWORD") ?: "jkhd-dev"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("jkhd")
        }
        debug {
            signingConfig = signingConfigs.getByName("jkhd")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }
}

tasks.named("preBuild") {
    dependsOn(websiteVorschauKopieren)
}

dependencies {
    // Nur fuer die Unit-Tests auf dem Rechner: JUnit 4 und ein echtes org.json
    // (das android.jar der Tests enthaelt nur Attrappen).
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}
