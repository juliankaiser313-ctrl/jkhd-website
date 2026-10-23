package de.jkhd.app.webseite;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import de.jkhd.app.R;
import de.jkhd.app.Schriften;

/**
 * Die Vorschau: die echte partner.html der Website (mitgebaut unter assets/website), geladen in einer
 * WebView, mit data-api="" und window.JKHD_VORSCHAU = true — genau wie die PC-App. Die Daten kommen
 * nach dem Laden als message-Ereignis (Form von /daten, gebaut aus dem aktuellen, auch
 * ungespeicherten Stand). Herunterladen und Abmelden sind in der Vorschau gesperrt (main.js).
 * Links verlassen die Vorschau nie: Seiten der Website öffnen sich im Browser auf www.jkhd.de.
 */
public class VorschauActivity extends Activity {

    private static final String BASIS = "file:///android_asset/website/";
    private static final String WEBSITE = "https://www.jkhd.de/";
    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        final WebseiteSitzung sitzung = WebseiteSitzung.holen();
        String schluessel = getIntent().getStringExtra(PartnerActivity.EXTRA_SCHLUESSEL);
        Partner partner = sitzung.geladen() && schluessel != null ? sitzung.arbeit.partner.get(schluessel) : null;
        if (partner == null) {
            finish();
            return;
        }
        setContentView(R.layout.activity_vorschau);
        Schriften.anwenden(findViewById(android.R.id.content));
        findViewById(R.id.zurueck).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        final String daten;
        try {
            String adresse = partner.bisherigeAdresse != null ? partner.bisherigeAdresse : partner.email;
            daten = VorschauDaten.bauen(partner, sitzung.arbeit.rollenZurAuswahl(),
                    sitzung.katalog(), sitzung.stand.vip, sitzung.stand.passwortVon(adresse)).toString()
                    // In JS-Quelltext (nicht in JSON) waren diese beiden Zeichen früher nicht erlaubt.
                    .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");
        } catch (org.json.JSONException e) {
            finish();
            return;
        }

        web = findViewById(R.id.web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        // Assets (file:///android_asset) gehen immer; Zugriff aufs Dateisystem braucht die Vorschau nicht.
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setBuiltInZoomControls(false);
        web.setBackgroundColor(0xFF0B0B0C);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) {
                    return false;
                }
                linkOeffnen(request.getUrl());
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                String js = "(function(){var d=" + daten + ";"
                        + "window.dispatchEvent(new MessageEvent('message',{data:{typ:'jkhd-vorschau',daten:d},origin:window.location.origin}));"
                        + "})();";
                view.evaluateJavascript(js, null);
            }
        });

        String html;
        try {
            html = asset("website/partner.html");
        } catch (IOException fehlt) {
            html = "<!doctype html><meta charset=utf-8><body style=\"background:#0b0b0c;color:#f4f2ee;font-family:sans-serif;padding:24px\">"
                    + "Die Vorschau ist in dieser Fassung nicht enthalten (partner.html fehlt im Bau).</body>";
        }
        html = html.replace("data-api=\"https://api.jkhd.de\"", "data-api=\"\"");
        String schalter = "<script>window.JKHD_VORSCHAU = true; try { localStorage.setItem('jkhd-theme', 'dark'); } catch (e) {}</script>\n";
        int skript = html.indexOf("<script src=\"js/main.js");
        if (skript >= 0) {
            html = html.substring(0, skript) + schalter + html.substring(skript);
        } else {
            html = html.replace("</head>", schalter + "</head>");
        }
        web.loadDataWithBaseURL(BASIS, html, "text/html", "utf-8", null);
    }

    /** Ein Link aus der Vorschau: Website-Seiten im Browser auf www.jkhd.de, E-Mail ans Mailprogramm, Rest ignorieren. */
    private void linkOeffnen(Uri url) {
        if (url == null) {
            return;
        }
        Uri ziel = null;
        String schema = url.getScheme() == null ? "" : url.getScheme();
        if (schema.equals("http") || schema.equals("https") || schema.equals("mailto")) {
            ziel = url;
        } else if (schema.equals("file") && url.toString().startsWith(BASIS)) {
            ziel = Uri.parse(WEBSITE + url.toString().substring(BASIS.length()));
        }
        if (ziel == null) {
            return;
        }
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, ziel));
        } catch (android.content.ActivityNotFoundException keineApp) {
            Toast.makeText(this, "Keine App für diesen Link gefunden.", Toast.LENGTH_SHORT).show();
        }
    }

    private String asset(String pfad) throws IOException {
        try (InputStream ein = getAssets().open(pfad)) {
            ByteArrayOutputStream puffer = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = ein.read(b)) > 0) {
                puffer.write(b, 0, n);
            }
            return puffer.toString("UTF-8");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (WebseiteSitzung.fortgesetztAbgelaufen()) {
            finish();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        WebseiteSitzung.pausiert();
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
