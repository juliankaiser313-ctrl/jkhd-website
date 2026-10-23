package de.jkhd.app.webseite;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import de.jkhd.app.Ladebildschirm;
import de.jkhd.app.R;
import de.jkhd.app.Schriften;

/**
 * Bereich „Webseite“: die Partnerverwaltung — Partnerliste, Suche, Speichern, Rollen, Neu laden.
 * Beim Öffnen: Schlüssel vorhanden? Sonst eingeben. Bildschirmsperre bestätigen, Schlüssel
 * entsperren, Liste laden (mit Ladebildschirm). Alles Weitere wie in der PC-App.
 * Laden und Speichern laufen im Hintergrund und überleben das Drehen: der Zustand liegt in der
 * WebseiteSitzung, das Ergebnis bekommt die Seite, die gerade vorn ist.
 */
public class WebseiteActivity extends Activity {

    private static final int REQ_SCHLUESSEL = 21;
    private static final int REQ_SPERRE = 22;

    private static WeakReference<WebseiteActivity> vorn = new WeakReference<>(null);

    private WebseiteSitzung sitzung;
    private Schluesselspeicher speicher;
    private Ladebildschirm ladebildschirm;
    private ListView liste;
    private PartnerAdapter adapter;
    private TextView status;
    private TextView fehler;
    private TextView leer;
    private TextView speicherText;
    private View speicherleiste;
    private Button nochmal;
    private Button speichern;
    private Button verwerfen;
    private Runnable nochmalAktion;
    private String suchtext = "";
    private boolean wartetAufNutzer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_webseite);
        Schriften.anwenden(findViewById(android.R.id.content));
        sitzung = WebseiteSitzung.holen();
        speicher = new Schluesselspeicher(this);
        ladebildschirm = new Ladebildschirm(findViewById(R.id.ladebildschirm));
        ladebildschirm.sofortWeg();

        liste = findViewById(R.id.liste);
        status = findViewById(R.id.status);
        fehler = findViewById(R.id.fehler);
        leer = findViewById(R.id.leer);
        speicherText = findViewById(R.id.speicher_text);
        speicherleiste = findViewById(R.id.speicherleiste);
        nochmal = findViewById(R.id.nochmal);
        speichern = findViewById(R.id.speichern);
        verwerfen = findViewById(R.id.verwerfen);
        EditText suche = findViewById(R.id.suche);

        adapter = new PartnerAdapter();
        liste.setAdapter(adapter);
        liste.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                oeffnen(adapter.schluessel(position));
            }
        });
        suche.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            @Override
            public void afterTextChanged(Editable s) {
                suchtext = s.toString().trim().toLowerCase(Locale.GERMANY);
                zeigen();
            }
        });

        klick(R.id.zurueck, new Runnable() {
            @Override
            public void run() {
                verlassen();
            }
        });
        klick(R.id.partner_neu, new Runnable() {
            @Override
            public void run() {
                neuerPartner();
            }
        });
        klick(R.id.rollen, new Runnable() {
            @Override
            public void run() {
                if (sitzung.geladen()) {
                    startActivity(new Intent(WebseiteActivity.this, RollenActivity.class));
                }
            }
        });
        klick(R.id.neu_laden, new Runnable() {
            @Override
            public void run() {
                neuLaden();
            }
        });
        klick(R.id.verwerfen, new Runnable() {
            @Override
            public void run() {
                verwerfen();
            }
        });
        klick(R.id.speichern, new Runnable() {
            @Override
            public void run() {
                speichern();
            }
        });
        klick(R.id.schluessel_entfernen, new Runnable() {
            @Override
            public void run() {
                schluesselEntfernen();
            }
        });
        klick(R.id.nochmal, new Runnable() {
            @Override
            public void run() {
                if (nochmalAktion != null) {
                    nochmalAktion.run();
                }
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

    /** Die Seite, die gerade vorn ist (oder null) — dorthin gehen Ergebnisse aus dem Hintergrund. */
    private static WebseiteActivity vorn(WebseiteSitzung s) {
        WebseiteActivity a = vorn.get();
        return a != null && a.sitzung == s && !a.isFinishing() && !a.isDestroyed() ? a : null;
    }

    @Override
    protected void onResume() {
        super.onResume();
        WebseiteSitzung.fortgesetztAbgelaufen();
        WebseiteSitzung neu = WebseiteSitzung.holen();
        if (neu != sitzung) {
            sitzung = neu;
            wartetAufNutzer = false;
        }
        vorn = new WeakReference<>(this);
        if (WebseiteSitzung.wegenRuheGesperrtAbholen()) {
            Toast.makeText(this, "Nach 15 Minuten im Hintergrund gesperrt — ungespeicherte Änderungen sind verworfen.", Toast.LENGTH_LONG).show();
        }
        if (!wartetAufNutzer) {
            vorbereiten();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (vorn.get() == this) {
            vorn = new WeakReference<>(null);
        }
        WebseiteSitzung.pausiert();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Bereich verlassen = Schlüssel aus dem Speicher, alles vergessen (wie „geschlossen = weg“ am PC).
        if (isFinishing() && WebseiteSitzung.holen() == sitzung && !sitzung.beschaeftigt()) {
            WebseiteSitzung.sperren();
        }
    }

    @Override
    public void onBackPressed() {
        verlassen();
    }

    private void verlassen() {
        if (sitzung.beschaeftigt()) {
            Toast.makeText(this, "Bitte kurz warten — es läuft noch etwas (Laden, Speichern oder Upload).", Toast.LENGTH_LONG).show();
            return;
        }
        if (sitzung.geaendert()) {
            new AlertDialog.Builder(this)
                    .setTitle("Bereich verlassen?")
                    .setMessage("Es gibt ungespeicherte Änderungen. Beim Verlassen gehen sie verloren.")
                    .setPositiveButton("Verlassen", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            finish();
                        }
                    })
                    .setNegativeButton("Bleiben", null)
                    .show();
            return;
        }
        finish();
    }

    /** Je nach Zustand: warten, Offenes zeigen, Liste zeigen, Schlüssel holen, Sperre bestätigen oder laden. */
    private void vorbereiten() {
        if (sitzung.arbeitLaeuft) {
            if (!ladebildschirm.sichtbar()) {
                ladebildschirm.starten(null);
            }
            return;
        }
        if (offenesZeigen()) {
            return;
        }
        if (sitzung.geladen()) {
            ladebildschirm.sofortWeg();
            zeigen();
            return;
        }
        if (!sitzung.entsperrt()) {
            if (!speicher.vorhanden()) {
                wartetAufNutzer = true;
                startActivityForResult(new Intent(this, SchluesselActivity.class), REQ_SCHLUESSEL);
                return;
            }
            entsperren();
            return;
        }
        laden();
    }

    private void entsperren() {
        try {
            byte[] s = speicher.laden();
            if (s == null) {
                wartetAufNutzer = true;
                startActivityForResult(new Intent(this, SchluesselActivity.class), REQ_SCHLUESSEL);
                return;
            }
            sitzung.entsperren(s);
            Arrays.fill(s, (byte) 0);
            laden();
        } catch (GeneralSecurityException e) {
            if (Schluesselspeicher.brauchtBestaetigung(e)) {
                KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
                Intent i = km == null ? null : km.createConfirmDeviceCredentialIntent(
                        getString(R.string.ws_sperre_titel), getString(R.string.ws_sperre_text));
                if (i == null) {
                    fehlerAnzeigen(getString(R.string.ws_sperre_fehlt), true);
                    return;
                }
                wartetAufNutzer = true;
                startActivityForResult(i, REQ_SPERRE);
            } else {
                schluesselKaputt(e.getMessage());
            }
        } catch (RuntimeException e) {
            schluesselKaputt(e.getMessage());
        }
    }

    /** Der gespeicherte Schlüssel lässt sich nicht öffnen (z. B. Bildschirmsperre entfernt): neu eingeben. */
    private void schluesselKaputt(String grund) {
        fehlerAnzeigen("Der gespeicherte Schlüssel ließ sich nicht öffnen (" + grund + "). "
                + "Das passiert z. B., wenn die Bildschirmsperre geändert wurde. Bitte den Schlüssel neu eingeben.", false);
        nochmal.setText(R.string.ws_schluessel_neu);
        nochmal.setVisibility(View.VISIBLE);
        nochmalAktion = new Runnable() {
            @Override
            public void run() {
                speicher.loeschen();
                startActivityForResult(new Intent(WebseiteActivity.this, SchluesselActivity.class), REQ_SCHLUESSEL);
            }
        };
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_SCHLUESSEL) {
            if (resultCode == RESULT_OK) {
                wartetAufNutzer = false;   // onResume lädt
                fehler.setVisibility(View.GONE);
                nochmal.setVisibility(View.GONE);
            } else {
                finish();
            }
        } else if (requestCode == REQ_SPERRE) {
            if (resultCode == RESULT_OK) {
                wartetAufNutzer = false;
            } else {
                fehlerAnzeigen(getString(R.string.ws_sperre_abgebrochen), true);
            }
        }
    }

    // ---------- Laden ----------

    private void laden() {
        final WebseiteSitzung s = sitzung;
        s.arbeitLaeuft = true;
        fehler.setVisibility(View.GONE);
        nochmal.setVisibility(View.GONE);
        ladebildschirm.starten(null);
        Hintergrund.starten(new Hintergrund.Aufgabe<Stand>() {
            @Override
            public Stand ausfuehren() throws Exception {
                return s.verwaltung().lesen();
            }
        }, new Hintergrund.Danach<Stand>() {
            @Override
            public void fertig(Stand st) {
                s.arbeitLaeuft = false;
                s.standUebernehmen(st);
                WebseiteActivity a = vorn(s);
                if (a != null) {
                    a.ladebildschirm.arbeitFertig();
                    a.zeigen();
                }
            }

            @Override
            public void fehler(Exception e) {
                s.arbeitLaeuft = false;
                s.offenerFehler = Hintergrund.text(e);
                s.offenerFehlerMitNochmal = true;
                WebseiteActivity a = vorn(s);
                if (a != null) {
                    a.offenesZeigen();
                }
            }
        });
    }

    /** Zeigt, was aus dem Hintergrund noch offen ist (Fehler, Konflikt, Meldung). true, wenn ein Fehler kam. */
    private boolean offenesZeigen() {
        boolean fehlerDa = false;
        if (sitzung.offenerFehler != null) {
            ladebildschirm.sofortWeg();
            fehlerAnzeigen(sitzung.offenerFehler, sitzung.offenerFehlerMitNochmal);
            if (!sitzung.offenerFehlerMitNochmal) {
                wartetAufNutzer = false;   // Speicherfehler: die Liste bleibt bedienbar
            }
            fehlerDa = !sitzung.geladen();
            sitzung.offenerFehler = null;
        }
        if (sitzung.offenerKonflikt) {
            sitzung.offenerKonflikt = false;
            ladebildschirm.sofortWeg();
            new AlertDialog.Builder(this)
                    .setTitle("Inzwischen geändert")
                    .setMessage("Jemand anders hat die Partnerliste inzwischen gespeichert (z. B. die PC-App). "
                            + "Neu laden? Deine ungespeicherten Änderungen gehen dabei verloren.")
                    .setPositiveButton("Neu laden", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            laden();
                        }
                    })
                    .setNegativeButton("Behalten", null)
                    .show();
        }
        if (sitzung.offeneMeldung != null) {
            Toast.makeText(this, sitzung.offeneMeldung, Toast.LENGTH_LONG).show();
            sitzung.offeneMeldung = null;
        }
        return fehlerDa;
    }

    private void fehlerAnzeigen(String text, boolean mitNochmal) {
        wartetAufNutzer = true;
        fehler.setText(text);
        fehler.setVisibility(View.VISIBLE);
        nochmal.setText(R.string.ws_nochmal);
        nochmal.setVisibility(mitNochmal ? View.VISIBLE : View.GONE);
        nochmalAktion = new Runnable() {
            @Override
            public void run() {
                wartetAufNutzer = false;
                fehler.setVisibility(View.GONE);
                nochmal.setVisibility(View.GONE);
                vorbereiten();
            }
        };
    }

    // ---------- Anzeigen ----------

    private void zeigen() {
        if (!sitzung.geladen()) {
            return;
        }
        adapter.neu();
        int n = sitzung.arbeit.partner.size();
        status.setText("Stand " + sitzung.standUm + " · " + n + " Partner");
        if (n == 0) {
            leer.setText(R.string.ws_keine_partner);
            leer.setVisibility(View.VISIBLE);
        } else if (adapter.getCount() == 0) {
            leer.setText(R.string.ws_nichts_gefunden);
            leer.setVisibility(View.VISIBLE);
        } else {
            leer.setVisibility(View.GONE);
        }
        Aenderungen a = sitzung.aenderungen();
        if (a.leer() && sitzung.uploadsLaufen == 0) {
            speicherleiste.setVisibility(View.GONE);
            return;
        }
        Pruefung p = sitzung.pruefung();
        String text = a.anzahl() == 1 ? "1 ungespeicherte Änderung" : a.anzahl() + " ungespeicherte Änderungen";
        if (sitzung.uploadsLaufen > 0) {
            text += " · Upload läuft …";
        }
        if (!p.inOrdnung()) {
            text += " · " + (p.anzahl() == 1 ? "1 Beanstandung" : p.anzahl() + " Beanstandungen") + " (rot markiert) — erst beheben";
        }
        speicherText.setText(text);
        speichern.setEnabled(p.inOrdnung() && !a.leer() && !sitzung.beschaeftigt());
        verwerfen.setEnabled(!a.leer() && !sitzung.beschaeftigt());
        speicherleiste.setVisibility(View.VISIBLE);
    }

    private void neuerPartner() {
        if (!sitzung.geladen()) {
            return;
        }
        Partner p = sitzung.arbeit.neuerPartner(WebseiteSitzung.heute());
        sitzung.arbeit.partner.put("neu-" + System.nanoTime(), p);
        sitzung.arbeit.neuEinordnen();
        oeffnen(sitzung.arbeit.schluesselVon(p));
    }

    private void oeffnen(String schluessel) {
        if (schluessel == null) {
            return;
        }
        Intent i = new Intent(this, PartnerActivity.class);
        i.putExtra(PartnerActivity.EXTRA_SCHLUESSEL, schluessel);
        startActivity(i);
    }

    // ---------- Speichern, Verwerfen, Neu laden ----------

    private void speichern() {
        if (sitzung.beschaeftigt() || !sitzung.geladen()) {
            return;
        }
        final Aenderungen a = sitzung.aenderungen();
        if (a.leer() || !sitzung.pruefung().inOrdnung()) {
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Änderungen speichern?")
                .setMessage(Text.verbinden("\n\n", a.zeilen))
                .setPositiveButton("Speichern", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        schreiben();
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    private void schreiben() {
        if (sitzung.beschaeftigt()) {
            return;
        }
        final WebseiteSitzung s = sitzung;
        final Stand alt = s.stand;
        // Die Liste auf dem Hauptfaden bauen — im Hintergrund wird nur noch gesendet.
        final JSONObject gesendet;
        try {
            gesendet = s.arbeit.zuJson(s.katalog());
        } catch (JSONException e) {
            fehlerAnzeigen("Die Liste ließ sich nicht zusammenstellen: " + e.getMessage(), false);
            wartetAufNutzer = false;
            return;
        }
        s.arbeitLaeuft = true;
        fehler.setVisibility(View.GONE);
        ladebildschirm.starten(null);
        Hintergrund.starten(new Hintergrund.Aufgabe<Speichervorgang.Ergebnis>() {
            @Override
            public Speichervorgang.Ergebnis ausfuehren() throws Exception {
                return Speichervorgang.ausfuehren(s.verwaltung(), alt, gesendet);
            }
        }, new Hintergrund.Danach<Speichervorgang.Ergebnis>() {
            @Override
            public void fertig(Speichervorgang.Ergebnis e) {
                s.arbeitLaeuft = false;
                s.standUebernehmen(e.stand);
                String meldung = e.nachgelesen ? "Gespeichert."
                        : "Gespeichert. Der neue Stand ließ sich nicht nachlesen — bei Gelegenheit „Neu laden“.";
                if (e.passwoerterEntfernt > 0) {
                    meldung += " Der Server hat " + e.passwoerterEntfernt + (e.passwoerterEntfernt == 1 ? " Passwort" : " Passwörter")
                            + " entfernt (Partner entfernt oder Adresse geändert).";
                }
                s.offeneMeldung = meldung;
                WebseiteActivity a = vorn(s);
                if (a != null) {
                    a.ladebildschirm.arbeitFertig();
                    a.zeigen();
                    a.offenesZeigen();
                }
            }

            @Override
            public void fehler(Exception e) {
                s.arbeitLaeuft = false;
                if (e instanceof VerwaltungFehler && ((VerwaltungFehler) e).status == 409) {
                    s.offenerKonflikt = true;
                } else {
                    s.offenerFehler = "Nicht gespeichert: " + Hintergrund.text(e);
                    s.offenerFehlerMitNochmal = false;
                }
                WebseiteActivity a = vorn(s);
                if (a != null) {
                    a.offenesZeigen();
                    a.zeigen();
                }
            }
        });
    }

    private void verwerfen() {
        if (!sitzung.geaendert() || sitzung.beschaeftigt()) {
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Änderungen verwerfen?")
                .setMessage("Alle ungespeicherten Änderungen gehen verloren.")
                .setPositiveButton("Verwerfen", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        sitzung.verwerfen();
                        zeigen();
                    }
                })
                .setNegativeButton("Behalten", null)
                .show();
    }

    private void neuLaden() {
        if (!sitzung.entsperrt()) {
            return;
        }
        if (sitzung.beschaeftigt()) {
            Toast.makeText(this, "Bitte kurz warten — es läuft noch etwas.", Toast.LENGTH_SHORT).show();
            return;
        }
        if (sitzung.geaendert()) {
            new AlertDialog.Builder(this)
                    .setTitle("Neu laden?")
                    .setMessage("Ungespeicherte Änderungen gehen dabei verloren.")
                    .setPositiveButton("Neu laden", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            laden();
                        }
                    })
                    .setNegativeButton("Abbrechen", null)
                    .show();
            return;
        }
        laden();
    }

    private void schluesselEntfernen() {
        if (sitzung.beschaeftigt()) {
            Toast.makeText(this, "Bitte kurz warten — es läuft noch etwas.", Toast.LENGTH_SHORT).show();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Schlüssel entfernen?")
                .setMessage("Der Schlüssel der Verwaltung wird vom Handy gelöscht; die Partnerverwaltung ist dann erst wieder nach neuer Eingabe möglich.")
                .setPositiveButton("Entfernen", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        speicher.loeschen();
                        WebseiteSitzung.sperren();
                        finish();
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    /** Die Partnerliste als ListView-Zeilen, gefiltert nach dem Suchtext. */
    private final class PartnerAdapter extends BaseAdapter {

        private final List<String> schluessel = new ArrayList<>();
        private final List<Partner> partner = new ArrayList<>();
        private Pruefung pruefung = new Pruefung();
        private List<Rolle> rollen = new ArrayList<>();

        void neu() {
            schluessel.clear();
            partner.clear();
            pruefung = sitzung.pruefung();
            rollen = sitzung.arbeit.rollenZurAuswahl();
            for (Map.Entry<String, Partner> e : sitzung.arbeit.partner.entrySet()) {
                Partner p = e.getValue();
                if (!suchtext.isEmpty()) {
                    String heu = (p.name + " " + p.email + " " + p.rolle).toLowerCase(Locale.GERMANY);
                    if (!heu.contains(suchtext)) {
                        continue;
                    }
                }
                schluessel.add(e.getKey());
                partner.add(p);
            }
            notifyDataSetChanged();
        }

        String schluessel(int position) {
            return schluessel.get(position);
        }

        @Override
        public int getCount() {
            return partner.size();
        }

        @Override
        public Object getItem(int position) {
            return partner.get(position);
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            View zeile = convertView;
            if (zeile == null) {
                zeile = LayoutInflater.from(WebseiteActivity.this).inflate(R.layout.zeile_partner, parent, false);
                Schriften.anwenden(zeile);
            }
            Partner p = partner.get(position);
            String k = schluessel.get(position);
            ((TextView) zeile.findViewById(R.id.zeile_name)).setText(p.anzeige());
            ((TextView) zeile.findViewById(R.id.zeile_email)).setText(p.email.isEmpty() ? "— Adresse fehlt —" : p.email);
            int module = p.wirksameFreigaben(rollen, sitzung.katalog()).size();
            String info = (p.rolle.isEmpty() ? "ohne Rolle" : p.rolle) + " · " + module + (module == 1 ? " Modul" : " Module");
            if (!p.dateien.isEmpty()) {
                info += " · " + p.dateien.size() + (p.dateien.size() == 1 ? " Datei" : " Dateien");
            }
            ((TextView) zeile.findViewById(R.id.zeile_info)).setText(info);
            TextView marke = zeile.findViewById(R.id.zeile_marke);
            if (pruefung.jePartner.containsKey(k)) {
                marke.setText("!");
                marke.setTextColor(getColor(R.color.gefahr));
            } else if (geaendert(p)) {
                marke.setText("●");
                marke.setTextColor(getColor(R.color.warnung));
            } else {
                marke.setText("›");
                marke.setTextColor(getColor(R.color.text_gedaempft));
            }
            return zeile;
        }

        private boolean geaendert(Partner p) {
            if (p.bisherigeAdresse == null) {
                return true;
            }
            Partner alt = sitzung.original.partner.get(p.bisherigeAdresse);
            return alt == null || !alt.gleich(p);
        }
    }
}
