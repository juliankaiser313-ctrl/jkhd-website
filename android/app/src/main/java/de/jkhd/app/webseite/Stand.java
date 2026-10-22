package de.jkhd.app.webseite;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Die Antwort von „lesen“: Partnerliste samt Fassung, Katalog, VIP-Adresse, Serverzeit, Passwortstatus. */
public final class Stand {

    public final String partnerText;
    /** SHA-256 des Texts, 64 Hex — die Basis für „schreiben“. */
    public final String version;
    public final Partnerliste liste;
    public final List<Modul> katalog;
    /** Die VIP-Adresse: nur anzeigen, nie speichern. */
    public final String vip;
    public final long zeit;
    /** Hat der Server den Passwortstatus überhaupt mitgeschickt? Sonst ist er unbekannt. */
    public final boolean passwoerterBekannt;
    public final Map<String, Passwortstatus> passwoerter = new LinkedHashMap<>();

    public Stand(JSONObject antwort) throws JSONException, VerwaltungFehler {
        partnerText = antwort.optString("partner_text", "");
        version = antwort.optString("version", "");
        String gerechnet = sha256Hex(partnerText);
        if (!gerechnet.equalsIgnoreCase(version)) {
            throw new VerwaltungFehler(-1, "Die Partnerliste kam beschädigt an (Prüfsumme passt nicht). Bitte neu laden.", null);
        }
        liste = Partnerliste.ausText(partnerText);
        JSONArray k = antwort.optJSONArray("katalog");
        if (k == null) {
            k = antwort.optJSONArray("module");
        }
        katalog = Modul.listeAusJson(k);
        vip = antwort.optString("vip", "");
        zeit = antwort.optLong("zeit", 0);
        JSONObject pw = antwort.optJSONObject("passwoerter");
        passwoerterBekannt = pw != null;
        if (pw != null) {
            Iterator<String> it = pw.keys();
            while (it.hasNext()) {
                String adresse = it.next();
                JSONObject s = pw.optJSONObject(adresse);
                if (s != null) {
                    passwoerter.put(Adresse.schluessel(adresse), Passwortstatus.ausJson(s));
                }
            }
        }
    }

    public Passwortstatus passwortVon(String email) {
        return passwoerter.get(Adresse.schluessel(email));
    }

    public static String sha256Hex(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return Hex.von(md.digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException unmoeglich) {
            throw new IllegalStateException(unmoeglich);
        }
    }
}
