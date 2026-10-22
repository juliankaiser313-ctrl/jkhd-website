package de.jkhd.app.webseite;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Der Client für POST {api}/verwaltung — das, was in der PC-App das Python-Programm tut.
 * Vier Aktionen: lesen, schreiben, datei_hochladen, passwort_entfernen. Jede Anfrage ist für sich
 * unterschrieben (keine Anmeldung, keine Sitzung); die Uhr wird über GET /ping abgeglichen.
 * Kein Origin-Kopf (der Server lehnt ihn ab), keine Umleitungen, immer https (außer in Tests).
 */
public final class Verwaltung {

    public static final String API = "https://api.jkhd.de";
    public static final String KENNUNG = "JKHD-App/1 (Android)";
    /** So alt darf der Uhrabgleich sein, bevor er wiederholt wird (die PC-App: 10 Minuten). */
    private static final long VERSATZ_GUELTIG_MS = 10 * 60 * 1000L;
    private static final int VERBINDEN_MS = 15000;

    private final String api;
    private final byte[] schluessel;
    private long versatzSek;
    private long versatzSeit;

    public Verwaltung(String api, byte[] schluessel) {
        this.api = api.replaceAll("/+$", "");
        this.schluessel = schluessel;
    }

    public Verwaltung(byte[] schluessel) {
        this(API, schluessel);
    }

    /** Gleicht die Uhr mit dem Date-Kopf von GET /ping ab. */
    public void uhrAbgleichen() throws IOException {
        HttpURLConnection v = oeffnen("/ping", "GET", 15000);
        try {
            int status = v.getResponseCode();
            long serverMs = v.getHeaderFieldDate("Date", 0);
            if (status != 200 || serverMs == 0) {
                throw new IOException("ping: Status " + status);
            }
            versatzSek = serverMs / 1000 - System.currentTimeMillis() / 1000;
            versatzSeit = System.currentTimeMillis();
        } finally {
            v.disconnect();
        }
    }

    public long versatzSek() {
        return versatzSek;
    }

    public Stand lesen() throws IOException, VerwaltungFehler {
        try {
            return new Stand(aufruf("lesen", null, 30000));
        } catch (JSONException e) {
            throw new VerwaltungFehler(-1, "Die Antwort des Servers war nicht lesbar.", null);
        }
    }

    /** Ergebnis von „schreiben“. */
    public static final class Geschrieben {
        public final String version;
        public final int passwoerterEntfernt;

        Geschrieben(String version, int passwoerterEntfernt) {
            this.version = version;
            this.passwoerterEntfernt = passwoerterEntfernt;
        }
    }

    /** Schreibt die GANZE Liste; basis ist die Fassung, auf der gearbeitet wurde (409 sonst). */
    public Geschrieben schreiben(String basis, JSONObject partner) throws IOException, VerwaltungFehler {
        try {
            JSONObject felder = new JSONObject();
            felder.put("basis", basis);
            felder.put("partner", partner);
            JSONObject a = aufruf("schreiben", felder, 60000);
            return new Geschrieben(a.optString("version", ""), a.optInt("passwoerter_entfernt", 0));
        } catch (JSONException e) {
            throw new VerwaltungFehler(-1, "Die Antwort des Servers war nicht lesbar.", null);
        }
    }

    /** Lädt eine Datei hoch; sie gehört erst nach „schreiben“ zu einem Partner, sonst löscht der Server sie nach einem Tag. */
    public Datei dateiHochladen(String name, byte[] inhalt, String heute) throws IOException, VerwaltungFehler {
        try {
            JSONObject felder = new JSONObject();
            felder.put("name", name);
            felder.put("inhalt", Base64Kodierer.kodieren(inhalt));
            JSONObject a = aufruf("datei_hochladen", felder, 240000);
            Datei d = new Datei(a.optString("id", ""), name, a.optLong("groesse", inhalt.length), heute, "");
            d.neu = true;
            return d;
        } catch (JSONException e) {
            throw new VerwaltungFehler(-1, "Die Antwort des Servers war nicht lesbar.", null);
        }
    }

    /** Entfernt das Passwort eines Partners sofort; der Server beendet seine Sitzungen und schreibt ihm. */
    public boolean passwortEntfernen(String email) throws IOException, VerwaltungFehler {
        try {
            JSONObject felder = new JSONObject();
            felder.put("email", email);
            return aufruf("passwort_entfernen", felder, 30000).optBoolean("entfernt", false);
        } catch (JSONException e) {
            throw new VerwaltungFehler(-1, "Die Antwort des Servers war nicht lesbar.", null);
        }
    }

    private JSONObject aufruf(String aktion, JSONObject felder, int lesenMs) throws IOException, VerwaltungFehler, JSONException {
        if (versatzSeit == 0 || System.currentTimeMillis() - versatzSeit > VERSATZ_GUELTIG_MS) {
            try {
                uhrAbgleichen();
            } catch (IOException egal) {
                // Ohne Abgleich mit der eigenen Uhr versuchen; bei 408 sagt der Server es.
            }
        }
        long zeit = System.currentTimeMillis() / 1000 + versatzSek;
        String nutzlast = Unterschrift.nutzlast(zeit, Unterschrift.einmal(), aktion, felder);
        byte[] rumpf = Unterschrift.rumpf(schluessel, nutzlast).getBytes(StandardCharsets.UTF_8);

        HttpURLConnection v = oeffnen("/verwaltung", "POST", lesenMs);
        try {
            v.setDoOutput(true);
            v.setFixedLengthStreamingMode(rumpf.length);
            v.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            OutputStream aus = v.getOutputStream();
            aus.write(rumpf);
            aus.close();
            int status = v.getResponseCode();
            String text = lesen(status >= 400 ? v.getErrorStream() : v.getInputStream());
            JSONObject antwort = null;
            if (!text.trim().isEmpty()) {
                try {
                    antwort = new JSONObject(text);
                } catch (JSONException kein) {
                    antwort = null;
                }
            }
            if (status == 200 && antwort != null) {
                return antwort;
            }
            if (status == 200) {
                throw new VerwaltungFehler(-1, "Die Antwort des Servers war nicht lesbar.", null);
            }
            String meldung = antwort != null ? antwort.optString("fehler", "") : "";
            if (meldung.isEmpty()) {
                meldung = VerwaltungFehler.standardText(status);
            }
            throw new VerwaltungFehler(status, meldung, antwort != null ? antwort.optString("version", null) : null);
        } finally {
            v.disconnect();
        }
    }

    private HttpURLConnection oeffnen(String pfad, String methode, int lesenMs) throws IOException {
        HttpURLConnection v = (HttpURLConnection) new URL(api + pfad).openConnection();
        v.setRequestMethod(methode);
        v.setInstanceFollowRedirects(false);
        v.setConnectTimeout(VERBINDEN_MS);
        v.setReadTimeout(lesenMs);
        v.setUseCaches(false);
        v.setRequestProperty("User-Agent", KENNUNG);
        v.setRequestProperty("Accept", "application/json");
        return v;
    }

    private static String lesen(InputStream ein) throws IOException {
        if (ein == null) {
            return "";
        }
        try {
            ByteArrayOutputStream puffer = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = ein.read(b)) > 0) {
                puffer.write(b, 0, n);
            }
            return puffer.toString("UTF-8");
        } finally {
            ein.close();
        }
    }
}
