package de.jkhd.app.webseite;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import de.jkhd.app.R;
import de.jkhd.app.Schriften;

/**
 * Ein Partner bearbeiten: Adresse, Name, Rolle, Passwort, Module, Angaben, Dateien, Ansicht, Notiz —
 * wie der Editor der PC-App, nur untereinander. Änderungen landen in der Arbeitskopie der Sitzung;
 * gespeichert wird in der Liste. Dateien gehen sofort zum Server (gehören erst nach dem Speichern zum
 * Partner), „Passwort entfernen“ wirkt sofort. Beides läuft im Hintergrund weiter, auch wenn die
 * Seite gedreht oder verlassen wird; das Ergebnis landet beim richtigen Partner.
 */
public class PartnerActivity extends Activity {

    public static final String EXTRA_SCHLUESSEL = "schluessel";
    private static final int REQ_DATEI = 31;
    /** Vorschläge für Bezeichnungen, wie die datalist der PC-App. */
    private static final List<String> ANGABE_VORSCHLAEGE = Arrays.asList(
            "Geboren", "Firma", "Ansprechpartner", "Zweck", "Angelegt", "Partner seit", "Status", "Telefon");

    private static WeakReference<PartnerActivity> vorn = new WeakReference<>(null);

    private WebseiteSitzung sitzung;
    private Partner partner;
    private String schluessel;
    private boolean entfernt;

    private TextView titel;
    private TextView probleme;
    private EditText email;
    private EditText name;
    private Spinner rolle;
    private TextView passwortStatus;
    private Button passwortEntfernen;
    private LinearLayout module;
    private LinearLayout angaben;
    private LinearLayout dateien;
    private EditText begruessung;
    private Switch ansichtDaten;
    private Switch ansichtDateien;
    private Switch ansichtModule;
    private Switch ansichtVip;
    private EditText notiz;
    private TextView bisherigeAdresse;
    private ProgressBar arbeit;
    private List<Rolle> rollenAuswahl = new ArrayList<>();
    private boolean fuelltGerade;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sitzung = WebseiteSitzung.holen();
        schluessel = savedInstanceState != null && savedInstanceState.getString(EXTRA_SCHLUESSEL) != null
                ? savedInstanceState.getString(EXTRA_SCHLUESSEL)
                : getIntent().getStringExtra(EXTRA_SCHLUESSEL);
        partner = sitzung.geladen() && schluessel != null ? sitzung.arbeit.partner.get(schluessel) : null;
        if (partner == null) {
            finish();
            return;
        }
        setContentView(R.layout.activity_partner);

        titel = findViewById(R.id.titel);
        probleme = findViewById(R.id.probleme);
        email = findViewById(R.id.email);
        name = findViewById(R.id.name);
        rolle = findViewById(R.id.rolle);
        passwortStatus = findViewById(R.id.passwort_status);
        passwortEntfernen = findViewById(R.id.passwort_entfernen);
        module = findViewById(R.id.module);
        angaben = findViewById(R.id.angaben);
        dateien = findViewById(R.id.dateien);
        begruessung = findViewById(R.id.begruessung);
        ansichtDaten = findViewById(R.id.ansicht_daten);
        ansichtDateien = findViewById(R.id.ansicht_dateien);
        ansichtModule = findViewById(R.id.ansicht_module);
        ansichtVip = findViewById(R.id.ansicht_vip);
        notiz = findViewById(R.id.notiz);
        bisherigeAdresse = findViewById(R.id.bisherige_adresse);
        arbeit = findViewById(R.id.arbeit);

        fuellen();
        Schriften.anwenden(findViewById(android.R.id.content));

        // Beanstandungen und „Bisherige Adresse“ sofort zeigen, sobald ein Feld verlassen wird.
        View.OnFocusChangeListener beimVerlassen = new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hatFokus) {
                if (!hatFokus) {
                    uebernehmen();
                }
            }
        };
        email.setOnFocusChangeListener(beimVerlassen);
        name.setOnFocusChangeListener(beimVerlassen);

        klick(R.id.zurueck, new Runnable() {
            @Override
            public void run() {
                onBackPressed();
            }
        });
        klick(R.id.fertig, new Runnable() {
            @Override
            public void run() {
                uebernehmen();
                finish();
            }
        });
        Runnable vorschau = new Runnable() {
            @Override
            public void run() {
                uebernehmen();
                Intent i = new Intent(PartnerActivity.this, VorschauActivity.class);
                i.putExtra(EXTRA_SCHLUESSEL, schluessel);
                startActivity(i);
            }
        };
        klick(R.id.vorschau, vorschau);
        klick(R.id.vorschau_oben, vorschau);
        klick(R.id.angabe_neu, new Runnable() {
            @Override
            public void run() {
                angabenLesen();
                partner.felder.add(new Angabe("", ""));
                angabenZeichnen();
                View letzte = angaben.getChildAt(angaben.getChildCount() - 1);
                if (letzte != null) {
                    letzte.findViewById(R.id.angabe_label).requestFocus();
                }
            }
        });
        klick(R.id.datei_neu, new Runnable() {
            @Override
            public void run() {
                dateiWaehlen();
            }
        });
        klick(R.id.ansicht_alle, new Runnable() {
            @Override
            public void run() {
                ansichtFuerAlle();
            }
        });
        klick(R.id.passwort_entfernen, new Runnable() {
            @Override
            public void run() {
                passwortEntfernenFragen();
            }
        });
        klick(R.id.partner_entfernen, new Runnable() {
            @Override
            public void run() {
                partnerEntfernenFragen();
            }
        });
    }

    private void klick(int id, final Runnable was) {
        findViewById(id).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                was.run();
            }
        });
    }

    /** Der Editor, der gerade vorn ist (oder null). */
    private static PartnerActivity vorn() {
        PartnerActivity a = vorn.get();
        return a != null && !a.isFinishing() && !a.isDestroyed() ? a : null;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (WebseiteSitzung.fortgesetztAbgelaufen() || WebseiteSitzung.holen() != sitzung
                || !sitzung.geladen() || sitzung.arbeit.schluesselVon(partner) == null) {
            // Gesperrt (Ruhezeit) oder die Liste wurde ersetzt: zurück zur Liste.
            entfernt = true;
            finish();
            return;
        }
        vorn = new WeakReference<>(this);
        arbeitZeigen(sitzung.uploadsLaufen > 0 || sitzung.passwortLaeuft);
        dateienLesen();
        dateienZeichnen();
        passwortStatusZeichnen();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (vorn.get() == this) {
            vorn = new WeakReference<>(null);
        }
        if (partner != null && !entfernt && sitzung.geladen()) {
            uebernehmen();
        }
        WebseiteSitzung.pausiert();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putString(EXTRA_SCHLUESSEL, schluessel);
    }

    @Override
    public void onBackPressed() {
        uebernehmen();
        super.onBackPressed();
    }

    // ---------- Anzeigen ----------

    private void fuellen() {
        fuelltGerade = true;
        titel.setText(partner.anzeige());
        email.setText(partner.email);
        name.setText(partner.name);

        rollenAuswahl = sitzung.arbeit.rollenZurAuswahl();
        List<String> namen = new ArrayList<>();
        namen.add("— keine Rolle —");
        int gewaehlt = 0;
        for (int i = 0; i < rollenAuswahl.size(); i++) {
            namen.add(rollenAuswahl.get(i).name);
            if (rollenAuswahl.get(i).name.equals(partner.rolle)) {
                gewaehlt = i + 1;
            }
        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, namen);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        rolle.setAdapter(adapter);
        rolle.setSelection(gewaehlt);
        rolle.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String neu = position == 0 || position - 1 >= rollenAuswahl.size() ? "" : rollenAuswahl.get(position - 1).name;
                if (!neu.equals(partner.rolle)) {
                    partner.rolle = neu;
                    moduleZeichnen();
                    problemeZeichnen();
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
            }
        });

        passwortStatusZeichnen();
        moduleZeichnen();
        angabenZeichnen();
        dateienZeichnen();

        begruessung.setText(partner.ansicht.begruessung);
        ansichtDaten.setChecked(partner.ansicht.daten);
        ansichtDateien.setChecked(partner.ansicht.dateien);
        ansichtModule.setChecked(partner.ansicht.module);
        ansichtVip.setChecked(partner.ansicht.vip);
        notiz.setText(partner.notiz);

        bisherigeAdresseZeichnen();
        problemeZeichnen();
        fuelltGerade = false;
    }

    private void bisherigeAdresseZeichnen() {
        if (partner.bisherigeAdresse != null && !partner.bisherigeAdresse.equals(partner.email)) {
            bisherigeAdresse.setText("Bisherige Adresse: " + partner.bisherigeAdresse
                    + " — mit dem Speichern ist das ein neuer Zugang (Passwort und Anmeldungen der alten Adresse werden gelöscht).");
            bisherigeAdresse.setVisibility(View.VISIBLE);
        } else {
            bisherigeAdresse.setVisibility(View.GONE);
        }
    }

    private void passwortStatusZeichnen() {
        String adresse = partner.bisherigeAdresse != null ? partner.bisherigeAdresse : partner.email;
        Passwortstatus s = sitzung.stand.passwortVon(adresse);
        if (s != null) {
            String text = "Passwort: festgelegt seit " + s.seit;
            if (!s.bestaetigt.isEmpty()) {
                text += " · zuletzt per Code bestätigt " + s.bestaetigt;
            }
            passwortStatus.setText(text);
            passwortEntfernen.setVisibility(View.VISIBLE);
        } else if (!sitzung.stand.passwoerterBekannt) {
            passwortStatus.setText(R.string.ws_passwort_unbekannt);
            passwortEntfernen.setVisibility(View.GONE);
        } else {
            passwortStatus.setText(R.string.ws_passwort_keins);
            passwortEntfernen.setVisibility(View.GONE);
        }
    }

    private void moduleZeichnen() {
        module.removeAllViews();
        List<Modul> katalog = sitzung.katalog();
        final boolean alle = partner.rolleMitAllenModulen(rollenAuswahl);
        if (katalog.isEmpty()) {
            TextView t = new TextView(this);
            t.setText(R.string.ws_keine_module);
            t.setTextColor(getColor(R.color.text_gedaempft));
            module.addView(t);
        }
        if (alle) {
            TextView t = new TextView(this);
            t.setText("Die Rolle „" + partner.rolle + "“ schaltet alle Module frei.");
            t.setTextColor(getColor(R.color.text_gedaempft));
            t.setPadding(0, 0, 0, dp(6));
            module.addView(t);
        }
        for (final Modul m : katalog) {
            String text = m.name;
            if (m.bald()) {
                text += "  · angekündigt";
            }
            if (m.neu) {
                text += "  · NEU";
            }
            CheckBox cb = kaestchen(text, alle || partner.freigaben.contains(m.id), !alle);
            cb.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                @Override
                public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                    if (isChecked) {
                        if (!partner.freigaben.contains(m.id)) {
                            partner.freigaben.add(m.id);
                        }
                    } else {
                        partner.freigaben.remove(m.id);
                    }
                }
            });
            module.addView(cb);
        }
        // Freigaben, die der Katalog nicht kennt: sichtbar machen, nur bewusst entfernen
        for (final String id : new ArrayList<>(partner.freigaben)) {
            if (Modul.finde(katalog, id) == null) {
                CheckBox cb = kaestchen(id + "  · nicht im Katalog", true, true);
                cb.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        if (isChecked) {
                            if (!partner.freigaben.contains(id)) {
                                partner.freigaben.add(id);
                            }
                        } else {
                            partner.freigaben.remove(id);
                        }
                    }
                });
                module.addView(cb);
            }
        }
        Schriften.anwenden(module);
    }

    private CheckBox kaestchen(String text, boolean an, boolean aktiv) {
        CheckBox cb = new CheckBox(this);
        cb.setText(text);
        cb.setChecked(an);
        cb.setEnabled(aktiv);
        cb.setSaveEnabled(false);
        cb.setTextColor(getColor(aktiv ? R.color.text_hell : R.color.text_gedaempft));
        cb.setTextSize(15);
        cb.setMinHeight(dp(44));
        cb.setPadding(dp(6), 0, 0, 0);
        return cb;
    }

    private void angabenZeichnen() {
        angaben.removeAllViews();
        LayoutInflater li = LayoutInflater.from(this);
        ArrayAdapter<String> vorschlaege = new ArrayAdapter<>(this, android.R.layout.simple_dropdown_item_1line, ANGABE_VORSCHLAEGE);
        for (int i = 0; i < partner.felder.size(); i++) {
            final int index = i;
            Angabe a = partner.felder.get(i);
            View zeile = li.inflate(R.layout.zeile_angabe, angaben, false);
            AutoCompleteTextView label = zeile.findViewById(R.id.angabe_label);
            label.setAdapter(vorschlaege);
            label.setThreshold(1);
            label.setText(a.label);
            ((EditText) zeile.findViewById(R.id.angabe_wert)).setText(a.wert);
            zeile.findViewById(R.id.angabe_entfernen).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    angabenLesen();
                    if (index < partner.felder.size()) {
                        partner.felder.remove(index);
                    }
                    angabenZeichnen();
                }
            });
            angaben.addView(zeile);
        }
        Schriften.anwenden(angaben);
    }

    private void angabenLesen() {
        for (int i = 0; i < angaben.getChildCount() && i < partner.felder.size(); i++) {
            View zeile = angaben.getChildAt(i);
            Angabe a = partner.felder.get(i);
            a.label = ((EditText) zeile.findViewById(R.id.angabe_label)).getText().toString().trim();
            a.wert = ((EditText) zeile.findViewById(R.id.angabe_wert)).getText().toString().trim();
        }
    }

    private void dateienZeichnen() {
        dateien.removeAllViews();
        if (partner.dateien.isEmpty()) {
            TextView t = new TextView(this);
            t.setText(R.string.ws_keine_dateien);
            t.setTextColor(getColor(R.color.text_gedaempft));
            dateien.addView(t);
        }
        LayoutInflater li = LayoutInflater.from(this);
        for (int i = 0; i < partner.dateien.size(); i++) {
            final int index = i;
            Datei d = partner.dateien.get(i);
            View zeile = li.inflate(R.layout.zeile_datei, dateien, false);
            zeile.setTag(d.id);
            ((TextView) zeile.findViewById(R.id.datei_typ)).setText(Datei.typ(d.name));
            ((TextView) zeile.findViewById(R.id.datei_name)).setText(d.name);
            String info = groesseText(d.groesse) + (d.datum.isEmpty() ? "" : " · " + d.datum) + (d.neu ? " · noch nicht gespeichert" : "");
            ((TextView) zeile.findViewById(R.id.datei_info)).setText(info);
            ((EditText) zeile.findViewById(R.id.datei_text)).setText(d.text);
            zeile.findViewById(R.id.datei_entfernen).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    dateienLesen();
                    if (index < partner.dateien.size()) {
                        partner.dateien.remove(index);
                    }
                    dateienZeichnen();
                }
            });
            dateien.addView(zeile);
        }
        Schriften.anwenden(dateien);
    }

    /** Liest die Beschreibungen zurück — je Zeile über die Kennung der Datei, nicht über die Position. */
    private void dateienLesen() {
        for (int i = 0; i < dateien.getChildCount(); i++) {
            View zeile = dateien.getChildAt(i);
            EditText text = zeile.findViewById(R.id.datei_text);
            if (text == null || !(zeile.getTag() instanceof String)) {
                continue;
            }
            for (Datei d : partner.dateien) {
                if (d.id.equals(zeile.getTag())) {
                    d.text = text.getText().toString().trim();
                    break;
                }
            }
        }
    }

    private void problemeZeichnen() {
        Pruefung p = sitzung.pruefung();
        List<String> m = p.jePartner.get(schluessel);
        if (m == null || m.isEmpty()) {
            probleme.setVisibility(View.GONE);
        } else {
            probleme.setText("• " + Text.verbinden("\n• ", m));
            probleme.setVisibility(View.VISIBLE);
        }
    }

    // ---------- Übernehmen ----------

    /** Liest alle Felder in den Partner und ordnet die Liste neu ein (die Adresse ist der Schlüssel). */
    private void uebernehmen() {
        if (entfernt || fuelltGerade || partner == null || titel == null) {
            return;
        }
        partner.email = email.getText().toString().trim();
        partner.name = name.getText().toString().trim();
        int pos = rolle.getSelectedItemPosition();
        partner.rolle = pos <= 0 || pos - 1 >= rollenAuswahl.size() ? "" : rollenAuswahl.get(pos - 1).name;
        angabenLesen();
        dateienLesen();
        partner.ansicht.begruessung = begruessung.getText().toString().trim();
        partner.ansicht.daten = ansichtDaten.isChecked();
        partner.ansicht.dateien = ansichtDateien.isChecked();
        partner.ansicht.module = ansichtModule.isChecked();
        partner.ansicht.vip = ansichtVip.isChecked();
        partner.notiz = notiz.getText().toString().trim();
        sitzung.arbeit.neuEinordnen();
        schluessel = sitzung.arbeit.schluesselVon(partner);
        // Auch der Intent trägt den neuen Schlüssel — falls Android die Seite aus ihm neu baut.
        getIntent().putExtra(EXTRA_SCHLUESSEL, schluessel);
        titel.setText(partner.anzeige());
        bisherigeAdresseZeichnen();
        problemeZeichnen();
    }

    // ---------- Dateien ----------

    private void dateiWaehlen() {
        uebernehmen();
        if (partner.dateien.size() >= Partner.DATEIEN_MAX) {
            Toast.makeText(this, "Höchstens " + Partner.DATEIEN_MAX + " Dateien je Partner.", Toast.LENGTH_LONG).show();
            return;
        }
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        try {
            startActivityForResult(i, REQ_DATEI);
        } catch (android.content.ActivityNotFoundException keineApp) {
            Toast.makeText(this, "Keine Dateien-App gefunden.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_DATEI || resultCode != RESULT_OK || data == null || data.getData() == null || partner == null) {
            return;
        }
        final Uri uri = data.getData();
        String dateiname = null;
        long groesse = -1;
        try (Cursor c = getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int n = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                int g = c.getColumnIndex(OpenableColumns.SIZE);
                if (n >= 0) {
                    dateiname = c.getString(n);
                }
                if (g >= 0 && !c.isNull(g)) {
                    groesse = c.getLong(g);
                }
            }
        } catch (RuntimeException egal) {
            // dann ohne Namen aus dem Anbieter
        }
        if (dateiname == null || dateiname.isEmpty()) {
            dateiname = uri.getLastPathSegment();
        }
        final String name = dateiname == null ? "" : dateiname.trim();
        String problem = Datei.nameProblem(name);
        if (problem != null) {
            melden(problem);
            return;
        }
        if (groesse > Datei.GROESSE_MAX) {
            melden("Die Datei ist größer als 15 MB.");
            return;
        }
        final WebseiteSitzung s = sitzung;
        final Partner ziel = partner;
        final android.content.ContentResolver resolver = getContentResolver();
        s.uploadsLaufen++;
        arbeitZeigen(true);
        Hintergrund.starten(new Hintergrund.Aufgabe<Datei>() {
            @Override
            public Datei ausfuehren() throws Exception {
                byte[] inhalt;
                try (InputStream ein = resolver.openInputStream(uri)) {
                    if (ein == null) {
                        throw new java.io.IOException("Die Datei ließ sich nicht öffnen.");
                    }
                    ByteArrayOutputStream puffer = new ByteArrayOutputStream();
                    byte[] b = new byte[65536];
                    int n;
                    while ((n = ein.read(b)) > 0) {
                        puffer.write(b, 0, n);
                        if (puffer.size() > Datei.GROESSE_MAX) {
                            throw new java.io.IOException("Die Datei ist größer als 15 MB.");
                        }
                    }
                    inhalt = puffer.toByteArray();
                }
                if (inhalt.length == 0) {
                    throw new java.io.IOException("Die Datei ist leer.");
                }
                return s.verwaltung().dateiHochladen(name, inhalt, WebseiteSitzung.heute());
            }
        }, new Hintergrund.Danach<Datei>() {
            @Override
            public void fertig(Datei d) {
                s.uploadsLaufen--;
                PartnerActivity a = vorn();
                // Den Partner in der aktuellen Liste suchen — das Objekt von vorhin kann ersetzt sein.
                Partner p = s.arbeit == null ? null : s.arbeit.wiederfinden(ziel);
                if (p == null) {
                    if (a != null) {
                        a.arbeitZeigen(s.passwortLaeuft);
                        a.melden("Die Datei wurde hochgeladen, aber der Partner steht nicht mehr in der Liste. "
                                + "Sie wird nicht zugeordnet; der Server löscht sie nach einem Tag.");
                    }
                    return;
                }
                boolean sichtbar = a != null && a.partner == p;
                if (sichtbar) {
                    a.dateienLesen();
                }
                p.dateien.add(d);
                if (a != null) {
                    a.arbeitZeigen(s.uploadsLaufen > 0 || s.passwortLaeuft);
                    if (sichtbar) {
                        a.dateienZeichnen();
                    }
                    Toast.makeText(a, "Hochgeladen — gehört „" + p.anzeige() + "“, sobald du speicherst.", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void fehler(Exception e) {
                s.uploadsLaufen--;
                PartnerActivity a = vorn();
                if (a != null) {
                    a.arbeitZeigen(s.uploadsLaufen > 0 || s.passwortLaeuft);
                    a.melden("Hochladen fehlgeschlagen: " + Hintergrund.text(e));
                }
            }
        });
    }

    // ---------- Ansicht, Passwort, Entfernen ----------

    private void ansichtFuerAlle() {
        uebernehmen();
        new AlertDialog.Builder(this)
                .setTitle("Für alle Partner übernehmen?")
                .setMessage("Begrüßung und die vier Schalter werden bei allen " + sitzung.arbeit.partner.size() + " Partnern so gesetzt (wirksam mit dem Speichern).")
                .setPositiveButton("Übernehmen", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        for (Partner p : sitzung.arbeit.partner.values()) {
                            if (p != partner) {
                                p.ansicht = partner.ansicht.kopie();
                            }
                        }
                        Toast.makeText(PartnerActivity.this, "Übernommen.", Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    private void passwortEntfernenFragen() {
        final String adresse = partner.bisherigeAdresse != null ? partner.bisherigeAdresse : partner.email.trim();
        new AlertDialog.Builder(this)
                .setTitle("Passwort entfernen?")
                .setMessage("Das Passwort von " + adresse + " wird sofort auf dem Server gelöscht, alle Anmeldungen enden, "
                        + "und der Partner bekommt eine E-Mail. Er meldet sich danach per Code an.")
                .setPositiveButton("Entfernen", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        passwortEntfernen(adresse);
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    private void passwortEntfernen(final String adresse) {
        final WebseiteSitzung s = sitzung;
        s.passwortLaeuft = true;
        arbeitZeigen(true);
        Hintergrund.starten(new Hintergrund.Aufgabe<Boolean>() {
            @Override
            public Boolean ausfuehren() throws Exception {
                return s.verwaltung().passwortEntfernen(adresse);
            }
        }, new Hintergrund.Danach<Boolean>() {
            @Override
            public void fertig(Boolean wirklich) {
                s.passwortLaeuft = false;
                if (s.stand != null) {
                    s.stand.passwoerter.remove(Adresse.schluessel(adresse));
                }
                PartnerActivity a = vorn();
                if (a != null) {
                    a.arbeitZeigen(s.uploadsLaufen > 0);
                    a.passwortStatusZeichnen();
                    Toast.makeText(a, wirklich ? "Passwort von " + adresse + " entfernt." : "Es war kein Passwort gesetzt.", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void fehler(Exception e) {
                s.passwortLaeuft = false;
                PartnerActivity a = vorn();
                if (a != null) {
                    a.arbeitZeigen(s.uploadsLaufen > 0);
                    a.melden("Passwort nicht entfernt: " + Hintergrund.text(e));
                }
            }
        });
    }

    private void partnerEntfernenFragen() {
        new AlertDialog.Builder(this)
                .setTitle("Partner entfernen?")
                .setMessage(partner.anzeige() + " wird aus der Liste genommen. Mit dem Speichern löscht der Server Passwort und Anmeldungen, die Dateien einen Tag später.")
                .setPositiveButton("Entfernen", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        sitzung.arbeit.entfernen(partner);
                        entfernt = true;
                        finish();
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    // ---------- Kleinkram ----------

    private void arbeitZeigen(boolean an) {
        arbeit.setVisibility(an ? View.VISIBLE : View.INVISIBLE);
        findViewById(R.id.datei_neu).setEnabled(sitzung.uploadsLaufen == 0);
        passwortEntfernen.setEnabled(!sitzung.passwortLaeuft);
    }

    private void melden(String text) {
        new AlertDialog.Builder(this).setMessage(text).setPositiveButton("OK", null).show();
    }

    private int dp(int wert) {
        return Math.round(wert * getResources().getDisplayMetrics().density);
    }

    static String groesseText(long b) {
        if (b >= 1048576) {
            return String.format(Locale.GERMANY, "%.1f MB", b / 1048576.0);
        }
        if (b >= 1024) {
            return String.format(Locale.GERMANY, "%.0f KB", b / 1024.0);
        }
        return b + " B";
    }
}
