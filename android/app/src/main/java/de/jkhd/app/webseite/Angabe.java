package de.jkhd.app.webseite;

import org.json.JSONException;
import org.json.JSONObject;

/** Eine Angabe zum Partner, die er nach der Anmeldung sieht: Bezeichnung und Wert. */
public final class Angabe {

    public static final int LABEL_MAX = 60;
    public static final int WERT_MAX = 300;

    public String label;
    public String wert;

    public Angabe(String label, String wert) {
        this.label = label == null ? "" : label;
        this.wert = wert == null ? "" : wert;
    }

    public static Angabe ausJson(JSONObject o) {
        return new Angabe(o.optString("label", ""), o.optString("wert", ""));
    }

    public JSONObject zuJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("label", label);
        o.put("wert", wert);
        return o;
    }

    public Angabe kopie() {
        return new Angabe(label, wert);
    }

    @Override
    public boolean equals(Object andere) {
        if (!(andere instanceof Angabe)) {
            return false;
        }
        Angabe a = (Angabe) andere;
        return label.equals(a.label) && wert.equals(a.wert);
    }

    @Override
    public int hashCode() {
        return label.hashCode() * 31 + wert.hashCode();
    }
}
