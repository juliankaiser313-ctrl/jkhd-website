package de.jkhd.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

/**
 * Die einzige Seite der App: ein schwarzer Bildschirm, sonst nichts.
 * Dass auch Status- und Navigationsleiste schwarz sind, regelt das Thema (res/values/styles.xml).
 */
public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View schwarz = new View(this);
        schwarz.setBackgroundColor(Color.BLACK);
        setContentView(schwarz);
    }
}
