package de.jkhd.app.webseite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Prüft die Liste vor dem Speichern wie pruefen() in der PC-App — mit denselben Grenzen wie der
 * Server, damit der gar nicht erst 400 antworten muss. Ergebnis: Beanstandungen je Partner
 * (Schlüssel = Adresse, wie sie in der Liste steht) und allgemeine.
 */
public final class Pruefung {

    public final Map<String, List<String>> jePartner = new LinkedHashMap<>();
    public final List<String> allgemein = new ArrayList<>();

    public boolean inOrdnung() {
        return jePartner.isEmpty() && allgemein.isEmpty();
    }

    public int anzahl() {
        int n = allgemein.size();
        for (List<String> l : jePartner.values()) {
            n += l.size();
        }
        return n;
    }

    public static Pruefung pruefen(Partnerliste liste, List<Modul> katalog) {
        Pruefung p = new Pruefung();
        if (liste.partner.size() > Partnerliste.PARTNER_MAX) {
            p.allgemein.add("Höchstens " + Partnerliste.PARTNER_MAX + " Partner.");
        }
        if (liste.rollen.size() > Rolle.ANZAHL_MAX) {
            p.allgemein.add("Höchstens " + Rolle.ANZAHL_MAX + " Rollen.");
        }
        Set<String> rollennamen = new HashSet<>();
        for (Rolle r : liste.rollen) {
            if (r.name.trim().isEmpty() || r.name.length() > Rolle.NAME_MAX) {
                p.allgemein.add("Ein Rollenname fehlt oder ist länger als " + Rolle.NAME_MAX + " Zeichen.");
            } else if (!rollennamen.add(r.name)) {
                p.allgemein.add("Die Rolle „" + r.name + "“ gibt es doppelt.");
            }
        }

        Map<String, String> gesehen = new HashMap<>();   // schluessel -> Listen-Schlüssel
        for (Map.Entry<String, Partner> e : liste.partner.entrySet()) {
            String k = e.getKey();
            Partner x = e.getValue();
            List<String> m = new ArrayList<>();

            if (x.email.trim().isEmpty()) {
                m.add("Die E-Mail-Adresse fehlt.");
            } else if (!Adresse.gueltig(x.email)) {
                m.add("Die E-Mail-Adresse ist nicht gültig (nur ASCII, höchstens " + Adresse.MAX_LAENGE + " Zeichen).");
            } else {
                String s = Adresse.schluessel(x.email);
                String vorher = gesehen.get(s);
                if (vorher != null) {
                    m.add("Dasselbe Postfach wie bei „" + liste.partner.get(vorher).anzeige() + "“.");
                } else {
                    gesehen.put(s, k);
                }
            }
            if (x.name.trim().isEmpty()) {
                m.add("Der Name fehlt.");
            } else if (x.name.length() > Partner.NAME_MAX) {
                m.add("Der Name ist länger als " + Partner.NAME_MAX + " Zeichen.");
            } else if (steuerzeichen(x.name)) {
                m.add("Der Name enthält Steuerzeichen.");
            }
            if (x.rolle.length() > Angabe.WERT_MAX) {
                m.add("Die Rolle ist länger als " + Angabe.WERT_MAX + " Zeichen.");
            }
            int angaben = x.felder.size() + (x.rolle.isEmpty() ? 0 : 1);
            if (angaben > Partner.ANGABEN_MAX) {
                m.add("Höchstens " + Partner.ANGABEN_MAX + " Angaben (die Rolle zählt mit).");
            }
            for (Angabe a : x.felder) {
                if (a.label.trim().isEmpty() || a.label.length() > Angabe.LABEL_MAX) {
                    m.add("Eine Angabe hat keine Bezeichnung oder eine mit mehr als " + Angabe.LABEL_MAX + " Zeichen.");
                } else if (a.label.equals(Rolle.ANGABE_LABEL)) {
                    m.add("„Rolle“ ist als Bezeichnung einer Angabe nicht erlaubt — die Rolle wird oben gewählt.");
                }
                if (a.wert.length() > Angabe.WERT_MAX) {
                    m.add("Der Wert von „" + a.label + "“ ist länger als " + Angabe.WERT_MAX + " Zeichen.");
                }
            }
            List<String> wirksam = x.wirksameFreigaben(liste.rollen, katalog);
            if (wirksam.size() > Partner.FREIGABEN_MAX) {
                m.add("Höchstens " + Partner.FREIGABEN_MAX + " Freigaben.");
            }
            if (x.dateien.size() > Partner.DATEIEN_MAX) {
                m.add("Höchstens " + Partner.DATEIEN_MAX + " Dateien.");
            }
            Set<String> dateiIds = new HashSet<>();
            for (Datei d : x.dateien) {
                if (!Hex.ist(d.id, 16)) {
                    m.add("Die Datei „" + d.name + "“ hat keine gültige Kennung.");
                } else if (!dateiIds.add(d.id)) {
                    m.add("Die Datei „" + d.name + "“ ist doppelt angehängt.");
                }
                String np = Datei.nameProblem(d.name);
                if (np != null) {
                    m.add(np);
                }
                if (d.text.length() > Datei.TEXT_MAX) {
                    m.add("Die Beschreibung von „" + d.name + "“ ist länger als " + Datei.TEXT_MAX + " Zeichen.");
                }
            }
            if (x.ansicht.begruessung.length() > Ansicht.BEGRUESSUNG_MAX) {
                m.add("Die Begrüßung ist länger als " + Ansicht.BEGRUESSUNG_MAX + " Zeichen.");
            }
            if (x.notiz.length() > Partner.NOTIZ_MAX) {
                m.add("Die Notiz ist länger als " + Partner.NOTIZ_MAX + " Zeichen.");
            }
            if (!m.isEmpty()) {
                p.jePartner.put(k, m);
            }
        }
        return p;
    }

    private static boolean steuerzeichen(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c < 32 || c == 127) {
                return true;
            }
        }
        return false;
    }
}
