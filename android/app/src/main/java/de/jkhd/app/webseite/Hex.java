package de.jkhd.app.webseite;

import java.util.Locale;

/** Hex-Darstellung von Bytes, wie der Server sie erwartet (Kleinbuchstaben). */
public final class Hex {

    private static final char[] ZIFFERN = "0123456789abcdef".toCharArray();

    private Hex() {
    }

    public static String von(byte[] bytes) {
        char[] aus = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int b = bytes[i] & 0xff;
            aus[i * 2] = ZIFFERN[b >>> 4];
            aus[i * 2 + 1] = ZIFFERN[b & 0x0f];
        }
        return new String(aus);
    }

    /** Liest eine Hex-Zeichenkette; Leerraum und Groß-/Kleinschreibung sind egal. null, wenn kein Hex. */
    public static byte[] zu(String text) {
        if (text == null) {
            return null;
        }
        String s = text.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
        if (s.isEmpty() || s.length() % 2 != 0 || !s.matches("[0-9a-f]+")) {
            return null;
        }
        byte[] aus = new byte[s.length() / 2];
        for (int i = 0; i < aus.length; i++) {
            aus[i] = (byte) Integer.parseInt(s.substring(i * 2, i * 2 + 2), 16);
        }
        return aus;
    }

    /** Ist das ein Hex-Wert mit genau so vielen Bytes? */
    public static boolean ist(String text, int bytes) {
        byte[] b = zu(text);
        return b != null && b.length == bytes;
    }
}
