package de.jkhd.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

/**
 * Der Startbildschirm: erst der Ladebildschirm (großes Lockup, Ladebalken), dann das
 * Kontrollzentrum — schwarz, oben links das Lockup, darunter die Vierecke der Bereiche
 * (siehe Bereich.java). Vier Plätze stehen bereit; belegt sind so viele, wie es Bereiche gibt.
 */
public class MainActivity extends Activity {

    private static final int[] PLAETZE = {R.id.kachel_1, R.id.kachel_2, R.id.kachel_3, R.id.kachel_4};
    private static final String ZUSTAND_GELADEN = "geladen";

    private Ladebildschirm ladebildschirm;
    private boolean geladen;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        ladebildschirm = new Ladebildschirm(findViewById(R.id.ladebildschirm));

        if (savedInstanceState != null && savedInstanceState.getBoolean(ZUSTAND_GELADEN)) {
            // Schon einmal geladen (z. B. nach einer Drehung): nicht noch einmal warten lassen.
            geladen = true;
            ladebildschirm.sofortWeg();
            einrichten();
        } else {
            laden();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putBoolean(ZUSTAND_GELADEN, geladen);
    }

    /** Lädt im Hintergrund, was die Seite braucht (bisher: die Schriften), und baut sie dann auf. */
    private void laden() {
        ladebildschirm.starten(new Runnable() {
            @Override
            public void run() {
                geladen = true;
            }
        });
        new Thread(new Runnable() {
            @Override
            public void run() {
                Schriften.serif(MainActivity.this);
                Schriften.sans(MainActivity.this);
                Schriften.sansKraeftig(MainActivity.this);
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (isFinishing() || isDestroyed()) {
                            return;
                        }
                        einrichten();
                        ladebildschirm.arbeitFertig();
                    }
                });
            }
        }, "jkhd-laden").start();
    }

    /** Baut das Kontrollzentrum auf: Überschrift in der Serife, die Plätze mit den Bereichen. */
    private void einrichten() {
        ((TextView) findViewById(R.id.ueberschrift)).setTypeface(Schriften.serif(this));

        Bereich[] bereiche = Bereich.values();
        for (int i = 0; i < PLAETZE.length; i++) {
            View kachel = findViewById(PLAETZE[i]);
            if (i < bereiche.length) {
                belegen(kachel, bereiche[i]);
            } else {
                // Freier Platz: nimmt seinen Raum ein, bleibt aber unsichtbar.
                kachel.setVisibility(View.INVISIBLE);
                kachel.setOnClickListener(null);
                kachel.setClickable(false);
            }
        }

        // Eine ganz leere zweite Reihe (Hochformat) braucht keinen Platz.
        View zweiteReihe = findViewById(R.id.zeile_2);
        if (zweiteReihe != null) {
            zweiteReihe.setVisibility(bereiche.length > 2 ? View.VISIBLE : View.GONE);
        }
    }

    private void belegen(View kachel, final Bereich bereich) {
        TextView nummer = kachel.findViewById(R.id.kachel_nummer);
        TextView titel = kachel.findViewById(R.id.kachel_titel);
        TextView untertitel = kachel.findViewById(R.id.kachel_untertitel);
        nummer.setText(bereich.nummer());
        titel.setText(bereich.titel);
        titel.setTypeface(Schriften.sansKraeftig(this));
        untertitel.setText(bereich.untertitel);
        untertitel.setTypeface(Schriften.sans(this));
        kachel.setVisibility(View.VISIBLE);
        kachel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                BereichActivity.oeffnen(MainActivity.this, bereich);
            }
        });
    }
}
