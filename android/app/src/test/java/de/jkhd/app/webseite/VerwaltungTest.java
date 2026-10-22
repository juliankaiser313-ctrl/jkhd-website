package de.jkhd.app.webseite;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.nio.charset.StandardCharsets;

public class VerwaltungTest {

    private final byte[] schluessel = Hex.zu("a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90");
    private VerwaltungAttrappe attrappe;
    private String api;

    @Before
    public void auf() throws Exception {
        attrappe = new VerwaltungAttrappe(schluessel);
        attrappe.partnerText = PartnerlisteTest.BEISPIEL;
        api = attrappe.starten();
    }

    @After
    public void ab() {
        attrappe.stoppen();
    }

    @Test
    public void uhrabgleichLiestDenDateKopf() throws Exception {
        Verwaltung v = new Verwaltung(api, schluessel);
        v.uhrAbgleichen();
        // Attrappe und Test laufen auf derselben Uhr: der Versatz ist (bis auf Sekundenrundung) null.
        assertTrue(String.valueOf(v.versatzSek()), Math.abs(v.versatzSek()) <= 2);
    }

    @Test
    public void lesenLiefertDenStand() throws Exception {
        Verwaltung v = new Verwaltung(api, schluessel);
        Stand s = v.lesen();
        assertEquals(2, s.liste.partner.size());
        assertEquals("vip@example.com", s.vip);
        assertEquals(1, s.katalog.size());
        assertEquals("https://beispiel.example/q", s.katalog.get(0).link);
        assertNotNull(s.passwortVon("Anna.Muster@example.com"));
        assertEquals("lesen", attrappe.letzteAktion);
        assertFalse("kein Origin-Kopf", attrappe.originGesehen);
        assertEquals(Stand.sha256Hex(attrappe.partnerText), s.version);
    }

    @Test
    public void schreibenMitRichtigerBasisUndDanach409() throws Exception {
        Verwaltung v = new Verwaltung(api, schluessel);
        Stand s = v.lesen();
        Partnerliste arbeit = s.liste.kopie();
        Partner neu = arbeit.neuerPartner("22.10.2026");
        neu.email = "neu@example.com";
        neu.name = "Neu";
        arbeit.partner.put(neu.email, neu);
        Verwaltung.Geschrieben g = v.schreiben(s.version, arbeit.zuJson(s.katalog));
        assertEquals(Stand.sha256Hex(attrappe.partnerText), g.version);
        assertTrue(attrappe.partnerText.contains("neu@example.com"));
        assertEquals(3, attrappe.letzteNutzlast.getJSONObject("partner").length() - 2);   // _hinweis, _rollen + 3 Partner

        try {
            v.schreiben(s.version, arbeit.zuJson(s.katalog));
            fail("alte Basis muss 409 geben");
        } catch (VerwaltungFehler f) {
            assertEquals(409, f.status);
            assertEquals(g.version, f.version);
        }
    }

    @Test
    public void serverTextBei400WirdDurchgereicht() throws Exception {
        Verwaltung v = new Verwaltung(api, schluessel);
        Stand s = v.lesen();
        Partnerliste arbeit = s.liste.kopie();
        Partner kaputt = arbeit.neuerPartner("22.10.2026");
        kaputt.email = "kein-at";
        kaputt.name = "Kaputt";
        arbeit.partner.put(kaputt.email, kaputt);
        try {
            v.schreiben(s.version, arbeit.zuJson(s.katalog));
            fail("400 erwartet");
        } catch (VerwaltungFehler f) {
            assertEquals(400, f.status);
            assertTrue(f.getMessage().contains("Ungültige Adresse"));
        }
    }

    @Test
    public void falscherSchluesselGibt404MitKlartext() throws Exception {
        Verwaltung v = new Verwaltung(api, new byte[32]);
        try {
            v.lesen();
            fail("404 erwartet");
        } catch (VerwaltungFehler f) {
            assertEquals(404, f.status);
            assertTrue(f.getMessage().contains("Schlüssel"));
        }
    }

    @Test
    public void dateiHochladenUndPasswortEntfernen() throws Exception {
        Verwaltung v = new Verwaltung(api, schluessel);
        byte[] inhalt = "Hallo Welt, Grüße".getBytes(StandardCharsets.UTF_8);
        Datei d = v.dateiHochladen("Gruss.txt", inhalt, "22.10.2026");
        assertEquals("0123456789abcdef0123456789abcdef", d.id);
        assertEquals(inhalt.length, d.groesse);
        assertTrue(d.neu);
        assertEquals("22.10.2026", d.datum);
        try {
            v.dateiHochladen("virus.exe", inhalt, "22.10.2026");
            fail("400 erwartet");
        } catch (VerwaltungFehler f) {
            assertEquals(400, f.status);
        }
        assertTrue(v.passwortEntfernen("anna.muster@example.com"));
        assertFalse(v.passwortEntfernen("niemand@example.com"));
    }

    @Test
    public void kaputterKatalogGibt503() throws Exception {
        attrappe.katalogKaputt = true;
        try {
            new Verwaltung(api, schluessel).lesen();
            fail("503 erwartet");
        } catch (VerwaltungFehler f) {
            assertEquals(503, f.status);
        }
    }

    @Test
    public void base64IstStriktUndRichtig() {
        assertEquals("", Base64Kodierer.kodieren(new byte[0]));
        assertEquals("Zg==", Base64Kodierer.kodieren("f".getBytes(StandardCharsets.UTF_8)));
        assertEquals("Zm8=", Base64Kodierer.kodieren("fo".getBytes(StandardCharsets.UTF_8)));
        assertEquals("Zm9v", Base64Kodierer.kodieren("foo".getBytes(StandardCharsets.UTF_8)));
        byte[] alle = new byte[256];
        for (int i = 0; i < 256; i++) {
            alle[i] = (byte) i;
        }
        assertEquals(java.util.Base64.getEncoder().encodeToString(alle), Base64Kodierer.kodieren(alle));
    }
}
