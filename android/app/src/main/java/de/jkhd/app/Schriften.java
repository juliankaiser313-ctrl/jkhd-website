package de.jkhd.app;

import android.content.Context;
import android.graphics.Typeface;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

/**
 * Die Schriften der Website, mitgeliefert unter assets/fonts (SIL Open Font License, Lizenztexte
 * daneben): Playfair Display für Überschriften, Manrope für alles andere. Feste Schnitte aus den
 * variablen Schriften der Website (Stärke 500 bzw. 700), damit sie auf jedem Android gleich aussehen.
 */
public final class Schriften {

    /** android:tag="serif" an einem TextView: Überschrift in Playfair Display. */
    public static final String TAG_SERIF = "serif";
    /** android:tag="mono" an einem TextView: bleibt in der Festbreitenschrift des Systems. */
    public static final String TAG_MONO = "mono";

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

    /** Manrope 700 — Titel in den Vierecken, Knöpfe. */
    public static Typeface sansKraeftig(Context context) {
        if (sansKraeftig == null) {
            sansKraeftig = laden(context, "fonts/manrope_700.ttf");
        }
        return sansKraeftig;
    }

    /**
     * Setzt die Schriften auf alle TextViews unter einer Wurzel: Tag „serif“ → Playfair, Tag „mono“
     * → unverändert, fett gesetzte → Manrope 700, alle anderen → Manrope 500.
     */
    public static void anwenden(View wurzel) {
        if (wurzel instanceof TextView) {
            TextView t = (TextView) wurzel;
            Object tag = t.getTag();
            if (TAG_MONO.equals(tag)) {
                return;
            }
            Context c = t.getContext();
            if (TAG_SERIF.equals(tag)) {
                t.setTypeface(serif(c));
            } else if (t.getTypeface() != null && t.getTypeface().isBold()) {
                t.setTypeface(sansKraeftig(c));
            } else {
                t.setTypeface(sans(c));
            }
            return;
        }
        if (wurzel instanceof ViewGroup) {
            ViewGroup g = (ViewGroup) wurzel;
            for (int i = 0; i < g.getChildCount(); i++) {
                anwenden(g.getChildAt(i));
            }
        }
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
