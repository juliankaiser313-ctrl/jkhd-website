package de.jkhd.app.webseite;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * E-Mail-Adressen so behandeln wie der Server: {@link #schluessel} ist die Form, in der der Server
 * Adressen vergleicht (klein, ohne Rand, Gmail ohne Punkte und +Zusatz); {@link #gueltig} entspricht
 * PHPs filter_var(FILTER_VALIDATE_EMAIL) in den Fällen, die hier vorkommen (nur ASCII).
 */
public final class Adresse {

    public static final int MAX_LAENGE = 254;

    private static final Pattern LOKAL = Pattern.compile("^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$");
    private static final Pattern DOMAIN = Pattern.compile("^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$");

    private Adresse() {
    }

    public static String schluessel(String email) {
        String s = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        int at = s.lastIndexOf('@');
        if (at < 0) {
            return s;
        }
        String lokal = s.substring(0, at);
        String domain = s.substring(at + 1);
        if (domain.equals("gmail.com") || domain.equals("googlemail.com")) {
            int plus = lokal.indexOf('+');
            if (plus >= 0) {
                lokal = lokal.substring(0, plus);
            }
            lokal = lokal.replace(".", "");
        }
        return lokal + "@" + domain;
    }

    public static boolean gueltig(String email) {
        if (email == null) {
            return false;
        }
        String s = email.trim();
        if (s.isEmpty() || s.length() > MAX_LAENGE || !s.equals(email)) {
            return false;
        }
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) > 126 || s.charAt(i) < 33) {
                return false;
            }
        }
        int at = s.lastIndexOf('@');
        if (at <= 0 || at == s.length() - 1) {
            return false;
        }
        String lokal = s.substring(0, at);
        String domain = s.substring(at + 1);
        return lokal.length() <= 64 && LOKAL.matcher(lokal).matches() && DOMAIN.matcher(domain).matches();
    }
}
