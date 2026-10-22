package de.jkhd.app.webseite;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

/**
 * Ein Übungsserver für /verwaltung, nach dem Vertrag des echten Servers (Bericht
 * android/analyse-partner-app.md, Abschnitt 3): Unterschrift über den rohen Text, Zeitfenster,
 * Einmal-Wert, Origin verboten, die vier Aktionen mit Fassung (409). Nur für Tests.
 */
public final class VerwaltungAttrappe {

    public final byte[] schluessel;
    public String partnerText = "{}";
    public String vip = "vip@example.com";
    public final Set<String> einmalGesehen = new HashSet<>();
    public boolean katalogKaputt;
    public int anfragen;
    public String letzteAktion;
    public JSONObject letzteNutzlast;
    public boolean originGesehen;
    private HttpServer server;

    public VerwaltungAttrappe(byte[] schluessel) {
        this.schluessel = schluessel;
    }

    public String starten() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        // Den Date-Kopf setzt der HttpServer selbst (echte Uhr) — genau wie der echte Server.
        server.createContext("/ping", ex -> antworten(ex, 200, "{\"ok\":true}"));
        server.createContext("/verwaltung", this::verwaltung);
        server.start();
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    public void stoppen() {
        server.stop(0);
    }

    private void verwaltung(HttpExchange ex) throws IOException {
        anfragen++;
        if (ex.getRequestHeaders().getFirst("Origin") != null) {
            originGesehen = true;
            antworten(ex, 404, "");
            return;
        }
        String rumpf = lesen(ex.getRequestBody());
        try {
            JSONObject r = new JSONObject(rumpf);
            String nutzlast = r.getString("nutzlast");
            String unterschrift = r.getString("unterschrift");
            if (!Unterschrift.unterschreiben(schluessel, nutzlast).equals(unterschrift)) {
                antworten(ex, 404, "");
                return;
            }
            JSONObject n = new JSONObject(nutzlast);
            letzteNutzlast = n;
            long jetzt = System.currentTimeMillis() / 1000;
            long zeit = n.getLong("zeit");
            if (Math.abs(zeit - jetzt) > 300) {
                antworten(ex, 408, "{\"fehler\":\"zu alt\"}");
                return;
            }
            String einmal = n.getString("einmal");
            if (!Hex.ist(einmal, 16) || !einmalGesehen.add(einmal)) {
                antworten(ex, 404, "");
                return;
            }
            if (katalogKaputt) {
                antworten(ex, 503, "");
                return;
            }
            String aktion = n.getString("aktion");
            letzteAktion = aktion;
            switch (aktion) {
                case "lesen": {
                    JSONObject a = new JSONObject();
                    a.put("partner_text", partnerText);
                    a.put("version", Stand.sha256Hex(partnerText));
                    a.put("module", new org.json.JSONArray().put(new JSONObject().put("id", "quant-labor").put("name", "Quant-Labor").put("status", "anfrage")));
                    a.put("katalog", new org.json.JSONArray().put(new JSONObject().put("id", "quant-labor").put("name", "Quant-Labor").put("kurz", "Test").put("link", "https://beispiel.example/q")));
                    a.put("vip", vip);
                    a.put("zeit", jetzt);
                    a.put("passwoerter", new JSONObject().put("anna.muster@example.com", new JSONObject().put("seit", "01.10.2026").put("bestaetigt", "01.10.2026")));
                    antworten(ex, 200, a.toString());
                    return;
                }
                case "schreiben": {
                    String basis = n.getString("basis");
                    if (!basis.equals(Stand.sha256Hex(partnerText))) {
                        antworten(ex, 409, new JSONObject().put("fehler", "Die Liste wurde inzwischen geändert.").put("version", Stand.sha256Hex(partnerText)).toString());
                        return;
                    }
                    JSONObject partner = n.getJSONObject("partner");
                    java.util.Iterator<String> it = partner.keys();
                    while (it.hasNext()) {
                        String k = it.next();
                        if (!k.startsWith("_") && !Adresse.gueltig(k)) {
                            antworten(ex, 400, new JSONObject().put("fehler", "Ungültige Adresse: " + k).toString());
                            return;
                        }
                    }
                    partnerText = partner.toString(2) + "\n";
                    antworten(ex, 200, new JSONObject().put("version", Stand.sha256Hex(partnerText)).put("passwoerter_entfernt", 0).toString());
                    return;
                }
                case "datei_hochladen": {
                    String name = n.getString("name");
                    String inhalt = n.getString("inhalt");
                    if (Datei.nameProblem(name) != null) {
                        antworten(ex, 400, new JSONObject().put("fehler", "Diese Art Datei ist nicht erlaubt.").toString());
                        return;
                    }
                    if (!inhalt.matches("[A-Za-z0-9+/]*={0,2}")) {
                        antworten(ex, 400, new JSONObject().put("fehler", "Kein Base64.").toString());
                        return;
                    }
                    byte[] bytes = java.util.Base64.getDecoder().decode(inhalt);
                    antworten(ex, 200, new JSONObject().put("id", "0123456789abcdef0123456789abcdef").put("groesse", bytes.length).toString());
                    return;
                }
                case "passwort_entfernen": {
                    String email = n.getString("email");
                    antworten(ex, 200, new JSONObject().put("entfernt", email.equals("anna.muster@example.com")).toString());
                    return;
                }
                default:
                    antworten(ex, 400, "{\"fehler\":\"Unbekannte Aktion.\"}");
            }
        } catch (JSONException e) {
            antworten(ex, 404, "");
        }
    }

    private static void antworten(HttpExchange ex, int status, String text) throws IOException {
        byte[] b = text.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json");
        ex.sendResponseHeaders(status, b.length == 0 ? -1 : b.length);
        if (b.length > 0) {
            OutputStream aus = ex.getResponseBody();
            aus.write(b);
            aus.close();
        }
        ex.close();
    }

    private static String lesen(InputStream ein) throws IOException {
        ByteArrayOutputStream puffer = new ByteArrayOutputStream();
        byte[] b = new byte[8192];
        int n;
        while ((n = ein.read(b)) > 0) {
            puffer.write(b, 0, n);
        }
        return puffer.toString("UTF-8");
    }
}
