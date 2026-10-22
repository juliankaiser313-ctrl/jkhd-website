package de.jkhd.app.webseite;

/** Eine Absage des Servers (oder der Verbindung) mit einem Text, der angezeigt werden kann. */
public final class VerwaltungFehler extends Exception {

    /** HTTP-Status; -1 für Fehler ohne Antwort (Netz, Prüfsumme). */
    public final int status;
    /** Bei 409 die jetzige Fassung auf dem Server, sonst null. */
    public final String version;

    public VerwaltungFehler(int status, String meldung, String version) {
        super(meldung);
        this.status = status;
        this.version = version;
    }

    /** Ein Klartext je Status, wenn der Server keinen schickt. */
    public static String standardText(int status) {
        switch (status) {
            case 400:
                return "Der Server hat die Angaben nicht angenommen.";
            case 404:
                return "Der Server lehnt die Anfrage ab. Stimmt der Schlüssel? (Falsche Unterschrift, Wiederholung oder fehlender Schlüssel auf dem Server.)";
            case 408:
                return "Die Anfrage war zu alt, als sie ankam: Uhr des Handys oder sehr langsame Verbindung. Bitte noch einmal.";
            case 409:
                return "Jemand anders hat inzwischen gespeichert (z. B. die PC-App). Bitte neu laden.";
            case 413:
                return "Die Anfrage ist zu groß.";
            case 429:
                return "Zu viele abgelehnte Anfragen aus diesem Netz; der Server bremst für eine Stunde.";
            case 500:
                return "Fehler auf dem Server (Partnerliste nicht lesbar?).";
            case 503:
                return "Der Modul-Katalog auf dem Server ist nicht lesbar; speichern ist gerade nicht erlaubt.";
            default:
                return "Der Server hat mit Status " + status + " geantwortet.";
        }
    }
}
