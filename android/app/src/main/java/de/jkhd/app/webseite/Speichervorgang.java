package de.jkhd.app.webseite;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

/**
 * Speichern wie die PC-App (Bericht §2.3 g, §6.1.2): die GANZE Liste mit der Fassung des letzten
 * Lesens schreiben, danach nachlesen. Geht die Antwort verloren (Netz) oder sagt der Server 409,
 * wird nachgelesen: steht genau das Gesendete schon auf dem Server, war es unser eigenes
 * Speichern und gilt als gelungen. Scheitert nur das Nachlesen nach gelungenem Schreiben, gilt
 * die gesendete Liste mit der neuen Fassung — gespeichert ist ja.
 */
public final class Speichervorgang {

    public static final class Ergebnis {
        public final Stand stand;
        /** Kommt der Stand frisch vom Server (true) oder ist es die gesendete Liste (false)? */
        public final boolean nachgelesen;
        public final int passwoerterEntfernt;

        Ergebnis(Stand stand, boolean nachgelesen, int passwoerterEntfernt) {
            this.stand = stand;
            this.nachgelesen = nachgelesen;
            this.passwoerterEntfernt = passwoerterEntfernt;
        }
    }

    private Speichervorgang() {
    }

    /** gesendet = Partnerliste.zuJson(...) — auf dem Hauptfaden gebaut, hier nur noch gelesen. */
    public static Ergebnis ausfuehren(Verwaltung v, Stand alt, JSONObject gesendet) throws IOException, VerwaltungFehler {
        Verwaltung.Geschrieben g;
        try {
            g = v.schreiben(alt.version, gesendet);
        } catch (IOException verloren) {
            Stand jetzt = v.lesen();
            if (stehtSchonDa(jetzt, gesendet)) {
                return new Ergebnis(jetzt, true, 0);
            }
            throw verloren;
        } catch (VerwaltungFehler f) {
            if (f.status == 409 || f.status == -1) {
                Stand jetzt;
                try {
                    jetzt = v.lesen();
                } catch (IOException | VerwaltungFehler egal) {
                    throw f;
                }
                if (stehtSchonDa(jetzt, gesendet)) {
                    return new Ergebnis(jetzt, true, 0);
                }
            }
            throw f;
        }
        try {
            return new Ergebnis(v.lesen(), true, g.passwoerterEntfernt);
        } catch (IOException | VerwaltungFehler nachlesenGescheitert) {
            try {
                return new Ergebnis(new Stand(alt, gesendet.toString(), g.version), false, g.passwoerterEntfernt);
            } catch (JSONException unmoeglich) {
                throw new VerwaltungFehler(-1, "Gespeichert, aber der neue Stand ließ sich nicht lesen. Bitte neu laden.", null);
            }
        }
    }

    /** Steht auf dem Server inhaltlich genau die gesendete Liste? */
    public static boolean stehtSchonDa(Stand jetzt, JSONObject gesendet) {
        String t = jetzt.partnerText == null ? "" : jetzt.partnerText.trim();
        try {
            Object server = t.isEmpty() || t.startsWith("[") ? new JSONObject() : new JSONObject(t);
            return JsonGleich.gleich(server, gesendet);
        } catch (JSONException kaputt) {
            return false;
        }
    }
}
