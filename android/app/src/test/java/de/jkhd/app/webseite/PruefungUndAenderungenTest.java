package de.jkhd.app.webseite;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.util.List;

public class PruefungUndAenderungenTest {

    @Test
    public void saubereListeIstInOrdnung() throws Exception {
        Partnerliste l = Partnerliste.ausText(PartnerlisteTest.BEISPIEL);
        Pruefung p = Pruefung.pruefen(l, PartnerlisteTest.katalog());
        assertTrue(String.valueOf(p.jePartner), p.inOrdnung());
    }

    @Test
    public void findetFehlendeUndDoppelteAdressen() throws Exception {
        Partnerliste l = Partnerliste.ausText(PartnerlisteTest.BEISPIEL);
        Partner neu = l.neuerPartner("22.10.2026");
        neu.name = "Ohne Adresse";
        l.partner.put("neu", neu);
        Partner doppelt = l.neuerPartner("22.10.2026");
        doppelt.name = "Doppelt";
        doppelt.email = "Anna.Muster@example.com";
        l.partner.put("doppelt", doppelt);
        Pruefung p = Pruefung.pruefen(l, PartnerlisteTest.katalog());
        assertFalse(p.inOrdnung());
        assertTrue(p.jePartner.get("neu").get(0).contains("fehlt"));
        assertTrue(p.jePartner.get("doppelt").get(0).contains("Dasselbe Postfach"));
        assertEquals(2, p.jePartner.size());
    }

    @Test
    public void findetGrenzenUndVerboteneAngabe() throws Exception {
        Partnerliste l = Partnerliste.ausText(PartnerlisteTest.BEISPIEL);
        Partner anna = l.partner.get("anna.muster@example.com");
        anna.name = "";
        anna.felder.add(new Angabe("Rolle", "nochmal"));
        StringBuilder lang = new StringBuilder();
        for (int i = 0; i < 301; i++) {
            lang.append('x');
        }
        anna.felder.add(new Angabe("Lang", lang.toString()));
        anna.dateien.add(new Datei("kaputt", "virus.exe", 1, "22.10.2026", ""));
        Pruefung p = Pruefung.pruefen(l, PartnerlisteTest.katalog());
        List<String> m = p.jePartner.get("anna.muster@example.com");
        assertTrue(m.toString(), m.size() >= 5);
    }

    @Test
    public void aenderungenNeuGeaendertEntfernt() throws Exception {
        Partnerliste original = Partnerliste.ausText(PartnerlisteTest.BEISPIEL);
        Partnerliste arbeit = original.kopie();
        List<Modul> katalog = PartnerlisteTest.katalog();
        assertTrue(Aenderungen.ermitteln(original, arbeit, katalog).leer());

        Partner anna = arbeit.partner.get("anna.muster@example.com");
        anna.freigaben.remove("fremd-modul");
        anna.notiz = "neu";
        arbeit.partner.remove("kontakt@beispiel-firma.example");
        Partner neu = arbeit.neuerPartner("22.10.2026");
        neu.email = "neu@example.com";
        neu.name = "Neu";
        arbeit.partner.put(neu.email, neu);

        Aenderungen a = Aenderungen.ermitteln(original, arbeit, katalog);
        assertEquals(1, a.neu);
        assertEquals(1, a.geaendert);
        assertEquals(1, a.entfernt);
        assertEquals(3, a.zeilen.size());
        assertTrue(a.zeilen.get(0).contains("Module +0 −1"));
        assertTrue(a.zeilen.get(0).contains("Notiz"));
        assertTrue(a.zeilen.get(1).startsWith("Neu: Neu"));
        assertTrue(a.zeilen.get(2).startsWith("Entfernt: Beispiel Firma"));
    }

    @Test
    public void adressaenderungWarntVorNeuemZugang() throws Exception {
        Partnerliste original = Partnerliste.ausText(PartnerlisteTest.BEISPIEL);
        Partnerliste arbeit = original.kopie();
        arbeit.partner.get("anna.muster@example.com").email = "anna.neu@example.com";
        arbeit.neuEinordnen();
        Aenderungen a = Aenderungen.ermitteln(original, arbeit, PartnerlisteTest.katalog());
        assertEquals(1, a.geaendert);
        assertEquals(0, a.entfernt);
        assertTrue(a.zeilen.get(1).contains("neuer Zugang"));
    }

    @Test
    public void vorschauDatenHabenDieFormVonDaten() throws Exception {
        Partnerliste l = Partnerliste.ausText(PartnerlisteTest.BEISPIEL);
        Partner anna = l.partner.get("anna.muster@example.com");
        org.json.JSONObject d = VorschauDaten.bauen(anna, l.rollen, PartnerlisteTest.katalog(), "vip@example.com", new Passwortstatus("01.10.2026", ""));
        assertEquals("Anna Muster", d.getString("name"));
        assertEquals("", d.getString("vip"));                       // ansicht.vip = false
        assertEquals("Rolle", d.getJSONArray("felder").getJSONObject(0).getString("label"));
        assertEquals(3, d.getJSONArray("module").length());
        assertTrue(d.getJSONArray("module").getJSONObject(1).has("link"));   // alpha-fabrik: freigeschaltet (alle Module), nicht bald
        assertFalse(d.getJSONArray("module").getJSONObject(2).has("link"));  // prop-firms: bald
        assertEquals("PDF", d.getJSONArray("dateien").getJSONObject(0).getString("typ"));
        assertTrue(d.getJSONObject("passwort").getBoolean("gesetzt"));
        assertFalse(d.getJSONObject("ansicht").getBoolean("vip"));
    }
}
