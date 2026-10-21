package de.jkhd.app;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.FrameLayout;

/** Ein FrameLayout, das immer quadratisch ist: die Höhe folgt der Breite. */
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
        int quadrat = MeasureSpec.makeMeasureSpec(breite, MeasureSpec.EXACTLY);
        super.onMeasure(quadrat, quadrat);
    }
}
