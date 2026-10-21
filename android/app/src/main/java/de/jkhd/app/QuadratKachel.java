package de.jkhd.app;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.FrameLayout;

/**
 * Ein FrameLayout, das quadratisch ist: die Höhe folgt der Breite. Braucht der Inhalt mehr Platz
 * (sehr große Systemschrift), wird es nur so viel höher wie nötig, statt Text abzuschneiden.
 * Gibt die Reihe eine feste Höhe vor (beide Vierecke einer Reihe gleich hoch), gilt diese.
 */
public class QuadratKachel extends FrameLayout {

    public QuadratKachel(Context context) {
        super(context);
    }

    public QuadratKachel(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public QuadratKachel(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int breite = MeasureSpec.getSize(widthMeasureSpec);
        int breiteSpec = MeasureSpec.makeMeasureSpec(breite, MeasureSpec.EXACTLY);
        int hoehe;
        if (MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY) {
            // Die Reihe macht ihre Vierecke gleich hoch (LinearLayout.forceUniformHeight).
            hoehe = MeasureSpec.getSize(heightMeasureSpec);
        } else {
            // Erst den Wunsch des Inhalts messen, dann mindestens quadratisch.
            super.onMeasure(breiteSpec, MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED));
            hoehe = Math.max(breite, getMeasuredHeight());
        }
        super.onMeasure(breiteSpec, MeasureSpec.makeMeasureSpec(hoehe, MeasureSpec.EXACTLY));
    }
}
