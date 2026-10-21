package de.jkhd.app;

/**
 * Die Bereiche der App — je ein Viereck auf dem Startbildschirm, je eine eigene Seite.
 * Neuen Bereich anlegen: Texte in res/values/strings.xml, Eintrag hier anhängen; der
 * Startbildschirm hat vier Plätze (activity_main.xml), die Reihenfolge hier ist die Reihenfolge dort.
 */
public enum Bereich {

    WEBSEITE(
            R.string.bereich_webseite_titel,
            R.string.bereich_webseite_untertitel,
            R.string.bereich_webseite_beschreibung),

    QUANT_SYSTEM(
            R.string.bereich_quant_titel,
            R.string.bereich_quant_untertitel,
            R.string.bereich_quant_beschreibung);

    /** Name im Viereck und als Überschrift der Seite. */
    public final int titel;
    /** Kurze Zeile unter dem Namen: wofür der Bereich da ist. */
    public final int untertitel;
    /** Ein Satz auf der Seite, solange sie noch ein Platzhalter ist. */
    public final int beschreibung;

    Bereich(int titel, int untertitel, int beschreibung) {
        this.titel = titel;
        this.untertitel = untertitel;
        this.beschreibung = beschreibung;
    }

    /** Laufende Nummer als Text, "01", "02", … */
    public String nummer() {
        return String.format(java.util.Locale.ROOT, "%02d", ordinal() + 1);
    }
}
