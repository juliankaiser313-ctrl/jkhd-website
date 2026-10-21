// JKHD-App: beim Oeffnen ein schwarzer Bildschirm, als Symbol das Zeichen (drei Balken).
// Keine Bibliotheken, nur das Android-Grundgeruest — das haelt die APK klein und den Bau einfach.
plugins {
    id("com.android.application")
}

// Umgebungsvariable lesen; leer gesetzt (wie bei fehlenden GitHub-Secrets) zaehlt als nicht gesetzt.
fun umgebung(name: String): String? = System.getenv(name)?.takeIf { it.isNotBlank() }

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
        versionName = "0.3"
    }

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
}
