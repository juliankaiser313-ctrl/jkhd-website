# Datenschutzerklärung: IONOS als Auftragsverarbeiter und E-Mail-Anbieter nicht genannt

- **Seite:** https://jkhd.de/datenschutz.html (ebenso https://jkhd.de/en/privacy.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website — kein Rechtsrat)
- **Gerät / Browser / Fenstergröße:** —
- **Sprache / Darstellung:** Deutsch und Englisch
- **Status:** offen
- **Art:** Verbesserung (Recht)
- **Gewicht:** mittel

Vorweg: Die Erklärung ist ungewöhnlich gründlich und deckt sich mit dem, was die Website
tatsächlich tut (gemessen: keine Cookies, keine fremden Hosts außer dem eigenen
api.jkhd.de, nur der genannte localStorage-Eintrag). Drei Lücken:

## 1. IONOS als Auftragsverarbeiter

Für OVHcloud steht ausdrücklich „Auftragsverarbeiter (Art. 28 DSGVO); der AVV ist fester
Bestandteil des Vertrags“. Für IONOS, das api.jkhd.de betreibt (Partnerzugang, Anfragen,
Bestenliste, Fragen an die KI, Zugriffsprotokolle), steht nur „Webspace bei IONOS SE“.
Bei IONOS muss der Auftragsverarbeitungsvertrag im Kundenbereich **selbst
abgeschlossen** werden (Bereich Datenschutz / „Vertrag zur Auftragsverarbeitung“).
Vorschlag: prüfen, ob er abgeschlossen ist, und dann wie bei OVHcloud einen Satz
ergänzen.

## 2. E-Mail-Anbieter

Der Abschnitt „Kontakt per E-Mail“ sagt nicht, dass die Postfächer (kontakt@, service@,
info@) bei IONOS liegen und E-Mails dort verarbeitet und gespeichert werden. Auch die
Anfrage-E-Mails und die Eingangsbestätigung laufen über IONOS-SMTP. Ein Satz genügt.

## 3. Speicherdauer der GitHub-Protokolle

Beim Hosting (GitHub Pages) steht, welche Daten GitHub in Server-Protokollen verarbeitet,
aber nicht, wie lange. Wenn sich dazu keine Angabe von GitHub findet, wenigstens auf die
GitHub-Datenschutzerklärung verweisen.

## Kleinigkeiten

- „Stand 10. Oktober 2026“ — seit dem 11.10. kennt die KI auch die Simulation; an der
  Verarbeitung ändert das nichts, aber beim nächsten Stand mitprüfen.
- Anführungszeichen siehe eigener Bericht `2026-10-11-anfuehrungszeichen-uneinheitlich.md`.

## Hinweis (Claude, 11.10.2026)

Braucht Fakten und Wortlaut von Julian: (1) Ist der Auftragsverarbeitungsvertrag mit IONOS im Kundenbereich abgeschlossen? Erst dann der Satz wie bei OVHcloud. (2) Satz zu den Postfächern bei IONOS (kontakt@, service@, info@) und zum SMTP-Versand der Anfrage-Mails. (3) Speicherdauer der GitHub-Protokolle oder Verweis auf die GitHub-Datenschutzerklärung. Anführungszeichen sind seit Runde B einheitlich; der „Stand“ wird beim nächsten Rechtstext mit angehoben.

## Was zu tun ist (Claude, 11.10.2026, nachgesehen; kein Rechtsrat)

### 1. Auftragsverarbeitungsvertrag mit IONOS

- **Lage:** Laut IONOS-Hilfe ist die Vereinbarung zur Auftragsverarbeitung seit dem 19.07.2022
  Bestandteil der IONOS-AGB; ein eigener Abschluss ist nur bei älteren Verträgen nötig. Das
  Webhosting für api.jkhd.de ist vom 20.09.2026, also gedeckt. Die Postfächer hängen am
  Domain-Vertrag; dessen Datum ist nachzusehen.
- **Julian:** Im IONOS-Konto anmelden → Menü → Mein Konto → Kachel „Datenschutz & Privatsphäre“
  → Kachel „Vereinbarung zur Auftragsverarbeitung (AVV)“ → „Weitere Informationen“. Dort steht,
  ob die Vereinbarung gilt oder noch abzuschließen ist (Abschluss kostenlos; Bestätigung
  aufheben). Ergebnis mitteilen.
- **Danach** im Abschnitt „Partnerzugang“ (erste Nennung von IONOS) der Satz wie bei OVHcloud:
  „Die IONOS SE verarbeitet diese Daten als unser Auftragsverarbeiter (Art. 28 DSGVO); die
  Vereinbarung zur Auftragsverarbeitung ist Bestandteil des Vertrags mit IONOS.“
  EN: “IONOS SE processes this data as our processor (Art. 28 GDPR); the data processing
  agreement is part of our contract with IONOS.”
- **Quelle:** <https://www.ionos.de/hilfe/datenschutz/allgemeine-informationen-zur-datenschutz-grundverordnung-dsgvo/vereinbarung-zur-auftragsverarbeitung-avv-mit-ionos-abschliessen/>

### 2. Postfächer bei IONOS

- **Lage** (aus Server-Code und IONOS-Konto): Es gibt ein einziges echtes Postfach bei IONOS;
  kontakt@, service@ und info@ sind Weiterleitungen darauf. Der Server versendet über
  smtp.ionos.de aus diesem Postfach, Anfragen mit Absender service@. Kein anderer Anbieter ist
  beteiligt; im Konto ist nichts zu tun.
- **Julian:** bestätigen, dass das noch stimmt und dass das Postfach nur über IONOS-Webmail oder
  ein Mailprogramm gelesen wird (würden die Mails in ein Gmail-Konto geholt, müsste Google in
  die Erklärung).
- **Danach** im Abschnitt „Kontakt per E-Mail“: „Unsere Postfächer liegen bei der IONOS SE in
  Deutschland; dort werden E-Mails an uns und von uns verarbeitet und gespeichert, auch die
  Anfrage-Mails und die Eingangsbestätigung.“
  EN: “Our mailboxes are hosted by IONOS SE in Germany; e-mails to and from us, including
  enquiry e-mails and the acknowledgement of receipt, are processed and stored there.”

### 3. Speicherdauer der GitHub-Protokolle

- **Lage** (nachgesehen 11.10.2026): Die GitHub-Pages-Doku sagt nur, dass Besucher-IP-Adressen
  „for security purposes“ protokolliert und gespeichert werden; die GitHub-Datenschutzerklärung
  nennt keine Frist („depends on the purpose“). Es gibt also keine Dauer anzugeben, nur dass
  GitHub keine nennt.
- **Julian:** Ja oder Nein zu dem Satz im Abschnitt „Hosting“: „Wie lange GitHub diese
  Protokolle aufbewahrt, gibt GitHub nicht an; Näheres steht in der Datenschutzerklärung von
  GitHub“ (mit Link). EN: “GitHub does not state how long it keeps these logs; see GitHub’s
  privacy statement for details.”
- **Quellen:** <https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages>
  (Abschnitt „Data collection“),
  <https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement>

**Nach den drei Antworten:** Sätze in `datenschutz.html` und `en/privacy.html` einbauen,
„Stand“ anheben, Cache-Stempel, spiegeln, live prüfen, Bericht nach `behoben/`.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**
