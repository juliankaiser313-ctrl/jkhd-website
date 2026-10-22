package de.jkhd.app.webseite;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class AdresseTest {

    @Test
    public void schluesselKleinUndOhneRand() {
        assertEquals("anna.muster@example.com", Adresse.schluessel("  Anna.Muster@Example.COM "));
    }

    @Test
    public void gmailOhnePunkteUndZusatz() {
        assertEquals("annamuster@gmail.com", Adresse.schluessel("Anna.Muster+jkhd@gmail.com"));
        assertEquals("annamuster@googlemail.com", Adresse.schluessel("anna.muster@googlemail.com"));
        assertEquals("anna.muster+x@example.com", Adresse.schluessel("anna.muster+x@example.com"));
    }

    @Test
    public void gueltigeAdressen() {
        assertTrue(Adresse.gueltig("anna.muster@example.com"));
        assertTrue(Adresse.gueltig("kontakt@beispiel-firma.example"));
        assertTrue(Adresse.gueltig("a+b_c@sub.domain.de"));
    }

    @Test
    public void ungueltigeAdressen() {
        assertFalse(Adresse.gueltig(""));
        assertFalse(Adresse.gueltig("ohne-at.example.com"));
        assertFalse(Adresse.gueltig("anna@localhost"));
        assertFalse(Adresse.gueltig("anna@example.com "));
        assertFalse(Adresse.gueltig("änna@example.com"));
        assertFalse(Adresse.gueltig("anna..muster@example.com"));
        assertFalse(Adresse.gueltig("anna@-example.com"));
        StringBuilder lang = new StringBuilder();
        for (int i = 0; i < 250; i++) {
            lang.append('a');
        }
        assertFalse(Adresse.gueltig(lang + "@example.com"));
    }
}
