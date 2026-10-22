package de.jkhd.app.webseite;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/** Eine für den Partner hinterlegte Datei: auf dem Server liegt sie unter ihrer id, hier Name und Beschreibung. */
public final class Datei {

    /** Erlaubte Endungen, wie in der PC-App und auf dem Server. */
    public static final List<String> ENDUNGEN = Arrays.asList(
            "pdf", "png", "jpg", "jpeg", "webp", "gif", "txt", "csv", "docx", "xlsx", "pptx", "zip", "mp4");
    public static final long GROESSE_MAX = 15L * 1024 * 1024;
    public static final int NAME_MAX = 120;
    public static final int TEXT_MAX = 300;

    public String id;
    public String name;
    public long groesse;
    public String datum;
    public String text;
    /** Hochgeladen, aber noch nicht gespeichert (nur in dieser Sitzung). */
    public boolean neu;

    public Datei(String id, String name, long groesse, String datum, String text) {
        this.id = id == null ? "" : id;
        this.name = name == null ? "" : name;
        this.groesse = groesse;
        this.datum = datum == null ? "" : datum;
        this.text = text == null ? "" : text;
    }

    public static Datei ausJson(JSONObject o) {
        return new Datei(o.optString("id", ""), o.optString("name", ""), o.optLong("groesse", 0),
                o.optString("datum", ""), o.optString("text", ""));
    }

    public JSONObject zuJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("name", name);
        o.put("groesse", groesse);
        o.put("datum", datum);
        if (!text.isEmpty()) {
            o.put("text", text);
        }
        return o;
    }

    public Datei kopie() {
        Datei d = new Datei(id, name, groesse, datum, text);
        d.neu = neu;
        return d;
    }

    /** Endung in Kleinbuchstaben, "" ohne Punkt. */
    public static String endung(String name) {
        if (name == null) {
            return "";
        }
        int punkt = name.lastIndexOf('.');
        return punkt < 0 ? "" : name.substring(punkt + 1).toLowerCase(Locale.ROOT);
    }

    /** Typ-Marke wie auf der Partnerseite (die Endung groß). */
    public static String typ(String name) {
        return endung(name).toUpperCase(Locale.ROOT);
    }

    /** Prüft den Dateinamen wie die PC-App; null = in Ordnung, sonst der Grund. */
    public static String nameProblem(String name) {
        if (name == null || name.isEmpty()) {
            return "Die Datei hat keinen Namen.";
        }
        if (name.length() > NAME_MAX) {
            return "Der Dateiname ist länger als " + NAME_MAX + " Zeichen.";
        }
        if (name.contains("/") || name.contains("\\") || name.startsWith(".")) {
            return "Der Dateiname darf keinen Schrägstrich enthalten und nicht mit einem Punkt beginnen.";
        }
        if (!ENDUNGEN.contains(endung(name))) {
            return "Diese Art Datei ist nicht erlaubt (erlaubt: " + String.join(", ", ENDUNGEN) + ").";
        }
        return null;
    }

    @Override
    public boolean equals(Object andere) {
        if (!(andere instanceof Datei)) {
            return false;
        }
        Datei d = (Datei) andere;
        return id.equals(d.id) && name.equals(d.name) && groesse == d.groesse && datum.equals(d.datum) && text.equals(d.text);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
