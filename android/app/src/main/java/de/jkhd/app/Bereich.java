package de.jkhd.app;

import android.app.Activity;

import de.jkhd.app.multibroker.MultiBrokerActivity;
import de.jkhd.app.webseite.WebseiteActivity;

/**
 * Die Bereiche der App — je ein Viereck auf dem Startbildschirm, je eine eigene Seite.
 * Neuen Bereich anlegen: Texte in res/values/strings.xml, Eintrag hier anhängen; der
 * Startbildschirm hat vier Plätze (activity_main.xml), die Reihenfolge hier ist die Reihenfolge dort.
 * Ohne eigene Seite (seite == null) öffnet sich der Platzhalter (BereichActivity).
 */
public enum Bereich {

    WEBSEITE(
            R.string.bereich_webseite_titel,
            R.string.bereich_webseite_untertitel,
            R.string.bereich_webseite_beschreibung,
            WebseiteActivity.class),

    QUANT_SYSTEM(
            R.string.bereich_quant_titel,
            R.string.bereich_quant_untertitel,
            R.string.bereich_quant_beschreibung,
            null),

    /** Die Trading-Oberfläche vom PC (über Tailscale). Langes Drücken aufs Viereck: Adresse ändern. */
    MULTI_BROKER(
            R.string.bereich_multibroker_titel,
            R.string.bereich_multibroker_untertitel,
            R.string.bereich_multibroker_beschreibung,
            MultiBrokerActivity.class);

    /** Name im Viereck und als Überschrift der Seite. */
    public final int titel;
    /** Kurze Zeile unter dem Namen: wofür der Bereich da ist. */
    public final int untertitel;
    /** Ein Satz auf der Seite, solange sie noch ein Platzhalter ist. */
    public final int beschreibung;
    /** Die eigene Seite des Bereichs; null = noch Platzhalter. */
    public final Class<? extends Activity> seite;

    Bereich(int titel, int untertitel, int beschreibung, Class<? extends Activity> seite) {
        this.titel = titel;
        this.untertitel = untertitel;
        this.beschreibung = beschreibung;
        this.seite = seite;
    }

    /** Laufende Nummer als Text, "01", "02", … */
    public String nummer() {
        return String.format(java.util.Locale.ROOT, "%02d", ordinal() + 1);
    }
}
