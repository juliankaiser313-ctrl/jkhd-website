// ---------- Startseite: Flug durch die Milchstrasse bis in einen Computer ----------
// Julian, 10.10.2026 (nach dem Chart, das ihm nicht gefiel): "Wenn man runterscrollt,
// soll es erst mal schwarz sein, und dann beim Scrollen soll eine fast schon
// universumartige Umgebung erscheinen, wo Mathematik usw. alles wie in einem Netz
// zusammenfliesst, und die Kamera soll dem Netz immer weiter folgen. Irgendwann
// kommt es am Ziel an, und dort erscheint das Logo mit dem Spruch."
// Am selben Abend das Ende neu: "nicht direkt das Logo, sondern die Erde, und die
// zoomt immer naeher rein bis in einen Computer, dort sieht man, wie Stroeme in den
// Bot fliessen, und am Ende auf dem Bildschirm das Logo". Und dann die dritte
// Fassung: "die Erde echt machen, das Universum echter, echte Planeten im
// Hintergrund, oben nicht so lange schwarz, der Uebergang auf den PC schoener. Es
// soll so aussehen, als kaeme die Kamera in die Milchstrasse, dort schweben die
// Formeln, dann rasen die mit der Kamera im Universum rum Richtung Erde, dann bis
// in den PC."
//
// Umsetzung ohne Bibliothek: eine Zeichenflaeche (canvas 2D) mit eigener
// Perspektiv-Projektion; die Erde zeichnet ein kleines WebGL-Programm (eine Kugel je
// Bildpunkt, mit Tag- und Nachtseite, Wolken, Atmosphaere und Glanz auf dem Meer)
// aus NASA-Aufnahmen in assets/erde/ -- gemeinfrei, liegen bei uns, kein fremder
// Server. Ohne WebGL steht an ihrer Stelle eine Erde aus Punkten (Landumrisse von
// Hand nachgezeichnet, weiter unten). Der Scrollfortschritt p durch den Abschnitt
// #universum (die Buehne bleibt dabei stehen, sticky) treibt alles:
//   0,00-0,10  die Milchstrasse liegt voraus und waechst, Sterne ringsum
//   0,10-0,17  hinein: das Band, Nebel und Staub fuellen das Bild
//   0,10-0,42  im Netz der Formeln (Knoten, Kanten, Lichtimpulse, Drahtmodelle)
//   0,35-0,53  Rasen: die Formeln fliegen mit, Planeten ziehen vorbei, die Erde
//              waechst voraus
//   0,49-0,58  Ankunft: Lichtstroeme und Formeln fliessen in die Erde
//   0,58-0,66  die Erde dreht sich nach Europa
//   0,64-0,86  Zoom: Europa, Abend, Nachtlichter am Oberrhein, ein Licht wird zum
//              Bildschirm, der Computer waechst daraus
//   0,86-0,90  Stroeme fliessen ueber die Leitungen in den Chip (den Bot)
//   0,89-0,94  aus dem Chip wird das Zeichen
//   0,94-0,98  Wortmarke, "Quant Systems" und Spruch auf dem Bildschirm
//   0,98-1,00  das Schlussbild steht
// Alles ausser den Erdbildern wird hier erzeugt (feste Saat, jedes Mal gleich);
// nichts wird gespeichert. Bei "reduzierter Bewegung" steht das Schlussbild still
// da (der Computer mit dem Zeichen), ohne Scrollweg und ohne Bilder; ohne
// JavaScript zeigt der Abschnitt das Zeichen auf Schwarz.
(function () {
  const abschnitt = document.getElementById("universum");
  if (!abschnitt) return;
  const buehne = abschnitt.querySelector(".universum-buehne");
  const leinwand = abschnitt.querySelector(".universum-leinwand");
  const ctx = leinwand.getContext("2d");
  if (!ctx) return;
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Wo die Erdbilder liegen: neben js/, auch von en/ aus gesehen
  const BILDER = (() => {
    try { return new URL("../assets/erde/", document.currentScript.src).href; } catch (e) { return "assets/erde/"; }
  })();

  // ---- Hilfen ----
  function zufall(saat) {
    let a = saat >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const glatt = (t) => t * t * (3 - 2 * t);
  const stueck = (p, von, bis) => glatt(clamp((p - von) / (bis - von), 0, 1));
  const misch = (a, b, t) => a + (b - a) * t;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const kreuz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  // ---- Die Bahn: Catmull-Rom durch Stuetzpunkte, die Kamera fliegt nach -z ----
  const LAENGE = 8400;
  const STUECKE = 14;
  const STUETZEN = [];
  for (let i = 0; i <= STUECKE; i++) {
    const z = 300 - i * (LAENGE / STUECKE);
    const ruhe = i >= STUECKE - 1 ? 0 : 1;   // zum Ziel hin gerade
    STUETZEN.push([Math.sin(i * 0.9) * 360 * ruhe, Math.sin(i * 0.7 + 1.2) * 210 * ruhe, z]);
  }
  function bahn(u) {
    const n = STUETZEN.length - 1;
    const f = clamp(u, 0, 1) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const t = f - i;
    const p0 = STUETZEN[Math.max(0, i - 1)], p1 = STUETZEN[i], p2 = STUETZEN[i + 1], p3 = STUETZEN[Math.min(n, i + 2)];
    const t2 = t * t, t3 = t2 * t;
    const r = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      r[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
    }
    return r;
  }
  function rahmen(u) {
    const vorn = norm(sub(bahn(Math.min(1, u + 0.004)), bahn(Math.max(0, u - 0.004))));
    const rechts = norm(kreuz(vorn, [0, 1, 0]));
    const oben = kreuz(rechts, vorn);
    return { vorn, rechts, oben };
  }
  const ZIEL_U = 1;          // dort steht die Erde
  const KAMERA_ENDE = 0.955; // so weit fliegt die Kamera

  // Die Fahrt: Ort u auf der Bahn ueber dem Fortschritt q im Flug. Stueckweise kubisch
  // (Hermite) durch [q, u, Steigung]: langsam im Netz, dann das Rasen, am Ende sanft
  // bremsen. Die Steigungen liegen in der Schranke von Fritsch und Carlson, die Kurve
  // geht also nie rueckwaerts.
  const FAHRT = [[0, 0, 0.12], [0.6, 0.36, 0.5], [0.92, 0.92, 1.0], [1, KAMERA_ENDE, 0]];
  function fahrt(q) {
    q = clamp(q, 0, 1);
    let i = 0;
    while (i < FAHRT.length - 2 && q > FAHRT[i + 1][0]) i++;
    const a = FAHRT[i], b = FAHRT[i + 1];
    const h = b[0] - a[0], t = (q - a[0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * h * a[2] + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * h * b[2];
  }

  // ---- Zeitplan (Anteile am Scrollweg) ----
  const FLUG = 0.58;                     // so viel gehoert dem Flug
  const ZOOM_VON = 0.64, ZOOM_BIS = 0.86; // der Zoom von der Erde bis zum Computer ...
  const ZOOM_ENDE = 8;                   // ... ueber so viele e-fache Vergroesserungen
  const ERDE_R = 110;                    // Radius der Erde in Einheiten der Bahn
  // Ziel des Zooms: Schliengen (Sitz laut Impressum); es steht nirgends angeschrieben
  const ZIEL_LAENGE = 7.6, ZIEL_BREITE = 47.76;
  const GRAD = Math.PI / 180;
  const SONNE_WELT = norm([-0.5, 0.3, 0.8]);   // Licht von links oben, hinter der Kamera
  // Ausschnitte der NASA-Bilder: Laenge, Breite der linken unteren Ecke, Spannen (Grad)
  const EUROPA = [-14, 34, 50, 30], ZIEL_BOX = [4, 45, 7, 5.5];
  // Der Computer in Einheiten der Schirmbreite, Ursprung in der Mitte des Schirms
  const SCHIRM_H = 0.3125;                        // halbe Hoehe des Schirms (16:10)
  const RAND = 0.022, KINN = 0.045, HALS = 0.15, FUSS = 0.02;
  const MONITOR_HOEHE = RAND + 2 * SCHIRM_H + KINN + HALS + FUSS;
  const CHIP_Y = -0.085, CHIP = 0.075;            // Mitte und halbe Kante des Chips (Bot)
  const LOGO = 0.2;                               // Kantenlaenge des Zeichens auf dem Schirm

  // Landflaechen grob von Hand nachgezeichnet (Laenge, Breite in Grad, je Umriss eine
  // flache Liste) -- keine fremden Kartendaten. Fuer Punkte im Abstand von einem halben
  // Grad reicht das; Laengen ueber 180 laufen ueber die Datumsgrenze weiter.
  const LAND = [
    // Nordamerika
    [-166,68.8, -163,66, -165,64.5, -161,64, -165,61, -162,58.5, -157,57, -152,59, -150,61, -145,60, -140,59.8, -136,58.5, -133,56, -130,54.5, -128,51, -124,48.5, -124,46, -124,42, -122.5,37.5, -118,34, -117,32.5, -116,30, -114,27.5, -112,25, -110,23, -111.5,26, -113,29, -114.5,31.5, -112,29, -109.5,25.5, -105.5,21, -105,19.5, -101,17.5, -96,15.7, -92,14.5, -87.5,13, -85.5,11, -84,9, -80,7.3, -77.5,8.5, -79.5,9.5, -83.5,11, -83.5,15, -88,15.8, -88,18.5, -87,21.5, -90.5,21, -91,19, -94.5,18.2, -97.3,21, -97.5,25.8, -97,28, -94,29.7, -90,29.2, -89,30.3, -85,29.7, -82.7,28, -81.8,26, -80.4,25.2, -80.1,27, -81.2,30, -81,32, -77.9,34, -75.6,35.5, -76,37, -74,40.5, -70,41.5, -70.6,43, -67,44.8, -66,44, -63.5,44.5, -60,46, -64,47, -65,49, -67,49.3, -60,50.2, -56,51.5, -57,53.5, -60,55.5, -62,57.5, -64.5,60.3, -69,58.8, -72,61, -78,62.3, -77.5,60, -76.5,56, -79,54.5, -79.5,51.5, -82,52.9, -85,55.2, -88.5,56.8, -92.5,57, -94.5,59, -94.5,61, -93,63, -88,64.2, -86,66.3, -82,66.8, -82,68.5, -85,69.8, -89,68.5, -94,68.6, -96,68.5, -101,67.8, -108,68.2, -115,68.4, -121,69.6, -128,70, -133,69.5, -141,69.7, -148,70.3, -156.7,71.3, -161,70.3],
    // Groenland
    [-73,78, -66,80.8, -56,82.2, -40,83.4, -25,83, -18,81.5, -12,81.6, -19,79, -19,76, -21,72.5, -22,70.2, -26,68.3, -32,68, -38,65.6, -41,63, -43,60, -45.5,60.3, -48.5,61.5, -51,64, -53.5,67.2, -54,70.5, -55,72.5, -58,75.5, -62,76.2, -68,76.8],
    // Kanadische Inseln
    [-65,62.5, -68,62.2, -73,64.5, -77.5,65.4, -74,68, -78.5,70, -85,70.5, -89,71.8, -80,73.7, -73,72.3, -68,70.5, -63,67.5, -62,66.5],
    [-90,76.5, -80,76, -78,78, -70,80, -62,82.2, -75,83, -90,81.5, -95,79],
    [-125,71.5, -120,69.5, -110,68.5, -101,69.5, -100,72.5, -108,74.5, -117,75.5, -124,74.5],
    // Karibik, Neufundland
    [-85,21.8, -82,23.2, -77,22.5, -74.2,20.2, -77.5,19.8, -81,21.6],
    [-74.4,19.8, -72.8,19.9, -69.8,19.6, -68.4,18.6, -71,17.6, -74.4,18.3],
    [-59.3,47.6, -55.5,46.8, -52.7,47.5, -53.5,49.5, -55.8,51.6, -57.3,50.6],
    // Suedamerika
    [-77.3,8.5, -75.5,10.5, -72,12, -71.5,10.5, -68,10.6, -64,10.6, -61,10.5, -60,8.5, -57,6, -53,5.5, -51,4, -50,1.8, -49.5,0, -47,-0.8, -44.5,-2.5, -40,-2.8, -37,-4.8, -35,-6, -35,-9, -37,-12, -39,-14, -39,-17.5, -40,-20.5, -41.5,-22.5, -44,-23, -47,-24.2, -48.5,-26, -48.6,-28.5, -51,-31, -53,-33.7, -55,-35, -57,-35.5, -57.5,-38, -62,-39, -62.5,-41, -65,-42, -63.8,-42.8, -65.5,-45, -67.5,-46.5, -66,-47.8, -68,-50, -69,-51.5, -68.5,-52.5, -70,-53.5, -72,-54, -74,-52.5, -75,-50, -74,-46, -73.5,-43, -74,-40, -73.3,-37, -71.7,-33, -71.4,-28, -70.5,-23, -70.2,-18.4, -71.5,-17, -76,-14, -77,-12, -79,-8, -81.2,-5.5, -80.3,-3.5, -80.9,-1, -80,1, -78.8,1.8, -77.5,4, -77.4,6.5],
    // Eurasien: von Gibraltar nach Norden, um Skandinavien, die Eismeerkueste entlang,
    // den Pazifik hinunter, um Indien und Arabien, zurueck ueber Schwarzes Meer und Mittelmeer
    [-5.6,36, -6.5,36.8, -7.4,37.2, -8.9,37, -8.8,38.7, -9.5,38.8, -8.8,41, -8.8,42.2, -9.3,43, -8,43.7, -5.5,43.5, -3.8,43.4, -1.8,43.4, -1.4,44.5, -1.2,46, -2.2,47.1, -4.4,47.8, -4.7,48.5, -3,48.8, -1.6,48.7, -1.9,49.7, -1.2,49.3, 0.2,49.5, 1.6,50.2, 1.6,50.9, 3,51.3, 4.2,52, 4.7,52.9, 5.6,53.4, 7,53.6, 8.5,53.6, 8.8,54.1, 8.6,55.4, 8.1,56.6, 9.9,57.6, 10.6,57.7, 10.3,56.3, 10.2,55, 10.9,54.4, 11,54, 12.5,54.4, 14,54, 16.5,54.5, 18.5,54.8, 19.8,54.4, 21.2,55.2, 21,56.8, 22,57.6, 23.5,57, 24.3,57.8, 23.5,58.9, 26,59.6, 28,59.5, 30,60, 28,60.5, 25,60.2, 22.9,59.9, 21.5,60.7, 21.5,62, 21.3,63.3, 22.4,64, 24.6,64.9, 25.4,65.5, 24.2,65.8, 22.2,65.8, 21.2,64.8, 19.9,63.6, 18.2,62.7, 17.3,61.3, 17.2,60.4, 18.8,60, 18.2,59.3, 16.8,58.4, 16.6,57, 15.9,56.1, 14.3,55.5, 12.9,55.4, 12.6,56.2, 11.9,57.5, 11.3,58.9, 10.6,59.9, 10.3,59.1, 9.5,58.9, 8.2,58.1, 7,58, 5.6,58.6, 5.2,59.5, 5,61, 5,62, 6.5,62.6, 8,63.3, 9.8,64, 11.3,64.9, 12.2,65.8, 13.2,67.3, 14.4,68, 16,68.6, 17.5,69.6, 19.5,70.2, 22,70.3, 25,71, 26.5,70.9, 28.5,70.9, 30.5,70, 31.5,69.7, 33,69.3, 36,69, 40,67.6, 41,66.4, 38.5,66, 34.5,66.2, 34,65, 36,64.5, 37.5,64.2, 40.5,66.5, 44,66.2, 43.7,68.4, 46,68, 48.5,67.6, 53,68.3, 54.8,68.2, 58.5,68.9, 60.5,69.8, 64,69.3, 67,68.6, 68.5,68.2, 69,69.5, 67,70.8, 66.8,71.6, 69,73, 71.5,72.8, 72.8,72, 72,70.5, 73.5,68.5, 72.5,66.5, 74,67.5, 75,68.5, 77,68, 78.5,70.5, 80,72.5, 84,72.8, 87,74, 92,75.6, 98,76.2, 104,77.7, 108,76.8, 112,76, 113.5,73.5, 118,73.5, 124,73.8, 129,72.5, 129,71, 132,71.6, 137,71.5, 140,72.5, 146,72.3, 150,71.6, 155,71, 159,70.8, 160.5,69.6, 166,69.6, 170,70, 176,69.8, 180,69, 185,67.5, 190.2,66.1, 186,64.5, 182,65, 178.6,64.5, 177,62.5, 173,61, 170,60, 166,60, 163.5,59.9, 162,58, 163,56.2, 162,54.8, 160,53.5, 158.5,52, 156.7,51, 156,53, 155.5,56, 156.8,57.8, 158,58.2, 161,60.4, 160,61.4, 156,61.5, 154,59.2, 151,59.2, 148,59.3, 143,59.3, 140.5,58, 137,54.2, 140.5,53, 141.2,50, 140.5,48, 138,46, 135,43.5, 132,43.2, 130,42.3, 129.5,41, 128,39.8, 129.5,37, 129.3,35.2, 127.5,34.6, 126.3,34.5, 126.5,36.8, 126.2,37.7, 125,37.8, 124.8,39.6, 122,40, 121.5,40.8, 119,39.2, 117.8,38.6, 118.9,37.4, 121,37.7, 122.5,37, 120.5,36, 119.2,35, 120.8,32.5, 121.8,31.5, 121.5,30, 122,29, 120.5,27.2, 119.6,25.5, 118,24.5, 116.5,22.9, 114.2,22.3, 111,21.4, 110,20.5, 108.5,21.6, 106.7,20.3, 105.8,19, 106.6,17.5, 108.5,15.5, 109.3,13, 109,11.5, 107,10.4, 106,9, 104.8,8.6, 105,10, 104.5,10.5, 103,11, 102.5,12.2, 100.9,13.4, 100,12.5, 99.2,10.3, 100,8.5, 100.4,7, 101.5,6.6, 102.6,6, 103.4,4.5, 103.5,2.5, 104.2,1.4, 103.4,1.3, 101.3,2.8, 100.4,4.8, 100.3,6.5, 98.3,8, 98.4,9.5, 98.6,11.8, 98,14, 97.7,16.5, 95,15.8, 94.3,16.3, 94.6,18.5, 93,19.9, 92.3,20.8, 92,22.5, 91,22.5, 90,21.9, 89,21.8, 88,22, 86.9,21, 86.5,20.2, 85,19.3, 83.3,17.7, 82.2,16.7, 80.3,15.5, 80.1,13.5, 79.9,10.3, 79.3,10.3, 78.2,8.9, 77.5,8.1, 76.5,8.9, 75.8,11.3, 74.8,12.9, 74.1,14.9, 73.4,16.4, 72.8,19.1, 72.6,21.4, 70.5,20.9, 69,22.3, 70.2,22.8, 68.5,23.6, 67.4,24, 66.7,25.4, 64.5,25.2, 61.6,25.2, 58.5,25.6, 57.3,25.8, 56.4,27.1, 54.7,26.5, 52.5,27.6, 51.4,27.9, 50.2,29.9, 48.7,30.3, 48,30, 48,29.2, 48.8,28, 49.6,26.8, 50.2,26.2, 50.6,25, 51.6,25.9, 51.6,24.2, 53.5,24.1, 54.8,24.6, 56.1,25.9, 56.4,26.3, 56.4,24.8, 57.8,23.7, 59.8,22.4, 58.5,20.4, 57.7,19, 56.6,18.3, 55.3,17.6, 52.2,15.9, 49.5,14.6, 46,13.4, 43.5,12.7, 43,14.5, 42.7,16.5, 41.2,19, 39.1,21.7, 38.5,24, 37.5,25.3, 35.2,28, 34.6,28, 34.4,29.5, 33.7,27.8, 32.6,29.9, 32.3,31.2, 34.2,31.3, 35,33, 35.9,35, 36,36.7, 34.5,36.8, 32.5,36.1, 30.5,36.3, 29.2,36.7, 27.4,37, 26.8,38.3, 26.2,39.4, 26.4,40.1, 27.5,40.4, 29,41.1, 31,41.1, 33,41.9, 35,42, 36.8,41.3, 38.5,40.9, 40.5,41, 41.6,41.6, 41.5,42.6, 39.9,43.4, 38,44.4, 37,45.3, 36.4,45.4, 35,45, 33.5,44.5, 32.6,45.4, 33.6,46, 31.8,46.6, 30.7,46.5, 29.6,45.4, 28.7,44.4, 28.1,43.3, 27.9,42.2, 28.9,41.3, 26.6,40.6, 25,40.9, 23.8,40.7, 22.6,40.5, 22.7,39.5, 23.2,38.2, 24,37.7, 23,36.5, 22.4,36.4, 21.7,36.8, 21.1,37.9, 21.3,38.4, 20,39.7, 19.4,40.4, 19.4,41.8, 18.5,42.5, 17,43.2, 15.9,43.6, 15.2,44.3, 14.5,45.2, 13.6,45.6, 12.4,45.4, 12.2,44.6, 13.6,43.5, 14.8,42.1, 16.1,41.9, 17.5,40.9, 18.5,40.2, 18.3,39.8, 17,40.5, 16.6,39.6, 17.1,39, 16.5,38.4, 15.7,38, 15.9,39, 15.2,40.1, 14,40.8, 12.6,41.5, 11.1,42.4, 10.5,43, 10.2,43.9, 8.8,44.4, 7.7,43.8, 6.6,43.1, 4.6,43.4, 3.1,43.1, 3.2,41.9, 1,41, 0.2,40, -0.3,39.4, 0,38.8, -0.7,37.6, -2.1,36.7, -4.4,36.7],
    // Afrika
    [-5.9,35.8, -2,35.1, 1,36.5, 3,36.8, 6.5,37.1, 9.8,37.3, 11.1,37, 10.3,36, 11,35.2, 10.2,34.2, 11.2,33.2, 13,32.9, 15.3,32.2, 17.5,31, 19.9,30.9, 20.1,32.2, 22,32.9, 25,31.8, 27.5,31.3, 29.5,31, 31,31.6, 32.3,31.2, 32.6,29.9, 33.5,28, 33.8,27, 35.7,23.9, 37.2,21, 37.4,18.5, 38.6,17.9, 39.7,15.5, 41.2,14.3, 43.2,11.6, 44.5,10.4, 47.5,11.2, 51.2,11.8, 51.1,10.5, 50.5,9, 49,6, 47.8,4.4, 46,2.3, 43.5,-0.5, 42,-1, 40.5,-2.5, 39.3,-4.6, 38.8,-6.5, 39.4,-8, 39.8,-10, 40.5,-11, 40.6,-14.5, 39.5,-16.5, 37,-17.8, 35.5,-20, 35.5,-22, 35.5,-24, 32.9,-25.9, 32.8,-28.5, 31.3,-29.4, 30,-31, 28.2,-32.8, 26.5,-33.8, 24,-34.1, 22,-34.4, 20,-34.8, 18.4,-34.2, 18.2,-32.5, 17.3,-30, 15.7,-27, 14.5,-23, 12.5,-19, 11.8,-17, 12.3,-14, 13.6,-12, 13.2,-9, 12.2,-6, 11.8,-4, 9.6,-1, 9.3,1, 9.8,3.2, 8.5,4.5, 7,4.4, 6,4.3, 5,5.8, 4.4,6.4, 2.5,6.3, 1,6, -2,4.8, -4,5.2, -7.5,4.4, -9.5,5.4, -11.5,6.9, -13.2,8.5, -15,10.9, -16.7,12.4, -17.5,14.7, -16.4,16.5, -16.2,19, -17,21, -16,23.7, -14.5,26, -13.2,27.7, -11.5,28.2, -9.8,29.6, -9.6,31, -8.6,33.3, -6.8,34.1],
    [49.3,-12, 50.5,-15.5, 49.8,-17.5, 48.5,-20.5, 47.3,-24.8, 45.2,-25.5, 43.7,-23.5, 43.3,-21.5, 44.3,-20, 44,-17, 46.4,-15.8, 48,-13.5],
    // Australien, Ozeanien
    [113.5,-22, 114,-26, 115,-30, 115.5,-33.5, 117.5,-35, 120,-33.9, 123.5,-33.9, 126,-32.3, 129,-31.6, 131.5,-31.5, 134,-32.8, 135.6,-34.8, 137.5,-33, 138.3,-35.6, 140,-37.5, 143.5,-38.8, 146.3,-39, 148,-37.8, 150,-37.4, 150.8,-34.5, 152.5,-32, 153.6,-28.5, 153,-25.5, 150.8,-22.5, 148.8,-20.3, 146.3,-19, 145.4,-16, 145.3,-14.8, 143.6,-13.8, 142.5,-10.7, 141.6,-13, 141.5,-15.5, 140.7,-17.5, 139.3,-17.3, 137,-15.8, 135.5,-14.8, 136.7,-12.2, 135,-12, 132.6,-11.5, 131,-12.2, 129.6,-14.9, 128.1,-15, 126.5,-14, 125,-15, 123.6,-16.8, 122.2,-18, 120,-19.8, 117,-20.6, 114.6,-21.8],
    [144.6,-40.7, 148.3,-40.9, 148,-43.2, 146.8,-43.6, 145.2,-42.2],
    [172.7,-34.4, 174.6,-36.2, 175.9,-37.3, 178.5,-37.7, 177,-39.3, 176.2,-41.3, 174.8,-41.3, 175,-39.8, 173.8,-39.2, 174.5,-37.5],
    [172.8,-40.5, 174.3,-41.6, 173,-43.8, 171.2,-44.4, 170.5,-45.9, 169,-46.7, 166.5,-46, 166.8,-45, 168.5,-44, 170.6,-42.8, 172.1,-41],
    [131,-1, 134,-0.8, 135.5,-3.2, 138,-1.6, 141,-2.6, 145,-4.3, 147.8,-6.5, 147.5,-8, 150,-10.5, 148,-10.2, 146,-8, 144,-7.7, 142.6,-9.3, 141,-9.1, 139,-8.1, 138.2,-8.4, 137.6,-5.5, 135.5,-4.4, 133.5,-4, 132,-2.8],
    // Inseln Asiens
    [109,1.7, 109.6,2, 111,1.7, 113,3.2, 115.5,5.5, 117.2,7, 119.3,5.3, 118,4.5, 117.6,3, 118,1, 117,-1, 116.5,-3, 116,-4, 114.5,-3.6, 111.7,-3, 110.2,-2.9, 110,-1.6, 109,0],
    [95.3,5.6, 97.5,5.2, 100.3,2.6, 102,1.6, 104,0.4, 104.5,-1.5, 106,-3.2, 105.8,-5.8, 104.5,-5.9, 102.3,-4, 101,-2.5, 99.5,-0.5, 98.7,1.7, 97,3.5],
    [105.3,-6.8, 106.5,-6, 108.5,-6.5, 110.5,-6.8, 112.6,-6.9, 114.4,-7.7, 114.4,-8.6, 110.5,-8.2, 108,-7.8, 106.4,-7.4],
    [118.8,-3, 119.6,0, 120.5,1.2, 123,1, 125,1.5, 121.6,0.5, 121,-1, 122.5,-1, 122,-4.5, 120.5,-5.6, 119.4,-5.5],
    [120.6,18.5, 122.2,18.5, 122,16.5, 121.6,15.8, 122.6,14, 124,13, 121.8,13.8, 120.9,14, 120.6,15.5, 119.8,16.4],
    [122,7, 122.4,8, 123.8,8.6, 125.4,9.8, 126.5,8, 126.2,6.3, 125.4,5.8, 124,6.5],
    [130.9,34, 132.5,35.4, 135.2,35.7, 136.8,37.3, 138.5,37.6, 139.8,39, 140,40.6, 141.4,41.4, 142,39.5, 141,38, 140.8,36, 140,35.3, 138.8,34.6, 137,34.6, 135.5,33.5, 134,34.3, 132,33.9],
    [129.7,33.5, 131,33.9, 131.7,32, 130.6,31, 129.9,32.7],
    [140,41.5, 140.3,43.2, 141.6,45.4, 143.6,44.3, 145.5,43.3, 143.3,42, 141.2,42.4],
    [142,46, 143.4,46.6, 143.2,49.3, 144.3,49, 143,51.5, 143.2,53.3, 142.6,54.3, 141.7,53.3, 142.1,50, 141.8,48],
    [121,25.2, 122,25, 121.4,23, 120.8,22, 120.1,23],
    [108.7,19.2, 110.5,20.1, 111,19.6, 110,18.3, 108.7,18.5],
    [79.9,9.8, 81.3,8.6, 81.8,7, 80.6,5.9, 79.8,6.5],
    // Inseln Europas
    [-5.7,50.1, -4,50.4, -1.3,50.8, 1.4,51.2, 1.7,52.6, 0.2,53, -0.2,54.1, -1.3,54.9, -1.6,55.6, -2.5,56.4, -1.8,57.6, -3,57.7, -4,57.9, -3.1,58.6, -5,58.6, -5.8,57.5, -5.6,56.3, -5.1,55.5, -4.9,54.8, -3.4,54.9, -3,54.1, -3,53.4, -4.6,53.3, -4.1,52.3, -5.2,51.8, -3.4,51.4, -4.2,51.2],
    [-6,52, -6.2,53.3, -5.6,54.6, -6.2,55.2, -7.3,55.4, -8.5,54.8, -10,54.2, -9.8,53.5, -10.2,52.1, -9.5,51.6, -8.2,51.8, -6.5,52.2],
    [-22.5,64, -24,65.5, -22,66.4, -18,66.2, -15,66.4, -13.5,65.2, -15,64.3, -18,63.4, -21,63.8],
    [12.4,38, 15.6,38.3, 15.1,36.7, 12.5,37.6],
    [8.2,41, 9.7,41, 9.6,39.1, 8.4,39],
    [9.4,43, 9.5,42, 9.2,41.4, 8.6,41.9, 8.6,42.6],
    [23.5,35.5, 26.3,35.3, 24.5,34.9],
    [32.3,35, 34.6,35.6, 33.8,34.8],
    [11,55.9, 12.6,56, 12.4,55.2, 11.2,55.2],
    [11,78.7, 16,80, 22,80.4, 27,80.2, 22,78.3, 18,77, 13.5,77.5],
    [52,71.5, 55,73.2, 57,75.5, 62,76.7, 68.5,76.9, 66,75.5, 60,74, 57.5,72, 55.5,70.7],
  ];
  // Wasser mitten im Land
  const SEEN = [
    [49,46.5, 51,47, 53,46.8, 53.2,45.3, 51.3,44.5, 52.7,42.5, 54,40.9, 53.9,38, 53.9,37.3, 51.5,36.8, 49,37.6, 49.4,40.2, 48.5,41.8, 47.5,43, 47.5,44.6],
  ];
  function einheit(laenge, breite) {
    const cb = Math.cos(breite * GRAD);
    return [cb * Math.cos(laenge * GRAD), cb * Math.sin(laenge * GRAD), Math.sin(breite * GRAD)];
  }
  const ZIEL = einheit(ZIEL_LAENGE, ZIEL_BREITE);
  function imUmriss(u, x, y) {
    let drin = false;
    for (let i = 0, j = u.length - 2; i < u.length; j = i, i += 2) {
      const xi = u[i], yi = u[i + 1], xj = u[j], yj = u[j + 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
    }
    return drin;
  }
  // Umgebendes Rechteck je Umriss, damit nicht jeder Punkt gegen jede Kueste laeuft
  const LAND_RAHMEN = LAND.map((u) => {
    const r = [Infinity, -Infinity, Infinity, -Infinity];
    for (let i = 0; i < u.length; i += 2) {
      r[0] = Math.min(r[0], u[i]); r[1] = Math.max(r[1], u[i]);
      r[2] = Math.min(r[2], u[i + 1]); r[3] = Math.max(r[3], u[i + 1]);
    }
    return r;
  });
  function istLand(laenge, breite) {
    for (const s of SEEN) if (imUmriss(s, laenge, breite)) return false;
    for (let n = 0; n < LAND.length; n++) {
      const r = LAND_RAHMEN[n];
      if (breite < r[2] || breite > r[3]) continue;
      for (const l of [laenge, laenge + 360]) {
        if (l >= r[0] && l <= r[1] && imUmriss(LAND[n], l, breite)) return true;
      }
    }
    return false;
  }

  // ---- Inhalt des Netzes ----
  // Formeln als Text mit ^{...} (hoch) und _{...} (tief); Zeichen fuer die kleinen Knoten
  const FORMELN = [
    "e^{iπ} + 1 = 0", "E = mc^{2}", "∇ · E = ρ / ε_{0}", "iħ ∂ψ/∂t = Ĥψ",
    "∫ e^{−x^{2}} dx = √π", "ζ(s) = Σ n^{−s}", "P(A|B) = P(B|A) P(A) / P(B)",
    "dS_{t} = μS_{t} dt + σS_{t} dW_{t}", "σ^{2} = E[(X − μ)^{2}]", "R_{μν} − ½ R g_{μν} = 8πG T_{μν}",
    "∮ F · dr = ∬ (∇ × F) · dA", "f(x) = Σ a_{n} x^{n}", "a^{2} + b^{2} = c^{2}", "lim_{n→∞} (1 + 1/n)^{n} = e",
    "H = − Σ p_{i} log p_{i}", "∂u/∂t = α ∇^{2}u",
    "φ = (1 + √5) / 2", "Σ_{k=1}^{n} k = n(n + 1) / 2", "f̂(ξ) = ∫ f(x) e^{−2πixξ} dx",
    "∂L/∂q − d/dt ∂L/∂q̇ = 0", "f(x) = e^{−x^{2}/2} / √(2π)", "e^{x} = Σ x^{n} / n!",
    "∇ × B = μ_{0}J + μ_{0}ε_{0} ∂E/∂t", "∮ f(z) dz = 2πi Σ Res", "df = f′ dX + ½ f″ σ^{2} dt",
    "det(A − λI) = 0",
  ];
  const ZEICHEN = ["π", "Σ", "∫", "∂", "∞", "λ", "μ", "σ", "∇", "φ", "ε", "Δ", "θ", "Ω", "√", "≈", "∮", "ℏ"];
  // Sternfarben nach Temperatur: blau-weiss bis rot
  const STERN_FARBEN = ["185,200,255", "222,230,255", "255,255,255", "255,244,222", "255,224,176", "255,192,150"];

  // ---- Sprites: einmal gezeichnete Bilder, die dann nur noch kopiert werden ----
  function sprite(b, h) { const c = document.createElement("canvas"); c.width = b; c.height = h; return c; }
  function radial(g, x, y, r, stops) {
    const v = g.createRadialGradient(x, y, 0, x, y, r);
    for (const s of stops) v.addColorStop(s[0], s[1]);
    g.fillStyle = v;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // Weicher Lichtfleck in einer Farbe
  const FLECKEN = new Map();
  function fleck(farbe) {
    let c = FLECKEN.get(farbe);
    if (!c) {
      c = sprite(128, 128);
      radial(c.getContext("2d"), 64, 64, 64, [[0, `rgba(${farbe},1)`], [0.3, `rgba(${farbe},0.42)`], [0.7, `rgba(${farbe},0.08)`], [1, `rgba(${farbe},0)`]]);
      FLECKEN.set(farbe, c);
    }
    return c;
  }
  // Wertrauschen in vier Oktaven, rund ausgeblendet: Wolkenstruktur fuer Nebel und Planeten
  function rauschen(saat, S, farbe) {
    const c = sprite(S, S), g = c.getContext("2d"), z = zufall(saat);
    const N = 16, gitter = [];
    for (let o = 0; o < 4; o++) { const w = new Float32Array(N * N); for (let i = 0; i < N * N; i++) w[i] = z(); gitter.push(w); }
    const wert = (w, x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const x0 = xi % N, x1 = (xi + 1) % N, y0 = (yi % N) * N, y1 = ((yi + 1) % N) * N;
      return misch(misch(w[y0 + x0], w[y0 + x1], sx), misch(w[y1 + x0], w[y1 + x1], sx), sy);
    };
    const img = g.createImageData(S, S), d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        let v = 0, amp = 0.5, fr = 4 / S;
        for (let o = 0; o < 4; o++) { v += amp * wert(gitter[o], x * fr, y * fr); amp *= 0.5; fr *= 2; }
        const dx = (x - S / 2) / (S / 2), dy = (y - S / 2) / (S / 2);
        const m = clamp(1 - (dx * dx + dy * dy), 0, 1);
        const a = clamp((v - 0.4) * 2.4, 0, 1) * m * m;
        const i = (y * S + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
    if (farbe) { g.globalCompositeOperation = "source-in"; g.fillStyle = `rgb(${farbe})`; g.fillRect(0, 0, S, S); }
    return c;
  }

  // Eine Spiralgalaxie von schraeg oben: Halo, zwei Arme aus Lichtflecken (blau-weiss,
  // dazwischen rosa Wolken), Staubbahnen als Loecher, warmer Kern, einzelne Sterne
  function galaxieBauen() {
    const S = 1024, M = S / 2, c = sprite(S, S), g = c.getContext("2d"), z = zufall(99);
    const gauss = () => z() + z() + z() - 1.5;
    const blau = fleck("175,195,255"), weiss = fleck("255,255,255"), rosa = fleck("255,170,205"), warm = fleck("255,228,190");
    g.globalCompositeOperation = "lighter";
    radial(g, M, M, S * 0.5, [[0, "rgba(140,160,220,0.16)"], [0.5, "rgba(140,160,220,0.05)"], [1, "rgba(140,160,220,0)"]]);
    for (let arm = 0; arm < 2; arm++) {
      const dreh = arm * Math.PI;
      for (let i = 0; i < 1100; i++) {
        const t = z() * 3.4 * Math.PI;
        const r = 55 * Math.exp(0.2 * t);
        if (r > S * 0.47) continue;
        const streu = gauss() * r * 0.12 + gauss() * 6;
        const w = t + dreh;
        const x = M + Math.cos(w) * (r + streu), y = M + Math.sin(w) * (r + streu);
        const art = z();
        const sp = art < 0.68 ? blau : art < 0.85 ? weiss : art < 0.94 ? rosa : warm;
        const gr = (6 + z() * 26) * (0.4 + r / 420);
        g.globalAlpha = 0.04 + z() * 0.07;
        g.drawImage(sp, x - gr, y - gr, 2 * gr, 2 * gr);
      }
    }
    g.globalCompositeOperation = "destination-out";
    for (let arm = 0; arm < 2; arm++) {
      const dreh = arm * Math.PI;
      for (let i = 0; i < 350; i++) {
        const t = 0.8 + z() * 2.4 * Math.PI;
        const r = 55 * Math.exp(0.2 * t) * 0.82;
        const w = t + dreh;
        const x = M + Math.cos(w) * r + gauss() * 5, y = M + Math.sin(w) * r + gauss() * 5;
        const gr = 5 + z() * 14;
        g.globalAlpha = 0.18 + z() * 0.2;
        g.drawImage(weiss, x - gr, y - gr, 2 * gr, 2 * gr);
      }
    }
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 1;
    g.save(); g.translate(M, M); g.scale(1, 0.75);
    radial(g, 0, 0, 170, [[0, "rgba(255,240,215,0.9)"], [0.12, "rgba(255,232,200,0.55)"], [0.4, "rgba(240,215,190,0.14)"], [1, "rgba(240,215,190,0)"]]);
    g.restore();
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 1800; i++) {
      const imKern = z() < 0.3;
      const t = z() * 3.4 * Math.PI;
      const r = (imKern ? z() * 90 : 55 * Math.exp(0.2 * t)) * (1 + gauss() * 0.12);
      const w = imKern ? z() * Math.PI * 2 : t + (z() < 0.5 ? 0 : Math.PI);
      const x = M + Math.cos(w) * r, y = M + Math.sin(w) * r;
      g.globalAlpha = 0.3 + z() * 0.7;
      const gr = z() < 0.9 ? 1 : 2;
      g.fillRect(x, y, gr, gr);
    }
    return c;
  }

  // Planeten als Sprites: Baender, Flecken, Krater, Ringe; Licht von links oben vorn
  const PLANETEN = [
    { art: "gas", grund: [205, 170, 125], baender: [[235, 205, 165], [190, 140, 95], [220, 185, 140], [160, 110, 80], [230, 200, 160]], fleck: true, u: 0.5, winkel: 0.4, weite: 1700, r: 950 },
    { art: "ring", grund: [220, 200, 150], baender: [[230, 215, 170], [205, 185, 135], [225, 210, 165]], u: 0.7, winkel: 3.6, weite: 1500, r: 760 },
    { art: "fels", grund: [190, 105, 70], kappe: true, u: 0.33, winkel: 2.2, weite: 1500, r: 300 },
    { art: "eis", grund: [60, 95, 200], baender: [[70, 110, 215], [55, 85, 185], [80, 120, 225]], u: 0.84, winkel: 5.2, weite: 1300, r: 520 },
    { art: "mond", grund: [150, 150, 152], u: 0.61, winkel: 1.2, weite: 520, r: 210 },
  ];
  function planetBauen(pl, rausch) {
    const R = 200, S = 512, B2 = pl.art === "ring" ? 1100 : S, cx = B2 / 2, cy = S / 2;
    const c = sprite(B2, S), g = c.getContext("2d"), z = zufall(pl.r);
    const rgb = (f, k) => `rgb(${Math.round(f[0] * (k || 1))},${Math.round(f[1] * (k || 1))},${Math.round(f[2] * (k || 1))})`;
    const ringe = (hinten) => {
      g.save();
      g.beginPath(); g.rect(0, hinten ? 0 : cy, B2, cy); g.clip();
      g.translate(cx, cy); g.scale(1, 0.24);
      for (let i = 0; i < 40; i++) {
        const rr = R * (1.35 + (i / 40) * 1.05);
        const luecke = i > 24 && i < 28 ? 0.15 : 1;        // eine Teilung wie die Cassinische
        g.globalAlpha = (0.25 + 0.55 * Math.abs(Math.sin(i * 0.9 + 1))) * luecke * (i > 34 ? 0.45 : 1);
        g.strokeStyle = rgb([225, 212, 180], 0.75 + 0.25 * Math.sin(i * 0.5));
        g.lineWidth = R * 0.028;
        g.beginPath(); g.ellipse(0, 0, rr, rr, 0, 0, Math.PI * 2); g.stroke();
      }
      g.restore();
    };
    if (pl.art === "ring") ringe(true);
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = rgb(pl.grund); g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    if (pl.baender) {
      const n = pl.baender.length;
      for (let y = -R; y <= R; y++) {
        const phi = Math.asin(clamp(y / R, -1, 1));
        const s = (Math.sin(phi * 7) + 0.6 * Math.sin(phi * 13 + 1.3) + 0.35 * Math.sin(phi * 23 + 0.4)) * 0.26 + 0.5;
        const f = clamp(s, 0, 0.999) * (n - 1), i = Math.floor(f), k = f - i;
        g.fillStyle = rgb([0, 1, 2].map((j) => misch(pl.baender[i][j], pl.baender[i + 1][j], k)));
        g.globalAlpha = pl.art === "eis" ? 0.5 : 0.9;
        g.fillRect(cx - R, cy + y, 2 * R, 1.5);
      }
    }
    g.globalAlpha = 1;
    if (pl.fleck) {
      g.save(); g.translate(cx + R * 0.3, cy + R * 0.35); g.rotate(-0.1); g.scale(1, 0.55);
      radial(g, 0, 0, R * 0.26, [[0, "rgba(200,90,60,0.9)"], [0.6, "rgba(200,100,70,0.6)"], [1, "rgba(200,100,70,0)"]]);
      g.restore();
    }
    if (pl.art === "mond") {
      for (let i = 0; i < 7; i++) {
        const w = z() * Math.PI * 2, d = z() * R * 0.7;
        g.fillStyle = "rgba(40,40,52,0.28)";
        g.beginPath(); g.ellipse(cx + Math.cos(w) * d, cy + Math.sin(w) * d, R * (0.15 + z() * 0.25), R * (0.1 + z() * 0.2), z() * 3, 0, Math.PI * 2); g.fill();
      }
    }
    if (pl.art === "fels" || pl.art === "mond") {
      for (let i = 0; i < 60; i++) {
        const w = z() * Math.PI * 2, d = Math.sqrt(z()) * R * 0.97;
        const x = cx + Math.cos(w) * d, y = cy + Math.sin(w) * d, gr = 2 + z() * z() * (pl.art === "mond" ? 18 : 28);
        if (pl.art === "mond") {
          g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.arc(x, y, gr, 0, Math.PI * 2); g.fill();
          g.fillStyle = "rgba(255,255,255,0.16)"; g.beginPath(); g.arc(x - gr * 0.25, y - gr * 0.25, gr * 0.8, 0, Math.PI * 2); g.fill();
          g.fillStyle = rgb(pl.grund, 0.92); g.beginPath(); g.arc(x - gr * 0.12, y - gr * 0.12, gr * 0.62, 0, Math.PI * 2); g.fill();
        } else {
          g.fillStyle = z() < 0.6 ? "rgba(60,25,15,0.18)" : "rgba(255,200,160,0.12)";
          g.beginPath(); g.ellipse(x, y, gr * 1.6, gr, z() * 3, 0, Math.PI * 2); g.fill();
        }
      }
      if (pl.kappe) { g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.ellipse(cx, cy - R * 0.93, R * 0.35, R * 0.1, 0, 0, Math.PI * 2); g.fill(); }
    }
    g.globalCompositeOperation = "soft-light";
    g.globalAlpha = pl.art === "eis" ? 0.35 : 0.7;
    g.drawImage(rausch, cx - R, cy - R, 2 * R, 2 * R);
    g.drawImage(rausch, cx - R * 1.3, cy - R * 0.8, 2.3 * R, 1.3 * R);
    g.globalCompositeOperation = "multiply";
    g.globalAlpha = 1;
    radial(g, cx - R * 0.45, cy - R * 0.4, R * 1.9, [[0, "rgb(255,255,255)"], [0.36, "rgb(240,240,245)"], [0.62, "rgb(90,90,110)"], [0.8, "rgb(12,12,20)"], [1, "rgb(0,0,0)"]]);
    if (pl.art !== "mond") {
      // Saum der Atmosphaere, nur auf der Lichtseite
      g.globalCompositeOperation = "lighter";
      g.save();
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, Math.PI * 0.9, Math.PI * 1.85); g.closePath(); g.clip();
      g.globalAlpha = 0.3;
      const v = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, pl.art === "eis" ? "rgba(140,180,255,0.9)" : "rgba(255,230,200,0.7)");
      g.fillStyle = v; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      g.restore();
    }
    g.restore();
    if (pl.art === "ring") ringe(false);
    return { bild: c, R, cx, cy, b: B2, h: S };
  }

  let welt = null;
  function weltBauen(klein) {
    const z = zufall(20261010);
    const gauss = () => z() + z() + z() - 1.5;
    const sterne = [];
    const stern = (p, g, hell, band) => {
      const w = z();
      sterne.push({ p, g, hell, band, farbe: w < 0.1 ? 0 : w < 0.3 ? 1 : w < 0.62 ? 2 : w < 0.84 ? 3 : w < 0.95 ? 4 : 5, phase: z() * Math.PI * 2 });
    };
    const anzahlSterne = klein ? 1100 : 2600;
    for (let i = 0; i < anzahlSterne; i++) {
      const hell = 0.2 + 0.8 * Math.pow(z(), 2.4);   // wenige helle, viele schwache
      stern([(z() - 0.5) * 7000, (z() - 0.5) * 5000, 900 - z() * (LAENGE + 2600)], 0.5 + hell * 1.6, hell, false);
    }
    // Das Band der Milchstrasse: viele schwache Sterne auf einer grossen, schraeg
    // liegenden Scheibe um die Mitte der Bahn -- es zieht sich quer ueber den Himmel;
    // dazu weiche Lichtflecken (die Glut des Bandes) und dunkle Staubwolken darin
    const mitteBahn = bahn(0.55);
    const neigung = 0.42;
    const aufScheibe = (radius, quer) => {
      const winkel = z() * Math.PI * 2;
      const x = Math.cos(winkel) * radius, t = Math.sin(winkel) * radius;
      return [mitteBahn[0] + x, mitteBahn[1] + t * Math.sin(neigung) + quer * Math.cos(neigung), mitteBahn[2] + t * Math.cos(neigung) - quer * Math.sin(neigung)];
    };
    const anzahlBand = klein ? 1300 : 3200;
    for (let i = 0; i < anzahlBand; i++) stern(aufScheibe(5200 + z() * 4200, gauss() * 470), 0.3 + z() * 0.9, 0.25 + z() * 0.45, true);
    const BAND_FARBEN = ["190,205,245", "235,225,205", "215,215,240", "255,235,210"];
    const bandGlut = [], bandStaub = [];
    for (let i = 0; i < 90; i++) bandGlut.push({ p: aufScheibe(5600 + z() * 3400, gauss() * 420), r: 1500 + z() * 1100, a: 0.05 + z() * 0.06, farbe: BAND_FARBEN[i % 4] });
    for (let i = 0; i < 30; i++) bandStaub.push({ p: aufScheibe(5800 + z() * 3000, gauss() * 140), r: 500 + z() * 600, a: 0.4 + z() * 0.3 });
    // Staub nah an der Bahn: fliegt dicht an der Kamera vorbei und gibt Tempo
    const staub = [];
    const anzahlStaub = klein ? 140 : 300;
    for (let i = 0; i < anzahlStaub; i++) {
      const u = z();
      const mitte = bahn(u);
      const r = rahmen(u);
      const winkel = z() * Math.PI * 2;
      const weite = 40 + z() * 260;
      staub.push([0, 1, 2].map((k) => mitte[k] + (r.rechts[k] * Math.cos(winkel) + r.oben[k] * Math.sin(winkel)) * weite));
    }
    // Knoten in einer Roehre um die Bahn, die zum Ziel hin enger wird
    const knoten = [];
    const anzahlKnoten = klein ? 210 : 340;
    for (let i = 0; i < anzahlKnoten; i++) {
      const u = 0.03 + (i / anzahlKnoten) * 0.95 + (z() - 0.5) * 0.01;
      const mitte = bahn(u);
      const r = rahmen(u);
      const weite = misch(620, 70, Math.pow(u, 1.6)) * (0.35 + z() * 0.9);
      const winkel = z() * Math.PI * 2;
      const pos = [0, 1, 2].map((k) => mitte[k] + (r.rechts[k] * Math.cos(winkel) + r.oben[k] * Math.sin(winkel)) * weite);
      knoten.push({ p: pos, u, g: 1.2 + z() * 2.2, text: null, formel: false });
    }
    // Formeln auf Knoten nah an der Bahn, verteilt ueber den Teil des Wegs, den die
    // Kamera langsam fliegt
    FORMELN.forEach((f, j) => {
      const u = 0.05 + (j / FORMELN.length) * 0.56;
      const mitte = bahn(u);
      const r = rahmen(u);
      const weite = 150 + z() * 170;
      const winkel = (j * 2.4) % (Math.PI * 2);
      const pos = [0, 1, 2].map((k) => mitte[k] + (r.rechts[k] * Math.cos(winkel) + r.oben[k] * Math.sin(winkel) * 0.7) * weite);
      knoten.push({ p: pos, u, g: 2.6, text: f, formel: true });
    });
    // Einzelne Zeichen auf jedem siebten gewoehnlichen Knoten
    for (let i = 0; i < anzahlKnoten; i += 7) knoten[i].text = ZEICHEN[(i / 7) % ZEICHEN.length];

    // Kanten: jeder Knoten zu den zwei naechsten Knoten weiter vorn -- daran fliesst das Licht
    knoten.sort((a, b) => a.u - b.u);
    const kanten = [];
    knoten.forEach((a, i) => {
      const kandidaten = [];
      for (let j = i + 1; j < Math.min(knoten.length, i + 40); j++) {
        const b = knoten[j];
        const d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]);
        if (d < 900) kandidaten.push({ j, d });
      }
      kandidaten.sort((x, y) => x.d - y.d);
      kandidaten.slice(0, 2).forEach((k) => kanten.push({ a: i, b: k.j, phase: z(), tempo: 0.18 + z() * 0.22 }));
    });

    // Das Zeichen: drei Balken (Anteile seiner Kantenlaenge, wie im Logo)
    const BALKEN = [{ x: 10, y: 22, b: 20, h: 56 }, { x: 40, y: 8, b: 20, h: 84 }, { x: 70, y: 22, b: 20, h: 56 }];
    // Lichtstroeme am Ende des Flugs: kommen von ueberall am Rand her (Bildschirm-
    // Einheiten relativ zur Mitte) und fliessen in die Erde (Ziel in Einheiten ihres
    // Radius)
    const strom = [];
    const anzahlStrom = klein ? 220 : 380;
    for (let i = 0; i < anzahlStrom; i++) {
      const winkel = z() * Math.PI * 2;
      const weite = 0.55 + z() * 0.45;
      const r = Math.sqrt(z()) * 0.92, w = z() * Math.PI * 2;
      strom.push({
        ziel: [Math.cos(w) * r, Math.sin(w) * r],
        start: [Math.cos(winkel) * weite, Math.sin(winkel) * weite],
        verzug: z() * 0.5,
      });
    }
    // Die Begleiter: Formeln, die beim Rasen mit der Kamera fliegen (Ort in Anteilen
    // der halben Bildbreite und -hoehe, nicht in der Mitte, da waechst die Erde)
    const BEGLEITER = ["E = mc^{2}", "e^{iπ} + 1 = 0", "a^{2} + b^{2} = c^{2}", "ζ(s) = Σ n^{−s}", "φ = (1 + √5) / 2", "det(A − λI) = 0",
      "H = − Σ p_{i} log p_{i}", "∂u/∂t = α ∇^{2}u", "e^{x} = Σ x^{n} / n!", "σ^{2} = E[(X − μ)^{2}]", "f(x) = Σ a_{n} x^{n}", "iħ ∂ψ/∂t = Ĥψ"];
    const begleiter = BEGLEITER.map((text, i) => {
      // zwei Ringe um die Mitte (da waechst die Erde), auf dem Handy nur der aeussere
      const w = (i / BEGLEITER.length) * Math.PI * 2 + 0.3;
      const r = klein ? 0.78 : i % 2 ? 0.5 : 0.84;
      return { text, x: Math.cos(w) * r * 1.1, y: Math.sin(w) * r, groesse: 0.75 + z() * 0.4, phase: z() * Math.PI * 2, verzug: z() };
    });
    // Nebel: grosse, leise Lichtwolken mit Struktur neben der Bahn
    const NEBEL = [rauschen(3, 256, "120,150,230"), rauschen(4, 256, "170,130,220"), rauschen(5, 256, "110,190,210"), rauschen(6, 256, "235,150,185")];
    const nebel = [];
    for (let i = 0; i < 16; i++) {
      const u = 0.05 + i * 0.058 + (z() - 0.5) * 0.03;
      const mitte = bahn(u);
      const r = rahmen(u);
      const winkel = z() * Math.PI * 2;
      const weite = 700 + z() * 900;
      nebel.push({
        p: [0, 1, 2].map((kk) => mitte[kk] + (r.rechts[kk] * Math.cos(winkel) + r.oben[kk] * Math.sin(winkel)) * weite - r.vorn[kk] * 400),
        r: 1100 + z() * 1100,
        a: 0.14 + z() * 0.16,
        bild: NEBEL[i % NEBEL.length],
        dreh: z() * Math.PI * 2,
      });
    }
    // Koerper der Mathematik als Drahtmodelle, die langsam drehend neben der Bahn
    // schweben (Koordinaten etwa in [-1, 1], jede Form eine Liste von Linienzuegen)
    const FORMEN = [lorenz(), torus(), kugel(), spirale(), helix(), welle(), moebius(), achsen()];
    const objekte = FORMEN.map((zuege, i) => {
      const u = 0.1 + i * 0.1 + (z() - 0.5) * 0.03;
      const mitte = bahn(u);
      const r = rahmen(u);
      const winkel = (i % 2 ? 0.15 : Math.PI - 0.15) + (z() - 0.5) * 1.1;
      const weite = 620 + z() * 360;
      return {
        mitte: [0, 1, 2].map((k) => mitte[k] + (r.rechts[k] * Math.cos(winkel) + r.oben[k] * Math.sin(winkel)) * weite),
        zuege,
        groesse: 240 + z() * 170,
        tempo: (0.05 + z() * 0.07) * (z() < 0.5 ? -1 : 1),
        phase: z() * Math.PI * 2,
        kipp: (z() - 0.5) * 1.2,
        a: 0.28 + z() * 0.14,
      };
    });
    // Planeten neben der Bahn
    const rausch = rauschen(8, 256, null);
    const planeten = PLANETEN.map((pl) => {
      const mitte = bahn(pl.u);
      const r = rahmen(pl.u);
      return {
        p: [0, 1, 2].map((k) => mitte[k] + (r.rechts[k] * Math.cos(pl.winkel) + r.oben[k] * Math.sin(pl.winkel)) * pl.weite),
        r: pl.r,
        sp: planetBauen(pl, rausch),
      };
    });

    // Leitungen zum Computer (Einheiten der Schirmbreite, Ursprung in der Schirmmitte):
    // von weit draussen hinter den Monitor, dann als Leiterbahn ueber den Schirm bis an
    // den Chip -- links und rechts je fuenf, oben fuenf; unten bleibt Platz fuer die Schrift
    const kurve = (a, c, b, n) => {
      const zug = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        zug.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
      }
      return zug;
    };
    const leitungen = [];
    const leitung = (aussen, innen) => {
      const punkte = aussen.concat(innen.slice(1));
      const laengen = [0];
      for (let i = 1; i < punkte.length; i++) laengen.push(laengen[i - 1] + Math.hypot(punkte[i][0] - punkte[i - 1][0], punkte[i][1] - punkte[i - 1][1]));
      leitungen.push({
        punkte,
        laengen,
        laenge: laengen[laengen.length - 1],
        grenze: aussen.length - 1,              // ab diesem Punkt liegt sie auf dem Schirm
        grenzLaenge: laengen[aussen.length - 1],
        impulse: [0, 1, 2].map((j) => ({ phase: (j + z()) / 3, tempo: 0.16 + z() * 0.08 })),
      });
    };
    for (const seite of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const y = CHIP_Y + (i - 2) * 0.0225;
        const x1 = CHIP + 0.035 + Math.abs(i - 2) * 0.012;
        const y2 = CHIP_Y + (i - 2) * 0.06;
        const x2 = x1 + Math.abs(y2 - y);
        const rand = [seite * 0.5, y2];
        leitung(kurve([seite * (1.2 + z() * 0.45), y2 * 2.4 + (z() - 0.5) * 0.5], [seite * (0.66 + z() * 0.16), y2 * 1.3], rand, 10),
          [rand, [seite * x2, y2], [seite * x1, y], [seite * CHIP, y]]);
      }
    }
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.0225;
      const y1 = CHIP_Y - CHIP - 0.035 - Math.abs(i - 2) * 0.01;
      const x2 = (i - 2) * 0.06;
      const y2 = y1 - Math.abs(x2 - x);
      const rand = [x2, -SCHIRM_H];
      leitung(kurve([x2 * 5 + (z() - 0.5) * 0.4, -1 - z() * 0.35], [x2 * 1.8, -0.62], rand, 10),
        [rand, [x2, y2], [x, y1], [x, CHIP_Y - CHIP]]);
    }
    return { klein, sterne, bandGlut, bandStaub, staub, knoten, kanten, strom, begleiter, BALKEN, nebel, objekte, planeten, leitungen, galaxie: galaxieBauen(), erde: null };
  }

  // Die Erde aus Punkten (Ersatz ohne WebGL): Land auf einer Fibonacci-Kugel, dazu
  // das Gradnetz. Kostet ein paar Millisekunden -- deshalb erst, wenn sie gebraucht wird.
  function erdeBauen(klein) {
    const punkte = [];
    const anzahl = klein ? 7000 : 12000;
    const goldwinkel = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < anzahl; i++) {
      const breite = Math.asin(1 - (2 * i + 1) / anzahl) / GRAD;
      const laenge = (((i * goldwinkel) / GRAD) % 360) - 180;
      if (istLand(laenge, breite)) punkte.push(...einheit(laenge, breite));
    }
    const gradnetz = [];
    for (let lo = -180; lo < 180; lo += 15) {
      const zug = [];
      for (let la = -90; la <= 90; la += 5) zug.push(einheit(lo, la));
      gradnetz.push(zug);
    }
    for (let la = -75; la <= 75; la += 15) {
      const zug = [];
      for (let lo = -180; lo <= 180; lo += 5) zug.push(einheit(lo, la));
      gradnetz.push(zug);
    }
    return { punkte, gradnetz };
  }

  // ---- Formen (Linienzuege in eigenen Koordinaten) ----
  function lorenz() {
    let x = 0.1, y = 0, z = 0;
    const zug = [];
    for (let i = 0; i < 1700; i++) {
      const dt = 0.008;
      const dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
      x += dx * dt; y += dy * dt; z += dz * dt;
      if (i > 150 && i % 2 === 0) zug.push([x / 22, (z - 25) / 22, y / 22]);
    }
    return [zug];
  }
  function torus() {
    const zuege = [];
    const R = 0.68, r = 0.28;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2, zug = [];
      for (let j = 0; j <= 20; j++) { const b = (j / 20) * Math.PI * 2; zug.push([(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]); }
      zuege.push(zug);
    }
    for (let j = 0; j < 6; j++) {
      const b = (j / 6) * Math.PI * 2, zug = [];
      for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; zug.push([(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]); }
      zuege.push(zug);
    }
    return zuege;
  }
  function kugel() {
    const zuege = [];
    for (let i = 1; i < 8; i++) {
      const t = (i / 8) * Math.PI, zug = [];
      for (let j = 0; j <= 36; j++) { const a = (j / 36) * Math.PI * 2; zug.push([Math.sin(t) * Math.cos(a) * 0.9, Math.cos(t) * 0.9, Math.sin(t) * Math.sin(a) * 0.9]); }
      zuege.push(zug);
    }
    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * Math.PI, zug = [];
      for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI * 2; zug.push([Math.sin(t) * Math.cos(a) * 0.9, Math.cos(t) * 0.9, Math.sin(t) * Math.sin(a) * 0.9]); }
      zuege.push(zug);
    }
    return zuege;
  }
  function spirale() {
    // goldene Spirale r = a * phi^(2 theta / pi)
    const zug = [];
    const phi = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i <= 260; i++) {
      const t = (i / 260) * Math.PI * 4.5;
      const r = 0.035 * Math.pow(phi, (2 * t) / Math.PI);
      zug.push([r * Math.cos(t) - 0.2, r * Math.sin(t) - 0.1, 0]);
    }
    return [zug];
  }
  function helix() {
    const zuege = [[], []];
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * Math.PI * 6;
      const y = (i / 120) * 2 - 1;
      zuege[0].push([Math.cos(t) * 0.32, y, Math.sin(t) * 0.32]);
      zuege[1].push([Math.cos(t + Math.PI) * 0.32, y, Math.sin(t + Math.PI) * 0.32]);
      if (i % 6 === 0) zuege.push([[Math.cos(t) * 0.32, y, Math.sin(t) * 0.32], [Math.cos(t + Math.PI) * 0.32, y, Math.sin(t + Math.PI) * 0.32]]);
    }
    return zuege;
  }
  function welle() {
    const zuege = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * 2 - 1, zug1 = [], zug2 = [];
      for (let j = 0; j <= 24; j++) {
        const b = (j / 24) * 2 - 1;
        zug1.push([a, 0.22 * Math.sin(3 * a) * Math.cos(3 * b), b]);
        zug2.push([b, 0.22 * Math.sin(3 * b) * Math.cos(3 * a), a]);
      }
      zuege.push(zug1, zug2);
    }
    return zuege;
  }
  function moebius() {
    const zuege = [];
    const punkt = (u, v) => [(0.7 + v * Math.cos(u / 2)) * Math.cos(u), v * Math.sin(u / 2), (0.7 + v * Math.cos(u / 2)) * Math.sin(u)];
    for (const v of [-0.28, -0.14, 0, 0.14, 0.28]) {
      const zug = [];
      for (let i = 0; i <= 60; i++) zug.push(punkt((i / 60) * Math.PI * 2, v));
      zuege.push(zug);
    }
    for (let i = 0; i < 30; i++) { const u = (i / 30) * Math.PI * 2; zuege.push([punkt(u, -0.28), punkt(u, 0.28)]); }
    return zuege;
  }
  function achsen() {
    const zuege = [[[-1, 0, 0], [1, 0, 0]], [[0, -0.8, 0], [0, 0.8, 0]], [[0, 0, -0.8], [0, 0, 0.8]]];
    for (let i = -4; i <= 4; i++) if (i) zuege.push([[i / 4.5, -0.03, 0], [i / 4.5, 0.03, 0]], [[-0.03, i / 5.6, 0], [0.03, i / 5.6, 0]]);
    const sinus = [];
    for (let i = 0; i <= 80; i++) { const x = (i / 80) * 2 - 1; sinus.push([x, 0.45 * Math.sin(x * Math.PI * 2), 0]); }
    zuege.push(sinus);
    return zuege;
  }

  // ---- Formel mit Hoch- und Tiefstellung zeichnen (zentriert) ----
  function formelTeile(text) {
    const teile = [];
    let i = 0, lauf = "";
    while (i < text.length) {
      const c = text[i];
      if ((c === "^" || c === "_") && text[i + 1] === "{") {
        if (lauf) { teile.push({ t: lauf, art: 0 }); lauf = ""; }
        let tiefe = 1, j = i + 2;
        while (j < text.length && tiefe) { if (text[j] === "{") tiefe++; else if (text[j] === "}") tiefe--; j++; }
        teile.push({ t: text.slice(i + 2, j - 1).replace(/[\^_]\{|\}/g, ""), art: c === "^" ? 1 : -1 });
        i = j;
      } else { lauf += c; i++; }
    }
    if (lauf) teile.push({ t: lauf, art: 0 });
    return teile;
  }
  const FORMEL_TEILE = new Map();
  function formelZeichnen(text, x, y, groesse) {
    let teile = FORMEL_TEILE.get(text);
    if (!teile) { teile = formelTeile(text); FORMEL_TEILE.set(text, teile); }
    const schrift = (g) => `italic 500 ${g.toFixed(1)}px "Playfair Display", "Cambria Math", Georgia, serif`;
    let breite = 0;
    for (const t of teile) { ctx.font = schrift(t.art ? groesse * 0.68 : groesse); breite += ctx.measureText(t.t).width; }
    let lx = x - breite / 2;
    for (const t of teile) {
      const g = t.art ? groesse * 0.68 : groesse;
      ctx.font = schrift(g);
      ctx.fillText(t.t, lx, y - (t.art === 1 ? groesse * 0.42 : t.art === -1 ? -groesse * 0.22 : 0));
      lx += ctx.measureText(t.t).width;
    }
  }

  // ---- Die Erde in WebGL: je Bildpunkt eine Kugel, Bilder der NASA darauf ----
  const erde = { gl: null, leinwand: null, prog: null, u: {}, bereit: false, geladen: 0, angestossen: false, fehl: false };
  const ERDE_BILDER = ["welt-tag", "welt-nacht", "wolken", "europa-tag", "europa-nacht", "ziel-nacht"];
  const VS = "attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }";
  const FS = `
precision highp float;
uniform vec2 uMitte;      // Mitte der Erde in Bildpunkten (y von unten)
uniform float uR;         // Radius in Bildpunkten
uniform mat3 uDreh;       // Blick -> Welt
uniform vec3 uSonne;      // Licht im Blick (x rechts, y oben, z zum Betrachter)
uniform sampler2D uTag, uNacht, uWolken, uTagEu, uNachtEu, uNachtZiel;
uniform vec4 uEu, uZiel;  // Ausschnitte: Laenge, Breite der Ecke, Spannen (Grad)
uniform float uEuMix, uZielMix, uWolkenMix, uWolkenVersatz, uNachtWeich, uNachtStaerke, uHell, uAtmo, uAlpha;
const float PI = 3.14159265;
float kante(vec2 uv) {
  vec2 k = smoothstep(0.0, 0.08, uv) * smoothstep(0.0, 0.08, 1.0 - uv);
  return k.x * k.y;
}
vec3 lichter(sampler2D t, vec2 uv) {
  // beim tiefen Zoom weich: eine groebere Stufe des Bildes mischt sich dazu
  vec3 scharf = texture2D(t, uv).rgb;
  vec3 weich = texture2D(t, uv, 1.0 + 4.0 * uNachtWeich).rgb;
  return mix(scharf, weich, uNachtWeich);
}
void main() {
  vec2 d = (gl_FragCoord.xy - uMitte) / uR;
  float r2 = dot(d, d);
  vec3 sonne = normalize(uSonne);
  if (r2 >= 1.0) {
    float r = sqrt(r2);
    if (r > 1.4) discard;
    vec3 n = vec3(d / r, 0.0);
    float licht = smoothstep(-0.35, 0.5, dot(n, sonne));
    float a = exp(-(r - 1.0) * 14.0) * (0.12 + 0.5 * licht) * uAtmo * uAlpha;
    gl_FragColor = vec4(vec3(0.45, 0.65, 1.0) * a, a);
    return;
  }
  float z = sqrt(1.0 - r2);
  vec3 n = vec3(d, z);
  vec3 w = uDreh * n;
  float lat = asin(clamp(w.z, -1.0, 1.0));
  float lon = atan(w.y, w.x);
  vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
  float latG = lat / PI * 180.0, lonG = lon / PI * 180.0;
  vec2 euv = vec2((lonG - uEu.x) / uEu.z, 1.0 - (latG - uEu.y) / uEu.w);
  float euDrin = kante(euv) * uEuMix;
  vec2 zuv = vec2((lonG - uZiel.x) / uZiel.z, 1.0 - (latG - uZiel.y) / uZiel.w);
  float zielDrin = kante(zuv) * uZielMix;
  vec3 tag = mix(texture2D(uTag, uv).rgb, texture2D(uTagEu, euv).rgb, euDrin);
  vec3 nacht = mix(lichter(uNacht, uv), lichter(uNachtEu, euv), euDrin);
  nacht = mix(nacht, lichter(uNachtZiel, zuv), zielDrin);
  float wasser = smoothstep(0.02, 0.14, tag.b - max(tag.r, tag.g));
  float wolke = texture2D(uWolken, vec2(fract(uv.x + uWolkenVersatz), uv.y)).r * uWolkenMix;
  float diff = dot(n, sonne);
  float tagLicht = smoothstep(-0.1, 0.3, diff);
  float daemmer = exp(-pow(diff / 0.15, 2.0));
  vec3 farbe = tag * (0.03 + 1.05 * tagLicht) * mix(vec3(1.0), vec3(1.15, 0.85, 0.65), daemmer * 0.6);
  vec3 h = normalize(sonne + vec3(0.0, 0.0, 1.0));
  farbe += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, h), 0.0), 90.0) * wasser * tagLicht * 0.55;
  float nachtAnteil = 1.0 - smoothstep(-0.25, 0.05, diff);
  farbe += nacht * nachtAnteil * uNachtStaerke;
  farbe = mix(farbe, vec3(1.0) * (0.04 + tagLicht), wolke * 0.9);
  float saum = pow(1.0 - z, 2.2);
  farbe += vec3(0.35, 0.55, 1.0) * saum * (0.25 + 0.75 * tagLicht) * uAtmo * 0.9;
  gl_FragColor = vec4(farbe * uHell * uAlpha, uAlpha);
}`;
  function erdeStarten() {
    const c = sprite(1, 1);
    const einstellungen = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" };
    const gl = c.getContext("webgl", einstellungen) || c.getContext("experimental-webgl", einstellungen);
    if (!gl) return false;
    const schattierer = (typ, quelle) => {
      const s = gl.createShader(typ);
      gl.shaderSource(s, quelle);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    try {
      const prog = gl.createProgram();
      gl.attachShader(prog, schattierer(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, schattierer(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const puffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, puffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      for (const name of ["uMitte", "uR", "uDreh", "uSonne", "uEu", "uZiel", "uEuMix", "uZielMix", "uWolkenMix", "uWolkenVersatz", "uNachtWeich", "uNachtStaerke", "uHell", "uAtmo", "uAlpha"]) erde.u[name] = gl.getUniformLocation(prog, name);
      ["uTag", "uNacht", "uWolken", "uTagEu", "uNachtEu", "uNachtZiel"].forEach((name, i) => gl.uniform1i(gl.getUniformLocation(prog, name), i));
      gl.uniform4f(erde.u.uEu, EUROPA[0], EUROPA[1], EUROPA[2], EUROPA[3]);
      gl.uniform4f(erde.u.uZiel, ZIEL_BOX[0], ZIEL_BOX[1], ZIEL_BOX[2], ZIEL_BOX[3]);
      erde.prog = prog;
    } catch (e) {
      return false;
    }
    c.addEventListener("webglcontextlost", (e) => { e.preventDefault(); erde.gl = null; erde.bereit = false; erde.fehl = true; });
    erde.gl = gl;
    erde.leinwand = c;
    return true;
  }
  // Die Bilder laden (erst, wenn der Abschnitt in die Naehe kommt) und als Texturen ablegen
  function erdeLaden() {
    if (erde.angestossen || reduziert.matches) return;
    erde.angestossen = true;
    if (!erdeStarten()) { erde.fehl = true; return; }
    const gl = erde.gl;
    const klein = welt && welt.klein;
    ERDE_BILDER.forEach((name, i) => {
      const bild = new Image();
      bild.decoding = "async";
      bild.onload = () => {
        if (!erde.gl) return;
        const t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, bild);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, i < 3 ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        erde.geladen++;
        if (erde.geladen === ERDE_BILDER.length) erde.bereit = true;
      };
      bild.onerror = () => { erde.fehl = true; };
      bild.src = BILDER + name + (klein ? "-k" : "") + ".jpg";
    });
  }
  function erdeGl(cx, cy, R, laenge0, breite0, sonne, e) {
    const gl = erde.gl, u = erde.u, c = erde.leinwand;
    if (c.width !== leinwand.width || c.height !== leinwand.height) { c.width = leinwand.width; c.height = leinwand.height; }
    gl.viewport(0, 0, c.width, c.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uMitte, cx * dpr, (H - cy) * dpr);
    gl.uniform1f(u.uR, R * dpr);
    const cl = Math.cos(laenge0 * GRAD), sl = Math.sin(laenge0 * GRAD), cb = Math.cos(breite0 * GRAD), sb = Math.sin(breite0 * GRAD);
    // Spalten: Blick-x = Osten, Blick-y = Norden, Blick-z = Lot auf die Mitte
    gl.uniformMatrix3fv(u.uDreh, false, new Float32Array([-sl, cl, 0, -sb * cl, -sb * sl, cb, cb * cl, cb * sl, sb]));
    gl.uniform3f(u.uSonne, sonne[0], sonne[1], sonne[2]);
    gl.uniform1f(u.uEuMix, e.eu);
    gl.uniform1f(u.uZielMix, e.ziel);
    gl.uniform1f(u.uWolkenMix, e.wolken);
    gl.uniform1f(u.uWolkenVersatz, e.versatz);
    gl.uniform1f(u.uNachtWeich, e.weich);
    gl.uniform1f(u.uNachtStaerke, e.nacht);
    gl.uniform1f(u.uHell, e.hell);
    gl.uniform1f(u.uAtmo, e.atmo);
    gl.uniform1f(u.uAlpha, e.alpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(c, 0, 0, B, H);
  }

  // ---- Zeichnen ----
  let B = 0, H = 0, dpr = 1;
  let kleben = 0;   // Abstand der klebenden Buehne vom oberen Rand (css: top)
  function groesseAnpassen() {
    kleben = parseFloat(getComputedStyle(buehne).top) || 0;
    const r = buehne.getBoundingClientRect();
    B = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, B < 700 ? 1.5 : 2);
    // grosse Schirme nicht ueber ~3 Mio. Bildpunkte
    while (B * H * dpr * dpr > 3.2e6 && dpr > 1) dpr -= 0.25;
    leinwand.width = Math.round(B * dpr);
    leinwand.height = Math.round(H * dpr);
    if (welt && welt.klein !== (B < 700)) welt = weltBauen(B < 700);
  }
  // Die Welt (mit allen Sprites) kostet etwa eine Zehntelsekunde: nicht beim Laden der
  // Seite, sondern wenn der Browser Luft hat -- spaetestens, wenn der Abschnitt dran ist
  function weltSicher() { if (!welt) welt = weltBauen(B < 700); }
  if (window.requestIdleCallback) window.requestIdleCallback(weltSicher, { timeout: 2000 }); else setTimeout(weltSicher, 400);

  function kamera(q) {
    const u = fahrt(q);
    const pos = bahn(u);
    // ein wenig vorausschauen: die Kamera folgt dem Fluss
    const blick = bahn(Math.min(ZIEL_U, u + 0.035));
    const vorn = norm(sub(blick, pos));
    const rechts = norm(kreuz(vorn, [0, 1, 0]));
    const oben = kreuz(rechts, vorn);
    return { pos, vorn, rechts, oben, u };
  }

  function projiziere(k, p, f) {
    const rel = sub(p, k.pos);
    const zc = dot(rel, k.vorn);
    if (zc < 8) return null;
    return { x: B / 2 + (dot(rel, k.rechts) / zc) * f, y: H / 2 - (dot(rel, k.oben) / zc) * f, z: zc };
  }

  // Sichtbarkeit nach Tiefe: nah weich einblenden, fern im Dunst verschwinden
  // (nah erst ab 60 und weich bis 300: was dicht an der Kamera vorbeizieht, wuerde
  // sonst als riesige Linie quer durchs Bild schneiden)
  const tiefe = (z, fern) => clamp((z - 60) / 240, 0, 1) * clamp(1 - (z - 300) / fern, 0, 1);

  let qAlt = 0;
  function bild(p, zeit, still) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, B, H);
    if (!welt) return;

    const q = Math.min(1, p / FLUG);      // Fortschritt im Flug
    const auftauchen = stueck(q, 0, 0.03);
    if (auftauchen <= 0) return;

    // Zoom von der Erde bis zum Computer, in e-fachen Vergroesserungen
    const L = ZOOM_ENDE * glatt(clamp((p - ZOOM_VON) / (ZOOM_BIS - ZOOM_VON), 0, 1));
    const k = kamera(q);
    const f = Math.min(B, H) * 0.95;
    // Die Kamera kurz davor -- fuer die Schweife der Sterne, solange es vorwaerts geht
    const dq = still ? 0 : q - qAlt;
    qAlt = q;
    const kS = !still && Math.abs(dq) > 1e-5 ? kamera(clamp(q - dq * 2.5, 0, 1)) : null;
    const innen = stueck(q, 0.16, 0.3);                       // in der Milchstrasse
    const netzSicht = auftauchen * stueck(q, 0.17, 0.3) * (1 - stueck(q, 0.6, 0.72));
    const himmel = auftauchen * (1 - stueck(L, 1.4, 2.8));     // Sterne weichen, wenn die Erde das Bild fuellt
    const masse = computerMasse();

    // Die Erde: wo sie im Bild steht und wie gross; beim Zoom wandert der Brennpunkt
    // in die Mitte und zuletzt an die Stelle des Chips auf dem Schirm
    const erdeProj = projiziere(k, bahn(ZIEL_U), f);
    const zurMitte = stueck(p, 0.58, 0.66), zumChip = stueck(p, 0.72, 0.8);
    const ex = erdeProj ? erdeProj.x : B / 2, ey = erdeProj ? erdeProj.y : H / 2;
    const fx = misch(misch(ex, B / 2, zurMitte), B / 2, zumChip);
    const fy = misch(misch(ey, H / 2, zurMitte), masse.fy, zumChip);
    const R = (erdeProj ? (ERDE_R * f) / erdeProj.z : 1) * Math.exp(L);
    const erdeSicht = stueck(q, 0.45, 0.56) * (1 - stueck(L, 5.0, 5.9));

    // Die Milchstrasse voraus: waechst, bis sie das Bild fuellt, dann sind wir drin
    const galaxieSicht = auftauchen * (1 - stueck(q, 0.19, 0.3));
    if (galaxieSicht > 0) {
      const gr = Math.min(B, H) * 0.2 * Math.exp(9.2 * q);
      ctx.save();
      ctx.translate(B / 2 + Math.sin(q * 3) * B * 0.04, H * 0.46);
      ctx.rotate(0.55 + q * 0.4);
      ctx.scale(1, 0.48);
      ctx.globalAlpha = galaxieSicht;
      ctx.drawImage(welt.galaxie, -gr, -gr, 2 * gr, 2 * gr);
      ctx.restore();
    }

    ctx.globalCompositeOperation = "lighter";
    if (himmel > 0) {
      // Die Glut des Bandes und die Staubwolken darin
      if (innen > 0) {
        for (const w of welt.bandGlut) {
          const q1 = projiziere(k, w.p, f);
          if (!q1) continue;
          const r = (w.r * f) / q1.z;
          if (q1.x + r < 0 || q1.x - r > B || q1.y + r < 0 || q1.y - r > H) continue;
          ctx.globalAlpha = himmel * innen * w.a;
          ctx.drawImage(fleck(w.farbe), q1.x - r, q1.y - r, 2 * r, 2 * r);
        }
      }
      // Sterne, gebuendelt nach Farbe und Helligkeit; mit Schweif, wenn es vorwaerts geht
      const eimerR = [], eimerL = [];
      for (let c = 0; c < STERN_FARBEN.length; c++) { eimerR.push([[], [], [], [], []]); eimerL.push([[], [], [], [], []]); }
      const glanz = [];
      for (const s of welt.sterne) {
        const q1 = projiziere(k, s.p, f);
        if (!q1 || q1.x < -6 || q1.x > B + 6 || q1.y < -6 || q1.y > H + 6) continue;
        const dichte = s.band ? innen : 0.55 + 0.45 * innen;
        const a = himmel * dichte * s.hell * tiefe(q1.z, s.band ? 14000 : 6500) * (0.72 + 0.28 * Math.sin(zeit * 1.3 + s.phase));
        if (a < 0.02) continue;
        const g = s.band ? clamp((s.g * 2200) / q1.z, 0.5, 1.6) : clamp((s.g * 260) / q1.z, 0.5, 2.6);
        const stufe = Math.min(4, Math.floor(a * 5));
        let schweif = false;
        if (kS) {
          const q0 = projiziere(kS, s.p, f);
          if (q0) {
            const l = Math.hypot(q0.x - q1.x, q0.y - q1.y);
            if (l > 1.2 && l < Math.max(B, H) * 0.5) { eimerL[s.farbe][stufe].push(q0.x, q0.y, q1.x, q1.y); schweif = true; }
          }
        }
        eimerR[s.farbe][stufe].push(q1.x, q1.y, g);
        if (s.hell > 0.93 && g > 1.6 && !schweif) glanz.push(q1.x, q1.y, g, a, s.farbe);
      }
      STERN_FARBEN.forEach((farbe, c) => {
        eimerR[c].forEach((liste, st) => {
          if (!liste.length) return;
          ctx.fillStyle = `rgb(${farbe})`;
          ctx.globalAlpha = (st + 0.5) / 5;
          ctx.beginPath();
          for (let i = 0; i < liste.length; i += 3) ctx.rect(liste[i] - liste[i + 2] / 2, liste[i + 1] - liste[i + 2] / 2, liste[i + 2], liste[i + 2]);
          ctx.fill();
        });
        eimerL[c].forEach((liste, st) => {
          if (!liste.length) return;
          ctx.strokeStyle = `rgb(${farbe})`;
          ctx.lineWidth = 1;
          ctx.globalAlpha = ((st + 0.5) / 5) * 0.6;
          ctx.beginPath();
          for (let i = 0; i < liste.length; i += 4) { ctx.moveTo(liste[i], liste[i + 1]); ctx.lineTo(liste[i + 2], liste[i + 3]); }
          ctx.stroke();
        });
      });
      // Die hellsten mit Hof und vier Strahlen
      for (let i = 0; i < glanz.length; i += 5) {
        const x = glanz[i], y = glanz[i + 1], g = glanz[i + 2], a = glanz[i + 3], farbe = STERN_FARBEN[glanz[i + 4]];
        const r = g * 7;
        ctx.globalAlpha = a * 0.5;
        ctx.drawImage(fleck(farbe), x - r, y - r, 2 * r, 2 * r);
        ctx.strokeStyle = `rgb(${farbe})`;
        ctx.globalAlpha = a * 0.35;
        ctx.lineWidth = 0.8;
        const l = g * 6;
        ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x + l, y); ctx.moveTo(x, y - l); ctx.lineTo(x, y + l); ctx.stroke();
      }
      if (innen > 0) {
        ctx.globalCompositeOperation = "source-over";
        for (const w of welt.bandStaub) {
          const q1 = projiziere(k, w.p, f);
          if (!q1) continue;
          const r = (w.r * f) / q1.z;
          if (q1.x + r < 0 || q1.x - r > B || q1.y + r < 0 || q1.y - r > H) continue;
          ctx.globalAlpha = himmel * innen * w.a;
          ctx.drawImage(fleck("3,3,8"), q1.x - r, q1.y - r, 2 * r, 2 * r);
        }
        ctx.globalCompositeOperation = "lighter";
      }

      // Staub dicht an der Bahn: kurze helle Punkte, die an der Kamera vorbeiziehen
      ctx.fillStyle = "#ffffff";
      for (const d of welt.staub) {
        const q1 = projiziere(k, d, f);
        if (!q1 || q1.z > 1400 || q1.x < 0 || q1.x > B || q1.y < 0 || q1.y > H) continue;
        const a = himmel * innen * clamp((q1.z - 20) / 120, 0, 1) * clamp(1 - q1.z / 1400, 0, 1) * 0.7;
        if (a < 0.03) continue;
        const g = clamp(180 / q1.z, 0.6, 3);
        ctx.globalAlpha = a;
        if (kS) {
          const q0 = projiziere(kS, d, f);
          if (q0) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = g; ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke(); continue; }
        }
        ctx.fillRect(q1.x - g / 2, q1.y - g / 2, g, g);
      }

      // Nebel: grosse, leise Lichtwolken mit Struktur -- geben dem Raum Tiefe
      for (const w of welt.nebel) {
        const q1 = projiziere(k, w.p, f);
        if (!q1 || q1.z < 120) continue;
        const r = (w.r * f) / q1.z;
        if (q1.x + r < 0 || q1.x - r > B || q1.y + r < 0 || q1.y - r > H) continue;
        const a = himmel * innen * w.a * clamp(1 - (q1.z - 600) / 5200, 0, 1) * clamp((q1.z - 120) / 600, 0, 1);
        if (a < 0.005) continue;
        ctx.save();
        ctx.translate(q1.x, q1.y);
        ctx.rotate(w.dreh + zeit * 0.01);
        ctx.globalAlpha = a;
        ctx.drawImage(w.bild, -r, -r, 2 * r, 2 * r);
        ctx.restore();
      }
    }

    // Planeten: decken ab, was hinter ihnen liegt
    ctx.globalCompositeOperation = "source-over";
    for (const pl of welt.planeten) {
      const m = projiziere(k, pl.p, f);
      if (!m) continue;
      const rad = (pl.r * f) / m.z;
      const sk = rad / pl.sp.R;
      if (m.x - pl.sp.cx * sk > B || m.x + (pl.sp.b - pl.sp.cx) * sk < 0 || m.y - pl.sp.cy * sk > H || m.y + (pl.sp.h - pl.sp.cy) * sk < 0) continue;
      const a = himmel * stueck(q, 0.22, 0.36) * clamp((m.z - 40) / 120, 0, 1) * clamp(1 - (m.z - 2500) / 7000, 0, 1);
      if (a < 0.02) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(pl.sp.bild, m.x - pl.sp.cx * sk, m.y - pl.sp.cy * sk, pl.sp.b * sk, pl.sp.h * sk);
    }
    ctx.globalCompositeOperation = "lighter";

    // Die Koerper der Mathematik: Drahtmodelle, die sich langsam drehen
    ctx.strokeStyle = "#cfd8ea";
    ctx.lineWidth = 1;
    if (netzSicht > 0) {
      for (const o of welt.objekte) {
        const m = projiziere(k, o.mitte, f);
        if (!m) continue;
        const a = o.a * netzSicht * tiefe(m.z, 4200) * clamp((m.z - 250) / 500, 0, 1);
        if (a < 0.02) continue;
        const rad = (o.groesse * f) / m.z;
        if (m.x + rad < 0 || m.x - rad > B || m.y + rad < 0 || m.y - rad > H) continue;
        const w = zeit * o.tempo + o.phase, cw = Math.cos(w), sw = Math.sin(w), ck = Math.cos(o.kipp), sk = Math.sin(o.kipp);
        ctx.globalAlpha = a;
        ctx.beginPath();
        for (const zug of o.zuege) {
          let davor = false;
          for (const pt of zug) {
            const x1 = pt[0] * cw + pt[2] * sw, z1 = -pt[0] * sw + pt[2] * cw;
            const y2 = pt[1] * ck - z1 * sk, z2 = pt[1] * sk + z1 * ck;
            const q1 = projiziere(k, [o.mitte[0] + x1 * o.groesse, o.mitte[1] + y2 * o.groesse, o.mitte[2] + z2 * o.groesse], f);
            if (!q1) { davor = false; continue; }
            if (davor) ctx.lineTo(q1.x, q1.y); else ctx.moveTo(q1.x, q1.y);
            davor = true;
          }
        }
        ctx.stroke();
      }

      // Knoten projizieren (einmal je Bild)
      const proj = welt.knoten.map((n) => projiziere(k, n.p, f));

      // Kanten in Helligkeitsstufen gebuendelt zeichnen
      const stufen = [[], [], [], [], []];
      const lang = Math.max(B, H) * 0.7;
      for (const e of welt.kanten) {
        const a = proj[e.a], b = proj[e.b];
        if (!a || !b) continue;
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > lang) continue;
        const h = Math.min(tiefe(a.z, 2600), tiefe(b.z, 2600)) * netzSicht;
        if (h < 0.04) continue;
        stufen[Math.min(4, Math.floor(h * 5))].push(a, b);
      }
      ctx.strokeStyle = "#dfe6f5";
      ctx.lineWidth = 1;
      stufen.forEach((liste, i) => {
        if (!liste.length) return;
        ctx.globalAlpha = 0.05 + i * 0.055;
        ctx.beginPath();
        for (let j = 0; j < liste.length; j += 2) { ctx.moveTo(liste[j].x, liste[j].y); ctx.lineTo(liste[j + 1].x, liste[j + 1].y); }
        ctx.stroke();
      });

      // Lichtimpulse fliessen die Kanten entlang nach vorn -- mit Schweif, damit
      // man das Fliessen sieht
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineCap = "round";
      const punkt = (A, Bp, t) => [misch(A[0], Bp[0], t), misch(A[1], Bp[1], t), misch(A[2], Bp[2], t)];
      for (const e of welt.kanten) {
        const A = welt.knoten[e.a].p, Bp = welt.knoten[e.b].p;
        const t = (zeit * e.tempo + e.phase) % 1;
        const q1 = projiziere(k, punkt(A, Bp, t), f);
        if (!q1) continue;
        const h = tiefe(q1.z, 2400) * netzSicht * Math.sin(Math.PI * t);
        if (h < 0.05) continue;
        const g = clamp(640 / q1.z, 1, 5);
        const hinten = projiziere(k, punkt(A, Bp, Math.max(0, t - 0.16)), f);
        if (hinten) {
          ctx.globalAlpha = h * 0.45;
          ctx.lineWidth = g * 0.7;
          ctx.beginPath(); ctx.moveTo(hinten.x, hinten.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
        }
        ctx.globalAlpha = h;
        ctx.fillRect(q1.x - g / 2, q1.y - g / 2, g, g);
        ctx.globalAlpha = h * 0.2;
        ctx.fillRect(q1.x - g * 2, q1.y - g * 2, g * 4, g * 4);
      }
      ctx.lineWidth = 1;

      // Knoten und ihre Beschriftung
      ctx.textBaseline = "middle";
      welt.knoten.forEach((n, i) => {
        const q1 = proj[i];
        if (!q1) return;
        const h = tiefe(q1.z, n.formel ? 1900 : 2600) * netzSicht;
        if (h < 0.03) return;
        const r = clamp((n.g * 300) / q1.z, 0.8, 7);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = h * 0.85;
        ctx.beginPath(); ctx.arc(q1.x, q1.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = h * 0.12;
        ctx.beginPath(); ctx.arc(q1.x, q1.y, r * 3.2, 0, Math.PI * 2); ctx.fill();
        if (n.text) {
          const g = ((n.formel ? 58 : 30) * f) / q1.z / 2.2;
          // Was ganz nah vorbeizieht, blendet aus, statt riesig angeschnitten zu
          // stehen -- die Grenze haengt an der Breite (Handy: kleiner)
          const gross = Math.min(64, B * 0.06);
          if (g < 8 || g > gross * 1.35) return;
          ctx.globalAlpha = h * (n.formel ? 0.95 : 0.55) * clamp(1 - (g - gross) / (gross * 0.35), 0, 1);
          ctx.fillStyle = "#f4f2ee";
          if (n.formel) formelZeichnen(n.text, q1.x, q1.y - r - g * 0.9, g);
          else { ctx.font = `italic 500 ${g.toFixed(1)}px "Playfair Display", Georgia, serif`; ctx.textAlign = "center"; ctx.fillText(n.text, q1.x, q1.y - r - g * 0.8); ctx.textAlign = "left"; }
        }
      });
    }

    // ---- Die Erde ----
    // Blick: erst ueber dem Atlantik, beim Rasen dreht sie sich langsam, dann nach Europa
    const dreh = stueck(p, 0.58, 0.66);
    const laenge0 = misch(-42 + 30 * stueck(q, 0.5, 0.95) + 4 * Math.sin(zeit * 0.1), ZIEL_LAENGE, dreh);
    const breite0 = misch(14, ZIEL_BREITE, dreh);
    if (erdeSicht > 0 && R > 0.6) {
      if (erde.bereit) {
        // Sonne im Blick; beim Zoom wandert sie hinter die Erde: Abend, dann Nacht
        let s = [dot(SONNE_WELT, k.rechts), dot(SONNE_WELT, k.oben), -dot(SONNE_WELT, k.vorn)];
        const abend = stueck(L, 1.6, 3.2) * 2.6;
        s = [s[0] * Math.cos(abend) + s[2] * Math.sin(abend), s[1], -s[0] * Math.sin(abend) + s[2] * Math.cos(abend)];
        erdeGl(fx, fy, R, laenge0, breite0, s, {
          eu: stueck(L, 0.8, 1.8),
          ziel: stueck(L, 3.0, 3.8),
          wolken: 1 - stueck(L, 1.5, 2.6),
          versatz: still ? 0 : zeit * 0.0012,
          weich: stueck(L, 3.4, 5.2),
          nacht: 1 + 0.3 * stueck(L, 3, 4.6),
          hell: 1 - 0.95 * stueck(L, 3.9, 5.2),
          atmo: 1 - stueck(L, 2, 3.5),
          alpha: erdeSicht,
        });
      } else {
        erdePunkte(fx, fy, R, laenge0, breite0, erdeSicht * (1 - stueck(L, 2.2, 3)), L);
      }
    }

    // Lichtstroeme fliessen in die Erde, aus dem Flug kommend
    const ziel = stueck(q, 0.84, 0.98), weg = stueck(q, 0.96, 1);
    if (ziel > 0 && weg < 1) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "#ffffff";
      ctx.lineCap = "round";
      ctx.lineWidth = 1.4;
      const weit = Math.max(B, H) * 0.75;
      for (const st of welt.strom) {
        const roh = clamp((ziel - st.verzug * 0.5) / 0.5, 0, 1);
        if (roh <= 0 || roh >= 1) continue;
        const ort = (t) => [misch(fx + st.start[0] * weit, fx + st.ziel[0] * R, t), misch(fy + st.start[1] * weit, fy + st.ziel[1] * R, t)];
        const [x, y] = ort(glatt(roh));
        const [hx, hy] = ort(glatt(Math.max(0, roh - 0.08)));
        const h = Math.sin(Math.PI * roh) * (1 - weg);
        ctx.globalAlpha = h * 0.55;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = h;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }

    // Die Begleiter: Formeln, die beim Rasen mit der Kamera fliegen und zuletzt in
    // die Erde stuerzen
    const begleiterSicht = stueck(q, 0.7, 0.78) * (1 - stueck(q, 0.93, 0.995));
    if (begleiterSicht > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f4f2ee";
      const gross = Math.min(40, B * 0.032);
      for (const b of welt.begleiter) {
        const hinein = stueck(q, 0.86 + b.verzug * 0.06, 0.96 + b.verzug * 0.03);
        const x0 = B / 2 + (b.x + 0.03 * Math.sin(zeit * 0.7 + b.phase)) * B * 0.5;
        const y0 = H / 2 + (b.y + 0.025 * Math.cos(zeit * 0.9 + b.phase)) * H * 0.5;
        const x = misch(x0, fx, glatt(hinein)), y = misch(y0, fy, glatt(hinein));
        const g = gross * b.groesse * (1 - 0.9 * hinein);
        if (g < 5) continue;
        ctx.globalAlpha = begleiterSicht * (0.85 - 0.4 * hinein);
        if (b.text.length > 1) formelZeichnen(b.text, x, y, g);
        else { ctx.font = `italic 500 ${(g * 1.3).toFixed(1)}px "Playfair Display", Georgia, serif`; ctx.textAlign = "center"; ctx.fillText(b.text, x, y); ctx.textAlign = "left"; }
      }
    }

    // Die Marke am Ziel: pulsiert, solange die Erde als Kugel dasteht
    const marke = stueck(p, 0.6, 0.65) * (1 - stueck(L, 1.2, 2.2));
    if (marke > 0) {
      const e = blick(drehung(laenge0, breite0), ZIEL);
      if (e[2] > 0) markeZeichnen(fx + R * e[0], fy - R * e[1], marke, zeit, still);
    }

    // Ein Licht wird zum Bildschirm: der Schein waechst mit dem Zoom, bis der
    // Computer daraus hervortritt
    const schein = stueck(L, 4.8, 5.8) * (1 - stueck(L, 7.4, 8));
    if (schein > 0) {
      ctx.globalCompositeOperation = "lighter";
      const r = Math.max(8, masse.m * Math.exp(L - ZOOM_ENDE) * 0.8);
      ctx.globalAlpha = schein * 0.9;
      ctx.drawImage(fleck("190,210,255"), fx - r, fy - r, 2 * r, 2 * r);
      ctx.globalAlpha = schein * 0.7;
      ctx.drawImage(fleck("255,255,255"), fx - r * 0.3, fy - r * 0.3, r * 0.6, r * 0.6);
    }
    const computer = stueck(L, 5.6, 6.8);
    if (computer > 0) computerZeichnen(fx, fy, masse.m * Math.exp(L - ZOOM_ENDE), computer, p, zeit, still);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  // Groesse des Computers im Schlussbild (m = Breite des Schirms) und wo dann der Chip steht
  function computerMasse() {
    const m = Math.min(B * (B < 700 ? 0.9 : 0.68), (H * 0.8) / MONITOR_HOEHE);
    const oben = (H - MONITOR_HOEHE * m) / 2;
    return { m, fy: oben + (RAND + SCHIRM_H + CHIP_Y) * m };
  }

  // Blick auf die Erde: die Stelle (laenge0, breite0) liegt in der Mitte der Scheibe;
  // blick() macht aus einem Einheitsvektor (x rechts, y oben, z zum Betrachter)
  function drehung(laenge0, breite0) {
    return { cl: Math.cos(laenge0 * GRAD), sl: Math.sin(laenge0 * GRAD), cb: Math.cos(breite0 * GRAD), sb: Math.sin(breite0 * GRAD) };
  }
  function blick(d, e) {
    const px = e[0] * d.cl + e[1] * d.sl, py = -e[0] * d.sl + e[1] * d.cl;
    return [py, d.cb * e[2] - d.sb * px, d.sb * e[2] + d.cb * px];
  }

  // Ersatz ohne WebGL: die Erde aus Punkten
  function erdePunkte(cx, cy, R, laenge0, breite0, sicht, L) {
    if (!welt.erde) welt.erde = erdeBauen(welt.klein);
    const d = drehung(laenge0, breite0);
    const randWeit = R > Math.max(B, H) * 2.5;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = sicht;
    if (randWeit) {
      ctx.fillStyle = "rgb(26,37,57)";
      ctx.fillRect(0, 0, B, H);
    } else {
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.3, R * 0.05, cx, cy, R);
      g.addColorStop(0, "rgb(36,50,76)");
      g.addColorStop(0.6, "rgb(15,22,37)");
      g.addColorStop(1, "rgb(5,8,14)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "lighter";
    if (!randWeit) {
      const hauch = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.24);
      hauch.addColorStop(0, "rgba(130,160,225,0)");
      hauch.addColorStop(0.25, `rgba(130,160,225,${(0.3 * sicht).toFixed(3)})`);
      hauch.addColorStop(1, "rgba(130,160,225,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = hauch;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.24, 0, Math.PI * 2); ctx.fill();
      const netz = sicht * 0.12 * (1 - stueck(L, 1.2, 2.2));
      if (netz > 0.005) {
        ctx.strokeStyle = "#9fb3d9";
        ctx.lineWidth = 1;
        ctx.globalAlpha = netz;
        ctx.beginPath();
        for (const zug of welt.erde.gradnetz) {
          let davor = false;
          for (const e of zug) {
            const v = blick(d, e);
            if (v[2] < 0) { davor = false; continue; }
            const x = cx + R * v[0], y = cy - R * v[1];
            if (davor) ctx.lineTo(x, y); else ctx.moveTo(x, y);
            davor = true;
          }
        }
        ctx.stroke();
      }
    }
    const liste = welt.erde.punkte, g = clamp(R * 0.011, 1.2, 2.6);
    const eimer = [[], [], [], [], []];
    for (let i = 0; i < liste.length; i += 3) {
      const X = liste[i], Y = liste[i + 1], Z = liste[i + 2];
      const px = X * d.cl + Y * d.sl;
      const vz = d.sb * Z + d.cb * px;
      if (vz <= 0.02) continue;
      const vx = -X * d.sl + Y * d.cl, vy = d.cb * Z - d.sb * px;
      const x = cx + R * vx, y = cy - R * vy;
      if (x < -g || x > B + g || y < -g || y > H + g) continue;
      const h = (0.3 + 0.7 * clamp(vx * SONNE_WELT[0] + vy * SONNE_WELT[1] + vz * SONNE_WELT[2], 0, 1)) * Math.sqrt(vz);
      if (h < 0.06) continue;
      eimer[Math.min(4, Math.floor(h * 5))].push(x, y);
    }
    ctx.fillStyle = "#dfe8fa";
    eimer.forEach((l, j) => {
      if (!l.length) return;
      ctx.globalAlpha = (sicht * (j + 1)) / 5;
      ctx.beginPath();
      for (let n = 0; n < l.length; n += 2) ctx.rect(l[n] - g / 2, l[n + 1] - g / 2, g, g);
      ctx.fill();
    });
  }

  function markeZeichnen(x, y, sicht, zeit, still) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = sicht * 0.8;
    ctx.drawImage(fleck("235,242,255"), x - 22, y - 22, 44, 44);
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = sicht;
    ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    if (still) return;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 2; i++) {
      const t = (zeit * 0.6 + i * 0.5) % 1;
      ctx.globalAlpha = sicht * (1 - t) * 0.6;
      ctx.beginPath(); ctx.arc(x, y, 5 + t * 26, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function rundRechteck(x, y, b, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + b, y, x + b, y + h, r);
    ctx.arcTo(x + b, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + b, y, r);
    ctx.closePath();
  }

  // Ort auf einer Leitung nach der Strecke s (Einheiten der Schirmbreite)
  function punktAuf(l, s) {
    let i = 1;
    while (i < l.laengen.length - 1 && l.laengen[i] < s) i++;
    const t = (s - l.laengen[i - 1]) / (l.laengen[i] - l.laengen[i - 1] || 1);
    const a = l.punkte[i - 1], b = l.punkte[i];
    return [misch(a[0], b[0], t), misch(a[1], b[1], t)];
  }
  function linieZiehen(punkte, von, bis, P) {
    for (let i = von; i < bis; i++) {
      const [x, y] = P(punkte[i]);
      if (i === von) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }
  // Lichtimpulse auf den Leitungen, alle in Richtung Chip; aussen = der Teil hinter dem
  // Monitor (wird vom Gehaeuse verdeckt), sonst der Teil auf dem Schirm
  function impulseZeichnen(P, m, staerke, zeit, aussen) {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineCap = "round";
    const g = Math.max(1.5, m * 0.004);
    for (const l of welt.leitungen) {
      for (const im of l.impulse) {
        const s = ((zeit * im.tempo + im.phase) % 1) * l.laenge;
        if (s < l.grenzLaenge !== aussen) continue;
        const [x, y] = P(punktAuf(l, s));
        const [hx, hy] = P(punktAuf(l, Math.max(0, s - 0.07)));
        const h = staerke * clamp(s / 0.25, 0, 1) * clamp((l.laenge - s) / 0.02, 0, 1);
        if (h < 0.02) continue;
        ctx.globalAlpha = h * 0.5;
        ctx.lineWidth = g * 0.8;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = h;
        ctx.fillRect(x - g / 2, y - g / 2, g, g);
        ctx.globalAlpha = h * 0.2;
        ctx.fillRect(x - g * 2, y - g * 2, g * 4, g * 4);
      }
    }
  }

  // Der Computer: ein Monitor mit Fuss auf einem Tisch in einem dunklen Raum, davor
  // eine Tastatur; auf dem Schirm fuehren Leiterbahnen in einen Chip -- den Bot. Aus
  // dem Chip wird das Zeichen, darunter die Schrift. m = Breite des Schirms in
  // Bildpunkten, (fx, fy) = Mitte des Chips.
  function computerZeichnen(fx, fy, m, sicht, p, zeit, still) {
    const sx = fx, sy = fy - CHIP_Y * m;        // Mitte des Schirms
    const P = (pt) => [sx + pt[0] * m, sy + pt[1] * m];
    const hb = 0.5 * m, hh = SCHIRM_H * m;
    const unten = sy + hh + KINN * m;           // Unterkante des Gehaeuses
    const boden = unten + (HALS + FUSS) * m;    // darauf steht der Fuss
    const fluss = stueck(p, 0.86, 0.9);          // die Stroeme in den Bot
    const chipSicht = 1 - stueck(p, 0.9, 0.94);
    const fuell = stueck(p, 0.89, 0.94);         // aus dem Chip wird das Zeichen
    const schrift = stueck(p, 0.94, 0.975);      // danach steht das Schlussbild still
    const einzeln = m > 24;                      // sonst zu klein fuer Einzelheiten

    // Licht des Schirms im Raum, auf dem Tisch und an der Wand dahinter
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1;
    let g = ctx.createRadialGradient(sx, sy, 0, sx, sy, m * 1.1);
    g.addColorStop(0, `rgba(150,175,230,${(0.07 * sicht).toFixed(3)})`);
    g.addColorStop(1, "rgba(150,175,230,0)");
    ctx.fillStyle = g;
    ctx.fillRect(sx - m * 1.1, sy - m * 1.1, m * 2.2, m * 2.2);
    ctx.save();
    ctx.translate(sx, boden);
    ctx.scale(1, 0.12);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, m * 0.8);
    g.addColorStop(0, `rgba(200,215,245,${(0.16 * sicht).toFixed(3)})`);
    g.addColorStop(1, "rgba(200,215,245,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-m * 0.8, -m * 0.8, m * 1.6, m * 1.6);
    ctx.restore();
    // Tischkante
    g = ctx.createLinearGradient(sx - m, 0, sx + m, 0);
    g.addColorStop(0, "rgba(207,216,234,0)");
    g.addColorStop(0.5, `rgba(207,216,234,${(0.35 * sicht).toFixed(3)})`);
    g.addColorStop(1, "rgba(207,216,234,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx - m, boden + 0.5); ctx.lineTo(sx + m, boden + 0.5); ctx.stroke();

    // Leitungen draussen, hinter dem Monitor
    if (einzeln) {
      ctx.strokeStyle = "#cfd8ea";
      ctx.globalAlpha = sicht * (0.12 + 0.14 * fluss);
      ctx.beginPath();
      for (const l of welt.leitungen) linieZiehen(l.punkte, 0, l.grenze + 1, P);
      ctx.stroke();
      if (!still && fluss > 0) impulseZeichnen(P, m, sicht * fluss, zeit, true);
    }

    // Gehaeuse und Fuss: decken ab, was dahinter liegt
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = sicht;
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "rgba(207,216,234,0.55)";
    ctx.lineWidth = 1;
    const hals = 0.035 * m;
    ctx.beginPath();
    ctx.moveTo(sx - hals, unten); ctx.lineTo(sx + hals, unten);
    ctx.lineTo(sx + hals * 1.25, boden - FUSS * m); ctx.lineTo(sx - hals * 1.25, boden - FUSS * m);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx - 0.15 * m, boden); ctx.lineTo(sx + 0.15 * m, boden);
    ctx.lineTo(sx + 0.11 * m, boden - FUSS * m); ctx.lineTo(sx - 0.11 * m, boden - FUSS * m);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    rundRechteck(sx - hb - RAND * m, sy - hh - RAND * m, 2 * hb + 2 * RAND * m, 2 * hh + RAND * m + KINN * m, 0.012 * m);
    ctx.fill(); ctx.stroke();
    g = ctx.createLinearGradient(0, sy - hh, 0, sy + hh);
    g.addColorStop(0, "#070b14");
    g.addColorStop(1, "#03050a");
    ctx.fillStyle = g;
    ctx.fillRect(sx - hb, sy - hh, 2 * hb, 2 * hh);
    ctx.strokeStyle = "rgba(207,216,234,0.22)";
    ctx.strokeRect(sx - hb + 0.5, sy - hh + 0.5, 2 * hb - 1, 2 * hh - 1);
    ctx.fillStyle = "#cfd8ea";                       // Betriebslicht unten am Gehaeuse
    ctx.globalAlpha = sicht * 0.7;
    ctx.fillRect(sx - 1, sy + hh + KINN * m * 0.5 - 1, 2, 2);
    // Tastatur vor dem Fuss, vom Schirm beleuchtet
    if (einzeln) {
      const tb = 0.56 * m, th = 0.055 * m, ty = boden + 0.035 * m;
      ctx.globalAlpha = sicht;
      ctx.fillStyle = "#050609";
      ctx.strokeStyle = "rgba(207,216,234,0.3)";
      rundRechteck(sx - tb / 2, ty, tb, th, 0.008 * m);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(207,216,234,0.14)";
      ctx.beginPath();
      for (let i = 1; i < 4; i++) { const y = ty + (th * i) / 4; ctx.moveTo(sx - tb / 2 + 0.01 * m, y); ctx.lineTo(sx + tb / 2 - 0.01 * m, y); }
      for (let i = 1; i < 14; i++) { const x = sx - tb / 2 + (tb * i) / 14; ctx.moveTo(x, ty + 0.006 * m); ctx.lineTo(x, ty + th - 0.006 * m); }
      ctx.stroke();
    }

    // Auf dem Schirm
    ctx.save();
    ctx.beginPath(); ctx.rect(sx - hb, sy - hh, 2 * hb, 2 * hh); ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    const glut = 0.1 + 0.3 * fluss * (still ? 1 : 0.8 + 0.2 * Math.sin(zeit * 3.2));
    g = ctx.createRadialGradient(fx, fy, 0, fx, fy, m * 0.4);
    g.addColorStop(0, `rgba(170,195,245,${(glut * sicht).toFixed(3)})`);
    g.addColorStop(1, "rgba(170,195,245,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(fx - m * 0.4, fy - m * 0.4, m * 0.8, m * 0.8);
    if (einzeln) {
      ctx.strokeStyle = "#cfd8ea";
      ctx.lineWidth = Math.max(1, m * 0.0018);
      ctx.globalAlpha = sicht * (0.22 + 0.18 * fluss);
      ctx.beginPath();
      for (const l of welt.leitungen) linieZiehen(l.punkte, l.grenze, l.punkte.length, P);
      ctx.stroke();
      if (!still && fluss > 0) impulseZeichnen(P, m, sicht * fluss, zeit, false);
    }
    // der Chip: Gehaeuse mit Beinchen, innen ein Kern, der leuchtet, je mehr hineinfliesst
    if (chipSicht > 0) {
      const c = CHIP * m;
      ctx.globalAlpha = sicht * chipSicht;
      ctx.strokeStyle = "#dfe6f5";
      ctx.lineWidth = Math.max(1, m * 0.002);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const o = (i - 2) * 0.0225 * m, bein = 0.016 * m;
        ctx.moveTo(fx - c, fy + o); ctx.lineTo(fx - c - bein, fy + o);
        ctx.moveTo(fx + c, fy + o); ctx.lineTo(fx + c + bein, fy + o);
        ctx.moveTo(fx + o, fy - c); ctx.lineTo(fx + o, fy - c - bein);
        ctx.moveTo(fx + o, fy + c); ctx.lineTo(fx + o, fy + c + bein);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#05070c";
      rundRechteck(fx - c, fy - c, 2 * c, 2 * c, 0.01 * m);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(223,230,245,0.35)";
      rundRechteck(fx - c * 0.62, fy - c * 0.62, c * 1.24, c * 1.24, 0.006 * m);
      ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      g = ctx.createRadialGradient(fx, fy, 0, fx, fy, c * 0.9);
      g.addColorStop(0, `rgba(235,242,255,${(sicht * chipSicht * (0.15 + 0.6 * fluss)).toFixed(3)})`);
      g.addColorStop(1, "rgba(235,242,255,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(fx - c, fy - c, 2 * c, 2 * c);
    }
    // das Zeichen: die drei Balken fuellen sich von unten, einer nach dem anderen
    if (fuell > 0) {
      const s = LOGO * m;
      welt.BALKEN.forEach((b, j) => {
        const t = glatt(clamp((fuell - j * 0.12) / 0.76, 0, 1));
        if (t <= 0) return;
        const x = fx + (b.x / 100 - 0.5) * s, w = (b.b / 100) * s;
        const y = fy + (b.y / 100 - 0.5) * s, h = (b.h / 100) * s;
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = sicht;
        ctx.fillStyle = "#f4f2ee";
        ctx.fillRect(x, y + h * (1 - t), w, h * t);
        if (t < 1) {
          // helle Kante, wo es gerade fuellt
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = sicht * (1 - t);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x - 2, y + h * (1 - t) - 1, w + 4, 2);
        }
      });
    }
    // Wortmarke, "Quant Systems" und Spruch
    if (schrift > 0) {
      const s = LOGO * m;
      ctx.globalCompositeOperation = "source-over";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const wy = fy + s * 0.5 + Math.max(26, 0.075 * m);
      ctx.globalAlpha = sicht * schrift;
      ctx.fillStyle = "#f4f2ee";
      gesperrt("JKHD", sx, wy, `800 ${Math.round(Math.max(17, m * 0.048))}px Manrope, "Segoe UI", sans-serif`, 0.34);
      ctx.fillStyle = "#cfcdc8";
      gesperrt("Quant Systems", sx, wy + Math.max(18, m * 0.042), `700 ${Math.round(Math.max(11, m * 0.022))}px Manrope, "Segoe UI", sans-serif`, 0.05);
      ctx.fillStyle = "#9d9d99";
      gesperrt("Just Know How to Dominate.", sx, wy + Math.max(34, m * 0.08), `${Math.round(Math.max(10, m * 0.019))}px "Cascadia Code", Consolas, monospace`, 0.03);
    }
    ctx.restore();

    // Glanz auf dem Glas
    ctx.globalCompositeOperation = "lighter";
    g = ctx.createLinearGradient(sx - hb, sy - hh, sx + hb * 0.2, sy + hh);
    g.addColorStop(0, `rgba(255,255,255,${(0.035 * sicht).toFixed(3)})`);
    g.addColorStop(0.45, "rgba(255,255,255,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(sx - hb, sy - hh, 2 * hb, 2 * hh);
  }

  // Text mit Zeichenabstand (em-Anteil), zentriert
  function gesperrt(text, x, y, font, abstand) {
    ctx.font = font;
    const em = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
    const breiten = [...text].map((c) => ctx.measureText(c).width);
    const gesamt = breiten.reduce((a, b) => a + b, 0) + em * abstand * (text.length - 1);
    let lx = x - gesamt / 2;
    [...text].forEach((c, i) => { ctx.fillText(c, lx, y); lx += breiten[i] + em * abstand; });
  }

  // ---- Fortschritt, Schleife ----
  // Vor der Buehne liegt der weiche Uebergang vom Startbildschirm ins Schwarz
  // (.universum-uebergang); gezaehlt wird, von wo die Buehne unter der Kopfzeile
  // anhaftet, bis sie wieder losgeht
  const uebergang = abschnitt.querySelector(".universum-uebergang");
  function zielFortschritt() {
    const r = abschnitt.getBoundingClientRect();
    const vorlauf = uebergang ? uebergang.offsetHeight : 0;
    const weg = abschnitt.offsetHeight - vorlauf - buehne.offsetHeight;
    if (weg <= 0) return 1;
    return clamp((kleben - r.top - vorlauf) / weg, 0, 1);
  }

  let p = 0;            // gezeigter Fortschritt (folgt dem Scrollen weich nach)
  let laeuft = false;
  let letzte = 0;
  // Messgeraet: mittlere Zeichenzeit je Bild (ms), einmal je Sekunde an der Leinwand
  // als data-zeichenzeit -- so laesst sich auf jedem Geraet nachsehen, was es kostet
  let messSumme = 0, messAnzahl = 0, messSeit = 0;
  function schleife(jetzt) {
    if (!laeuft) return;
    const dt = Math.min(0.05, (jetzt - letzte) / 1000 || 0.016);
    letzte = jetzt;
    const zielP = zielFortschritt();
    p += (zielP - p) * (1 - Math.exp(-dt * 6));   // weich, unabhaengig von der Bildrate
    if (Math.abs(zielP - p) < 0.0004) p = zielP;
    const t0 = performance.now();
    bild(p, jetzt / 1000, false);
    messSumme += performance.now() - t0;
    messAnzahl++;
    if (jetzt - messSeit > 1000) {
      leinwand.dataset.zeichenzeit = (messSumme / messAnzahl).toFixed(1);
      messSumme = 0; messAnzahl = 0; messSeit = jetzt;
    }
    requestAnimationFrame(schleife);
  }
  function starten() {
    if (laeuft || reduziert.matches) return;
    weltSicher();
    laeuft = true;
    letzte = performance.now();
    p = zielFortschritt();
    requestAnimationFrame(schleife);
  }
  function anhalten() { laeuft = false; }

  function einrichten() {
    abschnitt.classList.toggle("ist-still", reduziert.matches);
    groesseAnpassen();
    if (reduziert.matches) { anhalten(); weltSicher(); bild(1, 0, true); }
  }

  abschnitt.classList.add("ist-aktiv");
  einrichten();
  // Die Schriften (Playfair, Manrope) sind vielleicht noch nicht geladen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (reduziert.matches) bild(1, 0, true); });

  new IntersectionObserver((eintraege) => {
    if (eintraege.some((e) => e.isIntersecting)) starten();
    else anhalten();
  }).observe(abschnitt);
  // Die Erdbilder holen, sobald der Abschnitt in die Naehe kommt (einen Bildschirm davor)
  new IntersectionObserver((eintraege) => {
    if (eintraege.some((e) => e.isIntersecting)) erdeLaden();
  }, { rootMargin: "100% 0px" }).observe(abschnitt);

  window.addEventListener("resize", () => { groesseAnpassen(); if (reduziert.matches) bild(1, 0, true); });
  if (reduziert.addEventListener) reduziert.addEventListener("change", einrichten);
})();
