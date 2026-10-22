package de.jkhd.app.webseite;

import org.json.JSONObject;

/** Was der Server über das Passwort eines Partners verrät: nur Daten, nie Hashes. */
public final class Passwortstatus {

    /** Datum, seit dem das Passwort gilt (Text vom Server, z. B. "22.10.2026"). */
    public final String seit;
    /** Datum der letzten Bestätigung per Code (Text vom Server). */
    public final String bestaetigt;

    public Passwortstatus(String seit, String bestaetigt) {
        this.seit = seit == null ? "" : seit;
        this.bestaetigt = bestaetigt == null ? "" : bestaetigt;
    }

    public static Passwortstatus ausJson(JSONObject o) {
        return new Passwortstatus(o.optString("seit", ""), o.optString("bestaetigt", ""));
    }
}
