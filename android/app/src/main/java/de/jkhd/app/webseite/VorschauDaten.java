package de.jkhd.app.webseite;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

/**
 * Baut aus einem Partnereintrag das, was POST /daten dem Partner liefern würde — die Form, die
 * partner.html in der Vorschau erwartet (wie vorschauDaten() in der PC-App): Angaben nur bei
 * ansicht.daten, VIP-Adresse nur bei ansicht.vip, Module aus dem Katalog mit Link nur für
 * freigeschaltete und nicht angekündigte, Dateien mit Typ aus der Endung, Passwortstatus.
 */
public final class VorschauDaten {

    private VorschauDaten() {
    }

    public static JSONObject bauen(Partner p, List<Rolle> rollen, List<Modul> katalog, String vip, Passwortstatus passwort) throws JSONException {
        JSONObject d = new JSONObject();
        d.put("name", p.name);
        d.put("email", p.email);
        Ansicht a = p.ansicht;

        JSONArray felder = new JSONArray();
        if (a.daten) {
            if (!p.rolle.isEmpty()) {
                felder.put(new Angabe(Rolle.ANGABE_LABEL, p.rolle).zuJson());
            }
            for (Angabe x : p.felder) {
                felder.put(x.zuJson());
            }
        }
        d.put("felder", felder);
        d.put("vip", a.vip ? vip : "");

        List<String> frei = p.wirksameFreigaben(rollen, katalog);
        JSONArray module = new JSONArray();
        JSONArray freigaben = new JSONArray();
        if (a.module) {
            for (Modul m : katalog) {
                boolean freigeschaltet = frei.contains(m.id) && !m.bald();
                module.put(m.zuJson(freigeschaltet));
            }
            for (String id : frei) {
                freigaben.put(id);
            }
        }
        d.put("module", module);
        d.put("freigaben", freigaben);

        JSONArray dateien = new JSONArray();
        if (a.dateien) {
            for (Datei x : p.dateien) {
                JSONObject o = new JSONObject();
                o.put("id", x.id);
                o.put("name", x.name);
                o.put("typ", Datei.typ(x.name));
                o.put("groesse", x.groesse);
                o.put("datum", x.datum);
                o.put("text", x.text);
                dateien.put(o);
            }
        }
        d.put("dateien", dateien);
        d.put("ansicht", a.vollstaendig());

        if (passwort != null) {
            JSONObject pw = new JSONObject();
            pw.put("gesetzt", true);
            pw.put("seit", passwort.seit);
            pw.put("ohne_altes_bis", 0);
            pw.put("ohne_altes_rest", 0);
            d.put("passwort", pw);
        } else {
            JSONObject pw = new JSONObject();
            pw.put("gesetzt", false);
            pw.put("seit", "");
            pw.put("ohne_altes_bis", 0);
            pw.put("ohne_altes_rest", 0);
            d.put("passwort", pw);
        }
        return d;
    }
}
