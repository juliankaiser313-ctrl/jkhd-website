package de.jkhd.app.webseite;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Was sich seit dem letzten Lesen geändert hat — die Liste für den Dialog „Änderungen speichern?“,
 * wie aenderungen() in der PC-App, inklusive der Warnungen zu Passwörtern und Dateien.
 */
public final class Aenderungen {

    public final List<String> zeilen = new ArrayList<>();
    public int neu;
    public int geaendert;
    public int entfernt;

    public boolean leer() {
        return zeilen.isEmpty();
    }

    public int anzahl() {
        return neu + geaendert + entfernt + (rollen ? 1 : 0);
    }

    public boolean rollen;

    public static Aenderungen ermitteln(Partnerliste original, Partnerliste arbeit, List<Modul> katalog) {
        Aenderungen a = new Aenderungen();
        Set<String> gesehen = new HashSet<>();
        for (Partner p : arbeit.partner.values()) {
            Partner alt = p.bisherigeAdresse == null ? null : original.partner.get(p.bisherigeAdresse);
            if (alt == null) {
                a.neu++;
                a.zeilen.add("Neu: " + p.anzeige() + " (" + p.email + ")");
                continue;
            }
            gesehen.add(p.bisherigeAdresse);
            List<String> was = unterschiede(alt, p, original.rollen, arbeit.rollen, katalog);
            if (!was.isEmpty()) {
                a.geaendert++;
                a.zeilen.add("Geändert: " + p.anzeige() + " — " + String.join(", ", was));
            }
            if (!Adresse.schluessel(alt.email).equals(Adresse.schluessel(p.email))) {
                a.zeilen.add("   Achtung: neue Adresse = neuer Zugang. Passwort und Anmeldungen von "
                        + alt.email + " werden gelöscht; der Partner meldet sich künftig mit " + p.email + " an.");
            }
        }
        for (Map.Entry<String, Partner> e : original.partner.entrySet()) {
            if (!gesehen.contains(e.getKey())) {
                a.entfernt++;
                a.zeilen.add("Entfernt: " + e.getValue().anzeige() + " (" + e.getValue().email
                        + ") — Passwort und Anmeldungen werden gelöscht, Dateien einen Tag später.");
            }
        }
        if (!original.rollen.equals(arbeit.rollen) || original.rollenVorhanden != arbeit.rollenVorhanden) {
            a.rollen = true;
            a.zeilen.add("Rollenliste geändert (" + arbeit.rollen.size() + " Rollen).");
        }
        return a;
    }

    private static List<String> unterschiede(Partner alt, Partner neu, List<Rolle> rollenAlt, List<Rolle> rollenNeu, List<Modul> katalog) {
        List<String> was = new ArrayList<>();
        if (!alt.email.equals(neu.email)) {
            was.add("Adresse " + alt.email + " → " + neu.email);
        }
        if (!alt.name.equals(neu.name)) {
            was.add("Name");
        }
        if (!alt.rolle.equals(neu.rolle)) {
            was.add("Rolle " + (alt.rolle.isEmpty() ? "–" : alt.rolle) + " → " + (neu.rolle.isEmpty() ? "–" : neu.rolle));
        }
        List<String> fAlt = alt.wirksameFreigaben(rollenAlt, katalog);
        List<String> fNeu = neu.wirksameFreigaben(rollenNeu, katalog);
        int dazu = 0;
        int weg = 0;
        for (String id : fNeu) {
            if (!fAlt.contains(id)) {
                dazu++;
            }
        }
        for (String id : fAlt) {
            if (!fNeu.contains(id)) {
                weg++;
            }
        }
        if (dazu > 0 || weg > 0) {
            was.add("Module +" + dazu + " −" + weg);
        }
        if (!alt.felder.equals(neu.felder)) {
            was.add("Angaben");
        }
        int dDazu = 0;
        int dWeg = 0;
        for (Datei d : neu.dateien) {
            if (finde(alt.dateien, d.id) == null) {
                dDazu++;
            }
        }
        for (Datei d : alt.dateien) {
            if (finde(neu.dateien, d.id) == null) {
                dWeg++;
            }
        }
        if (dDazu > 0 || dWeg > 0) {
            was.add("Dateien +" + dDazu + " −" + dWeg);
        } else if (!alt.dateien.equals(neu.dateien)) {
            was.add("Dateibeschreibungen");
        }
        if (!alt.ansicht.equals(neu.ansicht)) {
            was.add("Ansicht");
        }
        if (!alt.notiz.equals(neu.notiz)) {
            was.add("Notiz");
        }
        return was;
    }

    private static Datei finde(List<Datei> dateien, String id) {
        for (Datei d : dateien) {
            if (d.id.equals(id)) {
                return d;
            }
        }
        return null;
    }
}
