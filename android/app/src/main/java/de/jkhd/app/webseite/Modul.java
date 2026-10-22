package de.jkhd.app.webseite;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** Ein Modul des VIP-Katalogs (vip.json auf dem Server); der Katalog wird nur gelesen. */
public final class Modul {

    public final String id;
    public final String name;
    public final String kurz;
    public final String kurzEn;
    public final boolean neu;
    /** "anfrage" (Standard) oder "bald" (nur angekündigt, schlägt jede Freigabe). */
    public final String status;
    /** Nur https; der Server gibt ihn nur freigeschalteten Partnern. */
    public final String link;

    public Modul(String id, String name, String kurz, String kurzEn, boolean neu, String status, String link) {
        this.id = id;
        this.name = name;
        this.kurz = kurz == null ? "" : kurz;
        this.kurzEn = kurzEn == null ? "" : kurzEn;
        this.neu = neu;
        this.status = "bald".equals(status) ? "bald" : "anfrage";
        this.link = link == null ? "" : link;
    }

    public boolean bald() {
        return "bald".equals(status);
    }

    public static Modul ausJson(JSONObject o) {
        return new Modul(o.optString("id", ""), o.optString("name", ""), o.optString("kurz", ""),
                o.optString("kurz_en", ""), o.optBoolean("neu", false), o.optString("status", "anfrage"),
                o.optString("link", ""));
    }

    /** Liest einen Katalog; Einträge ohne id oder name werden übergangen (wie der Server). */
    public static List<Modul> listeAusJson(JSONArray a) {
        List<Modul> liste = new ArrayList<>();
        if (a == null) {
            return liste;
        }
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o == null) {
                continue;
            }
            Modul m = ausJson(o);
            if (!m.id.isEmpty() && !m.name.isEmpty()) {
                liste.add(m);
            }
        }
        return liste;
    }

    /** Wie die Partnerseite ein Modul erwartet; mitLink nur für freigeschaltete, nicht angekündigte. */
    public JSONObject zuJson(boolean mitLink) throws JSONException {
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("name", name);
        o.put("kurz", kurz);
        o.put("kurz_en", kurzEn);
        o.put("neu", neu);
        o.put("status", status);
        if (mitLink && !link.isEmpty()) {
            o.put("link", link);
        }
        return o;
    }

    public static Modul finde(List<Modul> katalog, String id) {
        for (Modul m : katalog) {
            if (m.id.equals(id)) {
                return m;
            }
        }
        return null;
    }
}
