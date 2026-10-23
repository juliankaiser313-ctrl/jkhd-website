package de.jkhd.app.webseite;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.security.keystore.UserNotAuthenticatedException;
import android.util.Base64;

import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Bewahrt den Schlüssel der Verwaltung auf dem Handy auf — verschlüsselt mit einem Schlüssel aus dem
 * Android-Keystore, der nur kurz nach einer Bestätigung der Bildschirmsperre benutzbar ist (das
 * Gegenstück zu DPAPI auf dem Laptop). Ohne Bildschirmsperre wird nichts gespeichert.
 */
public final class Schluesselspeicher {

    private static final String KEYSTORE = "AndroidKeyStore";
    private static final String ALIAS = "jkhd-verwaltung";
    private static final String ABLAGE = "webseite";
    private static final String FELD = "schluessel";
    /** So lange nach einer Bestätigung der Sperre darf der Keystore-Schlüssel benutzt werden. */
    public static final int BESTAETIGUNG_GUELTIG_SEK = 60;

    private final Context context;

    public Schluesselspeicher(Context context) {
        this.context = context.getApplicationContext();
    }

    public boolean geraetGesichert() {
        KeyguardManager km = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
        return km != null && km.isDeviceSecure();
    }

    public boolean vorhanden() {
        return ablage().contains(FELD);
    }

    /** Verschlüsselt und speichert den Schlüssel. Wirft UserNotAuthenticatedException, wenn die Sperre erst bestätigt werden muss. */
    public void speichern(byte[] schluessel) throws GeneralSecurityException {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, keystoreSchluessel());
        byte[] iv = c.getIV();
        byte[] geheim = c.doFinal(schluessel);
        byte[] zusammen = new byte[iv.length + geheim.length];
        System.arraycopy(iv, 0, zusammen, 0, iv.length);
        System.arraycopy(geheim, 0, zusammen, iv.length, geheim.length);
        ablage().edit().putString(FELD, Base64.encodeToString(zusammen, Base64.NO_WRAP)).apply();
    }

    /** Entschlüsselt den Schlüssel. Wirft UserNotAuthenticatedException, wenn die Sperre erst bestätigt werden muss. */
    public byte[] laden() throws GeneralSecurityException {
        String text = ablage().getString(FELD, null);
        if (text == null) {
            return null;
        }
        byte[] zusammen = Base64.decode(text, Base64.NO_WRAP);
        if (zusammen.length < 13) {
            throw new GeneralSecurityException("Ablage beschädigt");
        }
        byte[] iv = Arrays.copyOfRange(zusammen, 0, 12);
        byte[] geheim = Arrays.copyOfRange(zusammen, 12, zusammen.length);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, keystoreSchluessel(), new GCMParameterSpec(128, iv));
        return c.doFinal(geheim);
    }

    /** Löscht den gespeicherten Schlüssel und den Keystore-Eintrag. */
    public void loeschen() {
        ablage().edit().remove(FELD).apply();
        try {
            KeyStore ks = KeyStore.getInstance(KEYSTORE);
            ks.load(null);
            ks.deleteEntry(ALIAS);
        } catch (Exception egal) {
            // Ohne Eintrag ist nichts zu löschen.
        }
    }

    /** Muss erst die Bildschirmsperre bestätigt werden? (Auch, wenn die Ausnahme eingewickelt ankommt.) */
    public static boolean brauchtBestaetigung(Throwable t) {
        for (int tiefe = 0; t != null && tiefe < 8; tiefe++, t = t.getCause()) {
            if (t instanceof UserNotAuthenticatedException) {
                return true;
            }
        }
        return false;
    }

    private SharedPreferences ablage() {
        return context.getSharedPreferences(ABLAGE, Context.MODE_PRIVATE);
    }

    private SecretKey keystoreSchluessel() throws GeneralSecurityException {
        try {
            KeyStore ks = KeyStore.getInstance(KEYSTORE);
            ks.load(null);
            KeyStore.Entry eintrag = ks.getEntry(ALIAS, null);
            if (eintrag instanceof KeyStore.SecretKeyEntry) {
                return ((KeyStore.SecretKeyEntry) eintrag).getSecretKey();
            }
        } catch (java.io.IOException e) {
            throw new GeneralSecurityException(e);
        }
        KeyGenParameterSpec.Builder b = new KeyGenParameterSpec.Builder(ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setUserAuthenticationRequired(true)
                .setInvalidatedByBiometricEnrollment(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            b.setUserAuthenticationParameters(BESTAETIGUNG_GUELTIG_SEK,
                    KeyProperties.AUTH_DEVICE_CREDENTIAL | KeyProperties.AUTH_BIOMETRIC_STRONG);
        } else {
            b.setUserAuthenticationValidityDurationSeconds(BESTAETIGUNG_GUELTIG_SEK);
        }
        KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE);
        kg.init(b.build());
        return kg.generateKey();
    }
}
