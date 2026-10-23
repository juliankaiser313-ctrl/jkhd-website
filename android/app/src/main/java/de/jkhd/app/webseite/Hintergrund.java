package de.jkhd.app.webseite;

import android.os.Handler;
import android.os.Looper;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Arbeit im Hintergrund (Netz), Ergebnis auf dem Hauptfaden. Ein Faden reicht: der Server will ohnehin nacheinander. */
public final class Hintergrund {

    /** Eine Aufgabe mit Ergebnis; wirft bei Fehlern. */
    public interface Aufgabe<T> {
        T ausfuehren() throws Exception;
    }

    /** Was danach auf dem Hauptfaden passiert. */
    public interface Danach<T> {
        void fertig(T ergebnis);

        void fehler(Exception fehler);
    }

    /** Zu wenig Speicher (sehr große Datei) — als Fehler mit Text statt Absturz. */
    public static final class ZuWenigSpeicher extends Exception {
        ZuWenigSpeicher() {
            super("Für diese Datei reicht der Speicher des Handys nicht.");
        }
    }

    private static final ExecutorService FADEN = Executors.newSingleThreadExecutor();
    private static final Handler HAUPT = new Handler(Looper.getMainLooper());

    private Hintergrund() {
    }

    public static <T> void starten(final Aufgabe<T> aufgabe, final Danach<T> danach) {
        FADEN.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    final T ergebnis = aufgabe.ausfuehren();
                    HAUPT.post(new Runnable() {
                        @Override
                        public void run() {
                            danach.fertig(ergebnis);
                        }
                    });
                } catch (final Exception e) {
                    HAUPT.post(new Runnable() {
                        @Override
                        public void run() {
                            danach.fehler(e);
                        }
                    });
                } catch (OutOfMemoryError zuGross) {
                    final Exception e = new ZuWenigSpeicher();
                    HAUPT.post(new Runnable() {
                        @Override
                        public void run() {
                            danach.fehler(e);
                        }
                    });
                }
            }
        });
    }

    /** Ein lesbarer Text zu einem Fehler aus dem Hintergrund. */
    public static String text(Exception e) {
        if (e instanceof VerwaltungFehler || e instanceof ZuWenigSpeicher) {
            return e.getMessage();
        }
        if (e instanceof java.net.UnknownHostException) {
            return "Keine Verbindung: der Server ist nicht erreichbar (Internet aus?).";
        }
        if (e instanceof java.net.SocketTimeoutException) {
            return "Der Server hat nicht rechtzeitig geantwortet.";
        }
        if (e instanceof javax.net.ssl.SSLException) {
            return "Die sichere Verbindung kam nicht zustande.";
        }
        if (e instanceof java.io.IOException) {
            return "Netzfehler: " + e.getMessage();
        }
        return "Unerwarteter Fehler: " + e;
    }
}
