package de.jkhd.app.webseite;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

import java.util.Arrays;
import java.util.List;

public class PartnerlisteTest {

    static final String BEISPIEL = "{\n"
            + "  \"_hinweis\": \"Je Partner ein Eintrag.\",\n"
            + "  \"_rollen\": [{\"name\": \"Partner — Vollzugang (alle Module)\", \"alle_module\": true}, {\"name\": \"Partner\", \"alle_module\": false}],\n"
            + "  \"anna.muster@example.com\": {\n"
            + "    \"name\": \"Anna Muster\",\n"
            + "    \"felder\": [{\"label\": \"Rolle\", \"wert\": \"Partner — Vollzugang (alle Module)\"}, {\"label\": \"Firma\", \"wert\": \"Muster Quant GmbH\"}],\n"
            + "    \"freigaben\": [\"quant-labor\", \"fremd-modul\"],\n"
            + "    \"notiz\": \"Gespräch am 20.10.\",\n"
            + "    \"dateien\": [{\"id\": \"0123456789abcdef0123456789abcdef\", \"name\": \"Formelsammlung.pdf\", \"groesse\": 279060, \"datum\": \"22.10.2026\", \"text\": \"Die aktuelle Fassung\"}],\n"
            + "    \"ansicht\": {\"begruessung\": \"Schön, dass Sie dabei sind.\", \"vip\": false}\n"
            + "  },\n"
            + "  \"kontakt@beispiel-firma.example\": {\"name\": \"Beispiel Firma\", \"felder\": [{\"label\": \"Rolle\", \"wert\": \"Partner\"}], \"freigaben\": []}\n"
            + "}\n";

    static List<Modul> katalog() {
        return Arrays.asList(
                new Modul("quant-labor", "Quant-Labor", "", "", true, "anfrage", ""),
                new Modul("alpha-fabrik", "Alpha-Fabrik", "", "", false, "anfrage", "https://beispiel.example/alpha"),
                new Modul("prop-firms", "Prop-Firms-Dashboard", "", "", false, "bald", ""));
    }

    @Test
    public void liestHinweisRollenUndPartner() throws Exception {
        Partnerliste l = Partnerliste.ausText(BEISPIEL);
        assertEquals("Je Partner ein Eintrag.", l.hinweis);
        assertTrue(l.rollenVorhanden);
        assertEquals(2, l.rollen.size());
        assertTrue(l.rollen.get(0).alleModule);
        assertEquals(2, l.partner.size());
        Partner anna = l.partner.get("anna.muster@example.com");
        assertEquals("Anna Muster", anna.name);
        assertEquals("Partner — Vollzugang (alle Module)", anna.rolle);
        assertEquals(1, anna.felder.size());
        assertEquals("Firma", anna.felder.get(0).label);
        assertEquals(Arrays.asList("quant-labor", "fremd-modul"), anna.freigaben);
        assertEquals(1, anna.dateien.size());
        assertEquals("Formelsammlung.pdf", anna.dateien.get(0).name);
        assertFalse(anna.ansicht.vip);
        assertTrue(anna.ansicht.daten);
        assertEquals("anna.muster@example.com", anna.bisherigeAdresse);
    }

    @Test
    public void leereDateiUndListeGeltenAlsLeer() throws Exception {
        assertEquals(0, Partnerliste.ausText("").partner.size());
        assertEquals(0, Partnerliste.ausText("[]").partner.size());
        assertEquals(0, Partnerliste.ausText("{}").partner.size());
    }

    @Test
    public void bautDieListeMitRolleAlsErsterAngabeUndAllenModulen() throws Exception {
        Partnerliste l = Partnerliste.ausText(BEISPIEL);
        JSONObject o = l.zuJson(katalog());
        assertEquals("Je Partner ein Eintrag.", o.getString("_hinweis"));
        assertEquals(2, o.getJSONArray("_rollen").length());
        JSONObject anna = o.getJSONObject("anna.muster@example.com");
        JSONArray felder = anna.getJSONArray("felder");
        assertEquals("Rolle", felder.getJSONObject(0).getString("label"));
        assertEquals("Firma", felder.getJSONObject(1).getString("label"));
        // Rolle mit allen Modulen: der ganze Katalog, und die fremde Freigabe bleibt
        JSONArray frei = anna.getJSONArray("freigaben");
        List<String> ids = Arrays.asList(frei.getString(0), frei.getString(1), frei.getString(2), frei.getString(3));
        assertTrue(ids.containsAll(Arrays.asList("quant-labor", "alpha-fabrik", "prop-firms", "fremd-modul")));
        assertEquals(4, frei.length());
        assertEquals("Gespräch am 20.10.", anna.getString("notiz"));
        assertEquals(1, anna.getJSONArray("dateien").length());
        JSONObject ansicht = anna.getJSONObject("ansicht");
        assertFalse(ansicht.getBoolean("vip"));
        assertFalse(ansicht.has("daten"));
        // Partner ohne Rolle "alle Module": nur die eigenen Freigaben; Standard-Ansicht fehlt ganz
        JSONObject firma = o.getJSONObject("kontakt@beispiel-firma.example");
        assertEquals(0, firma.getJSONArray("freigaben").length());
        assertFalse(firma.has("ansicht"));
        assertFalse(firma.has("notiz"));
        assertFalse(firma.has("dateien"));
    }

    @Test
    public void ohneRollenInDerDateiWerdenSieNurGeschriebenWennGeaendert() throws Exception {
        Partnerliste l = Partnerliste.ausText("{\"a@example.com\": {\"name\": \"A\"}}");
        assertFalse(l.rollenVorhanden);
        assertFalse(l.zuJson(katalog()).has("_rollen"));
        assertNull(l.hinweis);
        List<Rolle> auswahl = l.rollenZurAuswahl();
        assertEquals(2, auswahl.size());
        l.rollen.add(new Rolle("Partner", false));
        assertTrue(l.zuJson(katalog()).has("_rollen"));
    }

    @Test
    public void kopieIstUnabhaengig() throws Exception {
        Partnerliste l = Partnerliste.ausText(BEISPIEL);
        Partnerliste k = l.kopie();
        k.partner.get("anna.muster@example.com").name = "Anders";
        k.rollen.get(0).name = "Umbenannt";
        assertEquals("Anna Muster", l.partner.get("anna.muster@example.com").name);
        assertEquals("Partner — Vollzugang (alle Module)", l.rollen.get(0).name);
    }

    @Test
    public void neuerPartnerBekommtRolleUndAngelegt() throws Exception {
        Partnerliste l = Partnerliste.ausText(BEISPIEL);
        Partner p = l.neuerPartner("22.10.2026");
        assertEquals("Partner", p.rolle);
        assertEquals("Angelegt", p.felder.get(0).label);
        assertEquals("22.10.2026", p.felder.get(0).wert);
        assertNull(p.bisherigeAdresse);
    }

    @Test
    public void standPrueftDieFassung() throws Exception {
        JSONObject antwort = new JSONObject();
        antwort.put("partner_text", BEISPIEL);
        antwort.put("version", Stand.sha256Hex(BEISPIEL));
        antwort.put("katalog", new JSONArray().put(katalog().get(0).zuJson(true)));
        antwort.put("vip", "vip@example.com");
        JSONObject pw = new JSONObject();
        pw.put("Anna.Muster@example.com", new JSONObject().put("seit", "01.10.2026").put("bestaetigt", "01.10.2026"));
        antwort.put("passwoerter", pw);
        Stand s = new Stand(antwort);
        assertEquals(2, s.liste.partner.size());
        assertEquals(1, s.katalog.size());
        assertEquals("01.10.2026", s.passwortVon("anna.muster@example.com").seit);
        antwort.put("version", "00");
        try {
            new Stand(antwort);
            throw new AssertionError("falsche Fassung muss abgelehnt werden");
        } catch (VerwaltungFehler erwartet) {
            assertEquals(-1, erwartet.status);
        }
    }
}
