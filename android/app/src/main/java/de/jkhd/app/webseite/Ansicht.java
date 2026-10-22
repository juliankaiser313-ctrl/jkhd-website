package de.jkhd.app.webseite;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Wie der Partner seine Seite sieht: Begrüßung und welche Bereiche erscheinen.
 * Gespeichert werden nur Abweichungen vom Standard (alles sichtbar, keine Begrüßung).
 */
public final class Ansicht {

    public static final int BEGRUESSUNG_MAX = 1000;

    public String begruessung = "";
    public boolean daten = true;
    public boolean dateien = true;
    public boolean module = true;
    public boolean vip = true;

    public static Ansicht ausJson(JSONObject o) {
        Ansicht a = new Ansicht();
        if (o == null) {
            return a;
        }
        a.begruessung = o.optString("begruessung", "");
        a.daten = o.optBoolean("daten", true);
        a.dateien = o.optBoolean("dateien", true);
        a.module = o.optBoolean("module", true);
        a.vip = o.optBoolean("vip", true);
        return a;
    }

    /** Nur Abweichungen; null, wenn alles Standard ist. */
    public JSONObject zuJson() throws JSONException {
        JSONObject o = new JSONObject();
        if (!begruessung.isEmpty()) {
            o.put("begruessung", begruessung);
        }
        if (!daten) {
            o.put("daten", false);
        }
        if (!dateien) {
            o.put("dateien", false);
        }
        if (!module) {
            o.put("module", false);
        }
        if (!vip) {
            o.put("vip", false);
        }
        return o.length() == 0 ? null : o;
    }

    /** Vollständig, wie /daten sie liefert (für die Vorschau). */
    public JSONObject vollstaendig() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("begruessung", begruessung);
        o.put("daten", daten);
        o.put("dateien", dateien);
        o.put("module", module);
        o.put("vip", vip);
        return o;
    }

    public Ansicht kopie() {
        Ansicht a = new Ansicht();
        a.begruessung = begruessung;
        a.daten = daten;
        a.dateien = dateien;
        a.module = module;
        a.vip = vip;
        return a;
    }

    public boolean istStandard() {
        return begruessung.isEmpty() && daten && dateien && module && vip;
    }

    @Override
    public boolean equals(Object andere) {
        if (!(andere instanceof Ansicht)) {
            return false;
        }
        Ansicht a = (Ansicht) andere;
        return begruessung.equals(a.begruessung) && daten == a.daten && dateien == a.dateien && module == a.module && vip == a.vip;
    }

    @Override
    public int hashCode() {
        return begruessung.hashCode();
    }
}
