package de.jkhd.app.webseite;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Der Zustand des Bereichs „Webseite“, solange die App läuft: der entsperrte Schlüssel, der
 * Client, der zuletzt gelesene Stand, die Arbeitskopie der Liste. Nichts davon wird auf dem Handy
 * gespeichert — wie in der PC-App ist „geschlossen = weg“. Nur der Schlüssel liegt verschlüsselt
 * im Schluesselspeicher.
 */
public final class WebseiteSitzung {

    private static WebseiteSitzung instanz;

    private byte[] schluessel;
    private Verwaltung verwaltung;
    /** Der zuletzt gelesene Stand des Servers (null, solange noch nichts geladen ist). */
    public Stand stand;
    /** Die Liste, wie sie vom Server kam. */
    public Partnerliste original;
    /** Die Liste mit den Änderungen dieser Sitzung. */
    public Partnerliste arbeit;

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
