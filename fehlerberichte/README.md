# Fehlerberichte zu jkhd.de

Hier werden Fehler der Website gesammelt: eine Datei je Fehler. Eintragen darf jeder,
der etwas findet — Julian, ein Mensch mit Zugriff auf das Repository oder ein
KI-System. Behoben wird aus diesem Ordner heraus; der Bericht bleibt mit der Behebung
als Beleg liegen.

Dieser Ordner liegt öffentlich auf GitHub (Zweig `main`) und wird wie alles auf `main`
von GitHub Pages ausgeliefert (https://jkhd.de/fehlerberichte/…). Suchmaschinen sind
per robots.txt ausgeschlossen. Trotzdem gilt: nichts hinein, was nicht öffentlich sein
darf (siehe „Was NICHT hinein gehört“).

## So wird ein Fehler gemeldet

1. `VORLAGE.md` kopieren und als neue Datei in diesem Ordner anlegen:
   `JJJJ-MM-TT-kurzer-titel.md` — Datum des Fundes, Titel klein, mit Bindestrichen,
   ohne Umlaute (ä → ae, ö → oe, ü → ue, ß → ss).
   Beispiel: `2026-10-11-datenschutz-unsichtbar.md`.
2. Die Felder der Vorlage ausfüllen. Pflicht sind: Seite (genaue Adresse), Datum, wer
   meldet, Gerät / Browser / Fenstergröße, was passiert, was erwartet wird. Alles
   andere ist willkommen, aber nicht nötig.
3. Status auf `offen` lassen, Datei speichern bzw. auf GitHub „Commit changes“.

Auf GitHub geht das ohne Werkzeuge: Ordner `fehlerberichte` öffnen → „Add file“ →
„Create new file“ → Dateiname eingeben → Inhalt der Vorlage einfügen und ausfüllen →
„Commit changes“ (Zweig `main`). Wer keinen Schreibzugriff hat, legt den Bericht als
GitHub-Issue an (Reiter „Issues“): gleicher Inhalt, gleiche Felder.

Ein Bericht je Fehler. Mehrere Fehler auf einer Seite sind mehrere Berichte.
Screenshots dürfen daneben liegen (`JJJJ-MM-TT-kurzer-titel-1.png`), klein gehalten
(unter 500 KB) und ohne private Daten.

## Was NICHT hinein gehört

- Passwörter, Schlüssel, Token, Zugangsdaten — auch nicht „zum Nachstellen“.
- Personenbezogene Daten von Besuchern oder Partnern (Namen, E-Mail-Adressen,
  IP-Adressen). Wer meldet, nennt sich selbst — mehr nicht.
- Inhalte des Partnerzugangs (alles hinter der Anmeldung).
- Vermutungen über die Ursache sind erlaubt, aber als Vermutung gekennzeichnet. Ein
  Bericht beschreibt, was zu sehen ist; die Ursache findet, wer behebt.

## Status und Ablauf

| Status        | Bedeutung |
|---------------|-----------|
| `offen`       | gemeldet, noch nicht angesehen |
| `in Arbeit`   | jemand kümmert sich; Name und Datum stehen unter „Behebung“ |
| `behoben`     | Änderung ist live; Ursache, Commit, Stempel und Prüfung stehen unter „Behebung“; die Datei wandert nach `behoben/` |
| `kein Fehler` | geprüft und so gewollt; Begründung unter „Behebung“; die Datei wandert ebenfalls nach `behoben/` |

Wer behebt, füllt den Abschnitt „Behebung“ aus (Ursache, Änderung mit Commit und
Cache-Stempel, womit geprüft wurde) und verschiebt die Datei nach `behoben/`. Der
Dateiname bleibt. Gelöscht wird nichts.

## Für die Pflege (Julian, Claude)

Die Quelle der Website ist der lokale Zweig `master`; `release` wird daraus gespiegelt
und als `main` nach GitHub geschoben. Berichte, die direkt auf GitHub auf `main`
angelegt werden, müssen VOR dem nächsten Spiegel geholt werden, sonst weist GitHub den
Push ab (release wäre hinter main):

    git fetch origin
    git checkout release && git merge --ff-only origin/main
    git checkout master && git checkout origin/main -- fehlerberichte
    git add fehlerberichte && git commit -m "Fehlerberichte von GitHub übernommen"

Danach wie gewohnt spiegeln (README der Website, Abschnitt „Livegang“).
