package de.jkhd.app.webseite;

/**
 * Base64 mit dem strikten Alphabet (A–Z a–z 0–9 + /, mit =-Auffüllung), ohne Zeilenumbrüche — so,
 * wie der Server es für Dateien erwartet. Eigene Fassung, damit sie auf Android und in den Tests
 * auf dem Rechner gleich läuft.
 */
public final class Base64Kodierer {

    private static final char[] ALPHABET =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".toCharArray();

    private Base64Kodierer() {
    }

    public static String kodieren(byte[] daten) {
        StringBuilder aus = new StringBuilder((daten.length + 2) / 3 * 4);
        int i = 0;
        while (i + 2 < daten.length) {
            int n = ((daten[i] & 0xff) << 16) | ((daten[i + 1] & 0xff) << 8) | (daten[i + 2] & 0xff);
            aus.append(ALPHABET[(n >> 18) & 63]).append(ALPHABET[(n >> 12) & 63])
                    .append(ALPHABET[(n >> 6) & 63]).append(ALPHABET[n & 63]);
            i += 3;
        }
        int rest = daten.length - i;
        if (rest == 1) {
            int n = (daten[i] & 0xff) << 16;
            aus.append(ALPHABET[(n >> 18) & 63]).append(ALPHABET[(n >> 12) & 63]).append("==");
        } else if (rest == 2) {
            int n = ((daten[i] & 0xff) << 16) | ((daten[i + 1] & 0xff) << 8);
            aus.append(ALPHABET[(n >> 18) & 63]).append(ALPHABET[(n >> 12) & 63])
                    .append(ALPHABET[(n >> 6) & 63]).append('=');
        }
        return aus.toString();
    }
}
