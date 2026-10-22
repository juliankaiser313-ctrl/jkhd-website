package de.jkhd.app.webseite;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.util.List;

import de.jkhd.app.R;
import de.jkhd.app.Schriften;

/**
 * Rollen pflegen (wie der Dialog „Rollen“ der PC-App): umbenennen zieht die Angabe „Rolle“ bei allen
 * Partnern mit, entfernen setzt sie leer. Solange die Datei keine Rollen kennt, werden die
 * Vorschläge gezeigt und erst bei der ersten Änderung in die Liste übernommen.
 */
public class RollenActivity extends Activity {

    private WebseiteSitzung sitzung;
    private LinearLayout rollen;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sitzung = WebseiteSitzung.holen();
        if (!sitzung.geladen()) {
            finish();
            return;
        }
        setContentView(R.layout.activity_rollen);
        rollen = findViewById(R.id.rollen);
        final EditText neu = findViewById(R.id.rolle_neu);
        findViewById(R.id.zurueck).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        findViewById(R.id.rolle_hinzufuegen).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String name = neu.getText().toString().trim();
                if (name.isEmpty()) {
                    return;
                }
                if (name.length() > Rolle.NAME_MAX) {
                    Toast.makeText(RollenActivity.this, "Höchstens " + Rolle.NAME_MAX + " Zeichen.", Toast.LENGTH_SHORT).show();
                    return;
                }
                List<Rolle> liste = festmachen();
                if (Partnerliste.findeRolle(liste, name) != null) {
                    Toast.makeText(RollenActivity.this, "Diese Rolle gibt es schon.", Toast.LENGTH_SHORT).show();
                    return;
                }
                if (liste.size() >= Rolle.ANZAHL_MAX) {
                    Toast.makeText(RollenActivity.this, "Höchstens " + Rolle.ANZAHL_MAX + " Rollen.", Toast.LENGTH_SHORT).show();
                    return;
                }
                liste.add(new Rolle(name, false));
                neu.setText("");
                zeichnen();
            }
        });
        zeichnen();
        Schriften.anwenden(findViewById(android.R.id.content));
    }

    /** Die Rollen, die gezeigt werden: aus der Datei oder die Vorschläge. */
    private List<Rolle> anzeige() {
        if (sitzung.arbeit.rollenVorhanden || !sitzung.arbeit.rollen.isEmpty()) {
            return sitzung.arbeit.rollen;
        }
        return sitzung.arbeit.rollenZurAuswahl();
    }

    /** Vor einer Änderung: die Vorschläge in die Liste übernehmen, damit sie gespeichert werden. */
    private List<Rolle> festmachen() {
        if (!sitzung.arbeit.rollenVorhanden && sitzung.arbeit.rollen.isEmpty()) {
            sitzung.arbeit.rollen.addAll(sitzung.arbeit.rollenZurAuswahl());
        }
        return sitzung.arbeit.rollen;
    }

    private void zeichnen() {
        rollen.removeAllViews();
        LayoutInflater li = LayoutInflater.from(this);
        for (final Rolle r : anzeige()) {
            View zeile = li.inflate(R.layout.zeile_rolle, rollen, false);
            TextView name = zeile.findViewById(R.id.rolle_name);
            name.setText(r.name);
            name.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    umbenennen(r);
                }
            });
            CheckBox alle = zeile.findViewById(R.id.rolle_alle);
            alle.setChecked(r.alleModule);
            alle.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                @Override
                public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                    Rolle echt = eigene(r);
                    echt.alleModule = isChecked;
                }
            });
            zeile.findViewById(R.id.rolle_entfernen).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    entfernenFragen(r);
                }
            });
            rollen.addView(zeile);
        }
        Schriften.anwenden(rollen);
    }

    /** Die Rolle in der festen Liste (nach dem Festmachen dasselbe oder das gleichnamige Objekt). */
    private Rolle eigene(Rolle r) {
        List<Rolle> liste = festmachen();
        Rolle echt = Partnerliste.findeRolle(liste, r.name);
        if (echt == null) {
            echt = new Rolle(r.name, r.alleModule);
            liste.add(echt);
        }
        return echt;
    }

    private void umbenennen(final Rolle r) {
        final EditText feld = new EditText(this);
        feld.setText(r.name);
        feld.setSelection(r.name.length());
        feld.setSingleLine(true);
        int rand = Math.round(20 * getResources().getDisplayMetrics().density);
        android.widget.FrameLayout rahmen = new android.widget.FrameLayout(this);
        rahmen.setPadding(rand, rand / 2, rand, 0);
        rahmen.addView(feld);
        new AlertDialog.Builder(this)
                .setTitle("Rolle umbenennen")
                .setView(rahmen)
                .setPositiveButton("Umbenennen", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        String neu = feld.getText().toString().trim();
                        if (neu.isEmpty() || neu.equals(r.name) || neu.length() > Rolle.NAME_MAX) {
                            return;
                        }
                        List<Rolle> liste = festmachen();
                        if (Partnerliste.findeRolle(liste, neu) != null) {
                            Toast.makeText(RollenActivity.this, "Diese Rolle gibt es schon.", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        String alt = r.name;
                        eigene(r).name = neu;
                        int n = 0;
                        for (Partner p : sitzung.arbeit.partner.values()) {
                            if (p.rolle.equals(alt)) {
                                p.rolle = neu;
                                n++;
                            }
                        }
                        zeichnen();
                        Toast.makeText(RollenActivity.this, "Umbenannt; bei " + n + " Partnern mitgezogen.", Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    private void entfernenFragen(final Rolle r) {
        int n = 0;
        for (Partner p : sitzung.arbeit.partner.values()) {
            if (p.rolle.equals(r.name)) {
                n++;
            }
        }
        new AlertDialog.Builder(this)
                .setTitle("Rolle entfernen?")
                .setMessage("„" + r.name + "“ wird entfernt; bei " + n + " Partnern wird die Rolle leer.")
                .setPositiveButton("Entfernen", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        List<Rolle> liste = festmachen();
                        Rolle echt = Partnerliste.findeRolle(liste, r.name);
                        if (echt != null) {
                            liste.remove(echt);
                        }
                        for (Partner p : sitzung.arbeit.partner.values()) {
                            if (p.rolle.equals(r.name)) {
                                p.rolle = "";
                            }
                        }
                        zeichnen();
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }
}
