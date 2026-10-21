package de.jkhd.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

/**
 * Der Startbildschirm: schwarz, darauf die Vierecke der Bereiche (siehe Bereich.java).
 * Vier Plätze stehen bereit; belegt sind so viele, wie es Bereiche gibt.
 */
public class MainActivity extends Activity {

    private static final int[] PLAETZE = {R.id.kachel_1, R.id.kachel_2, R.id.kachel_3, R.id.kachel_4};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

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
