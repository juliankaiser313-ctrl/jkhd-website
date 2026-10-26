package de.jkhd.app.multibroker;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SslErrorHandler;
import android.webkit.WebBackForwardList;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import de.jkhd.app.R;
import de.jkhd.app.Schriften;

/**
 * Bereich „Multi-Broker“: die Trading-Oberfläche vom PC (Port 8800, über `tailscale serve` als
 * https://<pc>.<tailnet>.ts.net erreichbar) in einer WebView im Vollbild.
 *
 * Der Multi-Broker hat seinen eigenen Login mit Sitzungs-Cookie; die App speichert kein Passwort,
 * nur die Adresse. Cookies werden nach jedem Laden auf die Platte geschrieben, damit die Anmeldung
 * einen Neustart der App übersteht. Nur Seiten auf genau diesem Rechner laden in der App, alles
 * andere öffnet sich im Browser. Lädt die Hauptseite nicht, zeigt die App eine Fehleransicht statt
 * eines schwarzen Bildes. Beim Drehen wird die Seite nicht neu aufgebaut (configChanges im Manifest).
 */
public class MultiBrokerActivity extends Activity {

    private static final String ABLAGE = "multibroker";
    private static final String FELD = "multibroker_url";

    private WebView web;
    private ProgressBar balken;
    private View fehlerAnsicht;
    private TextView fehlerDetail;
    private String basis;
    /** Ist beim aktuellen Laden der Hauptseite ein Fehler gekommen? */
    private boolean fehler;
    /** Die Hauptseite, die zuletzt nicht geladen werden konnte (für „Erneut versuchen“). */
    private String fehlerUrl;
    /** Nach einem Adresswechsel den Verlauf der alten Adresse löschen, sobald die neue geladen ist. */
    private boolean verlaufLoeschen;

    // ---------- Adresse ----------

    /** Die gespeicherte Adresse oder null. */
    public static String gespeicherteAdresse(Context c) {
        String s = c.getApplicationContext().getSharedPreferences(ABLAGE, Context.MODE_PRIVATE).getString(FELD, null);
        if (s == null) {
            return null;
        }
        MultiBrokerAdresse.Pruefung p = MultiBrokerAdresse.pruefen(s);
        return p.ok() ? p.adresse : null;
    }

    private static void adresseSpeichern(Context c, String adresse) {
        SharedPreferences.Editor e = c.getApplicationContext().getSharedPreferences(ABLAGE, Context.MODE_PRIVATE).edit();
        e.putString(FELD, adresse);
        e.apply();
    }

    /**
     * Der Dialog „Adresse des Multi-Brokers“: nimmt nur https an. gespeichert läuft nach dem
     * Speichern, abgebrochen nach Abbrechen/Zurück (beide dürfen null sein).
     */
    public static void adresseFragen(final Activity a, final Runnable gespeichert, final Runnable abgebrochen) {
        final EditText feld = new EditText(a);
        String jetzt = gespeicherteAdresse(a);
        feld.setText(jetzt != null ? jetzt : "https://");
        feld.setSelection(feld.getText().length());
        feld.setHint(MultiBrokerAdresse.BEISPIEL);
        feld.setSingleLine(true);
        feld.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        int rand = Math.round(20 * a.getResources().getDisplayMetrics().density);
        FrameLayout rahmen = new FrameLayout(a);
        rahmen.setPadding(rand, rand / 2, rand, 0);
        rahmen.addView(feld);

        final boolean[] erledigt = {false};
        final AlertDialog d = new AlertDialog.Builder(a)
                .setTitle(R.string.mb_adresse_titel)
                .setMessage(a.getString(R.string.mb_adresse_text, MultiBrokerAdresse.BEISPIEL))
                .setView(rahmen)
                .setPositiveButton(R.string.mb_adresse_speichern, null)
                .setNegativeButton(R.string.mb_adresse_abbrechen, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        if (!erledigt[0]) {
                            erledigt[0] = true;
                            if (abgebrochen != null) {
                                abgebrochen.run();
                            }
                        }
                    }
                })
                .setOnCancelListener(new DialogInterface.OnCancelListener() {
                    @Override
                    public void onCancel(DialogInterface dialog) {
                        if (!erledigt[0]) {
                            erledigt[0] = true;
                            if (abgebrochen != null) {
                                abgebrochen.run();
                            }
                        }
                    }
                })
                .create();
        d.setOnShowListener(new DialogInterface.OnShowListener() {
            @Override
            public void onShow(DialogInterface dialog) {
                // Eigener Klick-Hörer, damit der Dialog bei einer falschen Adresse offen bleibt.
                d.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        MultiBrokerAdresse.Pruefung p = MultiBrokerAdresse.pruefen(feld.getText().toString());
                        if (!p.ok()) {
                            feld.setError(p.fehler);
                            return;
                        }
                        adresseSpeichern(a, p.adresse);
                        erledigt[0] = true;
                        d.dismiss();
                        if (gespeichert != null) {
                            gespeichert.run();
                        }
                    }
                });
            }
        });
        d.show();
    }

    // ---------- Seite ----------

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_multibroker);
        Schriften.anwenden(findViewById(android.R.id.content));
        web = findViewById(R.id.web);
        balken = findViewById(R.id.ladebalken);
        fehlerAnsicht = findViewById(R.id.fehler);
        fehlerDetail = findViewById(R.id.fehler_detail);

        Button erneut = findViewById(R.id.erneut);
        erneut.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                erneutVersuchen();
            }
        });
        findViewById(R.id.adresse_aendern).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                adresseFragen(MultiBrokerActivity.this, new Runnable() {
                    @Override
                    public void run() {
                        neueAdresseLaden();
                    }
                }, null);
            }
        });
        findViewById(R.id.zurueck).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        einrichten();

        basis = gespeicherteAdresse(this);
        if (basis == null) {
            // Erstes Öffnen: erst die Adresse, dann laden. Abbrechen = zurück zum Kontrollzentrum.
            adresseFragen(this, new Runnable() {
                @Override
                public void run() {
                    basis = gespeicherteAdresse(MultiBrokerActivity.this);
                    laden(null);
                }
            }, new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            });
        } else {
            laden(savedInstanceState);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void einrichten() {
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(false);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, false);

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int fortschritt) {
                balken.setProgress(fortschritt);
                balken.setVisibility(fortschritt < 100 && !fehler ? View.VISIBLE : View.GONE);
            }
        });

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                MultiBrokerAdresse.Ziel ziel = MultiBrokerAdresse.ziel(basis, url);
                if (ziel == MultiBrokerAdresse.Ziel.INTERN) {
                    if (request.isForMainFrame()) {
                        fehler = false;   // neue Seite auf dem eigenen Rechner: alter Fehler gilt nicht mehr
                    }
                    return false;
                }
                if (!request.isForMainFrame()) {
                    // Eingebettete Inhalte (z. B. Charts) dürfen von anderswo kommen; nur keine fremden Schemata.
                    return ziel != MultiBrokerAdresse.Ziel.EXTERN;
                }
                if (ziel == MultiBrokerAdresse.Ziel.EXTERN) {
                    extern(request.getUrl());
                }
                return true;
            }

            // Achtung Reihenfolge: neuere WebView-Versionen melden onReceivedError/onReceivedHttpError
            // VOR onPageStarted. Deshalb setzt onPageStarted den Fehler nicht zurück; entschieden wird
            // in onPageFinished: ist die fertige Seite genau die fehlerhafte, bleibt die Fehleransicht.
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                if (!fehlerseite(url)) {
                    balken.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // Sitzungs-Cookie sofort auf die Platte — sonst ist die Anmeldung nach einem Neustart weg.
                CookieManager.getInstance().flush();
                balken.setVisibility(View.GONE);
                if (fehlerseite(url)) {
                    return;
                }
                fehler = false;
                fehlerAnsicht.setVisibility(View.GONE);
                if (web != null) {
                    web.setVisibility(View.VISIBLE);
                    if (verlaufLoeschen) {
                        verlaufLoeschen = false;
                        web.clearHistory();
                    }
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    fehlerZeigen(String.valueOf(error.getDescription()), request.getUrl().toString());
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) {
                    fehlerZeigen("HTTP " + response.getStatusCode()
                            + (response.getReasonPhrase() != null ? " " + response.getReasonPhrase() : ""), request.getUrl().toString());
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();   // nie ein ungültiges Zertifikat durchwinken
                if (MultiBrokerAdresse.intern(basis, error.getUrl())) {
                    fehlerZeigen("Zertifikat ungültig (" + error.getPrimaryError() + ")", error.getUrl());
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // Der Darstellungsprozess ist abgestürzt: diese WebView ist tot. Seite neu aufbauen statt Absturz.
                ViewGroup eltern = (ViewGroup) view.getParent();
                if (eltern != null) {
                    eltern.removeView(view);
                }
                view.destroy();
                if (view == web) {
                    web = null;
                    recreate();
                }
                return true;
            }
        });
    }

    /** Lädt die Adresse — oder stellt nach einem Neustart des Prozesses den letzten Stand wieder her. */
    private void laden(Bundle gesichert) {
        if (web == null || basis == null) {
            return;
        }
        if (gesichert != null) {
            WebBackForwardList liste = web.restoreState(gesichert);
            if (liste != null && liste.getCurrentItem() != null
                    && MultiBrokerAdresse.intern(basis, liste.getCurrentItem().getUrl())) {
                return;
            }
        }
        fehler = false;
        web.loadUrl(basis);
    }

    private void neueAdresseLaden() {
        basis = gespeicherteAdresse(this);
        fehlerUrl = null;
        verlaufLoeschen = true;
        fehlerAnsicht.setVisibility(View.GONE);
        if (web != null) {
            web.stopLoading();
            web.setVisibility(View.INVISIBLE);
            laden(null);
        }
    }

    /** Ist url die Seite, die zuletzt nicht geladen werden konnte (und der Fehler noch aktuell)? */
    private boolean fehlerseite(String url) {
        return fehler && fehlerUrl != null && fehlerUrl.equals(url);
    }

    private void erneutVersuchen() {
        if (web == null || basis == null) {
            return;
        }
        fehlerAnsicht.setVisibility(View.GONE);
        fehler = false;
        balken.setProgress(0);
        balken.setVisibility(View.VISIBLE);
        String ziel = fehlerUrl != null && MultiBrokerAdresse.intern(basis, fehlerUrl) ? fehlerUrl : basis;
        if (ziel.equals(web.getUrl())) {
            web.reload();   // kein zweiter Eintrag im Verlauf für dieselbe Seite
        } else {
            web.loadUrl(ziel);
        }
    }

    /** Statt eines schwarzen Bildes: „PC nicht erreichbar“ mit „Erneut versuchen“. */
    private void fehlerZeigen(String detail, String url) {
        fehler = true;
        fehlerUrl = url;
        fehlerDetail.setText(detail == null ? "" : detail);
        balken.setVisibility(View.GONE);
        if (web != null) {
            web.setVisibility(View.INVISIBLE);
        }
        fehlerAnsicht.setVisibility(View.VISIBLE);
    }

    /** Fremde Links im Browser (bzw. Mail-/Telefon-App) öffnen. */
    private void extern(Uri url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, url).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (android.content.ActivityNotFoundException keineApp) {
            Toast.makeText(this, "Keine App für diesen Link gefunden.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) {
            web.onPause();
        }
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) {
            web.saveState(outState);
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            ViewGroup eltern = (ViewGroup) web.getParent();
            if (eltern != null) {
                eltern.removeView(web);
            }
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
