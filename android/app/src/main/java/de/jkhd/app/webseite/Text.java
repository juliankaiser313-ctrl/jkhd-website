package de.jkhd.app.webseite;

import java.util.List;

/** Kleine Texthilfen. String.join gibt es auf Android erst ab Version 8 (API 26), die App läuft ab 7. */
public final class Text {

    private Text() {
    }

    public static String verbinden(String trenner, List<String> teile) {
        StringBuilder aus = new StringBuilder();
        for (int i = 0; i < teile.size(); i++) {
            if (i > 0) {
                aus.append(trenner);
            }
            aus.append(teile.get(i));
        }
        return aus.toString();
    }

    /** Für Vergleiche von Rollennamen: Gedankenstriche (– —) wie Bindestriche behandeln. */
    public static String ohneStrichvarianten(String s) {
        return s == null ? "" : s.replace('—', '-').replace('–', '-').trim();
    }
}
