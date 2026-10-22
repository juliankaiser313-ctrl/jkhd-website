package de.jkhd.app.webseite;

import org.json.JSONException;
import org.json.JSONObject;

/** Eine Rolle aus _rollen in partner.json: Name und ob sie alle Module freischaltet. Der Server kennt Rollen nur als Angabe. */
public final class Rolle {

    public static final int NAME_MAX = 80;
    public static final int ANZAHL_MAX = 30;
    public static final String ANGABE_LABEL = "Rolle";

    public String name;
    public boolean alleModule;

    public Rolle(String name, boolean alleModule) {
        this.name = name == null ? "" : name;
        this.alleModule = alleModule;
    }

    public static Rolle ausJson(JSONObject o) {
        return new Rolle(o.optString("name", ""), o.optBoolean("alle_module", false));
    }

    public JSONObject zuJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("name", name);
        o.put("alle_module", alleModule);
        return o;
    }

    public Rolle kopie() {
        return new Rolle(name, alleModule);
    }

    @Override
    public boolean equals(Object andere) {
        if (!(andere instanceof Rolle)) {
            return false;
        }
        Rolle r = (Rolle) andere;
        return name.equals(r.name) && alleModule == r.alleModule;
    }

    @Override
    public int hashCode() {
        return name.hashCode();
    }
}
