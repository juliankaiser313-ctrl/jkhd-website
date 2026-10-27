package de.jkhd.app.multibroker;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class MultiBrokerAdresseTest {

    private static final String BASIS = "https://mein-pc.tail1234.ts.net/";

    private static String ok(String eingabe) {
        MultiBrokerAdresse.Pruefung p = MultiBrokerAdresse.pruefen(eingabe);
        assertTrue(eingabe + " sollte angenommen werden: " + p.fehler, p.ok());
        assertNull(p.fehler);
        return p.adresse;
    }

    private static void abgelehnt(String eingabe) {
        MultiBrokerAdresse.Pruefung p = MultiBrokerAdresse.pruefen(eingabe);
        assertFalse(eingabe + " sollte abgelehnt werden", p.ok());
        assertTrue(p.fehler != null && !p.fehler.isEmpty());
    }

    @Test
    public void httpsWirdAngenommenUndBereinigt() {
        assertEquals("https://mein-pc.tail1234.ts.net/", ok("https://mein-pc.tail1234.ts.net"));
        assertEquals("https://mein-pc.tail1234.ts.net/", ok("  HTTPS://Mein-PC.Tail1234.ts.net/  "));
        assertEquals("https://mein-pc.tail1234.ts.net/broker/", ok("https://mein-pc.tail1234.ts.net/broker/"));
        assertEquals("https://mein-pc.tail1234.ts.net/", ok("https://mein-pc.tail1234.ts.net/?x=1#oben"));
        assertEquals("https://mein-pc.tail1234.ts.net:8443/", ok("https://mein-pc.tail1234.ts.net:8443"));
        assertEquals("https://mein-pc.tail1234.ts.net/", ok("https://mein-pc.tail1234.ts.net:443/"));
    }

    @Test
    public void ohneSchemaWirdHttpsErgaenzt() {
        assertEquals("https://mein-pc.tail1234.ts.net/", ok("mein-pc.tail1234.ts.net"));
        assertEquals("https://mein-pc.tail1234.ts.net:8443/x", ok("mein-pc.tail1234.ts.net:8443/x"));
    }

    @Test
    public void nurHttpsAndereSchemataWerdenAbgelehnt() {
        abgelehnt("http://mein-pc.tail1234.ts.net");
        abgelehnt("HTTP://mein-pc.tail1234.ts.net");
        abgelehnt("ftp://mein-pc.tail1234.ts.net");
        abgelehnt("javascript:alert(1)");
        abgelehnt("file:///sdcard/x.html");
        abgelehnt("data:text/html,hallo");
        abgelehnt("intent://x#Intent;end");
    }

    @Test
    public void unbrauchbareEingabenWerdenAbgelehnt() {
        abgelehnt("");
        abgelehnt("   ");
        abgelehnt(null);
        abgelehnt("https://");
        abgelehnt("https:///pfad");
        abgelehnt("https://mein pc.ts.net");
        abgelehnt("https://julian:geheim@mein-pc.tail1234.ts.net");
        abgelehnt("https://mein-pc.tail1234.ts.net:0");
        abgelehnt("https://.ts.net");
    }

    @Test
    public void gleicherRechnerBleibtInDerApp() {
        assertEquals(MultiBrokerAdresse.Ziel.INTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net/login"));
        assertEquals(MultiBrokerAdresse.Ziel.INTERN, MultiBrokerAdresse.ziel(BASIS, "https://MEIN-PC.tail1234.ts.net/konten?x=1"));
        assertEquals(MultiBrokerAdresse.Ziel.INTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net:443/"));
        assertTrue(MultiBrokerAdresse.intern(BASIS, "https://mein-pc.tail1234.ts.net/"));
    }

    @Test
    public void fremdeSeitenGehenInDenBrowser() {
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://www.tradingview.com/"));
        // Tricks, die wie der eigene Rechner aussehen
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net.boese.example/"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://boese.example/?u=mein-pc.tail1234.ts.net"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://anderer-pc.tail1234.ts.net/"));
        // Gleicher Rechner, aber unverschlüsselt oder anderer Port: nicht in der App
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "http://mein-pc.tail1234.ts.net/"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net:8443/"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "mailto:support@example.com"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "tel:+491234"));
        assertFalse(MultiBrokerAdresse.intern(BASIS, "https://julian@mein-pc.tail1234.ts.net/"));
    }

    @Test
    public void chromiumAdressenMitSonderzeichenBleibenInDerApp() {
        // Chromium lässt | { } ^ und ein einzelnes % in Pfad/Abfrage roh stehen; java.net.URI lehnt sie ab.
        assertEquals(MultiBrokerAdresse.Ziel.INTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net/konten?ids=1|2"));
        assertEquals(MultiBrokerAdresse.Ziel.INTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net/k?f={}"));
        assertEquals(MultiBrokerAdresse.Ziel.INTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net/k?x=100%"));
        assertEquals(MultiBrokerAdresse.Ziel.INTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net/k?a=b^c#x|y"));
        assertEquals(MultiBrokerAdresse.Ziel.INTERN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net"));
        // Der Rechner endet am ersten / ? # — was danach kommt, macht keinen fremden Host zum eigenen.
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://boese.example/?u=https://mein-pc.tail1234.ts.net/"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://boese.example?@mein-pc.tail1234.ts.net/"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://boese.example#@mein-pc.tail1234.ts.net/"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "https://boese.example/|mein-pc.tail1234.ts.net"));
        assertFalse(MultiBrokerAdresse.intern(BASIS, "https://julian:x|y@mein-pc.tail1234.ts.net/"));
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, "https://mein-pc.tail1234.ts.net\\@boese.example/"));
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, "javascript://mein-pc.tail1234.ts.net/%0Aalert(1)"));
        assertEquals(MultiBrokerAdresse.Ziel.EXTERN, MultiBrokerAdresse.ziel(BASIS, "mailto:x@example.com?body=https://mein-pc.tail1234.ts.net/"));
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, "data:text/html,<a href=https://mein-pc.tail1234.ts.net/>"));
    }

    @Test
    public void gefaehrlicheSchemataWerdenIgnoriert() {
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, "javascript:alert(1)"));
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, "file:///data/data/x"));
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, "intent://scan/#Intent;scheme=zxing;end"));
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, "data:text/html,hallo"));
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, null));
        assertEquals(MultiBrokerAdresse.Ziel.IGNORIEREN, MultiBrokerAdresse.ziel(BASIS, "ht tp://kaputt"));
    }
}
