package de.jkhd.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.DecelerateInterpolator;
import android.widget.ProgressBar;

/**
 * Steuert den Ladebildschirm (ladebildschirm.xml): großes Lockup, unten ein Ladebalken.
 *
 * Ablauf: {@link #starten} lässt den Balken in gut einer Sekunde bis 85 % laufen, damit der
 * Bildschirm nicht nur aufblitzt. Ist bis dahin auch die eigentliche Arbeit gemeldet
 * ({@link #arbeitFertig}), läuft der Balken voll, der Bildschirm blendet aus und wird entfernt.
 * Dauert die Arbeit länger, bleibt der Balken bei 85 % stehen, bis sie fertig ist.
 * Später (Anmeldung, Daten laden) lassen sich hier Zwischenstände über {@link #fortschritt} setzen.
 */
public final class Ladebildschirm {

    private static final int VOLL = 1000;
    private static final int GRUNDLAUF_BIS = 850;
    private static final long GRUNDLAUF_DAUER_MS = 1100;
    private static final long ABSCHLUSS_DAUER_MS = 220;
    private static final long AUSBLENDEN_DAUER_MS = 350;

    private final View ansicht;
    private final ProgressBar balken;
    private Runnable danach;
    private boolean grundlaufFertig;
    private boolean arbeitFertig;
    private boolean abgeschlossen;

    public Ladebildschirm(View ansicht) {
        this.ansicht = ansicht;
        this.balken = ansicht.findViewById(R.id.ladebalken);
        balken.setMax(VOLL);
        balken.setProgress(0);
    }

    /** Zeigt den Bildschirm und startet den Grundlauf des Balkens; danach läuft, sobald alles fertig ist. */
    public void starten(Runnable danach) {
        this.danach = danach;
        ansicht.setVisibility(View.VISIBLE);
        ansicht.setAlpha(1f);
        ObjectAnimator lauf = ObjectAnimator.ofInt(balken, "progress", 0, GRUNDLAUF_BIS);
        lauf.setDuration(GRUNDLAUF_DAUER_MS);
        lauf.setInterpolator(new DecelerateInterpolator());
        lauf.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                grundlaufFertig = true;
                pruefen();
            }
        });
        lauf.start();
    }

    /** Zwischenstand der Arbeit in Prozent (0–100); nie unter den aktuellen Stand. */
    public void fortschritt(int prozent) {
        int ziel = Math.max(balken.getProgress(), Math.min(GRUNDLAUF_BIS, prozent * 10));
        balken.setProgress(ziel);
    }

    /** Die eigentliche Arbeit ist erledigt. */
    public void arbeitFertig() {
        arbeitFertig = true;
        pruefen();
    }

    /** Ohne Animation weg — etwa, wenn die Seite nach einer Drehung neu aufgebaut wird. */
    public void sofortWeg() {
        abgeschlossen = true;
        entfernen();
    }

    private void pruefen() {
        if (grundlaufFertig && arbeitFertig && !abgeschlossen) {
            abgeschlossen = true;
            abschliessen();
        }
    }

    private void abschliessen() {
        ObjectAnimator voll = ObjectAnimator.ofInt(balken, "progress", balken.getProgress(), VOLL);
        voll.setDuration(ABSCHLUSS_DAUER_MS);
        voll.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                ansicht.animate()
                        .alpha(0f)
                        .setDuration(AUSBLENDEN_DAUER_MS)
                        .withEndAction(new Runnable() {
                            @Override
                            public void run() {
                                entfernen();
                                if (danach != null) {
                                    danach.run();
                                }
                            }
                        })
                        .start();
            }
        });
        voll.start();
    }

    private void entfernen() {
        ansicht.setVisibility(View.GONE);
        ViewGroup eltern = (ViewGroup) ansicht.getParent();
        if (eltern != null) {
            eltern.removeView(ansicht);
        }
    }
}
