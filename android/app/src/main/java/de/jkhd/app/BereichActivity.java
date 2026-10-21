package de.jkhd.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

/**
 * Die Seite eines Bereichs. Noch ein Platzhalter: Titel und ein Satz, was hier entstehen soll.
 * Später kommt hier das jeweilige Dashboard hin (Webseite, Quant System, …).
 */
public class BereichActivity extends Activity {

    private static final String EXTRA_BEREICH = "bereich";

    /** Öffnet die Seite des Bereichs. */
    public static void oeffnen(Context context, Bereich bereich) {
        Intent absicht = new Intent(context, BereichActivity.class);
        absicht.putExtra(EXTRA_BEREICH, bereich.name());
        context.startActivity(absicht);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bereich bereich = bereichAusIntent();
        if (bereich == null) {
            finish();
            return;
        }

        setContentView(R.layout.activity_bereich);

        TextView kennzeile = findViewById(R.id.bereich_kennzeile);
        kennzeile.setText(bereich.nummer() + " · " + getString(R.string.in_vorbereitung));
        ((TextView) findViewById(R.id.bereich_titel)).setText(bereich.titel);
        ((TextView) findViewById(R.id.bereich_beschreibung)).setText(bereich.beschreibung);

        findViewById(R.id.zurueck).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
    }

    private Bereich bereichAusIntent() {
        String name = getIntent().getStringExtra(EXTRA_BEREICH);
        if (name == null) {
            return null;
        }
        try {
            return Bereich.valueOf(name);
        } catch (IllegalArgumentException unbekannt) {
            return null;
        }
    }
}
