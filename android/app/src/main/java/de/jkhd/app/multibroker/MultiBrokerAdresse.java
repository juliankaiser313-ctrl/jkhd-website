package de.jkhd.app.multibroker;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

/**
 * Die Adresse des Multi-Brokers (über Tailscale, z. B. https://mein-pc.tail1234.ts.net) und die
 * Regel, welche Links in der App bleiben. Ohne Android-Abhängigkeiten, damit es auf dem Rechner
 * getestet werden kann.
 *
 * Angenommen wird nur https mit einem Rechnernamen, ohne Benutzer/Passwort in der Adresse. Fehlt
 * „https://“, wird es ergänzt; „http://“ wird abgelehnt (Tailscale serve liefert gültiges HTTPS).
 */
public final class MultiBrokerAdresse {

    /** Was mit einem Link passiert. */
    public enum Ziel {
        /** Gleicher Rechner (https, gleicher Host und Port): in der App laden. */
        INTERN,
        /** Fremde Seite oder E-Mail/Telefon: im Browser bzw. der passenden App öffnen. */
        EXTERN,
        /** Alles andere (javascript:, file:, intent:, data: …): nicht öffnen. */
        IGNORIEREN
    }

    /** Ergebnis der Prüfung einer Eingabe: entweder die bereinigte Adresse oder ein Fehlertext. */
    public static final class Pruefung {
        public final String adresse;
        public final String fehler;

        private Pruefung(String adresse, String fehler) {
            this.adresse = adresse;
            this.fehler = fehler;
        }

        public boolean ok() {
            return adresse != null;
        }
    }

    public static final String BEISPIEL = "https://mein-pc.tail1234.ts.net";

    private MultiBrokerAdresse() {
    }

    /**
     * Prüft eine eingegebene Adresse. Ergebnis bei Erfolg: https://host[:port]/pfad (Host klein,
     * ohne Abfrage und Anker, Pfad mindestens „/“).
     */
    public static Pruefung pruefen(String eingabe) {
        String s = eingabe == null ? "" : eingabe.trim();
        if (s.isEmpty()) {
            return new Pruefung(null, "Bitte die Adresse eingeben, z. B. " + BEISPIEL);
        }
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c <= ' ' || c == 127) {
                return new Pruefung(null, "Die Adresse darf keine Leerzeichen enthalten.");
            }
        }
        String klein = s.toLowerCase(Locale.ROOT);
        if (!klein.contains("://")) {
            if (klein.contains(":") && !klein.matches("^[a-z0-9.-]+:[0-9]+(/.*)?$")) {
                return new Pruefung(null, "Nur https-Adressen sind erlaubt, z. B. " + BEISPIEL);
            }
            s = "https://" + s;
        } else if (!klein.startsWith("https://")) {
            return new Pruefung(null, "Nur https-Adressen sind erlaubt (nicht http), z. B. " + BEISPIEL);
        }
        URI u;
        try {
            u = new URI(s);
        } catch (URISyntaxException e) {
            return new Pruefung(null, "Das ist keine gültige Adresse.");
        }
        if (u.getRawUserInfo() != null) {
            return new Pruefung(null, "Benutzername oder Passwort gehören nicht in die Adresse.");
        }
        String host = u.getHost();
        if (host == null || host.isEmpty() || host.startsWith(".") || host.endsWith(".")) {
            return new Pruefung(null, "In der Adresse fehlt der Rechnername, z. B. " + BEISPIEL);
        }
        int port = u.getPort();
        if (port == 0 || port > 65535) {
            return new Pruefung(null, "Die Portnummer ist ungültig.");
        }
        String pfad = u.getRawPath() == null || u.getRawPath().isEmpty() ? "/" : u.getRawPath();
        String aus = "https://" + host.toLowerCase(Locale.ROOT) + (port > 0 && port != 443 ? ":" + port : "") + pfad;
        return new Pruefung(aus, null);
    }

    /** Wohin mit einem Link, wenn die App auf der Adresse basis läuft? */
    public static Ziel ziel(String basis, String url) {
        if (url == null) {
            return Ziel.IGNORIEREN;
        }
        URI b;
        URI u;
        try {
            b = new URI(basis);
            u = new URI(nurSchemaUndRechner(url.trim()));
        } catch (URISyntaxException | NullPointerException e) {
            return Ziel.IGNORIEREN;
        }
        String schema = u.getScheme() == null ? "" : u.getScheme().toLowerCase(Locale.ROOT);
        if (schema.equals("https") && gleicherRechner(b, u)) {
            return Ziel.INTERN;
        }
        if (schema.equals("http") || schema.equals("https") || schema.equals("mailto") || schema.equals("tel")) {
            return Ziel.EXTERN;
        }
        return Ziel.IGNORIEREN;
    }

    /**
     * Für die Link-Regel zählen nur Schema, Rechner und Port. Pfad, Abfrage und Anker werden
     * abgeschnitten: Chromium lässt dort Zeichen wie | { } ^ oder ein einzelnes % roh stehen, die
     * java.net.URI ablehnt — sonst würden solche Links auf dem eigenen Rechner still verschluckt.
     * Die Grenze (erstes / ? # nach „://“) ist dieselbe, an der Chromium den Rechner enden lässt.
     */
    static String nurSchemaUndRechner(String url) {
        int i = url.indexOf("://");
        if (i <= 0 || !url.substring(0, i).matches("[A-Za-z][A-Za-z0-9+.-]*")) {
            return url;   // kein „schema://“ am Anfang (mailto:, tel:, javascript: …): unverändert
        }
        int j = i + 3;
        while (j < url.length() && "/?#".indexOf(url.charAt(j)) < 0) {
            j++;
        }
        return url.substring(0, j);
    }

    /** Liegt url auf genau dem Rechner der Adresse basis (https, gleicher Host, gleicher Port)? */
    public static boolean intern(String basis, String url) {
        return ziel(basis, url) == Ziel.INTERN;
    }

    private static boolean gleicherRechner(URI basis, URI u) {
        if (basis.getHost() == null || u.getHost() == null || u.getRawUserInfo() != null) {
            return false;
        }
        return basis.getHost().equalsIgnoreCase(u.getHost()) && port(basis) == port(u);
    }

    private static int port(URI u) {
        return u.getPort() > 0 ? u.getPort() : 443;
    }
}
