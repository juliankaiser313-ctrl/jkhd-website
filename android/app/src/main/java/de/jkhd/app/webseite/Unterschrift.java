package de.jkhd.app.webseite;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Iterator;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Die Unterschrift für POST /verwaltung, genau wie die PC-App: der Rumpf ist
 * {"nutzlast": "<JSON als Text>", "unterschrift": "<HMAC-SHA256 über genau diesen Text, 64 hex>"}.
 * Signiert wird der Text, der gesendet wird — nie ein neu serialisiertes Objekt.
 */
public final class Unterschrift {

    public static final int SCHLUESSEL_BYTES = 32;
    private static final SecureRandom ZUFALL = new SecureRandom();

    private Unterschrift() {
    }

    /** Der Text der Nutzlast: zeit, einmal, aktion und die Felder der Aktion. */
    public static String nutzlast(long zeit, String einmal, String aktion, JSONObject felder) throws JSONException {
        JSONObject n = new JSONObject();
        n.put("zeit", zeit);
        n.put("einmal", einmal);
        n.put("aktion", aktion);
        if (felder != null) {
            Iterator<String> it = felder.keys();
            while (it.hasNext()) {
                String k = it.next();
                n.put(k, felder.get(k));
            }
        }
        return n.toString();
    }

    public static String unterschreiben(byte[] schluessel, String nutzlast) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(schluessel, "HmacSHA256"));
            return Hex.von(mac.doFinal(nutzlast.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Der fertige Rumpf der Anfrage. */
    public static String rumpf(byte[] schluessel, String nutzlast) throws JSONException {
        JSONObject r = new JSONObject();
        r.put("nutzlast", nutzlast);
        r.put("unterschrift", unterschreiben(schluessel, nutzlast));
        return r.toString();
    }

    /** Ein Einmal-Wert: 16 Zufallsbytes als 32 Hex. */
    public static String einmal() {
        byte[] b = new byte[16];
        ZUFALL.nextBytes(b);
        return Hex.von(b);
    }
}
