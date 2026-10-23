package de.jkhd.app.webseite;

import android.os.SystemClock;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Der Zustand des Bereichs „Webseite“, solange er offen ist: der entsperrte Schlüssel, der Client,
 * der zuletzt gelesene Stand, die Arbeitskopie der Liste und was gerade im Hintergrund läuft.
 * Nichts davon wird auf dem Handy gespeichert — wie in der PC-App ist „geschlossen = weg“. Nur der
 * Schlüssel liegt verschlüsselt im Schluesselspeicher. Gesperrt (alles vergessen) wird beim
 * Verlassen des Bereichs und nach 15 Minuten im Hintergrund (die PC-App beendet sich ebenso).
 */
public final class WebseiteSitzung {

    /** So lange darf der Bereich im Hintergrund liegen, dann ist der Schlüssel wieder zu. */
    public static final long RUHE_MS = 15 * 60 * 1000L;

    private static WebseiteSitzung instanz;
    private static long imHintergrundSeit;
    private static boolean wegenRuheGesperrt;

    private byte[] schluessel;
    private Verwaltung verwaltung;
    /** Der zuletzt gelesene Stand des Servers (null, solange noch nichts geladen ist). */
    public Stand stand;
    /** Die Liste, wie sie vom Server kam. */
    public Partnerliste original;
    /** Die Liste mit den Änderungen dieser Sitzung. */
    public Partnerliste arbeit;
    /** Uhrzeit des letzten Lesens (bzw. Speicherns), z. B. „19:42“. */
    public String standUm = "";

    /** Läuft gerade Laden oder Speichern? (Überlebt das Drehen des Handys.) */
    public boolean arbeitLaeuft;
    /** Laufende Datei-Uploads — solange > 0, sind Speichern, Verwerfen und Neu laden gesperrt. */
    public int uploadsLaufen;
    /** Läuft gerade „Passwort entfernen“? */
    public boolean passwortLaeuft;
    /** Ergebnis, das noch keine sichtbare Seite angezeigt hat (z. B. weil gedreht wurde). */
    public String offenerFehler;
    public boolean offenerFehlerMitNochmal;
    public boolean offenerKonflikt;
    public String offeneMeldung;

    private WebseiteSitzung() {
    }

    public static synchronized WebseiteSitzung holen() {
        if (instanz == null) {
            instanz = new WebseiteSitzung();
        }
        return instanz;
    }

    public boolean entsperrt() {
        return schluessel != null;
    }

    public void entsperren(byte[] s) {
        schluessel = s.clone();
        verwaltung = new Verwaltung(schluessel);
    }

    /** Schlüssel aus dem Speicher nehmen und alles vergessen. */
    public static synchronized void sperren() {
        if (instanz != null && instanz.schluessel != null) {
            Arrays.fill(instanz.schluessel, (byte) 0);
        }
        instanz = null;
    }

    /** Eine Seite des Bereichs geht in den Hintergrund. */
    public static synchronized void pausiert() {
        imHintergrundSeit = SystemClock.elapsedRealtime();
    }

    /**
     * Eine Seite des Bereichs kommt nach vorn. Lag der Bereich länger als RUHE_MS im Hintergrund,
     * wird gesperrt; dann true (die Seite schließt sich bzw. holt den Schlüssel neu).
     */
    public static synchronized boolean fortgesetztAbgelaufen() {
        long seit = imHintergrundSeit;
        imHintergrundSeit = 0;
        if (seit != 0 && SystemClock.elapsedRealtime() - seit > RUHE_MS && instanz != null && instanz.entsperrt()
                && !instanz.beschaeftigt()) {
            sperren();
            wegenRuheGesperrt = true;
            return true;
        }
        return instanz == null || !instanz.entsperrt();
    }

    /** Einmal abfragen, ob zuletzt wegen Ruhe gesperrt wurde (für den Hinweis). */
    public static synchronized boolean wegenRuheGesperrtAbholen() {
        boolean w = wegenRuheGesperrt;
        wegenRuheGesperrt = false;
        return w;
    }

    public Verwaltung verwaltung() {
        return verwaltung;
    }

    public boolean geladen() {
        return stand != null && arbeit != null;
    }

    public void standUebernehmen(Stand s) {
        stand = s;
        original = s.liste;
        arbeit = s.liste.kopie();
        standUm = uhrzeit();
    }

    public List<Modul> katalog() {
        return stand == null ? java.util.Collections.<Modul>emptyList() : stand.katalog;
    }

    public Aenderungen aenderungen() {
        if (!geladen()) {
            return new Aenderungen();
        }
        return Aenderungen.ermitteln(original, arbeit, stand.katalog);
    }

    public Pruefung pruefung() {
        if (!geladen()) {
            return new Pruefung();
        }
        return Pruefung.pruefen(arbeit, stand.katalog);
    }

    public boolean geaendert() {
        return !aenderungen().leer();
    }

    /** Läuft irgendetwas, das Speichern/Verwerfen/Neu laden ausschließt? */
    public boolean beschaeftigt() {
        return arbeitLaeuft || uploadsLaufen > 0 || passwortLaeuft;
    }

    public void verwerfen() {
        if (original != null) {
            arbeit = original.kopie();
        }
    }

    public static String heute() {
        return new SimpleDateFormat("dd.MM.yyyy", Locale.GERMANY).format(new Date());
    }

    public static String uhrzeit() {
        return new SimpleDateFormat("HH:mm", Locale.GERMANY).format(new Date());
    }
}
