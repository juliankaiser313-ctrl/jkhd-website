package de.jkhd.app.webseite;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Ein Partnereintrag, wie ihn die PC-App führt: die Angabe mit dem Label „Rolle“ wird aus den
 * Feldern herausgezogen und als Rolle geführt; beim Bauen steht sie wieder als erste Angabe drin.
 */
public final class Partner {

    public static final int NAME_MAX = 120;
    public static final int NOTIZ_MAX = 2000;
    public static final int ANGABEN_MAX = 20;
    public static final int FREIGABEN_MAX = 50;
    public static final int DATEIEN_MAX = 50;

    /** Die Anmeldeadresse = Schlüssel des Eintrags. */
    public String email;
    public String name = "";
    public String rolle = "";
    public final List<Angabe> felder = new ArrayList<>();
    public final List<String> freigaben = new ArrayList<>();
    public String notiz = "";
    public final List<Datei> dateien = new ArrayList<>();
    public Ansicht ansicht = new Ansicht();
    /** Adresse, unter der der Eintrag vom Server kam (null = in dieser Sitzung neu angelegt). */
    public String bisherigeAdresse;

    public Partner(String email) {
        this.email = email == null ? "" : email;
    }

    public static Partner ausJson(String email, JSONObject o) {
        Partner p = new Partner(email);
        p.bisherigeAdresse = email;
        p.name = o.optString("name", "");
        JSONArray felder = o.optJSONArray("felder");
        if (felder != null) {
            for (int i = 0; i < felder.length(); i++) {
                JSONObject f = felder.optJSONObject(i);
                if (f == null) {
                    continue;
                }
                Angabe a = Angabe.ausJson(f);
                if (a.label.equals(Rolle.ANGABE_LABEL) && p.rolle.isEmpty()) {
                    p.rolle = a.wert;
                } else {
                    p.felder.add(a);
                }
            }
        }
        JSONArray freigaben = o.optJSONArray("freigaben");
        if (freigaben != null) {
            for (int i = 0; i < freigaben.length(); i++) {
                String id = freigaben.optString(i, "");
                if (!id.isEmpty() && !p.freigaben.contains(id)) {
                    p.freigaben.add(id);
                }
            }
        }
        p.notiz = o.optString("notiz", "");
        JSONArray dateien = o.optJSONArray("dateien");
        if (dateien != null) {
            for (int i = 0; i < dateien.length(); i++) {
                JSONObject d = dateien.optJSONObject(i);
                if (d != null) {
                    p.dateien.add(Datei.ausJson(d));
                }
            }
        }
        p.ansicht = Ansicht.ausJson(o.optJSONObject("ansicht"));
        return p;
    }

    /**
     * Der Eintrag, wie er in partner.json gehört. Rollen mit „alle Module“ bekommen alle
     * Katalog-IDs; Freigaben, die der Katalog nicht kennt, bleiben erhalten (nie still entfernen).
     */
    public JSONObject zuJson(List<Rolle> rollen, List<Modul> katalog) throws JSONException {
        JSONObject o = new JSONObject();
        o.put("name", name);
        JSONArray f = new JSONArray();
        if (!rolle.isEmpty()) {
            f.put(new Angabe(Rolle.ANGABE_LABEL, rolle).zuJson());
        }
        for (Angabe a : felder) {
            f.put(a.zuJson());
        }
        o.put("felder", f);
        o.put("freigaben", new JSONArray(wirksameFreigaben(rollen, katalog)));
        if (!notiz.isEmpty()) {
            o.put("notiz", notiz);
        }
        if (!dateien.isEmpty()) {
            JSONArray d = new JSONArray();
            for (Datei datei : dateien) {
                d.put(datei.zuJson());
            }
            o.put("dateien", d);
        }
        JSONObject a = ansicht.zuJson();
        if (a != null) {
            o.put("ansicht", a);
        }
        return o;
    }

    /** Die Freigaben, die gespeichert würden: bei einer Rolle mit allen Modulen der ganze Katalog. */
    public List<String> wirksameFreigaben(List<Rolle> rollen, List<Modul> katalog) {
        Set<String> aus = new LinkedHashSet<>();
        if (rolleMitAllenModulen(rollen)) {
            for (Modul m : katalog) {
                aus.add(m.id);
            }
        }
        aus.addAll(freigaben);
        return new ArrayList<>(aus);
    }

    public boolean rolleMitAllenModulen(List<Rolle> rollen) {
        if (rolle.isEmpty() || rollen == null) {
            return false;
        }
        for (Rolle r : rollen) {
            if (r.name.equals(rolle)) {
                return r.alleModule;
            }
        }
        return false;
    }

    public Partner kopie() {
        Partner p = new Partner(email);
        p.bisherigeAdresse = bisherigeAdresse;
        p.name = name;
        p.rolle = rolle;
        for (Angabe a : felder) {
            p.felder.add(a.kopie());
        }
        p.freigaben.addAll(freigaben);
        p.notiz = notiz;
        for (Datei d : dateien) {
            p.dateien.add(d.kopie());
        }
        p.ansicht = ansicht.kopie();
        return p;
    }

    /** Gleicher Inhalt (ohne bisherigeAdresse)? */
    public boolean gleich(Partner p) {
        return email.equals(p.email) && name.equals(p.name) && rolle.equals(p.rolle) && felder.equals(p.felder)
                && freigaben.equals(p.freigaben) && notiz.equals(p.notiz) && dateien.equals(p.dateien)
                && ansicht.equals(p.ansicht);
    }

    /** Anzeigename für Listen: Name, sonst Adresse, sonst „Neuer Partner“. */
    public String anzeige() {
        if (!name.trim().isEmpty()) {
            return name.trim();
        }
        if (!email.trim().isEmpty()) {
            return email.trim();
        }
        return "Neuer Partner";
    }
}
