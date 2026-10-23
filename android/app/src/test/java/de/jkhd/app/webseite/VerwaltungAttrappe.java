package de.jkhd.app.webseite;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

/**
 * Ein Übungsserver für /verwaltung, nach dem Vertrag des echten Servers (Bericht
 * android/analyse-partner-app.md, Abschnitte 3 und 5): Unterschrift über den rohen Text, Zeitfenster,
 * Einmal-Wert, Origin verboten, die vier Aktionen mit Fassung (409), nur erlaubte Felder je Eintrag.
 * Bewusst ein kleiner HTTP-Server auf einem ServerSocket, weil der Android-Testbau nur die
 * Klassen von android.jar sieht (kein com.sun.net.httpserver).
 */
public final class VerwaltungAttrappe {

    static final List<String> EINTRAG_FELDER = Arrays.asList("name", "felder", "freigaben", "notiz", "dateien", "ansicht");

    public final byte[] schluessel;
    public volatile String partnerText = "{}";
    public String vip = "vip@example.com";
    public final Set<String> einmalGesehen = new HashSet<>();
    public volatile boolean katalogKaputt;
    /** Nächste Verwaltungs-Anfrage mit 408 ablehnen (Uhr „falsch“). */
    public volatile boolean naechsteZuAlt;
    /** „schreiben“ ausführen, aber die Verbindung ohne Antwort schließen (verlorene Antwort). */
    public volatile boolean schreibenOhneAntwort;
    /** Nach einem gelungenen „schreiben“ scheitern alle „lesen“ mit 500. */
    public volatile boolean lesenScheitertNachSchreiben;
    private volatile boolean geschrieben;
    public volatile int anfragen;
    public volatile int pings;
    public volatile String letzteAktion;
    public volatile JSONObject letzteNutzlast;
    public volatile byte[] letzteDatei;
    public volatile boolean originGesehen;
    private ServerSocket server;

    public VerwaltungAttrappe(byte[] schluessel) {
        this.schluessel = schluessel;
    }

    public String starten() throws IOException {
        server = new ServerSocket(0, 50, InetAddress.getLoopbackAddress());
        Thread faden = new Thread(new Runnable() {
            @Override
            public void run() {
                while (!server.isClosed()) {
                    try {
                        final Socket s = server.accept();
                        new Thread(new Runnable() {
                            @Override
                            public void run() {
                                bedienen(s);
                            }
                        }).start();
                    } catch (IOException zu) {
                        break;
                    }
                }
            }
        }, "attrappe");
        faden.setDaemon(true);
        faden.start();
        return "http://127.0.0.1:" + server.getLocalPort();
    }

    public void stoppen() {
        try {
            server.close();
        } catch (IOException egal) {
            // schon zu
        }
    }

    // ---------- HTTP (gerade genug für HttpURLConnection) ----------

    private void bedienen(Socket s) {
        try {
            InputStream ein = new BufferedInputStream(s.getInputStream());
            OutputStream aus = s.getOutputStream();
            String anfrage = zeile(ein);
            if (anfrage == null) {
                return;
            }
            String[] teile = anfrage.split(" ");
            String methode = teile.length > 0 ? teile[0] : "";
            String pfad = teile.length > 1 ? teile[1] : "/";
            Map<String, String> koepfe = new HashMap<>();
            while (true) {
                String k = zeile(ein);
                if (k == null || k.isEmpty()) {
                    break;
                }
                int d = k.indexOf(':');
                if (d > 0) {
                    koepfe.put(k.substring(0, d).trim().toLowerCase(Locale.ROOT), k.substring(d + 1).trim());
                }
            }
            int laenge = Integer.parseInt(koepfe.containsKey("content-length") ? koepfe.get("content-length") : "0");
            byte[] rumpf = new byte[laenge];
            int gelesen = 0;
            while (gelesen < laenge) {
                int n = ein.read(rumpf, gelesen, laenge - gelesen);
                if (n < 0) {
                    break;
                }
                gelesen += n;
            }
            String[] antwort = behandeln(methode, pfad, koepfe, new String(rumpf, StandardCharsets.UTF_8));
            if (antwort != null) {
                senden(aus, Integer.parseInt(antwort[0]), antwort[1]);
            }
        } catch (IOException | JSONException egal) {
            // Verbindung weg oder Unsinn — für die Tests reicht es, zu schweigen
        } finally {
            try {
                s.close();
            } catch (IOException egal) {
                // egal
            }
        }
    }

    private static String zeile(InputStream ein) throws IOException {
        ByteArrayOutputStream puffer = new ByteArrayOutputStream();
        int b;
        while ((b = ein.read()) >= 0) {
            if (b == '\n') {
                break;
            }
            if (b != '\r') {
                puffer.write(b);
            }
        }
        if (b < 0 && puffer.size() == 0) {
            return null;
        }
        return puffer.toString("UTF-8");
    }

    private static void senden(OutputStream aus, int status, String text) throws IOException {
        byte[] b = text.getBytes(StandardCharsets.UTF_8);
        SimpleDateFormat f = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss 'GMT'", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("GMT"));
        String kopf = "HTTP/1.1 " + status + " Status\r\n"
                + "Date: " + f.format(new Date()) + "\r\n"
                + "Content-Type: application/json\r\n"
                + "Content-Length: " + b.length + "\r\n"
                + "Connection: close\r\n\r\n";
        aus.write(kopf.getBytes(StandardCharsets.US_ASCII));
        aus.write(b);
        aus.flush();
    }

    // ---------- Der Vertrag von /verwaltung ----------

    private static String[] status(int s, String text) {
        return new String[]{String.valueOf(s), text};
    }

    private static String[] fehler(int s, String text) throws JSONException {
        return status(s, new JSONObject().put("fehler", text).toString());
    }

    /** null = Verbindung ohne Antwort schließen. */
    private String[] behandeln(String methode, String pfad, Map<String, String> koepfe, String rumpf) throws JSONException {
        if (pfad.startsWith("/ping")) {
            pings++;
            return status(200, "{\"ok\":true}");
        }
        if (!pfad.startsWith("/verwaltung") || !methode.equals("POST")) {
            return status(404, "");
        }
        anfragen++;
        if (koepfe.containsKey("origin")) {
            originGesehen = true;
            return status(404, "");
        }
        String nutzlast;
        String unterschrift;
        try {
            JSONObject r = new JSONObject(rumpf);
            nutzlast = r.getString("nutzlast");
            unterschrift = r.getString("unterschrift");
        } catch (JSONException unbrauchbar) {
            return status(404, "");
        }
        if (!Unterschrift.unterschreiben(schluessel, nutzlast).equals(unterschrift)) {
            return status(404, "");
        }
        JSONObject n = new JSONObject(nutzlast);
        letzteNutzlast = n;
        long jetzt = System.currentTimeMillis() / 1000;
        if (naechsteZuAlt || Math.abs(n.getLong("zeit") - jetzt) > 300) {
            naechsteZuAlt = false;
            return fehler(408, "Die Anfrage ist zu alt.");
        }
        String einmal = n.getString("einmal");
        synchronized (einmalGesehen) {
            if (!Hex.ist(einmal, 16) || !einmalGesehen.add(einmal)) {
                return status(404, "");
            }
        }
        if (katalogKaputt) {
            return status(503, "");
        }
        String aktion = n.getString("aktion");
        letzteAktion = aktion;
        switch (aktion) {
            case "lesen": {
                if (lesenScheitertNachSchreiben && geschrieben) {
                    return fehler(500, "Partnerliste nicht lesbar.");
                }
                JSONObject a = new JSONObject();
                a.put("partner_text", partnerText);
                a.put("version", Stand.sha256Hex(partnerText));
                a.put("module", new JSONArray().put(new JSONObject().put("id", "quant-labor").put("name", "Quant-Labor").put("status", "anfrage")));
                a.put("katalog", new JSONArray().put(new JSONObject().put("id", "quant-labor").put("name", "Quant-Labor").put("kurz", "Test").put("link", "https://beispiel.example/q")));
                a.put("vip", vip);
                a.put("zeit", jetzt);
                a.put("passwoerter", new JSONObject().put("anna.muster@example.com", new JSONObject().put("seit", "01.10.2026").put("bestaetigt", "01.10.2026")));
                return status(200, a.toString());
            }
            case "schreiben": {
                String basis = n.getString("basis");
                if (!basis.equals(Stand.sha256Hex(partnerText))) {
                    return status(409, new JSONObject().put("fehler", "Die Liste wurde inzwischen geändert.").put("version", Stand.sha256Hex(partnerText)).toString());
                }
                JSONObject partner = n.getJSONObject("partner");
                String problem = pruefen(partner);
                if (problem != null) {
                    return fehler(400, problem);
                }
                partnerText = partner.toString(2) + "\n";
                geschrieben = true;
                if (schreibenOhneAntwort) {
                    schreibenOhneAntwort = false;
                    return null;
                }
                return status(200, new JSONObject().put("version", Stand.sha256Hex(partnerText)).put("passwoerter_entfernt", 0).toString());
            }
            case "datei_hochladen": {
                String name = n.getString("name");
                String inhalt = n.getString("inhalt");
                if (Datei.nameProblem(name) != null) {
                    return fehler(400, "Diese Art Datei ist nicht erlaubt.");
                }
                if (!inhalt.matches("[A-Za-z0-9+/]*={0,2}")) {
                    return fehler(400, "Kein Base64.");
                }
                byte[] bytes = java.util.Base64.getDecoder().decode(inhalt);
                letzteDatei = bytes;
                return status(200, new JSONObject().put("id", "0123456789abcdef0123456789abcdef").put("groesse", bytes.length).toString());
            }
            case "passwort_entfernen": {
                String email = n.getString("email");
                return status(200, new JSONObject().put("entfernt", email.equals("anna.muster@example.com")).toString());
            }
            default:
                return fehler(400, "Unbekannte Aktion.");
        }
    }

    /** Wie verwaltung_pruefe() in groben Zügen: Adressen, erlaubte Felder, Name, keine fremden _-Einträge. */
    private static String pruefen(JSONObject partner) {
        Iterator<String> it = partner.keys();
        while (it.hasNext()) {
            String k = it.next();
            if (k.startsWith("_")) {
                if (!k.equals("_hinweis") && !k.equals("_rollen")) {
                    return "Unbekannter Eintrag: " + k;
                }
                continue;
            }
            if (!Adresse.gueltig(k)) {
                return "Ungültige Adresse: " + k;
            }
            JSONObject e = partner.optJSONObject(k);
            if (e == null) {
                return "Eintrag ist kein Objekt: " + k;
            }
            Iterator<String> f = e.keys();
            while (f.hasNext()) {
                String feld = f.next();
                if (!EINTRAG_FELDER.contains(feld)) {
                    return "Unbekanntes Feld „" + feld + "“ bei " + k;
                }
            }
            String name = e.optString("name", "");
            if (name.isEmpty() || name.length() > 120) {
                return "Name fehlt bei " + k;
            }
        }
        return null;
    }
}
