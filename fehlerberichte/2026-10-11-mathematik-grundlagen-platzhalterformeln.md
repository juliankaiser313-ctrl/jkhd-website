# Mathematik-Grundlagen: drei „Formeln“ sind Platzhalter, „Calmar“ steht nur in der Überschrift

- **Seite:** https://jkhd.de/mathematik-grundlagen.html (ebenso https://jkhd.de/en/mathematics-basics.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Text der ausgelieferten Seiten
- **Sprache / Darstellung:** Deutsch und Englisch
- **Status:** offen
- **Art:** Verbesserung (Inhalt)
- **Gewicht:** niedrig

## Was auffällt

1. **Korrektur für Mehrfachtests:** als Formel steht `p_korrigiert = f(p, Anzahl der
   Versuche)` — das ist keine Formel, sondern eine Ankündigung. Die Seite sagt selbst,
   alles darauf sei Lehrbuchwissen; die Standardformeln verraten nichts (z. B. Bonferroni
   `p · m`, Šidák `1 − (1 − p)^m`).
2. **Entwerteter Sharpe:** `PSR(SR*) = Φ(… n, Schiefe, Wölbung …)` mit Auslassungspunkten.
   Die vollständige Formel steht schon in der Quant-Formelsammlung derselben Website
   (Abschnitt 3, „Probabilistic & Deflated Sharpe Ratio“) — hier einfach übernehmen.
3. **Itôs Lemma:** gezeigt wird nur `(dW)² = dt` — das ist die Rechenregel, aus der der
   Zusatzterm folgt, nicht das Lemma selbst. Entweder die Überschrift anpassen oder das
   Lemma zeigen (`df = f'(X) dX + ½ f''(X) (dX)²`).
4. **„Drawdown & Calmar“:** die Überschrift nennt Calmar, Formel und Text erklären es aber
   nicht. Ein Satz („Calmar = Jahresrendite geteilt durch den maximalen Drawdown“) oder
   „Calmar“ aus der Überschrift nehmen. Ebenso nennt „Sharpe- und Sortino-Verhältnis“ nur
   die Sharpe-Formel (Sortino immerhin in Worten).
5. **Slippage = Ausführung − Signalkurs:** gilt so nur für Käufe; bei Verkäufen ist das
   Vorzeichen umgekehrt. Ein „(beim Kauf; beim Verkauf umgekehrt)“ genügt.

Die Seite wird aus `C:\Quant Arbeit\JKHD-Formeln` gebaut (Quelle `grundlagen-de_*.json`
bzw. `grundlagen-en_*.json`).

## Was erwartet wird

Jede gezeigte Formel ist eine echte Formel; Überschrift und Inhalt passen zusammen.

## Belege

Text der ausgelieferten Seite.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**
