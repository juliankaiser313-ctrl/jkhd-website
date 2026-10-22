package de.jkhd.app.webseite;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import org.json.JSONObject;
import org.junit.Test;

import java.nio.charset.StandardCharsets;

public class UnterschriftTest {

    @Test
    public void hmacBekannterVektor() {
        // RFC-Beispiel: HMAC-SHA256("key", "The quick brown fox jumps over the lazy dog")
        String u = Unterschrift.unterschreiben("key".getBytes(StandardCharsets.UTF_8), "The quick brown fox jumps over the lazy dog");
        assertEquals("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8", u);
    }

    @Test
    public void nutzlastTraegtZeitEinmalAktionUndFelder() throws Exception {
        JSONObject felder = new JSONObject();
        felder.put("email", "anna@example.com");
        String n = Unterschrift.nutzlast(1761158400L, "0123456789abcdef0123456789abcdef", "passwort_entfernen", felder);
        JSONObject zurueck = new JSONObject(n);
        assertEquals(1761158400L, zurueck.getLong("zeit"));
        assertEquals("0123456789abcdef0123456789abcdef", zurueck.getString("einmal"));
        assertEquals("passwort_entfernen", zurueck.getString("aktion"));
        assertEquals("anna@example.com", zurueck.getString("email"));
    }

    @Test
    public void rumpfUnterschreibtGenauDenGesendetenText() throws Exception {
        byte[] schluessel = Hex.zu("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff");
        String nutzlast = Unterschrift.nutzlast(1L, Unterschrift.einmal(), "lesen", null);
        JSONObject rumpf = new JSONObject(Unterschrift.rumpf(schluessel, nutzlast));
        assertEquals(nutzlast, rumpf.getString("nutzlast"));
        assertEquals(Unterschrift.unterschreiben(schluessel, nutzlast), rumpf.getString("unterschrift"));
        assertEquals(64, rumpf.getString("unterschrift").length());
    }

    @Test
    public void umlauteUeberlebenDieUnterschrift() throws Exception {
        byte[] schluessel = new byte[32];
        JSONObject felder = new JSONObject();
        felder.put("name", "Jürgen Müller-Ößt");
        String nutzlast = Unterschrift.nutzlast(5L, Unterschrift.einmal(), "schreiben", felder);
        String rumpf = Unterschrift.rumpf(schluessel, nutzlast);
        JSONObject r = new JSONObject(rumpf);
        String empfangen = r.getString("nutzlast");
        assertEquals(nutzlast, empfangen);
        assertEquals(r.getString("unterschrift"), Unterschrift.unterschreiben(schluessel, empfangen));
        assertEquals("Jürgen Müller-Ößt", new JSONObject(empfangen).getString("name"));
    }

    @Test
    public void einmalWerteSindHexUndVerschieden() {
        String a = Unterschrift.einmal();
        String b = Unterschrift.einmal();
        assertTrue(Hex.ist(a, 16));
        assertNotEquals(a, b);
    }
}
