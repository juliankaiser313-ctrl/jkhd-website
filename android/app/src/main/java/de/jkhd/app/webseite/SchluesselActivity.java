package de.jkhd.app.webseite;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.security.GeneralSecurityException;
import java.util.Arrays;

import de.jkhd.app.R;
import de.jkhd.app.Schriften;

/** Einmalig: den Schlüssel der Verwaltung eingeben; er wird verschlüsselt abgelegt (Schluesselspeicher). */
public class SchluesselActivity extends Activity {

    private static final int REQ_SPERRE = 11;

    private EditText feld;
    private TextView meldung;
    private Schluesselspeicher speicher;
    private byte[] wartend;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Der Schlüssel steht hier im Klartext: keine Bildschirmfotos, kein Vorschaubild in „Zuletzt verwendet“.
        getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE,
                android.view.WindowManager.LayoutParams.FLAG_SECURE);
        setContentView(R.layout.activity_schluessel);
        Schriften.anwenden(findViewById(android.R.id.content));
        speicher = new Schluesselspeicher(this);
        feld = findViewById(R.id.schluessel);
        meldung = findViewById(R.id.meldung);
        Button speichern = findViewById(R.id.speichern);

        findViewById(R.id.zurueck).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                vergessen();
                setResult(RESULT_CANCELED);
                finish();
            }
        });
        speichern.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                pruefen();
            }
        });
    }

    private void pruefen() {
        byte[] b = Hex.zu(feld.getText().toString());
        if (b == null || b.length != Unterschrift.SCHLUESSEL_BYTES) {
            melden(getString(R.string.ws_schluessel_ungueltig));
            return;
        }
        if (!speicher.geraetGesichert()) {
            melden(getString(R.string.ws_sperre_fehlt));
            return;
        }
        wartend = b;
        versuchen();
    }

    private void versuchen() {
        try {
            speicher.speichern(wartend);
            WebseiteSitzung.holen().entsperren(wartend);
            Arrays.fill(wartend, (byte) 0);
            feld.setText("");
            setResult(RESULT_OK);
            finish();
        } catch (GeneralSecurityException e) {
            if (Schluesselspeicher.brauchtBestaetigung(e)) {
                sperreBestaetigen();
            } else {
                melden("Der Schlüssel ließ sich nicht ablegen: " + e.getMessage());
            }
        } catch (RuntimeException e) {
            melden("Der Schlüssel ließ sich nicht ablegen: " + e.getMessage());
        }
    }

    private void sperreBestaetigen() {
        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        Intent i = km == null ? null : km.createConfirmDeviceCredentialIntent(
                getString(R.string.ws_sperre_titel), getString(R.string.ws_sperre_text));
        if (i == null) {
            melden(getString(R.string.ws_sperre_fehlt));
            return;
        }
        startActivityForResult(i, REQ_SPERRE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_SPERRE) {
            if (resultCode == RESULT_OK && wartend != null) {
                versuchen();
            } else {
                melden(getString(R.string.ws_sperre_abgebrochen));
            }
        }
    }

    private void melden(String text) {
        meldung.setText(text);
        meldung.setVisibility(View.VISIBLE);
    }

    /** Den eingegebenen Schlüssel aus Feld und Speicher nehmen. */
    private void vergessen() {
        if (wartend != null) {
            Arrays.fill(wartend, (byte) 0);
            wartend = null;
        }
        if (feld != null) {
            feld.setText("");
        }
    }

    @Override
    protected void onDestroy() {
        if (isFinishing()) {
            vergessen();
        }
        super.onDestroy();
    }
}
