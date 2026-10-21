package de.jkhd.app;

import android.content.Context;
import android.graphics.Typeface;

/**
 * Die Schriften der Website, mitgeliefert unter assets/fonts (SIL Open Font License, Lizenztexte
 * daneben): Playfair Display für Überschriften, Manrope für alles andere. Feste Schnitte aus den
 * variablen Schriften der Website (Stärke 500 bzw. 700), damit sie auf jedem Android gleich aussehen.
 */
public final class Schriften {

    private static Typeface serif;
    private static Typeface sans;
    private static Typeface sansKraeftig;

    private Schriften() {
    }

    /** Playfair Display 500 — Überschriften. */
    public static Typeface serif(Context context) {
        if (serif == null) {
            serif = laden(context, "fonts/playfair_display_500.ttf");
        }
        return serif;
    }

    /** Manrope 500 — Fließtext, Untertitel. */
    public static Typeface sans(Context context) {
        if (sans == null) {
            sans = laden(context, "fonts/manrope_500.ttf");
        }
        return sans;
    }

    /** Manrope 700 — Titel in den Vierecken. */
    public static Typeface sansKraeftig(Context context) {
        if (sansKraeftig == null) {
            sansKraeftig = laden(context, "fonts/manrope_700.ttf");
        }
        return sansKraeftig;
    }

    private static Typeface laden(Context context, String pfad) {
        try {
            return Typeface.createFromAsset(context.getApplicationContext().getAssets(), pfad);
        } catch (RuntimeException fehlt) {
            // Datei fehlt oder ist kaputt: lieber Standardschrift als Absturz.
            return Typeface.DEFAULT;
        }
    }
}
