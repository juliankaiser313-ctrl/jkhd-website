// ---------- Die Bilder der Pruefungen-Seite (pruefung.html / en/testing.html) ----------
// Gezeichnet vom Motor js/bildlauf.js (dort steht, wie Scrollweg, Schub, Aufbau und
// Haltezeit zusammenspielen). Inhalt sind die fuenf Stufen, die Belastungsproben
// und die Grenze der Seite vom 23.09.2026 (damals gegen den Quelltext des Systems
// geprueft), nur gekuerzt -- nichts Neues, keine Zahlen, die dort nicht standen.
// Die Bilder:
//   00 die Ueberschrift der Seite, dazu die fuenf Stufen als Zeichen, leise bewegt
//   01 Zuerst rot: ein Feld von Tests, jeder wird erst rot, dann gruen; ein paar
//      bleiben leer -- leer ist nichts bewiesen; danach laufen die Tests immer wieder
//   02 Eingefrorener Vergleichslauf: drei Paare von Baendern, Zeile fuer Zeile
//      verglichen -- bitgleich; andere Vorgabe, muss anders sein; Datei fehlt, rot
//   03 Suche gegen den Zufall: Suche vorn, Bestaetigung hinten, die Randzone faellt
//      heraus, das rollende Fenster; dieselbe Suche ueber eine zerstoerte Reihe und
//      eine mit eingebautem Effekt; die Reihen laufen weiter
//   04 Schattenbetrieb: Signale laufen ohne Geld durch die Sperren (Regimefilter,
//      Wiederholungs-Stop, eine Position) in die Evidenz, immer weiter
//   05 Ueberwachter Dauerbetrieb: das Lebenszeichen laeuft wie auf einem Monitor;
//      der Prozess steht (steht aber noch in der Liste), der Waechter beendet, der
//      naechste Durchgang startet neu -- und das wiederholt sich
//   06 Belastungsproben: sechs Ausfaelle treffen das System, je mit dem, was dabei
//      herauskommen muss; danach trifft es sie reihum wieder
//   07 Grenze: die fuenf Stufen als Zeichen, darunter der Strich, der vor dem
//      echten Broker endet
window.JKHDBilder = window.JKHDBilder || {};
window.JKHDBilder.pruefung = function (k) {
  const { ctx, F, T, text, haken, kreuz, linie, linieRund, reiheRund, zerstoertRund, reiheDrift, puls, mono, stueck, clamp, misch, dreieck, zufall } = k;
  const REIHE = reiheRund(5, 320);
  const REIHE_ZERSTOERT = zerstoertRund(REIHE, 9);
  const REIHE_EFFEKT = reiheDrift(11, 160, 0.09);

  // Die fuenf Stufen als Zeichen, jedes leise bewegt (fuer das erste und das letzte Bild)
  function stufenGlyph(i, cx, cy, gr, zeit) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = F.tinte; ctx.fillStyle = F.tinte; ctx.lineWidth = 1.5; ctx.lineCap = "round";
    const r = gr / 2;
    if (i === 0) {            // das Feld: 3x3 Kaestchen, eins leer; ein Test laeuft gerade
      const kk = gr / 3.4;
      const lauf = Math.floor(zeit * 2.5) % 9;
      for (let j = 0; j < 9; j++) {
        const kx = -r + (j % 3) * (kk + 3), ky = -r + Math.floor(j / 3) * (kk + 3);
        if (j === 7) ctx.strokeRect(kx + 0.5, ky + 0.5, kk - 1, kk - 1);
        else if (j === lauf) { ctx.fillStyle = F.rot; ctx.fillRect(kx, ky, kk, kk); ctx.fillStyle = F.tinte; }
        else ctx.fillRect(kx, ky, kk, kk);
      }
    } else if (i === 1) {     // zwei Baender, der Vergleichscursor laeuft
      for (let j = 0; j < 6; j++) {
        const bx = -r + j * (gr / 6);
        if (j % 2 === 0) { ctx.fillRect(bx, -r, gr / 6 - 3, r * 0.7); ctx.fillRect(bx, r * 0.3, gr / 6 - 3, r * 0.7); }
        else { ctx.strokeRect(bx + 0.5, -r + 0.5, gr / 6 - 4, r * 0.7 - 1); ctx.strokeRect(bx + 0.5, r * 0.3 + 0.5, gr / 6 - 4, r * 0.7 - 1); }
      }
      const x = -r + ((zeit * 0.4) % 1) * gr;
      ctx.beginPath(); ctx.moveTo(x, -r - 4); ctx.lineTo(x, r + 4); ctx.stroke();
    } else if (i === 2) {     // eine Reihe, die laeuft, mit der Grenze
      linieRund(REIHE, zeit * 6, 60, -r, -r, gr, gr, 1, F.tinte, 1.4);
      ctx.beginPath(); ctx.moveTo(r * 0.24, -r); ctx.lineTo(r * 0.24, r); ctx.stroke();
    } else if (i === 3) {     // drei Sperren, ein Signal wandert hindurch
      for (let j = 0; j < 3; j++) { const sx = -r + (j + 0.5) * (gr / 3); ctx.beginPath(); ctx.moveTo(sx, -r); ctx.lineTo(sx, -4); ctx.moveTo(sx, 4); ctx.lineTo(sx, r); ctx.stroke(); }
      const x = -r - 6 + ((zeit * 0.5) % 1) * (2 * r + 12);
      ctx.beginPath(); ctx.arc(x, 0, 3, 0, Math.PI * 2); ctx.fill();
    } else {                  // das Lebenszeichen, es schlaegt
      const periode = gr * 0.5;
      const schub = (zeit * 30) % periode;
      ctx.beginPath();
      for (let x = -r; x <= r; x += 1) {
        const ph = ((((x + r + schub) % periode) + periode) % periode) / periode;
        const y = puls(ph) * r * 0.8;
        if (x === -r) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function stufenReihe(A, t, zeit, alpha, mitZahlen) {
    const n = 5;
    const w = Math.min(120, (A.b - 40) / n);
    const x0 = A.x + (A.b - w * n) / 2;
    const y = A.y + A.h * (mitZahlen ? 0.36 : 0.5);
    const gr = Math.min(56, w * 0.6);
    for (let i = 0; i < n; i++) {
      const a = stueck(t, i * 0.08, i * 0.08 + 0.1) * alpha;
      if (a <= 0) continue;
      ctx.globalAlpha *= a;
      const cx = x0 + w * i + w / 2;
      stufenGlyph(i, cx, y, gr, zeit);
      text("0" + (i + 1), cx, y + gr / 2 + 22, mono(12), F.matt, "center");
      ctx.globalAlpha /= a;
    }
  }

  // 00 Die Ueberschrift: dazu die fuenf Stufen als Zeichen, leise
  function s0(t, zeit, A) {
    // die Zeichen kommen mit der Zeit (gleich nach dem Laden), nicht erst beim Scrollen
    stufenReihe(A, Math.max(t, Math.min(1, zeit * 0.7)), zeit, 0.55, false);
  }

  // 01 Zuerst rot: ein Feld von Tests; danach laufen die Tests immer wieder (der Lauf
  // zieht als helle Spalte ueber das Feld)
  function s1(t, zeit, A) {
    const z = 26, l = 10, schritt = z + l;
    const spalten = clamp(Math.floor((A.b + l) / schritt), 6, 14);
    const zeilen = clamp(Math.floor((A.h - 40 + l) / schritt), 3, 6);
    const n = spalten * zeilen;
    const bx = A.x + (A.b - (spalten * schritt - l)) / 2;
    const by = A.y + (A.h - 36 - (zeilen * schritt - l)) / 2;
    let rot = 0, gruen = 0, leer = 0;
    for (let i = 0; i < n; i++) {
      const x = bx + (i % spalten) * schritt, y = by + Math.floor(i / spalten) * schritt;
      const istLeer = (i * 7) % 23 === 0 && i > 0;
      const an = (i / n) * 0.78;
      const zustand = istLeer ? "leer" : t < an ? "offen" : t < an + 0.14 ? "rot" : "gruen";
      ctx.lineWidth = 1;
      if (zustand === "leer" || zustand === "offen") {
        ctx.strokeStyle = zustand === "leer" ? F.rand2 : F.rand;
        ctx.strokeRect(x + 0.5, y + 0.5, z - 1, z - 1);
        if (zustand === "leer" && t > an + 0.14) leer++;
      } else {
        const f = zustand === "rot" ? F.rot : F.gruen;
        const a = zustand === "rot" ? 0.9 : 0.75;
        ctx.fillStyle = f;
        ctx.globalAlpha *= a;
        ctx.fillRect(x, y, z, z);
        ctx.globalAlpha /= a;
        if (zustand === "rot") rot++; else gruen++;
      }
    }
    // der naechste Lauf: eine helle Spalte wandert ueber das Feld
    if (t >= 1) {
      const sp = ((zeit * 7) % (spalten + 8)) - 4;
      if (sp >= 0 && sp < spalten) {
        ctx.fillStyle = F.tinte;
        ctx.globalAlpha *= 0.14;
        ctx.fillRect(bx + sp * schritt - l / 2, by - 4, schritt, zeilen * schritt - l + 8);
        ctx.globalAlpha /= 0.14;
      }
    }
    const yU = by + zeilen * schritt + 14;
    text(T(`${gruen} grün · ${rot} rot · ${leer} leer`, `${gruen} green · ${rot} red · ${leer} empty`), bx, yU + 12, mono(12), F.matt);
    if (t > 0.9) {
      const a = stueck(t, 0.9, 1);
      ctx.globalAlpha *= a;
      if (k.klein) text(T("leer = nichts bewiesen, nur behauptet", "empty = nothing proven, only claimed"), bx, yU + 30, mono(11), F.rot);
      else text(T("leer = nichts bewiesen, nur behauptet", "empty = nothing proven, only claimed"), bx + A.b * 0.5, yU + 12, mono(12), F.rot, "right");
      ctx.globalAlpha /= a;
    }
  }

  // 02 Eingefrorener Vergleichslauf: drei Paare von Baendern, die nacheinander
  // entstehen und stehen bleiben -- dieselbe Vorgabe (bitgleich), eine andere
  // Vorgabe (muss anders sein), die fehlende Vergleichsdatei (rot, nicht
  // uebersprungen); danach laeuft der Vergleich in den ersten beiden immer wieder
  function s2(t, zeit, A) {
    const klein = k.klein;
    const bb = klein ? 9 : 11, l = klein ? 4 : 5, schritt = bb + l;
    const n = clamp(Math.floor((A.b - 40 + l) / schritt), 14, 44);
    const breite = n * schritt - l;
    const x0 = A.x + (A.b - breite) / 2;
    const hB = klein ? 16 : 18;
    const paarH = hB * 2 + 26 + 34;
    const y0 = A.y + 12 + Math.max(0, (A.h - 12 - 3 * paarH) / 2);
    const zA = zufall(31), musterA = [];
    for (let i = 0; i < n; i++) musterA.push(zA() < 0.5);
    const zB = zufall(77), musterB2 = [];
    for (let i = 0; i < n; i++) musterB2.push(i >= Math.floor(n * 0.45) ? zB() < 0.5 : musterA[i]);
    const paare = [
      { von: 0, bis: 0.32, b: musterA, urteil: T("dieselbe Vorgabe → bitgleich", "same input → bit-identical") },
      { von: 0.36, bis: 0.66, b: musterB2, urteil: T("andere Vorgabe → anders, wie verlangt", "different input → different, as demanded") },
      { von: 0.7, bis: 0.9, b: musterA, fehlt: true, urteil: T("Datei fehlt → rot, nicht übersprungen", "file missing → red, not skipped") },
    ];
    const band = (muster, y) => {
      for (let i = 0; i < n; i++) {
        const x = x0 + i * schritt;
        if (muster[i]) { ctx.fillStyle = F.tinte; ctx.fillRect(x, y, bb, hB); }
        else { ctx.strokeStyle = F.rand2; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, bb - 1, hB - 1); }
      }
    };
    for (let kk = 0; kk < 3; kk++) {
      const P = paare[kk];
      if (t < P.von) break;
      const tp = clamp((t - P.von) / (P.bis - P.von), 0, 1);
      const yA = y0 + kk * paarH, yB = yA + hB + 26;
      text(T("Lauf A", "run A"), x0, yA - 5, mono(10), F.matt);
      text(T("Lauf B", "run B"), x0, yB - 5, mono(10), F.matt);
      if (P.fehlt) {
        const a = stueck(tp, 0, 0.4);
        ctx.save();
        ctx.globalAlpha *= a;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = F.rand2;
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.5, yA + 0.5, breite - 1, hB - 1);
        ctx.restore();
        ctx.globalAlpha *= a;
        text(T("Vergleichsdatei fehlt", "comparison file missing"), x0 + breite / 2, yA + hB / 2, mono(10), F.matt, "center", "middle");
        ctx.globalAlpha /= a;
      } else {
        band(musterA, yA);
      }
      band(P.b, yB);
      if (!P.fehlt) {
        // bis hierhin verglichen: waehrend des Aufbaus mit dem Scrollen, danach
        // laeuft der Vergleich an der Uhr immer wieder von vorn
        const bis = t >= 1 ? Math.floor(((zeit * 0.22 + kk * 0.5) % 1) * (n + 6)) : Math.floor(tp * n);
        for (let i = 0; i < Math.min(bis, n); i++) {
          const gleich = musterA[i] === P.b[i];
          const x = x0 + i * schritt + bb / 2;
          ctx.strokeStyle = kk === 0 ? F.gruen : gleich ? F.rand2 : F.gruen;
          ctx.lineWidth = kk === 1 && gleich ? 1 : 2;
          ctx.beginPath();
          ctx.moveTo(x, yA + hB + 5);
          ctx.lineTo(x, yB - 5);
          ctx.stroke();
        }
        if (bis < n) {
          const x = x0 + bis * schritt + bb / 2;
          ctx.strokeStyle = F.tinte;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, yA - 3); ctx.lineTo(x, yB + hB + 3); ctx.stroke();
        }
      }
      const yU = yB + hB + 20;
      text(P.urteil, x0, yU, mono(11), F.matt);
      const fertig = P.fehlt ? stueck(tp, 0.5, 0.8) : stueck(tp, 0.96, 1);
      if (fertig > 0) {
        ctx.font = mono(11);
        const m = ctx.measureText(P.urteil).width;
        if (P.fehlt) kreuz(x0 + m + 18, yU - 4, 13, F.rot, fertig); else haken(x0 + m + 18, yU - 4, 13, F.gruen, fertig);
      }
    }
  }

  // 03 Suche gegen den Zufall: drei Reihen; die ersten beiden laufen weiter, das
  // rollende Fenster rollt, das Gefundene blinkt
  function s3(t, zeit, A) {
    const klein = k.klein;
    const abst = 14;
    const hK = (A.h - 2 * abst) / 3;
    const x0 = A.x, b = A.b;
    const grenze = 0.62, rand = 0.54;
    const lauf = zeit * 7;   // so laufen die Reihen (Werte je Sekunde)
    const y1 = A.y;
    linieRund(REIHE, lauf, 160, x0, y1, b, hK, stueck(t, 0, 0.22), F.tinte, 1.6);
    const aGrenze = stueck(t, 0.2, 0.3);
    if (aGrenze > 0) {
      ctx.globalAlpha *= aGrenze;
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0 + b * grenze, y1); ctx.lineTo(x0 + b * grenze, y1 + hK); ctx.stroke();
      text(T("Suche", "search"), x0 + b * grenze - 8, y1 + 12, mono(12), F.matt, "right");
      text(T("Bestätigung", "confirmation"), x0 + b * grenze + 8, y1 + 12, mono(12), F.matt, "left");
      ctx.globalAlpha /= aGrenze;
    }
    const aRand = stueck(t, 0.3, 0.4);
    if (aRand > 0) {
      ctx.save();
      ctx.globalAlpha *= aRand * 0.9;
      ctx.beginPath(); ctx.rect(x0 + b * rand, y1, b * (grenze - rand), hK); ctx.clip();
      ctx.strokeStyle = F.rand2; ctx.lineWidth = 1;
      for (let s = -hK; s < b * (grenze - rand) + hK; s += 7) {
        ctx.beginPath(); ctx.moveTo(x0 + b * rand + s, y1); ctx.lineTo(x0 + b * rand + s + hK, y1 + hK); ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha *= aRand;
      text(T("Randzone fällt heraus", "edge zone dropped"), x0 + b * rand - 8, y1 + hK - 6, mono(11), F.matt, "right");
      ctx.globalAlpha /= aRand;
    }
    // das rollende Fenster: rollt an der Uhr hin und her, solange das Bild steht
    const aFenster = stueck(t, 0.4, 0.46);
    if (aFenster > 0) {
      const fb = b * 0.18;
      const fx = x0 + dreieck(zeit * 0.06) * (b * rand - fb);
      ctx.globalAlpha *= aFenster;
      ctx.fillStyle = F.tinte;
      ctx.globalAlpha *= 0.08;
      ctx.fillRect(fx, y1, fb, hK);
      ctx.globalAlpha /= 0.08;
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 1;
      ctx.strokeRect(fx + 0.5, y1 + 0.5, fb - 1, hK - 1);
      if (!klein) text(T("rollendes Fenster: die Auswahl muss an jeder Zeitgrenze erneut halten", "rolling window: the selection has to hold again at every time boundary"), x0, y1 - 8, mono(11), F.matt);
      ctx.globalAlpha /= aFenster;
    }
    const y2 = y1 + hK + abst;
    const a2 = stueck(t, 0.5, 0.56);
    if (a2 > 0) {
      ctx.globalAlpha *= a2;
      linieRund(REIHE_ZERSTOERT, lauf, 160, x0, y2, b, hK, stueck(t, 0.5, 0.72), F.matt, 1.2);
      text(klein ? T("Reihe ohne Zusammenhang: Treffer auf Rauschen", "no link left: hits on noise")
        : T("dieselbe Suche über eine Reihe ohne Zusammenhang: zählt, wie oft sie auf Rauschen anspringt", "the same search over a series with no link left: counts how often it fires on noise"), x0, y2 + hK - 6, mono(11), F.matt);
      ctx.globalAlpha /= a2;
    }
    const y3 = y2 + hK + abst;
    const a3 = stueck(t, 0.72, 0.78);
    if (a3 > 0) {
      ctx.globalAlpha *= a3;
      linie(REIHE_EFFEKT, x0, y3, b, hK, stueck(t, 0.72, 0.92), F.tinte, 1.4);
      const satz = klein ? T("eingebauter Effekt: wird er gefunden?", "effect built in: is it found?")
        : T("und über eine mit eingebautem Effekt: findet die Suche überhaupt etwas?", "and over one with an effect built in: does the search find anything at all?");
      text(satz, x0, y3 + hK - 6, mono(11), F.matt);
      const f = stueck(t, 0.92, 1) * (t >= 1 ? 0.6 + 0.4 * Math.sin(zeit * 3) : 1);
      if (f > 0) { ctx.font = mono(11); haken(x0 + ctx.measureText(satz).width + 18, y3 + hK - 10, 13, F.gruen, f); }
      ctx.globalAlpha /= a3;
    }
  }

  // 04 Schattenbetrieb: Signale durch die Sperren, immer weiter
  const SIGNALE = [-1, 0, -1, 1, -1, -1, 2, -1, 0, -1, 1, -1, -1, 2, -1, 0];   // -1 = kommt durch, sonst die Sperre
  const SIGNAL_PERIODE = 11, SIGNAL_DAUER = 2.2;
  function s4(t, zeit, A) {
    const klein = k.klein;
    const xChart = A.x, bChart = A.b * (klein ? 0.26 : 0.3);
    const xS = [0.46, 0.6, 0.74].map((f) => A.x + A.b * f);
    const xE = A.x + A.b * 0.92;
    const yM = A.y + A.h * 0.5;
    const hC = Math.min(A.h * 0.5, 180);
    ctx.save();
    ctx.beginPath(); ctx.rect(xChart, yM - hC / 2, bChart, hC); ctx.clip();
    linieRund(REIHE, zeit * 9, 70, xChart, yM - hC / 2, bChart, hC, 1, F.tinte, 1.4);
    ctx.restore();
    text(T("Markt, live", "market, live"), xChart, yM - hC / 2 - 10, mono(12), F.matt);
    if (!klein) text(T("Kandidat: ohne Geld", "candidate: no money"), xChart + bChart, yM - hC / 2 - 10, mono(12), F.matt, "right");
    const aS = stueck(t, 0.08, 0.25);
    const namen = [T("Regimefilter", "regime filter"), T("Wiederholungs-Stop", "repetition stop"), T("eine Position", "one position")];
    ctx.globalAlpha *= aS;
    for (let g = 0; g < 3; g++) {
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xS[g], yM - hC / 2); ctx.lineTo(xS[g], yM - 9);
      ctx.moveTo(xS[g], yM + 9); ctx.lineTo(xS[g], yM + hC / 2);
      ctx.stroke();
      if (!klein || g !== 1) text(namen[g], xS[g], yM + hC / 2 + 18, mono(11), F.matt, "center");
    }
    if (klein) text(namen[1], xS[1], yM + hC / 2 + 32, mono(11), F.matt, "center");
    ctx.strokeStyle = F.rand2; ctx.lineWidth = 1;
    ctx.strokeRect(xE - 12 + 0.5, yM - hC / 2 + 0.5, 24, hC);
    text(T("Evidenz", "evidence"), xE, yM - hC / 2 - 10, mono(12), F.matt, "center");
    ctx.globalAlpha /= aS;
    if (t > 0.25) {
      const xStart = xChart + bChart;
      const runde = Math.floor(zeit / SIGNAL_PERIODE), tz = zeit - runde * SIGNAL_PERIODE;
      const jeRunde = SIGNALE.filter((s) => s < 0).length;
      let durch = 0;
      for (let i = 0; i < SIGNALE.length; i++) {
        const geburt = 0.3 + i * 0.55;
        if (tz < geburt) continue;
        const alter = (tz - geburt) / SIGNAL_DAUER;
        const ziel = SIGNALE[i];
        const xVoll = xStart + alter * (xE - xStart);
        const halt = ziel >= 0 ? xS[ziel] : xE;
        const x = Math.min(xVoll, halt);
        const y = yM + Math.sin(i * 1.7) * 4;
        if (x >= halt - 0.5) {
          if (ziel >= 0) {
            const seit = (xVoll - halt) / (xE - xStart);
            const a = 1 - stueck(seit, 0, 0.12);
            if (a > 0) { ctx.globalAlpha *= a; kreuz(halt, y, 12, F.rot, 1); ctx.globalAlpha /= a; }
          } else {
            durch++;
          }
        } else {
          ctx.fillStyle = F.tinte;
          ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
        }
      }
      const platz = Math.floor((hC - 10) / 9);
      const gesamt = Math.min(platz, runde * jeRunde + durch);
      for (let j = 0; j < gesamt; j++) {
        ctx.fillStyle = F.tinte;
        ctx.fillRect(xE - 7, yM + hC / 2 - 8 - j * 9, 14, 5);
      }
    }
    const aF = stueck(t, 0.5, 0.7);
    ctx.globalAlpha *= aF;
    text(T("0 € im Spiel · dieselben Sperren wie mit Geld", "0 € at stake · the same locks as with money"), A.x, A.y + A.h - 4, mono(11), F.matt);
    ctx.globalAlpha /= aF;
  }

  // 05 Ueberwachter Dauerbetrieb: das Lebenszeichen laeuft wie auf einem Monitor;
  // in jeder Runde steht der Prozess einmal, der Waechter beendet, der naechste
  // Durchgang startet neu
  function s5(t, zeit, A) {
    const klein = k.klein;
    const x0 = A.x, b = A.b;
    const yM = A.y + A.h * 0.5;
    const amp = Math.min(44, A.h * 0.2);
    const P = Math.max(560, b * 0.9);
    const standVon = P * 0.5, standBis = P * 0.74;
    const takt = 28;
    const schub = zeit * 36;
    const sichtbar = x0 + b * clamp(t / 0.6, 0, 1);
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
    ctx.beginPath();
    for (let x = x0; x <= sichtbar; x += 2) {
      const s = (((x - x0 + schub) % P) + P) % P;
      const steht = s >= standVon && s < standBis;
      const y = steht ? yM : yM + puls((s % takt) / takt) * amp;
      if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const kk = Math.floor((schub + standVon) / P);
    for (let r = kk - 1; r <= kk + 1; r++) {
      const xs = x0 + r * P + standVon - schub, xe = xs + (standBis - standVon);
      if (xe < x0 || xs > sichtbar) continue;
      const links = Math.max(xs, x0), rechts = Math.min(xe, sichtbar);
      if (xs >= x0 && xs <= sichtbar) text(T("Prozess läuft, Arbeit steht", "process runs, work stalls"), xs + 6, yM - amp - 10, mono(11), F.rot);
      if (rechts - links > 60) {
        ctx.strokeStyle = F.rot; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(links, yM + amp * 0.7); ctx.lineTo(rechts - 8, yM + amp * 0.7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(links, yM + amp * 0.5); ctx.lineTo(links, yM + amp * 0.9); ctx.moveTo(rechts - 8, yM + amp * 0.5); ctx.lineTo(rechts - 8, yM + amp * 0.9); ctx.stroke();
        text(T("Wächter: beendet", "watchdog: ended"), links, yM + amp + 16, mono(11), F.rot);
      }
      if (xe >= x0 && xe <= sichtbar) {
        if (klein) text(T("nächster Durchgang: neu", "next pass: restarted"), Math.min(xe + 4, x0 + b - 150), yM + amp + 32, mono(11), F.gruen);
        else text(T("nächster Durchgang: neu, nie zwei zugleich", "next pass: restarted, never two at once"), Math.min(xe + 4, x0 + b - 290), yM - amp - 10, mono(11), F.gruen);
      }
    }
    const chip = klein ? T("Liste: läuft", "list: running") : T("in der Prozessliste: läuft", "in the process list: running");
    ctx.font = mono(12);
    const cb = ctx.measureText(chip).width + 22;
    const cx = x0 + b - cb, cy = A.y + 4;
    ctx.strokeStyle = F.gruen; ctx.lineWidth = 1;
    ctx.strokeRect(cx + 0.5, cy + 0.5, cb - 1, 24);
    text(chip, cx + 11, cy + 16, mono(12), F.gruen);
    const schlaege = Math.floor(schub / takt) - Math.floor(schub / P) * Math.floor((standBis - standVon) / takt);
    text((klein ? T("Lebenszeichen ", "sign of life ") : T("Lebenszeichen: Uhrzeit + Zähler ", "sign of life: wall time + counter ")) + String(Math.max(0, schlaege) % 10000).padStart(4, "0"), x0, A.y + 20, mono(12), F.matt);
  }

  // 06 Belastungsproben: sechs Ausfaelle; danach trifft es sie reihum wieder
  const PROBEN = [
    [T("Abriss mitten in der Order", "connection lost mid-order"), T("kein Trade gebucht, der Platz bleibt gesperrt", "no trade booked, the slot stays taken")],
    [T("Neustart mitten am Tag", "restart in mid-session"), T("Kontostand und Tagesverlust überleben", "balance and daily loss survive")],
    [T("zwei Schreiber auf einer Datei", "two writers, one file"), T("kein Eintrag verloren, die Prüfkette heil", "no entry lost, the checksum chain intact")],
    [T("halbe letzte Zeile", "half a final line"), T("weiterschreiben geht, der Rest bleibt Beleg", "writing continues, the rest stays as evidence")],
    [T("Prozess läuft, Arbeit steht", "process runs, work stalls"), T("erst beenden, dann neu starten", "end it first, restart it on the next pass")],
    [T("Wechsel Übung/Ernst bei unklarem Bestand", "mode switch with positions unclear"), T("der Wechsel wird blockiert", "the switch is blocked")],
  ];
  function glyph(art, x, y, gr, farbe) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = farbe; ctx.fillStyle = farbe; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    const r = gr / 2;
    ctx.beginPath();
    if (art === 0) {
      ctx.moveTo(-r, 0); ctx.lineTo(-r * 0.25, 0); ctx.moveTo(r * 0.25, 0); ctx.lineTo(r, 0);
      ctx.moveTo(-r * 0.25, -r * 0.35); ctx.lineTo(-r * 0.25, r * 0.35); ctx.moveTo(r * 0.25, -r * 0.35); ctx.lineTo(r * 0.25, r * 0.35);
    } else if (art === 1) {
      ctx.arc(0, 0, r * 0.8, -Math.PI * 0.3, Math.PI * 1.3); ctx.moveTo(0, -r); ctx.lineTo(0, -r * 0.2);
    } else if (art === 2) {
      ctx.rect(-r * 0.3, -r * 0.8, r * 1.1, r * 1.6);
      ctx.moveTo(-r, -r * 0.4); ctx.lineTo(-r * 0.35, -r * 0.4); ctx.moveTo(-r, r * 0.4); ctx.lineTo(-r * 0.35, r * 0.4);
    } else if (art === 3) {
      ctx.moveTo(-r, -r * 0.5); ctx.lineTo(r, -r * 0.5); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(-r, r * 0.5); ctx.lineTo(0, r * 0.5);
    } else if (art === 4) {
      ctx.moveTo(-r, 0); ctx.lineTo(-r * 0.5, 0); ctx.lineTo(-r * 0.3, -r * 0.7); ctx.lineTo(-r * 0.1, 0); ctx.lineTo(r, 0);
    } else {
      ctx.rect(-r, -r * 0.35, 2 * r, r * 0.7);
      ctx.moveTo(-r * 0.3, -r * 0.35); ctx.lineTo(-r * 0.3, r * 0.35);
    }
    ctx.stroke();
    if (art === 5) { ctx.font = mono(Math.round(gr * 0.5), 700); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", r * 0.35, 1); }
    ctx.restore();
  }
  function s6(t, zeit, A) {
    const klein = k.klein;
    const n = PROBEN.length;
    const zeile = Math.min(44, (A.h - 10) / n);
    const y0 = A.y + (A.h - zeile * n) / 2;
    const xG = A.x + 22, xN = A.x + 56;
    const xE = klein ? xN : A.x + Math.min(A.b * 0.5, 420);
    const wieder = t >= 1 ? Math.floor(zeit * 1.1) % n : -1;
    for (let i = 0; i < n; i++) {
      const an = (i / n) * 0.84;
      const a = stueck(t, an, an + 0.06);
      if (a <= 0) continue;
      const y = y0 + i * zeile + zeile / 2;
      ctx.globalAlpha *= a;
      let dx = (1 - a) * -30;
      let farbe = F.tinte;
      if (i === wieder) { const ph = (zeit * 1.1) % 1; dx += Math.sin(ph * Math.PI * 6) * 2 * (1 - ph); farbe = ph < 0.5 ? F.rot : F.tinte; }
      glyph(i, xG + dx, y, 22, farbe);
      text(PROBEN[i][0], xN, y + (klein ? -3 : 4), mono(klein ? 11 : 12), F.tinte);
      const e = stueck(t, an + 0.05, an + 0.11);
      if (e > 0) {
        ctx.globalAlpha *= e;
        const erw = (klein ? "" : T("erwartet: ", "expected: ")) + PROBEN[i][1];
        text(erw, xE, y + (klein ? 12 : 4), mono(11), F.matt);
        ctx.font = mono(11);
        haken(xE + ctx.measureText(erw).width + 16, y + (klein ? 8 : 0), 12, F.gruen, 1);
        ctx.globalAlpha /= e;
      }
      ctx.globalAlpha /= a;
    }
  }

  // 07 Grenze: die fuenf Stufen als Zeichen, darunter der Strich, der vor dem Broker endet
  function s7(t, zeit, A) {
    stufenReihe(A, t, zeit, 1, true);
    const a = stueck(t, 0.5, 0.7);
    if (a > 0) {
      ctx.globalAlpha *= a;
      const yS = A.y + A.h * 0.8;
      const bis = A.x + A.b * 0.72;
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(A.x, yS); ctx.lineTo(bis, yS); ctx.stroke();
      const blink = 0.55 + 0.45 * Math.sin(zeit * 2.5);
      ctx.globalAlpha *= blink;
      ctx.beginPath(); ctx.moveTo(bis, yS - 10); ctx.lineTo(bis, yS + 10); ctx.stroke();
      ctx.globalAlpha /= blink;
      text(T("bis hierher geprüft", "tested up to here"), A.x, yS - 10, mono(11), F.matt);
      text(T("echter Broker: noch keiner", "real broker: none yet"), bis + 10, yS + 4, mono(11), F.matt);
      ctx.globalAlpha /= a;
    }
  }

  return { laengen: [2.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5], zeichner: [s0, s1, s2, s3, s4, s5, s6, s7] };
};
