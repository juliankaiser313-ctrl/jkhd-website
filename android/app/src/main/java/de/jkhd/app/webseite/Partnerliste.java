package de.jkhd.app.webseite;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Die ganze partner.json: _hinweis, _rollen und je Adresse ein Partner. Gelesen aus dem Text, den der
 * Server liefert; gebaut als das Objekt, das „schreiben“ erwartet (immer die ganze Liste).
 */
public final class Partnerliste {

    public static final int PARTNER_MAX = 500;
    /** Die Vorschläge der PC-App, solange partner.json keine _rollen kennt. */
    public static final String VORSCHLAG_VOLLZUGANG = "Partner – Vollzugang (alle Module)";
    public static final String VORSCHLAG_PARTNER = "Partner";

    public String hinweis;
    public final List<Rolle> rollen = new ArrayList<>();
    /** Stand die Rollenliste in der Datei? Sonst wird sie erst geschrieben, wenn sie geändert wurde. */
    public boolean rollenVorhanden;
    /**
     * Alles, was die App nicht selbst versteht, unverändert durchgereicht: weitere _-Einträge und
     * Einträge, die kein Objekt sind. So verschwindet beim Speichern nichts still — passt etwas nicht,
     * sagt es der Server mit einer Absage.
     */
    public final Map<String, Object> extras = new LinkedHashMap<>();
    /** Reihenfolge wie in der Datei; Schlüssel ist die Adresse genau so, wie sie dort steht. */
    public final LinkedHashMap<String, Partner> partner = new LinkedHashMap<>();

    /** Liest den Text von „lesen“; eine leere Datei oder [] gilt als leere Liste. */
    public static Partnerliste ausText(String text) throws JSONException {
        Partnerliste liste = new Partnerliste();
        String t = text == null ? "" : text.trim();
        if (t.isEmpty() || t.startsWith("[")) {
            return liste;
        }
        JSONObject o = new JSONObject(t);
        Iterator<String> schluessel = o.keys();
        while (schluessel.hasNext()) {
            String k = schluessel.next();
            if (k.equals("_hinweis")) {
                liste.hinweis = o.optString(k, null);
            } else if (k.equals("_rollen") && o.optJSONArray(k) != null) {
                liste.rollenVorhanden = true;
                JSONArray a = o.optJSONArray(k);
                for (int i = 0; i < a.length(); i++) {
                    JSONObject r = a.optJSONObject(i);
                    if (r != null) {
                        liste.rollen.add(Rolle.ausJson(r));
                    }
                }
            } else if (k.startsWith("_")) {
                liste.extras.put(k, o.opt(k));
            } else {
                JSONObject e = o.optJSONObject(k);
                if (e != null) {
                    liste.partner.put(k, Partner.ausJson(k, e));
                } else {
                    liste.extras.put(k, o.opt(k));
                }
            }
        }
        return liste;
    }

    /** Das Objekt für „schreiben“: _hinweis und _rollen wie gelesen, dann alle Partner. */
    public JSONObject zuJson(List<Modul> katalog) throws JSONException {
        JSONObject o = new JSONObject();
        if (hinweis != null) {
            o.put("_hinweis", hinweis);
        }
        if (rollenVorhanden || !rollen.isEmpty()) {
            JSONArray a = new JSONArray();
            for (Rolle r : rollen) {
                a.put(r.zuJson());
            }
            o.put("_rollen", a);
        }
        for (Map.Entry<String, Object> e : extras.entrySet()) {
            o.put(e.getKey(), e.getValue());
        }
        List<Rolle> wirksam = rollenZurAuswahl();
        for (Partner p : partner.values()) {
            o.put(p.email, p.zuJson(wirksam, katalog));
        }
        return o;
    }

    public Partnerliste kopie() {
        Partnerliste l = new Partnerliste();
        l.hinweis = hinweis;
        l.rollenVorhanden = rollenVorhanden;
        for (Rolle r : rollen) {
            l.rollen.add(r.kopie());
        }
        l.extras.putAll(extras);
        for (Map.Entry<String, Partner> e : partner.entrySet()) {
            l.partner.put(e.getKey(), e.getValue().kopie());
        }
        return l;
    }

    /**
     * Die Rollen, die gelten — zur Auswahl im Editor UND beim Erweitern von „alle Module“ (Speichern,
     * Prüfung, Änderungsliste, Vorschau): aus der Datei; kennt die Datei keine _rollen, die
     * Vorschläge der PC-App. Dazu die vergebenen, die keiner kennt (ohne „alle Module“).
     */
    public List<Rolle> rollenZurAuswahl() {
        List<Rolle> aus = new ArrayList<>();
        for (Rolle r : rollen) {
            aus.add(r);
        }
        if (aus.isEmpty() && !rollenVorhanden) {
            aus.add(new Rolle(vergebeneSchreibweise(VORSCHLAG_VOLLZUGANG), true));
            aus.add(new Rolle(VORSCHLAG_PARTNER, false));
        }
        for (Partner p : partner.values()) {
            if (!p.rolle.isEmpty() && findeRolle(aus, p.rolle) == null) {
                aus.add(new Rolle(p.rolle, false));
            }
        }
        return aus;
    }

    /** Hat die PC-App den Vorschlag mit einem anderen Strich vergeben, gilt deren Schreibweise. */
    private String vergebeneSchreibweise(String vorschlag) {
        String norm = Text.ohneStrichvarianten(vorschlag);
        for (Partner p : partner.values()) {
            if (!p.rolle.isEmpty() && Text.ohneStrichvarianten(p.rolle).equals(norm)) {
                return p.rolle;
            }
        }
        return vorschlag;
    }

    public static Rolle findeRolle(List<Rolle> rollen, String name) {
        for (Rolle r : rollen) {
            if (r.name.equals(name)) {
                return r;
            }
        }
        return null;
    }

    /** Ein neuer Partner mit leerer Adresse, Standardrolle und der Angabe „Angelegt“ = heute. */
    public Partner neuerPartner(String heute) {
        Partner p = new Partner("");
        List<Rolle> auswahl = rollenZurAuswahl();
        Rolle standard = findeRolle(auswahl, VORSCHLAG_PARTNER);
        p.rolle = standard != null ? standard.name : (auswahl.isEmpty() ? "" : auswahl.get(0).name);
        p.felder.add(new Angabe("Angelegt", heute));
        return p;
    }

    /** Unter welchem Schlüssel steht dieser Partner (dasselbe Objekt) in der Liste? null, wenn er nicht drin ist. */
    public String schluesselVon(Partner p) {
        for (Map.Entry<String, Partner> e : partner.entrySet()) {
            if (e.getValue() == p) {
                return e.getKey();
            }
        }
        return null;
    }

    /** Entfernt genau dieses Partner-Objekt. */
    public boolean entfernen(Partner p) {
        String k = schluesselVon(p);
        if (k == null) {
            return false;
        }
        partner.remove(k);
        return true;
    }

    /**
     * Findet den Partner, der einem (vielleicht veralteten) Objekt entspricht: dasselbe Objekt, sonst
     * gleiche bisherige Adresse, sonst gleiche Adresse. null, wenn keiner passt.
     */
    public Partner wiederfinden(Partner alt) {
        if (alt == null) {
            return null;
        }
        if (schluesselVon(alt) != null) {
            return alt;
        }
        for (Partner p : partner.values()) {
            if (alt.bisherigeAdresse != null && alt.bisherigeAdresse.equals(p.bisherigeAdresse)) {
                return p;
            }
        }
        for (Partner p : partner.values()) {
            if (!alt.email.isEmpty() && Adresse.schluessel(alt.email).equals(Adresse.schluessel(p.email))) {
                return p;
            }
        }
        return null;
    }

    /** Schlüssel in der Liste: die Partner-Objekte stehen unter ihrer aktuellen Adresse. */
    public void neuEinordnen() {
        List<Partner> alle = new ArrayList<>(partner.values());
        partner.clear();
        for (Partner p : alle) {
            String k = p.email;
            while (partner.containsKey(k)) {
                k = k + " ";   // nur ein Platzhalter für leere/doppelte Adressen bis zur Prüfung
            }
            partner.put(k, p);
        }
    }
}
