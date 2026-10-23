package de.jkhd.app.webseite;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Iterator;

/**
 * Inhaltlicher Vergleich zweier JSON-Werte (Reihenfolge der Schlüssel egal, Zahlen nach Wert).
 * Ein leeres Objekt gilt gleich einem leeren Array — PHP schreibt {} als [] zurück.
 * Androids org.json kennt dafür nichts Eigenes.
 */
public final class JsonGleich {

    private JsonGleich() {
    }

    public static boolean gleich(Object a, Object b) {
        if (a == b) {
            return true;
        }
        if (leer(a) && leer(b)) {
            return true;
        }
        if (a instanceof JSONObject && b instanceof JSONObject) {
            JSONObject x = (JSONObject) a;
            JSONObject y = (JSONObject) b;
            if (x.length() != y.length()) {
                return false;
            }
            Iterator<String> it = x.keys();
            while (it.hasNext()) {
                String k = it.next();
                if (!y.has(k) || !gleich(x.opt(k), y.opt(k))) {
                    return false;
                }
            }
            return true;
        }
        if (a instanceof JSONArray && b instanceof JSONArray) {
            JSONArray x = (JSONArray) a;
            JSONArray y = (JSONArray) b;
            if (x.length() != y.length()) {
                return false;
            }
            for (int i = 0; i < x.length(); i++) {
                if (!gleich(x.opt(i), y.opt(i))) {
                    return false;
                }
            }
            return true;
        }
        if (a instanceof Number && b instanceof Number) {
            Number x = (Number) a;
            Number y = (Number) b;
            return x.doubleValue() == y.doubleValue() && x.longValue() == y.longValue();
        }
        if (a == null || b == null) {
            return istNull(a) && istNull(b);
        }
        return a.equals(b);
    }

    private static boolean leer(Object o) {
        return (o instanceof JSONObject && ((JSONObject) o).length() == 0)
                || (o instanceof JSONArray && ((JSONArray) o).length() == 0);
    }

    private static boolean istNull(Object o) {
        return o == null || JSONObject.NULL.equals(o);
    }
}
