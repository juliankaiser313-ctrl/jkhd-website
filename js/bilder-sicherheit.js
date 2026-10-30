// ---------- Die Bilder der Sicherheits-Seite (sicherheit.html / en/security.html) ----------
// Gezeichnet vom Motor js/bildlauf.js. Julian, 11.10.2026: "Kannst du dasselbe bei
// Sicherheit auch machen?" Inhalt sind die sieben Sperren, die Spuren, die Daten und
// die Liste dessen, was wir nicht vorweisen koennen -- von der Seite vom 24.09.2026,
// nur gekuerzt. Prinzip statt Bauplan (README): die Bilder zeigen, WAS gilt, nie,
// wie es gebaut ist -- keine Pfade, Formate, Fristen, Orte oder Kopfzahlen.
// Die Bilder:
//   00 die Ueberschrift der Seite, dazu sieben Schloesser, die sich nacheinander schliessen
//   01 Not-Aus: gezogen entstehen keine neuen Einstiege, offene Trades laufen aus;
//      ein Neustart aendert nichts; auf geht er erst mit Quittung und Notiz
//   02 Vorgabe: ein Eingriff kann vorsichtiger machen, nie mutiger -- der Knopf
//      springt auf die Vorgabe zurueck
//   03 Unklar: eine Anweisung, die sich nicht lesen laesst, ist keine Erlaubnis --
//      die Einstiege bleiben geschlossen, bis sie lesbar ist
//   04 Echtes Geld: keine Flagge, sondern nachgesehen -- Attrappen, Testbausteine,
//      Kopiervorlagen und Aufzeichnungen werden abgewiesen
//   05 Handgeschaefte: in die systematischen Konten fuehrt kein Weg von Hand
//   06 Wechsel: eine Reihenfolge von Schritten; jede Unklarheit haelt an und sagt warum
//   07 Zwei Grenzen: die Summe der offenen Stopp-Risiken gegen eine Obergrenze, die
//      Verlustbremse ueber alles -- fehlt eine, startet nichts
//   08 Spuren: verkettete Journale, nur angehaengt; wer eine Zeile aendert, bricht
//      die Kette, und der Bruch wird gemeldet
//   09 Daten: die Website legt kein Profil an, der Partnerzugang nur Pruefsummen und
//      ablaufende Anmeldungen, Zahlungsdaten gibt es nicht
//   10 Ehrlich gesagt: was wir nicht vorweisen koennen -- und der Geldweg, der vor
//      dem echten Broker endet
window.JKHDBilder = window.JKHDBilder || {};
window.JKHDBilder.sicherheit = function (k) {
  const { ctx, F, T, text, haken, kreuz, linieRund, reiheRund, schloss, mono, stueck, clamp, misch, dreieck, zufall } = k;
  const REIHE = reiheRund(17, 320);

  // Kleine Hilfen
  function rahmen(x, y, b, h, farbe, strich) {
    ctx.strokeStyle = farbe; ctx.lineWidth = strich || 1;
    ctx.strokeRect(x + 0.5, y + 0.5, b - 1, h - 1);
  }
  function pfeil(x0, y0, x1, y1, farbe, gestrichelt) {
    ctx.save();
    ctx.strokeStyle = farbe; ctx.fillStyle = farbe; ctx.lineWidth = 1.5; ctx.lineCap = "round";   /* Icon = Rolle Linie (Loop 2, A8) */
    if (gestrichelt) ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.setLineDash([]);
    const w = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 7 * Math.cos(w - 0.4), y1 - 7 * Math.sin(w - 0.4));
    ctx.lineTo(x1 - 7 * Math.cos(w + 0.4), y1 - 7 * Math.sin(w + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function notiz(x, y, gr, farbe) {   // ein Zettel mit drei Zeilen
    ctx.save();
    ctx.strokeStyle = farbe; ctx.lineWidth = 1.5; ctx.lineCap = "round";
    const r = gr / 2;
    ctx.strokeRect(x - r * 0.7 + 0.5, y - r + 0.5, r * 1.4, r * 2);
    for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.5 + j * r * 0.5); ctx.lineTo(x + r * (j === 2 ? 0.05 : 0.4), y - r * 0.5 + j * r * 0.5); ctx.stroke(); }
    ctx.restore();
  }
  function hand(x, y, gr, farbe) {   // eine Hand, schematisch: Handflaeche und drei Finger
    ctx.save();
    ctx.strokeStyle = farbe; ctx.lineWidth = 1.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const r = gr / 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y + r); ctx.lineTo(x - r * 0.5, y - r * 0.1); ctx.lineTo(x - r * 0.5, y - r * 0.8);
    ctx.moveTo(x - r * 0.15, y - r * 0.1); ctx.lineTo(x - r * 0.15, y - r);
    ctx.moveTo(x + r * 0.2, y - r * 0.1); ctx.lineTo(x + r * 0.2, y - r * 0.9);
    ctx.moveTo(x + r * 0.5, y + r); ctx.lineTo(x + r * 0.5, y - r * 0.2); ctx.lineTo(x + r * 0.5, y - r * 0.6);
    ctx.moveTo(x - r * 0.5, y + r); ctx.lineTo(x + r * 0.5, y + r);
    ctx.stroke();
    ctx.restore();
  }

  // 00 Die Ueberschrift: sieben Schloesser, die sich nacheinander schliessen
  function s0(t, zeit, A) {
    const n = 7;
    const w = Math.min(96, (A.b - 20) / n);
    const x0 = A.x + (A.b - w * n) / 2;
    const y = A.y + A.h * 0.5;
    const gr = Math.min(40, w * 0.55);
    const seit = Math.max(t, Math.min(1, zeit * 0.5));
    for (let i = 0; i < n; i++) {
      const a = stueck(seit, i * 0.1, i * 0.1 + 0.12) * 0.6;
      if (a <= 0) continue;
      ctx.globalAlpha *= a;
      const offen = 1 - stueck(seit, i * 0.1 + 0.12, i * 0.1 + 0.3);
      schloss(x0 + w * i + w / 2, y, gr, offen, F.tinte);
      text("0" + (i + 1), x0 + w * i + w / 2, y + gr * 0.75 + 16, mono(11), F.matt, "center");
      ctx.globalAlpha /= a;
    }
  }

  // 01 Der Not-Aus: eine Tuer fuer neue Einstiege, offene Trades laufen aus
  function s1(t, zeit, A) {
    const klein = k.klein;
    const yM = A.y + A.h * 0.52;
    const xT = A.x + A.b * 0.5;               // die Tuer
    const hT = Math.min(A.h * 0.5, 160);
    const P = 14;                             // eine Runde: 0-5 offen, 5-10 gezogen (bei 7 ein Neustart), 10 Quittung, dann offen
    const tz = zeit % P;
    const gezogen = tz >= 5 && tz < 10.5;
    const quittung = tz >= 10 && tz < 12;
    // die Tuer
    const aT = stueck(t, 0.05, 0.25);
    ctx.globalAlpha *= aT;
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xT, yM - hT / 2); ctx.lineTo(xT, yM - (gezogen ? 0 : 14));
    ctx.moveTo(xT, yM + (gezogen ? 0 : 14)); ctx.lineTo(xT, yM + hT / 2);
    ctx.stroke();
    text(T("neue Einstiege", "new entries"), xT, yM + hT / 2 + 18, mono(11), F.matt, "center");
    // der Hebel oben
    const xH = A.x + A.b * 0.5, yH = A.y + 14;
    rahmen(xH - 34, yH - 10, 68, 20, gezogen ? F.rot : F.rand2);
    ctx.fillStyle = gezogen ? F.rot : F.gruen;
    ctx.fillRect(xH - 32 + (gezogen ? 0 : 36), yH - 8, 28, 16);
    text(T("Not-Aus", "kill switch") + (gezogen ? T(": gezogen", ": pulled") : ""), xH + 42, yH + 4, mono(11), gezogen ? F.rot : F.matt);
    ctx.globalAlpha /= aT;
    // die Einstiege: Punkte von links zur Tuer; offen kommen sie durch und werden
    // offene Trades (Balken rechts), gezogen prallen sie ab
    const aE = stueck(t, 0.2, 0.4);
    ctx.globalAlpha *= aE;
    for (let i = 0; i < 6; i++) {
      const u = ((zeit * 0.5 + i / 6) % 1);
      const x = A.x + u * (xT - A.x - 6);
      const y = yM + Math.sin(i * 2.1) * 10;
      if (u < 0.96 || !gezogen) {
        ctx.fillStyle = F.tinte;
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      }
      if (gezogen && u > 0.93) kreuz(xT - 8, y, 10, F.rot, 1 - (u - 0.93) / 0.07);
    }
    // offene Trades rechts: laufen aus (schrumpfen), gezogen kommen keine neuen dazu
    const xB = xT + 30, bB = A.b * 0.5 - 60;
    for (let j = 0; j < 4; j++) {
      const y = yM - 36 + j * 24;
      const alter = ((zeit * 0.25 + j * 0.27) % 1);
      let laenge = (1 - alter) * bB;
      if (gezogen) laenge = Math.max(0, laenge - (tz - 5) * bB * 0.12);
      if (laenge < 4) continue;
      ctx.fillStyle = F.tinte;
      ctx.globalAlpha *= 0.35;
      ctx.fillRect(xB, y - 6, laenge, 12);
      ctx.globalAlpha /= 0.35;
    }
    text(T("offene Trades laufen aus", "open trades run out"), xB + bB, yM + hT / 2 + (klein ? 34 : 18), mono(11), F.matt, "right");
    // Neustart waehrend des gezogenen Zustands: ein kurzes Aufblitzen des Rahmens -- nichts aendert sich
    if (gezogen && tz >= 7 && tz < 7.6) {
      const a = 1 - (tz - 7) / 0.6;
      ctx.globalAlpha *= a;
      rahmen(A.x, A.y, A.b, A.h, F.tinte, 1.5);
      text(T("Neustart: der Zustand bleibt", "restart: the state survives"), A.x + A.b - 8, A.y + A.h - 8, mono(11), F.tinte, "right");
      ctx.globalAlpha /= a;
    }
    if (quittung) {
      const a = stueck(tz, 10, 10.4);
      ctx.globalAlpha *= a;
      notiz(xT + (klein ? 0 : 0), A.y + A.h - 36, 26, F.gruen);
      text(T("quittiert, mit Notiz", "acknowledged, with a note"), xT + 22, A.y + A.h - 32, mono(11), F.gruen);
      ctx.globalAlpha /= a;
    }
    ctx.globalAlpha /= aE;
  }

  // 02 Die Vorgabe: ein Regler, der nicht ueber die Vorgabe hinaus geht
  function s2(t, zeit, A) {
    const klein = k.klein;
    const y = A.y + A.h * 0.5;
    const x0 = A.x + 30, b = A.b - 60;
    const xV = x0 + b * 0.62;                 // die Vorgabe
    // die Skala
    const aS = stueck(t, 0, 0.3);
    ctx.globalAlpha *= aS;
    ctx.strokeStyle = F.rand2; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + b, y); ctx.stroke();
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xV, y - 26); ctx.lineTo(xV, y + 26); ctx.stroke();
    text(T("Vorgabe", "the setting"), xV, y - 34, mono(12), F.tinte, "center");
    text(T("← vorsichtiger", "← more careful"), x0, y + 44, mono(11), F.matt);
    text(T("mutiger → geht nicht", "bolder → not possible"), x0 + b, y + 44, mono(11), F.rot, "right");
    ctx.globalAlpha /= aS;
    // der Knopf: ein Versuch darueber hinaus (springt zurueck), dann vorsichtiger, dann zurueck zur Vorgabe
    const aK = stueck(t, 0.25, 0.45);
    if (aK > 0) {
      const P = 10, tz = zeit % P;
      let pos, versuch = false;
      if (tz < 2) pos = 0.62;
      else if (tz < 3.2) { const u = (tz - 2) / 1.2; pos = 0.62 + 0.22 * Math.sin(u * Math.PI); versuch = u < 0.5; }   // hin und zurueckgeholt
      else if (tz < 4) pos = 0.62;
      else if (tz < 5.5) pos = misch(0.62, 0.34, stueck(tz, 4, 5.5));
      else if (tz < 8) pos = 0.34;
      else pos = misch(0.34, 0.62, stueck(tz, 8, 9.5));
      // der Versuch: der Knopf will nach rechts, wird still zurueckgeholt
      const xK = x0 + b * Math.min(pos, versuch ? pos : 0.62 + Math.max(0, pos - 0.62) * 0.6);
      ctx.globalAlpha *= aK;
      ctx.fillStyle = F.grund; ctx.strokeStyle = F.tinte; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(xK, y, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = F.tinte;
      ctx.beginPath(); ctx.arc(xK, y, 4, 0, Math.PI * 2); ctx.fill();
      if (tz >= 2 && tz < 3.6) {
        const a = tz < 3.2 ? 1 : 1 - (tz - 3.2) / 0.4;
        ctx.globalAlpha *= a;
        text(klein ? T("zurückgeholt", "pulled back") : T("still auf die Vorgabe zurückgeholt — kein Eingriff", "quietly pulled back to the setting — not an intervention"), xV + 14, y - 14, mono(11), F.rot);
        ctx.globalAlpha /= a;
      }
      if (tz >= 4.5 && tz < 8) {
        text(T("Eingriff: vorsichtiger", "intervention: more careful"), x0 + b * 0.34, y - 20, mono(11), F.gruen, "center");
      }
      if (tz >= 8.2 && tz < 9.8) {
        text(T("der Weg zurück: bis zur Vorgabe, nicht darüber hinaus", "the way back: to the setting, not past it"), xV, y - 14, mono(11), F.matt, klein ? "right" : "left");
      }
      ctx.globalAlpha /= aK;
    }
  }

  // 03 Unklar: eine Anweisung, die sich nicht lesen laesst, ist keine Erlaubnis
  function s3(t, zeit, A) {
    const klein = k.klein;
    const P = 9, tz = zeit % P;
    const lesbar = tz >= 4.5;                 // erst unklar, dann lesbar
    const uebergang = stueck(tz, 4.5, 5.3);
    const z = zufall(3 + Math.floor(zeit * 6));   // das Rauschen flackert
    // die Anweisung: ein Blatt mit fuenf Zeilen
    const bx = A.x + (klein ? 10 : A.b * 0.12), by = A.y + 20, bb = klein ? A.b * 0.42 : A.b * 0.3, bh = Math.min(A.h - 60, 170);
    const aB = stueck(t, 0, 0.25);
    ctx.globalAlpha *= aB;
    rahmen(bx, by, bb, bh, F.rand2);
    text(T("Anweisung des Betreibers", "the operator's instruction"), bx, by - 8, mono(11), F.matt);
    for (let j = 0; j < 5; j++) {
      const y = by + 24 + j * ((bh - 36) / 4);
      if (uebergang >= 1) {
        ctx.strokeStyle = F.tinte; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx + 14, y); ctx.lineTo(bx + bb - 14 - (j === 4 ? bb * 0.3 : 0), y); ctx.stroke();
      } else {
        // unlesbar: zerrissene Striche, die flackern
        ctx.strokeStyle = F.matt; ctx.lineWidth = 2;
        let x = bx + 14;
        while (x < bx + bb - 14) {
          const l = 4 + z() * 14;
          if (z() < 0.55) { ctx.beginPath(); ctx.moveTo(x, y + (z() - 0.5) * 4); ctx.lineTo(Math.min(x + l, bx + bb - 14), y + (z() - 0.5) * 4); ctx.stroke(); }
          x += l + 3;
        }
        if (uebergang > 0) { ctx.strokeStyle = F.tinte; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 14, y); ctx.lineTo(bx + 14 + (bb - 28) * uebergang, y); ctx.stroke(); }
      }
    }
    text(lesbar ? T("lesbar", "readable") : T("nicht eindeutig lesbar", "not unambiguously readable"), bx + bb / 2, by + bh + 18, mono(11), lesbar ? F.gruen : F.rot, "center");
    ctx.globalAlpha /= aB;
    // der Pfeil zu den Einstiegen und die Tuer
    const aE = stueck(t, 0.3, 0.5);
    ctx.globalAlpha *= aE;
    const xT = A.x + A.b * (klein ? 0.8 : 0.72), yM = by + bh / 2, hT = Math.min(bh, 140);
    pfeil(bx + bb + 12, yM, xT - 24, yM, F.rand2, !lesbar);
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xT, yM - hT / 2); ctx.lineTo(xT, yM - (lesbar ? 14 : 0));
    ctx.moveTo(xT, yM + (lesbar ? 14 : 0)); ctx.lineTo(xT, yM + hT / 2);
    ctx.stroke();
    text(T("Einstiege", "entries"), xT, yM - hT / 2 - 10, mono(11), F.matt, "center");
    text(lesbar ? T("offen", "open") : T("geschlossen", "closed"), xT, yM + hT / 2 + 18, mono(11), lesbar ? F.gruen : F.rot, "center");
    if (!lesbar) text(T("nicht wissen heißt nicht handeln", "not knowing means not acting"), xT, yM + hT / 2 + 36, mono(11), F.matt, "center");
    ctx.globalAlpha /= aE;
  }

  // 04 Echtes Geld: nachgesehen, nicht behauptet
  const KANDIDATEN = [T("Attrappe", "stand-in"), T("Testbaustein", "test double"), T("Kopiervorlage", "copy template"), T("abgespielte Aufzeichnung", "replayed recording")];
  function s4(t, zeit, A) {
    const klein = k.klein;
    const yM = A.y + A.h * 0.5;
    const xP = A.x + A.b * 0.6;               // die Pruefstelle
    const hP = Math.min(A.h * 0.5, 150);
    const aP = stueck(t, 0, 0.25);
    ctx.globalAlpha *= aP;
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xP, yM - hP / 2); ctx.lineTo(xP, yM + hP / 2); ctx.stroke();
    // der Suchstrahl, der ueber die Pruefstelle laeuft
    const s = dreieck(zeit * 0.7);
    ctx.strokeStyle = F.rand2; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xP - 10, yM - hP / 2 + s * hP); ctx.lineTo(xP + 10, yM - hP / 2 + s * hP); ctx.stroke();
    text(T("nachgesehen", "checked"), xP, yM - hP / 2 - 10, mono(12), F.tinte, "center");
    text(T("echtes Geld?", "real money?"), xP, yM + hP / 2 + 18, mono(11), F.matt, "center");
    // keine Flagge: ein durchgestrichenes Blatt rechts
    const xF = A.x + A.b * (klein ? 0.86 : 0.84);
    notiz(xF, yM, 28, F.rand2);
    kreuz(xF, yM, 22, F.rot, 0.9);
    text(klein ? T("keine Flagge", "no flag") : T("keine Datei, die es behaupten könnte", "no file that could claim it"), xF, yM + hP / 2 + 18, mono(11), F.matt, "center");
    ctx.globalAlpha /= aP;
    // die Kandidaten: kommen von links, werden an der Pruefstelle abgewiesen
    const aK = stueck(t, 0.2, 0.4);
    ctx.globalAlpha *= aK;
    const P = 2.6;
    for (let i = 0; i < KANDIDATEN.length; i++) {
      const u = ((zeit / P + i / KANDIDATEN.length) % 1);
      const xA = A.x + (klein ? 130 : 30);
      const x = xA + u * (xP - xA - 10);
      const y = yM - 30 + i * 20;
      if (u < 0.9) {
        rahmen(x - 7, y - 7, 14, 14, F.tinte);
        text(KANDIDATEN[i], x - 12, y + 4, mono(klein ? 10 : 11), F.matt, "right");
      } else {
        const a = 1 - (u - 0.9) / 0.1;
        kreuz(xP - 12, y, 12, F.rot, a);
        ctx.globalAlpha *= a;
        text(T("abgewiesen", "refused"), xP + 14, y + 4, mono(11), F.rot);
        ctx.globalAlpha /= a;
      }
    }
    ctx.globalAlpha /= aK;
  }

  // 05 Handgeschaefte: kein Weg von Hand in die systematischen Konten
  function s5(t, zeit, A) {
    const klein = k.klein;
    const yM = A.y + A.h * 0.42;
    const xK = A.x + A.b * 0.62, bK = klein ? 110 : 170, hK = Math.min(A.h * 0.4, 110);
    const aK = stueck(t, 0, 0.25);
    ctx.globalAlpha *= aK;
    rahmen(xK - bK / 2, yM - hK / 2, bK, hK, F.tinte, 1.5);
    text(T("systematische Konten", "systematic accounts"), xK, yM - hK / 2 - 10, mono(11), F.matt, "center");
    // der Maschinenweg: Orders fliessen hinein
    pfeil(A.x + 20, yM, xK - bK / 2 - 6, yM, F.tinte, false);
    text(T("Maschine", "the machine"), A.x + 20, yM - 12, mono(11), F.matt);
    for (let i = 0; i < 5; i++) {
      const u = ((zeit * 0.4 + i / 5) % 1);
      const x = A.x + 20 + u * (xK - bK / 2 - 30 - A.x);
      ctx.fillStyle = F.tinte;
      ctx.beginPath(); ctx.arc(x, yM, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha /= aK;
    // die Hand: versucht es von unten, es gibt keinen Weg
    const aH = stueck(t, 0.3, 0.5);
    ctx.globalAlpha *= aH;
    const yH = A.y + A.h - 26, hub = dreieck(zeit * 0.3) * 28;
    hand(xK, yH - hub, 30, F.tinte);
    pfeil(xK, yH - hub - 22, xK, yM + hK / 2 + 26, F.rand2, true);
    kreuz(xK, yM + hK / 2 + 14, 14, F.rot, 1);
    k.textHalten(klein ? T("kein Weg von Hand", "no path by hand") : T("kein Weg für Handgeschäfte — auch nicht für uns", "no path for manual trades — not for us either"), xK + 22, yM + hK / 2 + 36, mono(11), F.rot);
    k.textHalten(klein ? T("sonst nicht mehr prüfbar", "else no longer testable") : T("sonst wären Maschine und Hand nicht mehr zu trennen", "otherwise machine and hand could no longer be told apart"), xK + 22, yM + hK / 2 + 52, mono(11), F.matt);
    ctx.globalAlpha /= aH;
  }

  // 06 Der Wechsel: eine Reihenfolge, kein Schalter
  const SCHRITTE = [T("Einstiege sperren", "block new entries"), T("nachweisen: nichts offen", "prove: nothing open"), T("den laufenden Ablauf beenden", "end the running process"), T("den Stillstand bezeugen", "witness the standstill"), T("Zielzustand starten", "start the target state")];
  function s6(t, zeit, A) {
    const klein = k.klein;
    const n = SCHRITTE.length;
    const zeile = Math.min(40, (A.h - 20) / n);
    const y0 = A.y + (A.h - zeile * n) / 2 + 8;
    const x0 = A.x + 30;
    const P = 12, tz = zeit % P;
    // der Marker: Schritt fuer Schritt; bei Schritt 2 einmal eine Unklarheit, die anhaelt
    let schritt, haelt = false;
    if (tz < 2) schritt = 0; else if (tz < 3.5) schritt = 1;
    else if (tz < 6.5) { schritt = 1; haelt = true; }
    else if (tz < 8) schritt = 2; else if (tz < 9.5) schritt = 3; else if (tz < 11) schritt = 4; else schritt = 4;
    for (let i = 0; i < n; i++) {
      const a = stueck(t, i * 0.12, i * 0.12 + 0.1);
      if (a <= 0) continue;
      const y = y0 + i * zeile;
      ctx.globalAlpha *= a;
      const dran = i === schritt, vorbei = i < schritt;
      ctx.strokeStyle = dran ? (haelt ? F.rot : F.tinte) : F.rand2; ctx.lineWidth = dran ? 2 : 1;
      ctx.beginPath(); ctx.arc(x0, y, 7, 0, Math.PI * 2); ctx.stroke();
      if (vorbei) haken(x0, y, 11, F.gruen, 1);
      if (i < n - 1) { ctx.strokeStyle = F.rand2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y + 8); ctx.lineTo(x0, y + zeile - 8); ctx.stroke(); }
      text(String(i + 1) + "  " + SCHRITTE[i], x0 + 18, y + 4, mono(klein ? 11 : 12), dran ? F.tinte : F.matt);
      if (dran && haelt) {
        // eine kaputte Datei: der Wechsel haelt hier an und sagt warum
        const xU = x0 + (klein ? 190 : 290);
        notiz(xU, y, 20, F.rot);
        ctx.strokeStyle = F.rot; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(xU - 4, y - 12); ctx.lineTo(xU + 4, y + 12); ctx.stroke();
        text(klein ? T("unklar → hält an", "unclear → halts") : T("eine kaputte Datei ist nicht „nichts offen“ → der Wechsel hält an und sagt warum", "a broken file is not “nothing open” → the change halts and says why"), xU + 16, y + 4, mono(11), F.rot);
      }
      ctx.globalAlpha /= a;
    }
    const aZ = stueck(t, 0.7, 0.9);
    ctx.globalAlpha *= aZ;
    text(klein ? T("dazu Zeitsperre und Fragen", "plus waiting period and questions") : T("dazu eine Zeitsperre und Fragen, die vorher beantwortet werden müssen — gegen den eigenen Übermut", "plus a waiting period and questions that have to be answered first — against our own overconfidence"), x0 - 8, A.y + A.h - 4, mono(11), F.matt);
    ctx.globalAlpha /= aZ;
  }

  // 07 Zwei Grenzen: die Summe der Stopp-Risiken, die Verlustbremse
  function s7(t, zeit, A) {
    const klein = k.klein;
    const hG = Math.min(A.h - 70, 190);
    const yB = A.y + 30 + hG;                 // Boden der Saeulen
    // links: fuenf Konten, ihre offenen Stopp-Risiken gestapelt gegen die Obergrenze
    const xL = A.x + 20, bL = A.b * (klein ? 0.42 : 0.4);
    const aL = stueck(t, 0, 0.3);
    ctx.globalAlpha *= aL;
    text(klein ? T("Stopp-Risiken, zusammen", "stop risks, added up") : T("offene Stopp-Risiken, zusammen", "open stop risks, added up"), xL, A.y + 14, mono(11), F.matt);
    const grenzeL = yB - hG * 0.8;
    ctx.strokeStyle = F.rot; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xL, grenzeL); ctx.lineTo(xL + bL, grenzeL); ctx.stroke();
    text(T("Obergrenze", "upper limit"), xL + bL, grenzeL - 6, mono(11), F.rot, "right");
    // die Stapel: fuenf Konten in dieselbe Richtung = ein Trade in fuenffacher Groesse
    const n = 5, sb = Math.min(28, (bL - 60) / n);
    let summe = 0;
    const P = 8, tz = zeit % P;
    for (let i = 0; i < n; i++) {
      const h = hG * (0.1 + 0.05 * i) * (0.85 + 0.15 * Math.sin(zeit * 0.8 + i));
      const x = xL + 10 + i * (sb + 6);
      ctx.fillStyle = F.tinte;
      ctx.globalAlpha *= 0.35;
      ctx.fillRect(x, yB - h, sb, h);
      ctx.globalAlpha /= 0.35;
      summe += h;
    }
    // die Summe als eine Saeule rechts daneben; ein neuer Trade will dazu
    const xS = xL + 10 + n * (sb + 6) + 10;
    ctx.fillStyle = F.tinte;
    ctx.fillRect(xS, yB - summe, sb, summe);
    const neu = hG * 0.22 * stueck(tz, 1, 2.5) * (1 - stueck(tz, 4, 5));
    if (neu > 0) {
      const passt = summe + neu <= hG * 0.8;
      ctx.strokeStyle = passt ? F.gruen : F.rot; ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(xS + 0.5, yB - summe - neu + 0.5, sb - 1, neu - 1);
      ctx.setLineDash([]);
      if (!passt && tz > 2.5) {
        kreuz(xS + sb / 2, yB - summe - neu - 12, 12, F.rot, 1);
        if (klein) text(T("abgelehnt", "refused"), xS + sb / 2, yB - summe - neu - 24, mono(11), F.rot, "center");
        else text(T("neuer Trade: abgelehnt", "new trade: refused"), xS + sb + 8, yB - summe - neu, mono(11), F.rot);
      }
    }
    text(klein ? T("= ein Trade, fünffach", "= one trade, five times") : T("= ein Trade in fünffacher Größe", "= one trade at five times the size"), xL, yB + 16, mono(11), F.matt);
    ctx.globalAlpha /= aL;
    // rechts: die Verlustbremse ueber alles (realisiert + unrealisiert)
    const xR = A.x + A.b * (klein ? 0.62 : 0.6), bR = A.b * (klein ? 0.36 : 0.36);
    const aR = stueck(t, 0.35, 0.6);
    ctx.globalAlpha *= aR;
    text(klein ? T("Verlustbremse", "loss brake") : T("Verlustbremse über alles", "loss brake across everything"), xR, A.y + 14, mono(11), F.matt);
    const grenzeR = yB - hG * 0.75;
    ctx.strokeStyle = F.rot; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xR, grenzeR); ctx.lineTo(xR + bR, grenzeR); ctx.stroke();
    const real = hG * 0.3 * (0.6 + 0.4 * dreieck(zeit * 0.08));
    const unreal = hG * 0.25 * (0.4 + 0.6 * dreieck(zeit * 0.13 + 0.3));
    const sbR = Math.min(40, bR * 0.3);
    ctx.fillStyle = F.tinte;
    ctx.fillRect(xR + 10, yB - real, sbR, real);
    ctx.globalAlpha *= 0.4;
    ctx.fillRect(xR + 10, yB - real - unreal, sbR, unreal);
    ctx.globalAlpha /= 0.4;
    text(T("realisiert", "realised"), xR + 10 + sbR + 8, yB - real / 2 + 4, mono(10), F.matt);
    text(T("+ unrealisiert", "+ unrealised"), xR + 10 + sbR + 8, yB - real - unreal / 2 + 4, mono(10), F.matt);
    // das Tagesbudget haengt am Stand bei Tagesbeginn
    const yT = yB - hG * 0.55;
    ctx.strokeStyle = F.rand2; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(xR, yT); ctx.lineTo(xR + bR, yT); ctx.stroke();
    ctx.setLineDash([]);
    if (!klein) text(T("Tagesbudget: Stand bei Tagesbeginn — ein Gewinn am Vormittag macht es nicht größer", "daily budget: balance at the start of the day — a morning profit does not enlarge it"), xR, yB + 16, mono(10), F.matt);
    ctx.globalAlpha /= aR;
    const aF = stueck(t, 0.75, 0.95);
    ctx.globalAlpha *= aF;
    text(T("fehlt eines dieser Limits, startet nichts", "if one of these limits is missing, nothing starts"), A.x + A.b / 2, A.y + A.h - 4, mono(11), F.tinte, "center");
    ctx.globalAlpha /= aF;
  }

  // 08 Spuren: verkettete Journale
  function s8(t, zeit, A) {
    const klein = k.klein;
    const yM = A.y + A.h * 0.42;
    const bb = klein ? 44 : 58, hb = 34, l = klein ? 22 : 30;
    const schritt = bb + l;
    const n = Math.floor((A.b + l) / schritt) + 2;
    const lauf = (zeit * 18) % schritt;     // die Kette rueckt nach links, hinten kommt immer ein Eintrag dazu
    const P = 9, tz = zeit % P;
    const geaendert = tz >= 4 && tz < 7;     // jemand aendert eine Zeile in der Mitte
    const aK = stueck(t, 0, 0.5);
    ctx.globalAlpha *= aK;
    const basis = Math.floor(zeit * 18 / schritt);   // die Nummer des vordersten Eintrags
    for (let i = 0; i < n; i++) {
      const x = A.x - lauf + i * schritt;
      if (x + bb < A.x - 2 || x > A.x + A.b + 2) continue;
      const nr = basis + i;
      const mitte = Math.abs(x + bb / 2 - (A.x + A.b * 0.5)) < schritt / 2;
      const kaputt = geaendert && mitte;
      rahmen(x, yM - hb / 2, bb, hb, kaputt ? F.rot : F.tinte, kaputt ? 1.5 : 1);
      text(String(nr % 1000).padStart(3, "0"), x + bb / 2, yM + 4, mono(11), kaputt ? F.rot : F.tinte, "center");
      // die Pruefsumme ueber den Vorgaenger: ein Haken am Glied; nach der Aenderung passt sie nicht mehr
      if (i > 0) {
        const bruch = geaendert && Math.abs(x - schritt + bb / 2 - (A.x + A.b * 0.5)) < schritt / 2;
        ctx.strokeStyle = bruch ? F.rot : F.rand2; ctx.lineWidth = bruch ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(x - l + 2, yM); ctx.lineTo(x - 2, yM); ctx.stroke();
        if (bruch) kreuz(x - l / 2, yM, 10, F.rot, 1); else haken(x - l / 2, yM - 1, 9, F.gruen, 0.9);
      }
      if (kaputt) text(T("Zeile geändert", "line changed"), x + bb / 2, yM - hb / 2 - 10, mono(11), F.rot, "center");
    }
    text(T("nur angehängt, nie überschrieben", "appended only, never overwritten"), A.x + A.b, yM + hb / 2 + (klein ? 34 : 18), mono(11), F.matt, "right");
    text(T("jeder Eintrag: Prüfsumme über den Vorgänger", "every entry: a checksum over its predecessor"), A.x, yM + hb / 2 + 18, mono(11), F.matt);
    if (geaendert) {
      const a = stueck(tz, 4.3, 4.8);
      ctx.globalAlpha *= a;
      if (klein) {   // am Handy zwei Zeilen, eine liefe ueber beide Raender
        text(T("Kette gebrochen → beim Start gemeldet;", "chain broken → reported at start-up;"), A.x + A.b / 2, A.y + A.h - 18, mono(11), F.rot, "center");
        text(T("ein Beweislauf bricht ab", "an evidence run stops"), A.x + A.b / 2, A.y + A.h - 4, mono(11), F.rot, "center");
      } else text(T("Kette gebrochen → beim Start gemeldet; ein Beweislauf bricht ab", "chain broken → reported at start-up; an evidence run stops"), A.x + A.b / 2, A.y + A.h - 4, mono(11), F.rot, "center");
      ctx.globalAlpha /= a;
    }
    ctx.globalAlpha /= aK;
  }

  // 09 Daten: wenig
  function s9(t, zeit, A) {
    const klein = k.klein;
    const spalten = [
      { titel: T("diese Website", "this website"), zeilen: [T("keine Cookies", "no cookies"), T("keine Tracker", "no trackers"), T("nichts von fremden Servern", "nothing from other servers"), T("keine Fragen, keine Antworten gespeichert", "no questions, no answers stored")], art: 0 },
      { titel: T("der Partnerzugang", "the partner access"), zeilen: [T("Code und Passwort nie im Klartext", "code and password never in clear text"), T("Anmeldungen verfallen von selbst", "sign-ins expire by themselves"), T("nur verschlüsselt erreichbar", "reachable only encrypted"), T("verrät nicht, wer dazugehört", "does not reveal who belongs")], art: 1 },
      { titel: T("Zahlungsdaten", "payment data"), zeilen: [T("keine Karten, keine Konten", "no cards, no accounts"), T("kein Warenkorb, kein Zahlungsdienst", "no basket, no payment provider"), T("es gibt nichts zu kaufen", "there is nothing to buy")], art: 2 },
    ];
    const n = spalten.length;
    const w = klein ? A.b : A.b / n;
    for (let i = 0; i < n; i++) {
      const a = stueck(t, i * 0.2, i * 0.2 + 0.2);
      if (a <= 0) continue;
      ctx.globalAlpha *= a;
      // am Laptop drei Spalten, am Handy drei Bloecke untereinander (Zeichen links)
      const cx = klein ? A.x + 40 : A.x + i * w + w / 2;
      // Handy: die drei Bloecke gleichmaessig ueber die (dort nur ~270 px hohe) Flaeche verteilt,
      // sonst beruehrt die letzte Zeile den naechsten Titel (Loop 29.10.2026, 1.17)
      const yG = klein ? A.y + 26 + i * ((A.h - 32) / n) : A.y + 44;
      const sp = spalten[i];
      // das Zeichen oben: Website = durchgestrichener Keks; Partner = Pruefsumme, die sich dreht, und eine Uhr; Zahlung = leerer Rahmen
      if (sp.art === 0) {
        ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, yG, 14, 0, Math.PI * 2); ctx.stroke();
        for (let j = 0; j < 4; j++) { ctx.fillStyle = F.tinte; ctx.beginPath(); ctx.arc(cx + Math.cos(j * 1.7) * 7, yG + Math.sin(j * 1.7) * 7, 1.6, 0, Math.PI * 2); ctx.fill(); }
        kreuz(cx, yG, 34, F.rot, 0.9);
      } else if (sp.art === 1) {
        const z = zufall(Math.floor(zeit * 4));
        let s = "";
        for (let j = 0; j < 8; j++) s += "0123456789abcdef"[Math.floor(z() * 16)];
        text(s, cx - (klein ? 14 : 16), yG + 4, mono(klein ? 10 : 12), F.tinte, "center");
        // die Uhr: eine Anmeldung, die ablaeuft
        const r = 11, u = (zeit * 0.12) % 1;
        ctx.strokeStyle = F.rand2; ctx.lineWidth = 1.5;
        const xU = cx + (klein ? 24 : 36);
        ctx.beginPath(); ctx.arc(xU, yG, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = F.tinte;
        ctx.beginPath(); ctx.arc(xU, yG, r, -Math.PI / 2, -Math.PI / 2 + (1 - u) * Math.PI * 2); ctx.stroke();
      } else {
        ctx.save(); ctx.setLineDash([3, 3]); rahmen(cx - 18, yG - 12, 36, 24, F.rand2); ctx.restore();
        text("—", cx, yG + 5, mono(14), F.matt, "center");
      }
      if (klein) text(sp.titel, cx + 46, yG - 4, mono(12, 700), F.tinte);
      else text(sp.titel, cx, yG + 32, mono(12, 700), F.tinte, "center");
      for (let j = 0; j < sp.zeilen.length; j++) {
        const e = stueck(t, i * 0.2 + 0.1 + j * 0.05, i * 0.2 + 0.18 + j * 0.05);
        if (e <= 0) continue;
        ctx.globalAlpha *= e;
        if (klein) text(sp.zeilen[j], cx + 46, yG + 13 + j * 14, mono(10), F.matt);
        else text(sp.zeilen[j], cx, yG + 56 + j * 18, mono(11), F.matt, "center");
        ctx.globalAlpha /= e;
      }
      ctx.globalAlpha /= a;
    }
    const aU = stueck(t, 0.8, 1);
    ctx.globalAlpha *= aU;
    text(T("die kürzeste Antwort auf jede Datenfrage: wenig haben", "the shortest answer to any data question: hold very little"), A.x + A.b / 2, A.y + A.h - 4, mono(11), F.tinte, "center");
    ctx.globalAlpha /= aU;
  }

  // 10 Ehrlich gesagt: was wir nicht vorweisen koennen -- und der Geldweg, der vor dem Broker endet
  const FEHLT = [T("keine Zertifizierung", "no certification"), T("kein externes Audit", "no external audit"), T("keine Bereitschaft rund um die Uhr", "no cover around the clock"), T("keine Redundanz", "no redundancy"), T("keine Sperre hat je echtes Geld gehalten", "no lock has ever held real money")];
  function s10(t, zeit, A) {
    const klein = k.klein;
    const n = FEHLT.length;
    const zeile = Math.min(30, (A.h * 0.6) / n);
    const y0 = A.y + 14;
    const x0 = A.x + 24;
    for (let i = 0; i < n; i++) {
      const a = stueck(t, i * 0.1, i * 0.1 + 0.1);
      if (a <= 0) continue;
      const y = y0 + i * zeile + zeile / 2;
      ctx.globalAlpha *= a;
      ctx.strokeStyle = F.rand2; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x0, y, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 - 4, y); ctx.lineTo(x0 + 4, y); ctx.stroke();
      text(FEHLT[i], x0 + 18, y + 4, mono(klein ? 11 : 12), i === n - 1 ? F.tinte : F.matt);
      ctx.globalAlpha /= a;
    }
    // der Geldweg: er endet, wo der echte Broker stuende; die Bereitschaftspruefung sagt nein
    const aW = stueck(t, 0.6, 0.85);
    if (aW > 0) {
      ctx.globalAlpha *= aW;
      const yS = A.y + A.h - 30;
      const bis = A.x + A.b * 0.64;
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(A.x, yS); ctx.lineTo(bis, yS); ctx.stroke();
      const blink = 0.55 + 0.45 * Math.sin(zeit * 2.5);
      ctx.globalAlpha *= blink;
      ctx.beginPath(); ctx.moveTo(bis, yS - 10); ctx.lineTo(bis, yS + 10); ctx.stroke();
      ctx.globalAlpha /= blink;
      // Punkte, die auf dem Weg laufen und an seinem Ende stehen bleiben
      for (let i = 0; i < 4; i++) {
        const u = ((zeit * 0.25 + i / 4) % 1);
        const x = A.x + u * (bis - A.x - 8);
        ctx.fillStyle = F.tinte;
        ctx.beginPath(); ctx.arc(x, yS, 3, 0, Math.PI * 2); ctx.fill();
      }
      text(T("der Geldweg, soweit es ihn gibt", "the money path, as far as it exists"), A.x, yS - 10, mono(11), F.matt);
      if (klein) text(T("kein Broker angeschlossen: Bereitschaft nein", "no broker attached: readiness says no"), A.x + A.b, yS + 22, mono(11), F.matt, "right");
      else text(T("keine Gegenseite angeschlossen — die Bereitschaftsprüfung sagt nein", "no counterparty attached — the readiness check says no"), bis + 10, yS + 4, mono(11), F.matt);
      ctx.globalAlpha /= aW;
    }
  }

  return { laengen: [2.0, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75], zeichner: [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10] };
};
