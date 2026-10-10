// ---------- Startseite: Flug durch die Milchstrasse bis in einen Computer ----------
// Julian, 10.10.2026 (nach dem Chart, das ihm nicht gefiel): "Wenn man runterscrollt,
// soll es erst mal schwarz sein, und dann beim Scrollen soll eine fast schon
// universumartige Umgebung erscheinen, wo Mathematik usw. alles wie in einem Netz
// zusammenfliesst, und die Kamera soll dem Netz immer weiter folgen. Irgendwann
// kommt es am Ziel an, und dort erscheint das Logo mit dem Spruch."
// Am selben Abend das Ende neu: "nicht direkt das Logo, sondern die Erde, und die
// zoomt immer naeher rein bis in einen Computer, dort sieht man, wie Stroeme in den
// Bot fliessen, und am Ende auf dem Bildschirm das Logo". Dritte Fassung: echte Erde,
// echteres Universum, Planeten, Milchstrasse. Vierte Fassung (sein Wortlaut):
// "die weissen Linien wegmachen; die Kamera soll von einem Planeten zum anderen,
// bis ploetzlich die Erde kommt, dann nach Europa (dort kein Punkt), es zoomt auf
// eine Stadt, in ein Rechenzentrum, dort ist ein Computer; auf einmal wird der
// Computer durchsichtig, man erkennt die Platine -- die Platine ist nicht auf dem
// Bildschirm; es darf nicht laggen; das Schlussbild soll laenger stehen." Fuenfte
// Fassung: "es fehlt die Bewegung: die Planeten sollen fest stehen bleiben und die
// Kamera soll so durchs Universum fliegen; die Formeln im Universum weglassen; der
// PC soll echt aussehen, nicht nur schwarz-weiss, und dort sollen die Formeln
// fliessend in den Chip fliessen, bis das Logo erscheint; ganz am Ende soll alles
// schwarz werden und der Spruch 'Nirgends und doch ueberall' erscheinen." Sechste
// Fassung: "die Formeln nicht so schnell; der PC soll an sein und die Formeln sollen
// dort rechnen; bei den Planeten mehr Nebel; der Uebergang von der Milchstrasse auf
// die Planeten echter, genauso der Uebergang zur Erde und vor allem auf die Erde."
// Siebte Fassung: "zu gleichmaessig und zu schnell beim naechsten Planeten -- es soll
// durchs Universum fliegen und nicht einfach so random; das Rechnen sieht man nur,
// wenn man nicht mehr scrollt, das soll nicht sein; die fliegenden Formeln weg."
// Achte Fassung: "ein Planet ausserhalb der Milchstrasse kann nicht sein; zwischen den
// Planeten soll es laenger gehen und mehr Universum zu sehen sein; die Planeten sollen
// vor allem dreidimensional sein." Neunte Fassung: "die Abstaende zwischen den
// Planeten viel, viel groesser; dazwischen muss ein Universum sein, Sterne usw., nicht
// einfach nix; und wenn man ins Universum kommt, sollen die Punkte nicht einfach
// verschwinden -- echter und schoener." Zehnte Fassung: "auf dem Handy sieht das
// Ganze viel schoener aus als auf dem Laptop; und die Kamera soll sich nicht so wild
// umherdrehen, eher waagerecht bleiben und nur nach links oder rechts gehen."
//
// Umsetzung ohne Bibliothek: eine Zeichenflaeche (canvas 2D) mit eigener
// Perspektiv-Projektion; die Erde zeichnet ein kleines WebGL-Programm (eine Kugel je
// Bildpunkt, mit Tag- und Nachtseite, Wolken, Atmosphaere und Glanz auf dem Meer)
// aus NASA-Aufnahmen in assets/erde/ -- gemeinfrei, liegen bei uns, kein fremder
// Server. Die Planeten zeichnet ein zweites WebGL-Programm genauso als Kugeln, ihre
// Karten entstehen hier aus Rauschen. Ohne WebGL steht an ihrer Stelle eine Erde aus
// Punkten (Landumrisse von Hand nachgezeichnet, weiter unten) und die Planeten sind
// schattierte Scheiben. Der Scrollfortschritt p durch den Abschnitt
// #universum (die Buehne bleibt dabei stehen, sticky) treibt alles:
//   0,00-0,20  die Milchstrasse liegt voraus und waechst, Sterne ringsum; hinein: die
//              Arme werden zum Band, Sterne, Nebel und Staub fuellen den Raum
//   0,20-0,70  der Flug auf einer sehr langen, kurvigen Bahn durch die Galaxie: ein
//              dichtes Sternfeld, das Band mit Glut und Staub, Nebel, ferne Galaxien
//              -- und vier Planeten, die fest im Raum stehen (echte Kugeln aus WebGL
//              mit Karte, Licht und Drehung), weit auseinander, mal nah, mal fern;
//              voraus waechst die Erde, mit Mond
//   0,70-0,77  die Erde dreht sich nach Europa, der Flug geht ohne Halt in den Zoom ueber
//   0,71-0,86  Zoom: in die Atmosphaere, durch die Wolken, Europa, Abend, die Lichter
//              einer Stadt -- dann ein Rechenzentrum: die Fahrt durch einen Gang
//              zwischen Serverschraenken bis zum Tisch; der Monitor dort ist an
//   0,86-0,89  das Gehaeuse des Computers wird durchsichtig: die Platine
//   0,87-0,93  der Monitor rechnet die Formeln durch, Zeile fuer Zeile mit dem
//              Scrollen (Formel, dann das Ergebnis, dessen Ziffern sich erst setzen)
//   0,93-0,95  das Zeichen erscheint ploetzlich auf dem Monitor, dazu die Schrift
//   0,96-0,98  alles wird schwarz
//   0,97-1,00  "Nirgends und doch ueberall." (englisch: "Nowhere and yet everywhere.")
// Alles ausser den Erdbildern wird hier erzeugt (feste Saat, jedes Mal gleich);
// nichts wird gespeichert. Bei "reduzierter Bewegung" steht der Computer mit dem
// Zeichen still da, ohne Scrollweg und ohne Bilder; ohne JavaScript zeigt der
// Abschnitt das Zeichen auf Schwarz.
//
// Gegen das Ruckeln: die Leinwand bleibt unter 2,4 Mio. Bildpunkten, die Erde wird
// beim Zoom in halber Aufloesung gerechnet, bei Stillstand nur jedes zweite Bild
// gezeichnet -- und die Schleife misst ihre eigene Zeichenzeit: dauert ein Bild im
// Mittel ueber 11 ms, schaltet sie die Aufloesung herunter (data-qualitaet an der
// Leinwand, data-zeichenzeit = Millisekunden je Bild).
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
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  // ---- Die Bahn: Catmull-Rom durch Stuetzpunkte, die Kamera fliegt nach -z ----
  const LAENGE = 24000;
  const STUECKE = 40;
  // Die Bahn schwingt gemaechlich nach links und rechts (hoechstens etwa 20 Grad aus
  // der Flugrichtung) und hebt und senkt sich nur wenig: die Kamera soll sich "nicht
  // so wild umherdrehen, eher waagerecht bleiben und nach links oder rechts gehen"
  const STUETZEN = [];
  for (let i = 0; i <= STUECKE; i++) {
    const z = 300 - i * (LAENGE / STUECKE);
    const ruhe = i >= STUECKE - 1 ? 0 : 1;   // zum Ziel hin gerade
    STUETZEN.push([(Math.sin(i * 0.5) * 300 + Math.sin(i * 1.1 + 0.7) * 60) * ruhe, Math.sin(i * 0.35 + 1.2) * 120 * ruhe, z]);
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
  // Der Rahmen an einer Stelle der Bahn: vorn ist die Flugrichtung, waagerecht
  // genommen (die Kamera nickt und rollt nie, sie giert nur), oben ist immer oben
  function waagerecht(richtung) {
    const vorn = norm([richtung[0], 0, richtung[2]]);
    return { vorn, rechts: [-vorn[2], 0, vorn[0]], oben: [0, 1, 0] };
  }
  function rahmen(u) {
    return waagerecht(sub(bahn(Math.min(1, u + 0.004)), bahn(Math.max(0, u - 0.004))));
  }
  // Ein Ort neben der Bahn: bei u, seitlich (rechts) und hoch (oben) um die Weite, dazu voraus
  function neben(u, seite, hoch, weite, voraus) {
    const m = bahn(u), r = rahmen(u);
    return [0, 1, 2].map((k) => m[k] + (r.rechts[k] * seite + r.oben[k] * hoch) * weite + r.vorn[k] * (voraus || 0));
  }
  const ZIEL_U = 1;          // dort steht die Erde
  const KAMERA_ENDE = 0.955; // so weit fliegt die Kamera

  // Die Fahrt: Ort u auf der Bahn ueber dem Fortschritt q im Flug. Stueckweise kubisch
  // (Hermite) durch [q, u, Steigung]: gemaechlich in die Galaxie, dann stetig von
  // Planet zu Planet, am Ende sanft bremsen. Die Steigungen liegen in der Schranke
  // von Fritsch und Carlson, die Kurve geht also nie rueckwaerts.
  const FAHRT = [[0, 0, 0.5], [0.15, 0.08, 0.8], [0.86, 0.9, 1.3], [1, KAMERA_ENDE, 0]];
  function fahrt(q) {
    q = clamp(q, 0, 1);
    let i = 0;
    while (i < FAHRT.length - 2 && q > FAHRT[i + 1][0]) i++;
    const a = FAHRT[i], b = FAHRT[i + 1];
    const h = b[0] - a[0], t = (q - a[0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * h * a[2] + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * h * b[2];
  }

  // ---- Zeitplan (Anteile am Scrollweg) ----
  const FLUG = 0.7;                      // so viel gehoert dem Flug
  const ZOOM_VON = 0.71, ZOOM_BIS = 0.86; // der Zoom von der Erde bis in die Halle ...
  const ZOOM_ENDE = 8;                   // ... ueber so viele e-fache Vergroesserungen
  const HALLE_VON = 5.2;                 // ab da faehrt die Kamera durch den Gang
  const ERDE_R = 110;                    // Radius der Erde in Einheiten der Bahn
  // Ziel des Zooms: Freiburg im Breisgau, die naechste Stadt am Sitz (Julian: "es
  // zoomt auf eine Stadt"); angeschrieben ist nichts
  const ZIEL_LAENGE = 7.85, ZIEL_BREITE = 47.995;
  const GRAD = Math.PI / 180;
  const SONNE_WELT = norm([-0.5, 0.3, 0.8]);   // Licht von links oben, hinter der Kamera
  // Ausschnitte der NASA-Bilder: Laenge, Breite der linken unteren Ecke, Spannen (Grad)
  const EUROPA = [-14, 34, 50, 30], ZIEL_BOX = [4, 45, 7, 5.5];
  // Der Spruch am Ende, in der Sprache der Seite (wie in der Fusszeile)
  const SPRUCH = (document.documentElement.lang || "de").startsWith("en") ? "Nowhere and yet everywhere." : "Nirgends und doch überall.";

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

  // ---- Die Formeln in den Nebeln ----
  // Text mit ^{...} (hoch) und _{...} (tief)
  const FORMELN = [
    "e^{iπ} + 1 = 0", "E = mc^{2}", "∇ · E = ρ / ε_{0}", "iħ ∂ψ/∂t = Ĥψ",
    "∫ e^{−x^{2}} dx = √π", "ζ(s) = Σ n^{−s}", "P(A|B) = P(B|A) P(A) / P(B)",
    "dS_{t} = μS_{t} dt + σS_{t} dW_{t}", "σ^{2} = E[(X − μ)^{2}]", "R_{μν} − ½ R g_{μν} = 8πG T_{μν}",
    "∮ F · dr = ∬ (∇ × F) · dA", "f(x) = Σ a_{n} x^{n}", "a^{2} + b^{2} = c^{2}", "lim_{n→∞} (1 + 1/n)^{n} = e",
    "H = − Σ p_{i} log p_{i}", "∂u/∂t = α ∇^{2}u",
    "φ = (1 + √5) / 2", "Σ_{k=1}^{n} k = n(n + 1) / 2", "f̂(ξ) = ∫ f(x) e^{−2πixξ} dx",
    "∂L/∂q − d/dt ∂L/∂q̇ = 0", "f(x) = e^{−x^{2}/2} / √(2π)", "e^{x} = Σ x^{n} / n!",
    "∇ × B = μ_{0}J + μ_{0}ε_{0} ∂E/∂t", "∮ f(z) dz = 2πi Σ Res", "df = f′ dX + ½ f″ σ^{2} dt",
    "det(A − λI) = 0", "x = (−b ± √(b^{2} − 4ac)) / 2a", "∇^{2}φ = 0", "S = k log W", "F = G m_{1} m_{2} / r^{2}",
  ];
  // Was der Monitor zu jeder Formel ausrechnet (ein Zahlenwert oder ein Befund)
  const ERGEBNISSE = [
    "0", "8.98755e16", "1.12941e11", "ψ ok", "1.772454", "1.644934", "0.618034",
    "σ = 0.1820", "0.033124", "2.0766e-43", "0", "1.000000", "25", "2.718282",
    "2.3219 bit", "u ok", "1.618034", "5050", "ok", "0", "0.398942", "2.718282",
    "ok", "6.283185i", "0.004170", "λ = 3, 1", "2, −3", "0", "1.3807e-23", "1.982e20",
  ];
  // Sternfarben nach Temperatur: blau-weiss bis rot
  const STERN_FARBEN = ["185,200,255", "222,230,255", "255,255,255", "255,244,222", "255,224,176", "255,192,150"];

  // Die Planeten stehen fest im Raum, seitlich neben der Bahn (u = wo, Seite, Hoehe,
  // Radius); die Kamera fliegt gerade an ihnen vorbei: sie kommen von vorn, wachsen
  // und ziehen am Rand des Bildes weg. Anderthalb Radien Abstand: dann fuellen sie
  // kurz vor dem Vorbeiflug ein gutes Viertel des Bildes
  // (abst = Abstand von der Bahn in Radien: klein = dichter Vorbeiflug, gross = fern;
  // saum = Farbe und Staerke der Atmosphaere am Rand; glanz = Glanzlicht; tempo =
  // Eigendrehung, neigung = Achsneigung)
  const PLANETEN = [
    { art: "gas", grund: [205, 170, 125], baender: [[235, 205, 165], [190, 140, 95], [220, 185, 140], [160, 110, 80], [230, 200, 160]], fleck: true, u: 0.4, seite: 1, hoch: 0.1, r: 650, abst: 1.5, saum: [1.0, 0.9, 0.75], saumStaerke: 0.5, glanz: 0.12, tempo: 3, neigung: 8 },
    { art: "ring", grund: [220, 200, 150], baender: [[230, 215, 170], [205, 185, 135], [225, 210, 165]], u: 0.58, seite: -1, hoch: -0.15, r: 520, abst: 1.35, saum: [1.0, 0.95, 0.8], saumStaerke: 0.45, glanz: 0.1, tempo: 4, neigung: 22 },
    { art: "eis", grund: [60, 95, 200], baender: [[70, 110, 215], [55, 85, 185], [80, 120, 225]], u: 0.74, seite: 1, hoch: 0.2, r: 400, abst: 1.7, saum: [0.55, 0.7, 1.0], saumStaerke: 0.7, glanz: 0.25, tempo: 5, neigung: 28 },
    { art: "fels", grund: [190, 105, 70], kappe: true, u: 0.88, seite: -1, hoch: -0.05, r: 240, abst: 1.4, saum: [1.0, 0.75, 0.6], saumStaerke: 0.25, glanz: 0.04, tempo: 2.5, neigung: 25 },
  ];
  const MOND = { art: "mond", grund: [150, 150, 152], r: 30, saum: [0.8, 0.8, 0.8], saumStaerke: 0.0, glanz: 0.02, tempo: 0.5, neigung: 6 };
  const PLANET_ORTE = PLANETEN.map((pl) => neben(pl.u, pl.seite, pl.hoch, pl.r * pl.abst, 0));

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

  // Ein Rauschfeld (Wertrauschen, drei Oktaven) fuer die Oberflaechen der Planeten
  function rauschFeld(saat) {
    const z = zufall(saat), N = 32, gitter = [];
    for (let o = 0; o < 3; o++) { const w = new Float32Array(N * N); for (let i = 0; i < N * N; i++) w[i] = z(); gitter.push(w); }
    const wert = (w, x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const x0 = ((xi % N) + N) % N, x1 = (x0 + 1) % N, y0 = (((yi % N) + N) % N) * N, y1 = ((((yi + 1) % N) + N) % N) * N;
      return misch(misch(w[y0 + x0], w[y0 + x1], sx), misch(w[y1 + x0], w[y1 + x1], sx), sy);
    };
    return (x, y) => 0.57 * wert(gitter[0], x, y) + 0.29 * wert(gitter[1], x * 2 + 7, y * 2.1 + 3) + 0.14 * wert(gitter[2], x * 4 + 11, y * 4.3 + 5);
  }

  // Die Karte eines Planeten (Laenge quer, Breite hoch, nahtlos in der Laenge), Bildpunkt
  // fuer Bildpunkt aus Rauschen: Baender mit Wirbeln (Gasriesen), Flecken und Kappen
  // (Fels), Meere und Krater (Mond); dazu Stuerme. Daraus wird in WebGL eine Kugel.
  function planetKarte(pl) {
    const W = pl.art === "gas" || pl.art === "ring" ? 1024 : 512, Hh = W / 2;
    const c = sprite(W, Hh), g = c.getContext("2d"), z = zufall(pl.r);
    const feld = rauschFeld(pl.r + 1), fein = rauschFeld(pl.r + 2);
    const img = g.createImageData(W, Hh), d = img.data;
    const palette = pl.baender || [pl.grund];
    for (let py = 0; py < Hh; py++) {
      const lat = (0.5 - (py + 0.5) / Hh) * Math.PI;
      const ky = py / Hh;
      for (let px = 0; px < W; px++) {
        const u = (px + 0.5) / W;
        const i = (py * W + px) * 4;
        const n1 = feld(u * 32, ky * 16), n2 = fein(u * 32 + 3, ky * 8 + 1);
        let f;
        if (pl.art === "gas" || pl.art === "ring" || pl.art === "eis") {
          const wirbel = pl.art === "gas" ? 0.34 : pl.art === "ring" ? 0.14 : 0.08;
          const l = lat + (n2 - 0.5) * wirbel + (n1 - 0.5) * wirbel * 0.4;
          const bs = (Math.sin(l * 7) + 0.6 * Math.sin(l * 13 + 1.3) + 0.35 * Math.sin(l * 23 + 0.4)) * 0.26 + 0.5;
          const t = clamp(bs, 0, 0.999) * (palette.length - 1), k = Math.floor(t), r = t - k;
          f = [0, 1, 2].map((j) => misch(palette[k][j], palette[Math.min(palette.length - 1, k + 1)][j], r));
          const hell = pl.art === "eis" ? 0.9 + 0.2 * n1 : 0.86 + 0.28 * n1;
          f = f.map((v) => v * hell);
        } else if (pl.art === "fels") {
          const dunkel = clamp((0.56 - n2) * 4, 0, 1);
          f = [misch(pl.grund[0], 95, dunkel * 0.7), misch(pl.grund[1], 45, dunkel * 0.7), misch(pl.grund[2], 30, dunkel * 0.7)].map((v) => v * (0.82 + 0.36 * n1));
          const kappe = clamp((Math.abs(lat) - 1.2) * 5 + (n1 - 0.5) * 0.6, 0, 1);
          f = f.map((v) => misch(v, 245, kappe));
        } else {
          const meer = clamp((0.5 - n2) * 6, 0, 1);
          const grau = (0.78 + 0.44 * n1) * misch(1, 0.58, meer);
          f = [pl.grund[0] * grau, pl.grund[1] * grau, pl.grund[2] * grau * 1.03];
        }
        d[i] = f[0]; d[i + 1] = f[1]; d[i + 2] = f[2]; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    if (pl.art === "gas") {
      for (const st of [[0.62, 0.66, 0.07, 0.5, "200,90,60"], [0.2, 0.36, 0.025, 0.5, "235,225,210"], [0.85, 0.3, 0.02, 0.5, "230,215,195"]]) {
        g.save(); g.translate(W * st[0], Hh * st[1]); g.scale(1, st[3]);
        radial(g, 0, 0, W * st[2], [[0, `rgba(${st[4]},0.85)`], [0.55, `rgba(${st[4]},0.5)`], [1, `rgba(${st[4]},0)`]]);
        g.restore();
      }
    }
    if (pl.art === "eis") {
      g.save(); g.translate(W * 0.4, Hh * 0.6); g.scale(1, 0.6);
      radial(g, 0, 0, W * 0.045, [[0, "rgba(20,35,110,0.8)"], [1, "rgba(20,35,110,0)"]]);
      g.restore();
    }
    if (pl.art === "mond" || pl.art === "fels") {
      // Krater: Boden dunkel, Rand zum Licht hin hell, vom Licht weg dunkel
      const anzahl = pl.art === "mond" ? 320 : 110;
      for (let i = 0; i < anzahl; i++) {
        const x = z() * W, y = Hh * (0.08 + z() * 0.84);
        const gr = (1.2 + Math.pow(z(), 3.2) * (pl.art === "mond" ? 14 : 9)) * (W / 512);
        g.fillStyle = pl.art === "mond" ? "rgba(0,0,0,0.2)" : "rgba(40,15,8,0.22)";
        g.beginPath(); g.arc(x, y, gr, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "rgba(255,255,255,0.22)"; g.lineWidth = Math.max(0.8, gr * 0.12);
        g.beginPath(); g.arc(x, y, gr, Math.PI * 0.85, Math.PI * 1.8); g.stroke();
        g.strokeStyle = "rgba(0,0,0,0.35)";
        g.beginPath(); g.arc(x, y, gr, Math.PI * -0.15, Math.PI * 0.8); g.stroke();
      }
    }
    return c;
  }
  // Die Ringe (in Bildkoordinaten um die Kugel): hinten die obere Haelfte, vorn die untere
  // (eine Flaeche mit einem Verlauf, dessen Stufen die Baender und Luecken sind -- so
  // kostet sie auch riesig nur einen Fuellvorgang)
  function ringeZeichnen(cx, cy, R, hinten, a, neigung) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, hinten ? 0 : cy, B, hinten ? cy : H - cy); ctx.clip();
    ctx.translate(cx, cy); ctx.rotate(neigung); ctx.scale(1, 0.26);
    const r0 = R * 1.3, r1 = R * 2.4;
    const g = ctx.createRadialGradient(0, 0, r0, 0, 0, r1);
    for (let i = 0; i <= 48; i++) {
      const luecke = i > 30 && i < 34 ? 0.12 : i > 40 && i < 42 ? 0.5 : 1;
      const al = (0.22 + 0.55 * Math.abs(Math.sin(i * 0.9 + 1))) * luecke * (i > 42 ? 0.4 : 1);
      const k = 0.72 + 0.28 * Math.sin(i * 0.5);
      g.addColorStop(i / 48, `rgba(${Math.round(228 * k)},${Math.round(214 * k)},${Math.round(184 * k)},${al.toFixed(3)})`);
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, r1, r1, 0, 0, Math.PI * 2);
    ctx.ellipse(0, 0, r0, r0, 0, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();
  }

  let welt = null;
  function weltBauen(klein, dichte) {
    const z = zufall(20261010);
    const gauss = () => z() + z() + z() - 1.5;
    const sterne = [];
    const stern = (p, g, hell, band) => {
      const w = z();
      sterne.push({ p, g, hell, band, farbe: w < 0.1 ? 0 : w < 0.3 ? 1 : w < 0.62 ? 2 : w < 0.84 ? 3 : w < 0.95 ? 4 : 5, phase: z() * Math.PI * 2 });
    };
    // Sterne im ganzen Raum, auch noch weit hinter der Erde (sonst ist der Anflug
    // leer); ihre Zahl waechst mit der Flaeche des Schirms, damit das Feld auf dem
    // Laptop so dicht steht wie auf dem Handy
    const anzahlSterne = Math.round(18000 * dichte);
    for (let i = 0; i < anzahlSterne; i++) {
      const hell = 0.5 + 0.5 * Math.pow(z(), 1.6);   // wenige helle, viele mittlere
      stern([(z() - 0.5) * 16000, (z() - 0.5) * 11000, 900 - z() * (LAENGE + 8000)], 0.5 + hell * 1.8, hell, false);
    }
    // Das Band der Milchstrasse: viele schwache Sterne auf einem grossen Ring um die
    // Mitte der Bahn. Die Ebene des Rings enthaelt die Flugrichtung und ist um sie
    // gekippt: so liegt das Band als Diagonale ueber dem Bild, auf dem breiten Schirm
    // wie auf dem schmalen (vorher kippte die Scheibe um die Querachse, und auf dem
    // Laptop lag das Band vorn unter dem Bildrand). Die Kamera bleibt im Loch des
    // Rings, das Band steht am Himmel und zieht nie an ihr vorbei. Dazu weiche
    // Lichtflecken (die Glut des Bandes) und dunkle Staubwolken darin
    const mitteBahn = bahn(0.55);
    const neigung = 0.42;
    const aufScheibe = (radius, quer) => {
      const winkel = z() * Math.PI * 2;
      const x = Math.cos(winkel) * radius, t = Math.sin(winkel) * radius;
      return [mitteBahn[0] + x * Math.cos(neigung) - quer * Math.sin(neigung), mitteBahn[1] + x * Math.sin(neigung) + quer * Math.cos(neigung), mitteBahn[2] + t];
    };
    const anzahlBand = Math.round(9000 * dichte);
    for (let i = 0; i < anzahlBand; i++) stern(aufScheibe(20000 + z() * 9000, gauss() * 1800), 0.3 + z() * 0.9, 0.3 + z() * 0.5, true);
    const BAND_FARBEN = ["190,205,245", "235,225,205", "215,215,240", "255,235,210"];
    const bandGlut = [], bandStaub = [];
    // (wenige grosse Flecken, die sich kaum ueberlappen: jeder kostet Fuellarbeit)
    for (let i = 0; i < 40; i++) bandGlut.push({ p: aufScheibe(21000 + z() * 7000, gauss() * 1200), r: 5000 + z() * 3000, a: 0.1 + z() * 0.08, farbe: BAND_FARBEN[i % 4] });
    for (let i = 0; i < 36; i++) bandStaub.push({ p: aufScheibe(21000 + z() * 6000, gauss() * 500), r: 1500 + z() * 1500, a: 0.4 + z() * 0.3 });
    // Staub nah an der Bahn: kurze helle Punkte, die an der Kamera vorbeiziehen
    const staub = [];
    const anzahlStaub = Math.round(1300 * dichte);
    for (let i = 0; i < anzahlStaub; i++) staub.push(neben(z(), Math.cos(z() * 6.3), Math.sin(z() * 6.3), 40 + z() * 260, 0));

    // Nebel: grosse Lichtwolken mit Struktur neben der Bahn, abwechselnd links und rechts
    const NEBEL = [rauschen(3, 256, "120,150,230"), rauschen(4, 256, "170,130,220"), rauschen(5, 256, "110,190,210"), rauschen(6, 256, "235,150,185")];
    const NEBEL_FARBEN = ["120,150,230", "170,130,220", "110,190,210", "235,150,185"];
    const nebel = [];
    const wolke = (p, r, a, i) => nebel.push({ p, r, a, bild: NEBEL[i % 4], farbe: NEBEL_FARBEN[i % 4], dreh: z() * Math.PI * 2 });
    // entlang der Bahn
    for (let i = 0; i < 32; i++) {
      const u = 0.1 + i * 0.026 + (z() - 0.5) * 0.02;
      const seite = i % 2 ? 1 : -1;
      wolke(neben(u, seite * Math.cos(z() * 1.2), (z() - 0.5) * 1.2, 350 + z() * 450, 0), 800 + z() * 600, 0.26 + z() * 0.18, i);
    }
    // auf dem letzten Stueck vor der Erde noch zwei, seitlich
    for (let i = 0; i < 2; i++) wolke(neben(0.905 + i * 0.02, i ? 1 : -1, (z() - 0.5) * 1.2, 1000 + z() * 500, 0), 900 + z() * 500, 0.2 + z() * 0.1, i + 2);
    // am Eintritt in die Galaxie: dichte Wolken, durch die die Kamera fliegt
    for (let i = 0; i < 4; i++) wolke(neben(0.04 + i * 0.03, Math.cos(i * 1.9), Math.sin(i * 1.9) * 0.6, 180 + z() * 220, 0), 700 + z() * 400, 0.3 + z() * 0.12, i + 1);
    // um jeden Planeten herum, hinter ihm und daneben
    PLANETEN.forEach((pl, i) => {
      for (let j = 0; j < 1; j++) {
        const w = z() * Math.PI * 2;
        const m = PLANET_ORTE[i];
        const rf = rahmen(pl.u);
        const d = pl.r * (1.6 + z() * 0.8);
        wolke([0, 1, 2].map((k) => m[k] + (rf.rechts[k] * Math.cos(w) + rf.oben[k] * Math.sin(w)) * d - rf.vorn[k] * pl.r * (0.8 + j)), pl.r * (1.8 + z() * 0.8), 0.2 + z() * 0.14, i + j);
      }
    });
    // Planeten und der Mond der Erde -- ihre Karten kommen nach und nach (siehe spritesBauen)
    const planeten = PLANETEN.map((pl, i) => ({ art: pl.art, pl, p: PLANET_ORTE[i], r: pl.r, phase: z() * 360, karte: null }));
    const erdeMond = { art: "mond", pl: MOND, p: neben(0.97, -1, 0.3, 430, -250), r: MOND.r, phase: 40, karte: null };
    // Ferne Galaxien, weit neben der Bahn: kleine Scheiben, schraeg, die langsam vorbeiziehen
    const galaxien = [];
    for (let i = 0; i < 4; i++) {
      const u = 0.22 + i * 0.19;
      galaxien.push({ p: neben(u, Math.cos(i * 2.1 + 0.5), Math.sin(i * 2.1 + 0.5) * 0.6, 3400 + z() * 2600, 0), r: 900 + z() * 800, dreh: z() * Math.PI, kipp: 0.3 + z() * 0.4, a: 0.3 + z() * 0.25 });
    }

    // Die Platine im Computer: Leiterbahnen von den Raendern zum Prozessor (Einheiten
    // der Glasscheibe: u quer, v hoch, der Prozessor bei 0,62/0,62)
    const bahnen = [];
    const bahnLegen = (punkte) => {
      const laengen = [0];
      for (let i = 1; i < punkte.length; i++) laengen.push(laengen[i - 1] + Math.hypot(punkte[i][0] - punkte[i - 1][0], punkte[i][1] - punkte[i - 1][1]));
      bahnen.push({ punkte, laengen, laenge: laengen[laengen.length - 1], impulse: [0, 1].map((j) => ({ phase: (j + z()) / 2, tempo: 0.22 + z() * 0.1 })) });
    };
    for (let i = 0; i < 5; i++) { const v = 0.3 + i * 0.1, knick = 0.3 + i * 0.05; bahnLegen([[0.13, v], [knick, v], [knick, 0.56 + i * 0.03], [0.52, 0.56 + i * 0.03]]); }
    for (let i = 0; i < 4; i++) { const u = 0.4 + i * 0.07; bahnLegen([[u, 0.89], [u, 0.78 - i * 0.02], [0.55 + i * 0.035, 0.78 - i * 0.02], [0.55 + i * 0.035, 0.72]]); }
    for (let i = 0; i < 3; i++) { const u = 0.56 + i * 0.05; bahnLegen([[0.3 + i * 0.1, 0.15], [0.3 + i * 0.1, 0.4 - i * 0.04], [u, 0.4 - i * 0.04], [u, 0.52]]); }
    for (let i = 0; i < 2; i++) { const v = 0.6 + i * 0.07; bahnLegen([[0.89, v], [0.76 + i * 0.02, v], [0.76 + i * 0.02, 0.62 + i * 0.04], [0.72, 0.62 + i * 0.04]]); }
    const kondensatoren = [];
    for (let i = 0; i < 12; i++) kondensatoren.push([0.45 + z() * 0.34, 0.44 + z() * 0.06]);
    for (let i = 0; i < 6; i++) kondensatoren.push([0.74 + z() * 0.03, 0.5 + z() * 0.3]);

    return { klein, dichte, sterne, bandGlut, bandStaub, staub, nebel, planeten, erdeMond, galaxien, bahnen, kondensatoren, galaxie: null, erde: null };
  }
  // Die Galaxie und die Karten der Planeten kosten je einige Dutzend Millisekunden: eines
  // nach dem anderen, jeweils wenn der Browser Luft hat -- in Reihenfolge des Auftritts.
  // Jede Karte wird gleich als Textur in WebGL abgelegt (ohne WebGL bleibt sie leer).
  function spritesBauen() {
    if (!welt) return;
    const w = welt;
    let schritt = null;
    if (!w.galaxie) schritt = () => { w.galaxie = galaxieBauen(); };
    else {
      const offen = w.planeten.concat([w.erdeMond]).find((pl) => !pl.karte);
      if (offen) schritt = () => {
        const vorhanden = w.planeten.find((pl) => pl.karte && pl.art === offen.art);
        offen.karte = vorhanden ? vorhanden.karte : { bild: planetKarte(offen.pl), textur: null };
        if (!offen.karte.textur && glStarten()) {
          const gl = erde.gl, t = gl.createTexture();
          gl.activeTexture(gl.TEXTURE6);
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, offen.karte.bild);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.generateMipmap(gl.TEXTURE_2D);
          offen.karte.textur = t;
        }
      };
    }
    if (!schritt) return;
    const weiter = () => { if (welt !== w) return; schritt(); spritesBauen(); };
    if (window.requestIdleCallback) window.requestIdleCallback(weiter, { timeout: 400 }); else setTimeout(weiter, 30);
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
  // Die Breiten der Teile werden einmal bei 100 px gemessen und dann nur skaliert (das
  // Messen jedes Bild kostete mehr als das Zeichnen) -- gemerkt wird erst, wenn die
  // Schriften geladen sind, sonst stuenden die Masse der Ersatzschrift fest
  let schriftenBereit = false;
  function formelZeichnen(text, x, y, groesse, linksbuendig) {
    groesse = Math.round(groesse * 2) / 2;   // in halben Bildpunkten: so trifft der Browser seine gemerkten Zeichen wieder
    let teile = FORMEL_TEILE.get(text);
    if (!teile) { teile = formelTeile(text); FORMEL_TEILE.set(text, teile); }
    const schrift = (g) => `italic 500 ${g.toFixed(1)}px "Playfair Display", "Cambria Math", Georgia, serif`;
    if (!teile[0].b || !teile[0].fest) {
      for (const t of teile) { ctx.font = schrift(t.art ? 68 : 100); t.b = ctx.measureText(t.t).width; t.fest = schriftenBereit; }
    }
    let breite = 0;
    for (const t of teile) breite += (t.b * groesse) / 100;
    let lx = linksbuendig ? x - 100 * groesse : x - breite / 2;
    for (const t of teile) {
      ctx.font = schrift(t.art ? groesse * 0.68 : groesse);
      ctx.fillText(t.t, lx, y - (t.art === 1 ? groesse * 0.42 : t.art === -1 ? -groesse * 0.22 : 0));
      lx += (t.b * groesse) / 100;
    }
    return breite;
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
  // Das zweite Programm: eine Kugel mit einer Karte, Licht von der Sonne, weicher Rand,
  // Saum einer Atmosphaere und ein wenig Glanz -- fuer die Planeten und den Mond
  const FS_KUGEL = `
precision highp float;
uniform vec2 uMitte;
uniform float uR;
uniform mat3 uDreh;
uniform vec3 uSonne;
uniform sampler2D uTex;
uniform vec3 uSaum;
uniform float uSaumStaerke, uGlanz, uAlpha;
const float PI = 3.14159265;
void main() {
  vec2 d = (gl_FragCoord.xy - uMitte) / uR;
  float r2 = dot(d, d);
  vec3 sonne = normalize(uSonne);
  float r = sqrt(r2);
  if (r2 >= 1.0) {
    if (r > 1.25 || uSaumStaerke <= 0.0) discard;
    vec3 n = vec3(d / r, 0.0);
    float licht = smoothstep(-0.3, 0.5, dot(n, sonne));
    float a = exp(-(r - 1.0) * 22.0) * (0.1 + 0.5 * licht) * uSaumStaerke * uAlpha;
    gl_FragColor = vec4(uSaum * a, a);
    return;
  }
  float z = sqrt(1.0 - r2);
  vec3 n = vec3(d, z);
  vec3 w = uDreh * n;
  float lat = asin(clamp(w.z, -1.0, 1.0));
  float lon = atan(w.y, w.x);
  vec3 tex = texture2D(uTex, vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI)).rgb;
  float diff = dot(n, sonne);
  float licht = smoothstep(-0.12, 0.35, diff);
  vec3 farbe = tex * (0.03 + 1.0 * licht);
  vec3 h = normalize(sonne + vec3(0.0, 0.0, 1.0));
  farbe += vec3(1.0, 0.98, 0.94) * pow(max(dot(n, h), 0.0), 40.0) * uGlanz * licht;
  float saum = pow(1.0 - z, 2.5);
  farbe += uSaum * saum * (0.15 + 0.85 * licht) * uSaumStaerke;
  float kante = 1.0 - smoothstep(1.0 - 2.5 / uR, 1.0, r);
  float a = kante * uAlpha;
  gl_FragColor = vec4(farbe * a, a);
}`;
  // WebGL einmal einrichten (beide Programme); false, wenn es nicht geht
  function glStarten() {
    if (erde.gl) return true;
    if (erde.fehl) return false;
    if (!erdeStarten()) { erde.fehl = true; return false; }
    return true;
  }
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
      // das Kugel-Programm teilt sich den Eckpunkt-Puffer (dasselbe Attribut 'a')
      const kugel = gl.createProgram();
      gl.attachShader(kugel, schattierer(gl.VERTEX_SHADER, VS));
      gl.attachShader(kugel, schattierer(gl.FRAGMENT_SHADER, FS_KUGEL));
      gl.bindAttribLocation(kugel, a, "a");
      gl.linkProgram(kugel);
      if (!gl.getProgramParameter(kugel, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(kugel));
      gl.useProgram(kugel);
      erde.ku = {};
      for (const name of ["uMitte", "uR", "uDreh", "uSonne", "uSaum", "uSaumStaerke", "uGlanz", "uAlpha"]) erde.ku[name] = gl.getUniformLocation(kugel, name);
      gl.uniform1i(gl.getUniformLocation(kugel, "uTex"), 6);
      erde.kugelProg = kugel;
      gl.useProgram(prog);
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
    if (!glStarten()) return;
    const gl = erde.gl;
    const klein = B < 700;
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
  // Spalten der Drehung: Blick-x = Osten, Blick-y = Norden, Blick-z = Lot auf die Mitte
  function drehMatrix(laenge0, breite0) {
    const cl = Math.cos(laenge0 * GRAD), sl = Math.sin(laenge0 * GRAD), cb = Math.cos(breite0 * GRAD), sb = Math.sin(breite0 * GRAD);
    return new Float32Array([-sl, cl, 0, -sb * cl, -sb * sl, cb, cb * cl, cb * sl, sb]);
  }
  // Ein Planet als Kugel: gerechnet wird nur das Rechteck um ihn (Schere), dann kopiert
  function kugelGl(cx, cy, R, laenge0, breite0, sonne, pl, karte, alpha) {
    const gl = erde.gl, u = erde.ku, c = erde.leinwand;
    if (c.width !== leinwand.width || c.height !== leinwand.height) { c.width = leinwand.width; c.height = leinwand.height; }
    // ein grosser Planet wird in halber Aufloesung gerechnet (unten links in der
    // GL-Leinwand, der Ausschnitt wird beim Kopieren wieder vergroessert)
    const teil = R > Math.min(B, H) * 0.45 ? 0.5 : 1;
    const s = dpr * teil;
    const x0 = Math.max(0, Math.floor((cx - R * 1.3) * s)), x1 = Math.min(Math.floor(c.width * teil), Math.ceil((cx + R * 1.3) * s));
    const y0 = Math.max(0, Math.floor((H - cy - R * 1.3) * s)), y1 = Math.min(Math.floor(c.height * teil), Math.ceil((H - cy + R * 1.3) * s));
    if (x1 <= x0 || y1 <= y0) return;
    gl.useProgram(erde.kugelProg);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, karte.textur);
    gl.viewport(0, 0, c.width, c.height);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x0, y0, x1 - x0, y1 - y0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uMitte, cx * s, (H - cy) * s);
    gl.uniform1f(u.uR, R * s);
    gl.uniformMatrix3fv(u.uDreh, false, drehMatrix(laenge0, breite0));
    gl.uniform3f(u.uSonne, sonne[0], sonne[1], sonne[2]);
    gl.uniform3f(u.uSaum, pl.saum[0], pl.saum[1], pl.saum[2]);
    gl.uniform1f(u.uSaumStaerke, pl.saumStaerke);
    gl.uniform1f(u.uGlanz, pl.glanz);
    gl.uniform1f(u.uAlpha, alpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    gl.useProgram(erde.prog);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    // der Ausschnitt der GL-Leinwand (y von oben gezaehlt) an seine Stelle
    ctx.drawImage(c, x0, c.height - y1, x1 - x0, y1 - y0, x0 / s, H - y1 / s, (x1 - x0) / s, (y1 - y0) / s);
  }
  function erdeGl(cx, cy, R, laenge0, breite0, sonne, e) {
    const gl = erde.gl, u = erde.u, c = erde.leinwand;
    // fuellt die Erde das Bild, reicht die halbe Aufloesung (die Bilder sind dann
    // ohnehin vergroessert) -- das spart drei Viertel der Rechenarbeit
    const teil = R > Math.min(B, H) * 0.8 ? 0.5 : 1;
    const bw = Math.round(leinwand.width * teil), bh = Math.round(leinwand.height * teil);
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    const s = dpr * teil;
    gl.useProgram(erde.prog);
    gl.viewport(0, 0, bw, bh);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uMitte, cx * s, (H - cy) * s);
    gl.uniform1f(u.uR, R * s);
    gl.uniformMatrix3fv(u.uDreh, false, drehMatrix(laenge0, breite0));
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
  let qualitaet = 1;   // Anteil der Aufloesung; die Schleife senkt ihn, wenn es ruckelt
  let kleben = 0;      // Abstand der klebenden Buehne vom oberen Rand (css: top)
  function groesseAnpassen() {
    kleben = parseFloat(getComputedStyle(buehne).top) || 0;
    const r = buehne.getBoundingClientRect();
    B = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 1.25) * qualitaet;
    // nicht ueber ~2,4 Mio. Bildpunkte: das Bild ist weich, Fuellrate ist der Engpass
    if (B * H * dpr * dpr > 2.4e6) dpr = Math.sqrt(2.4e6 / (B * H));
    leinwand.width = Math.round(B * dpr);
    leinwand.height = Math.round(H * dpr);
    if (welt && (welt.klein !== (B < 700) || Math.abs(welt.dichte - sternDichte()) > 0.2)) { welt = weltBauen(B < 700, sternDichte()); spritesBauen(); }
  }
  // Wie viele Sterne der Raum bekommt, nach der Flaeche des Schirms: auf dem Handy
  // etwa die Haelfte, auf einem grossen Schirm bis zum 1,4-fachen
  function sternDichte() { return B < 700 ? 0.55 : clamp(Math.sqrt((B * H) / 9e5), 1, 1.4); }
  // Die Welt (mit allen Sprites) kostet etwa eine Zehntelsekunde: nicht beim Laden der
  // Seite, sondern wenn der Browser Luft hat -- spaetestens, wenn der Abschnitt dran ist
  function weltSicher() { if (!welt) { welt = weltBauen(B < 700, sternDichte()); spritesBauen(); } }
  if (window.requestIdleCallback) window.requestIdleCallback(weltSicher, { timeout: 2000 }); else setTimeout(weltSicher, 400);

  // Die Kamera: faehrt die Bahn entlang und schaut ein Stueck voraus, immer waagerecht
  // (sie giert nur, nickt und rollt nie) -- der Raum zieht an ihr vorbei, nichts
  // dreht sich ihr entgegen
  function kamera(q) {
    const u = fahrt(q);
    const pos = bahn(u);
    const ziel = bahn(Math.min(ZIEL_U, u + 0.035));
    const r = waagerecht(sub(ziel, pos));
    return { pos, vorn: r.vorn, rechts: r.rechts, oben: r.oben, u };
  }

  function projiziere(k, p, f) {
    const rel = sub(p, k.pos);
    const zc = dot(rel, k.vorn);
    if (zc < 8) return null;
    return { x: B / 2 + (dot(rel, k.rechts) / zc) * f, y: H / 2 - (dot(rel, k.oben) / zc) * f, z: zc };
  }

  // Sichtbarkeit nach Tiefe: nah weich einblenden, fern im Dunst verschwinden
  const tiefe = (z, fern) => clamp((z - 60) / 240, 0, 1) * clamp(1 - (z - 300) / fern, 0, 1);

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

    // Zoom von der Erde bis in die Halle, in e-fachen Vergroesserungen
    const L = ZOOM_ENDE * glatt(clamp((p - ZOOM_VON) / (ZOOM_BIS - ZOOM_VON), 0, 1));
    const k = kamera(q);
    // Brennweite: auf dem schmalen Schirm 0,95 der Breite (Blick 56 Grad breit), auf
    // dem breiten 0,66 der Breite (Blick 74 Grad breit statt 86): so fuellen Planeten,
    // Band und Nebel das Bild auf dem Laptop aehnlich wie auf dem Handy. Sterne sind
    // auf grossen Schirmen etwas groesser, sonst sind sie dort im Verhaeltnis winzig
    const f = Math.max(Math.min(B, H) * 0.95, B * 0.66);
    const sk = clamp(Math.min(B, H) / 660, 1, 1.3);
    const innen = stueck(q, 0.2, 0.4);                        // in der Milchstrasse
    const himmel = auftauchen * (1 - stueck(L, 1.4, 2.8));     // Sterne weichen, wenn die Erde das Bild fuellt

    // Die Erde: wo sie im Bild steht und wie gross; beim Zoom wandert sie in die Mitte
    const erdeProj = projiziere(k, bahn(ZIEL_U), f);
    const zurMitte = stueck(p, 0.7, 0.76);
    const fx = misch(erdeProj ? erdeProj.x : B / 2, B / 2, zurMitte);
    const fy = misch(erdeProj ? erdeProj.y : H / 2, H / 2, zurMitte);
    const R = (erdeProj ? (ERDE_R * f) / erdeProj.z : 1) * Math.exp(L);
    const erdeSicht = stueck(q, 0.6, 0.7) * (1 - stueck(L, 5.0, 5.6));   // kommt von vorn und waechst

    // Die Milchstrasse voraus: waechst, bis sie das Bild fuellt, dann sind wir drin
    const galaxieSicht = auftauchen * (1 - stueck(q, 0.3, 0.46));
    if (galaxieSicht > 0 && welt.galaxie) {
      const gr = f * 0.21 * Math.exp(7.5 * q);
      ctx.save();
      ctx.translate(B / 2 + Math.sin(q * 3) * B * 0.03, H * 0.46);
      ctx.rotate(0.55 + q * 0.15);
      ctx.scale(1, 0.48);
      ctx.globalAlpha = galaxieSicht;
      ctx.drawImage(welt.galaxie, -gr, -gr, 2 * gr, 2 * gr);
      ctx.restore();
    }

    // Ferne Galaxien, weit draussen: schraege Scheiben, die langsam vorbeiziehen
    if (himmel > 0 && innen > 0 && welt.galaxie) {
      ctx.globalCompositeOperation = "source-over";
      for (const ga of welt.galaxien) {
        const q1 = projiziere(k, ga.p, f);
        if (!q1) continue;
        const r = (ga.r * f) / q1.z;
        if (r < 4 || q1.x + r < 0 || q1.x - r > B || q1.y + r < 0 || q1.y - r > H) continue;
        ctx.save();
        ctx.translate(q1.x, q1.y);
        ctx.rotate(ga.dreh);
        ctx.scale(1, ga.kipp);
        ctx.globalAlpha = himmel * innen * ga.a * clamp(1 - (q1.z - 4000) / 14000, 0.2, 1);
        ctx.drawImage(welt.galaxie, -r, -r, 2 * r, 2 * r);
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = "lighter";
    if (himmel > 0) {
      const rand = Math.max(B, H);
      // Die Glut des Bandes
      if (innen > 0) {
        for (const w of welt.bandGlut) {
          const q1 = projiziere(k, w.p, f);
          if (!q1) continue;
          const r = Math.min((w.r * f) / q1.z, rand * 0.6);
          if (q1.x + r < 0 || q1.x - r > B || q1.y + r < 0 || q1.y - r > H) continue;
          ctx.globalAlpha = himmel * innen * w.a * clamp(q1.z / 22000, 0.45, 1);   // nah blasser
          ctx.drawImage(fleck(w.farbe), q1.x - r, q1.y - r, 2 * r, 2 * r);
        }
      }
      // Sterne, gebuendelt nach Farbe und Helligkeit
      const eimer = [];
      for (let c = 0; c < STERN_FARBEN.length; c++) eimer.push([[], [], [], [], []]);
      const glanz = [];
      for (const s of welt.sterne) {
        const q1 = projiziere(k, s.p, f);
        if (!q1 || q1.x < -4 || q1.x > B + 4 || q1.y < -4 || q1.y > H + 4) continue;
        const dichte = s.band ? innen : 0.6 + 0.4 * innen;
        const a = himmel * dichte * s.hell * tiefe(q1.z, s.band ? 60000 : 20000) * (0.8 + 0.2 * Math.sin(zeit * 1.3 + s.phase));
        if (a < 0.02) continue;
        const g0 = s.band ? clamp((s.g * 6500) / q1.z, 1.0, 1.8) : clamp((s.g * 420) / q1.z, 1.5, 3.0);
        const g = g0 * sk;
        eimer[s.farbe][Math.min(4, Math.floor(a * 5))].push(q1.x, q1.y, g);
        if (s.hell > 0.95 && g0 > 1.7) glanz.push(q1.x, q1.y, g, a, s.farbe);
      }
      STERN_FARBEN.forEach((farbe, c) => {
        eimer[c].forEach((liste, st) => {
          if (!liste.length) return;
          ctx.fillStyle = `rgb(${farbe})`;
          ctx.globalAlpha = 0.5 + st * 0.125;
          ctx.beginPath();
          for (let i = 0; i < liste.length; i += 3) ctx.rect(liste[i] - liste[i + 2] / 2, liste[i + 1] - liste[i + 2] / 2, liste[i + 2], liste[i + 2]);
          ctx.fill();
        });
      });
      // Die hellsten mit einem Hof
      for (let i = 0; i < glanz.length; i += 5) {
        const r = glanz[i + 2] * 7;
        ctx.globalAlpha = glanz[i + 3] * 0.5;
        ctx.drawImage(fleck(STERN_FARBEN[glanz[i + 4]]), glanz[i] - r, glanz[i + 1] - r, 2 * r, 2 * r);
      }
      if (innen > 0) {
        // Staubwolken im Band: decken ab
        ctx.globalCompositeOperation = "source-over";
        for (const w of welt.bandStaub) {
          const q1 = projiziere(k, w.p, f);
          if (!q1) continue;
          const r = Math.min((w.r * f) / q1.z, rand * 0.4);
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
        const a = himmel * innen * clamp((q1.z - 20) / 120, 0, 1) * clamp(1 - q1.z / 1400, 0, 1);
        if (a < 0.03) continue;
        const g = clamp(200 / q1.z, 1.0, 3);
        ctx.globalAlpha = a;
        ctx.fillRect(q1.x - g / 2, q1.y - g / 2, g, g);
      }
      // Nebel: grosse Lichtwolken mit Struktur -- fuellt einer das ganze Bild, reicht
      // eine Flaeche in seiner Farbe (ein Rechteck statt eines riesigen Bildes)
      for (const w of welt.nebel) {
        const q1 = projiziere(k, w.p, f);
        if (!q1 || q1.z < 100) continue;
        const r = (w.r * f) / q1.z;
        if (q1.x + r < 0 || q1.x - r > B || q1.y + r < 0 || q1.y - r > H) continue;
        const a = himmel * innen * w.a * clamp(1 - (q1.z - 600) / 7000, 0, 1) * clamp((q1.z - 100) / 500, 0, 1);
        if (a < 0.005) continue;
        if (r > rand * 0.6) {
          ctx.globalAlpha = a * 0.3;
          ctx.fillStyle = `rgb(${w.farbe})`;
          ctx.fillRect(0, 0, B, H);
          continue;
        }
        ctx.save();
        ctx.translate(q1.x, q1.y);
        ctx.rotate(w.dreh + zeit * 0.01);
        ctx.globalAlpha = a;
        ctx.drawImage(w.bild, -r, -r, 2 * r, 2 * r);
        ctx.restore();
      }
    }

    // ---- Die Erde ----
    // Blick: erst ueber dem Atlantik, dann nach Europa
    const dreh = stueck(p, 0.7, 0.77);
    const laenge0 = misch(-30 + 4 * Math.sin(zeit * 0.1), ZIEL_LAENGE, dreh);
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
          weich: stueck(L, 3.4, 5.0),
          nacht: 1 + 0.3 * stueck(L, 3, 4.6),
          hell: 1 - 0.95 * stueck(L, 4.2, 5.2),
          atmo: 1 - stueck(L, 2, 3.5),
          alpha: erdeSicht,
        });
      } else {
        erdePunkte(fx, fy, R, laenge0, breite0, erdeSicht * (1 - stueck(L, 2.2, 3)), L);
      }
      // In die Atmosphaere: ein blauweisser Dunst, der aufzieht und sich wieder lichtet;
      // dann durch die Wolkendecke -- zwei Wolkenlagen ziehen vorbei und reissen auf
      const dunst = Math.sin(Math.PI * stueck(L, 0.5, 1.9)) * 0.28 * erdeSicht;
      if (dunst > 0.005) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = dunst;
        ctx.fillStyle = "#c9dcf5";
        ctx.fillRect(0, 0, B, H);
      }
      const wolkenflug = Math.sin(Math.PI * stueck(L, 1.3, 2.5)) * erdeSicht;
      if (wolkenflug > 0.01) {
        ctx.globalCompositeOperation = "source-over";
        const gr = Math.max(B, H) * (0.9 + 0.8 * stueck(L, 1.3, 2.5));
        for (let i = 0; i < 2; i++) {
          const x = B * (0.3 + i * 0.4) + Math.sin(zeit * 0.08 + i) * B * 0.05 - (L - 1.3) * B * 0.25 * (i ? -1 : 1);
          const y = H * (0.5 + (i ? 0.25 : -0.2));
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(i * 1.3 + L * 0.3);
          ctx.globalAlpha = wolkenflug * 0.8;
          ctx.drawImage(welt.nebel[0].bild, -gr, -gr, 2 * gr, 2 * gr);
          ctx.restore();
        }
        ctx.globalAlpha = wolkenflug * 0.35;
        ctx.fillStyle = "#eef3fb";
        ctx.fillRect(0, 0, B, H);
      }
    }

    // Planeten und der Mond: echte Kugeln (WebGL) -- fern liegt Dunst davor, der mit
    // der Naehe weicht; sie drehen sich langsam um die eigene Achse, das Licht kommt
    // von der Sonne hinter der Kamera, beim Vorbeiflug wandert es ueber die Kugel
    ctx.globalCompositeOperation = "source-over";
    const sonneSicht = [dot(SONNE_WELT, k.rechts), dot(SONNE_WELT, k.oben), -dot(SONNE_WELT, k.vorn)];
    const planetZeichnen = (pl, a) => {
      const m = projiziere(k, pl.p, f);
      if (!m) return;
      const R = (pl.r * f) / m.z;
      if (R < 0.8 || m.x + R * 2.6 < 0 || m.x - R * 2.6 > B || m.y + R * 2.6 < 0 || m.y - R * 2.6 > H) return;
      const dunst = pl.r > 60 ? clamp((m.z - 1500) / 2500, 0, 1) : clamp((m.z - 3000) / 7000, 0, 1);
      a *= clamp((m.z - 40) / 120, 0, 1) * (1 - stueck(dunst, 0.8, 1));
      if (a < 0.02) return;
      const laenge0 = pl.phase + (still ? 0 : zeit * pl.pl.tempo), breite0 = pl.pl.neigung;
      const kipp = pl.art === "ring" ? -0.18 : 0;
      if (pl.art === "ring") ringeZeichnen(m.x, m.y, R, true, a, kipp);
      if (pl.karte && pl.karte.textur && erde.gl) {
        kugelGl(m.x, m.y, R, laenge0, breite0, sonneSicht, pl.pl, pl.karte, a);
      } else {
        // ohne WebGL: eine schattierte Scheibe
        const gr = pl.pl.grund;
        const g = ctx.createRadialGradient(m.x - R * 0.4, m.y - R * 0.4, R * 0.1, m.x, m.y, R);
        g.addColorStop(0, `rgb(${gr[0]},${gr[1]},${gr[2]})`);
        g.addColorStop(0.7, `rgb(${Math.round(gr[0] * 0.5)},${Math.round(gr[1] * 0.5)},${Math.round(gr[2] * 0.5)})`);
        g.addColorStop(1, "rgb(4,4,8)");
        ctx.globalAlpha = a;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, Math.PI * 2); ctx.fill();
      }
      if (pl.art === "ring") ringeZeichnen(m.x, m.y, R, false, a, kipp);
      if (dunst > 0.02) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = a * dunst * 0.85;
        const r = R * (pl.art === "ring" ? 2.6 : 1.3);
        ctx.drawImage(fleck("8,10,18"), m.x - r, m.y - r, 2 * r, 2 * r);
      }
    };
    // erst, wenn die Kamera in der Galaxie ist -- ein Planet ausserhalb kann nicht sein
    const planetenSicht = himmel * stueck(q, 0.3, 0.38);
    if (planetenSicht > 0) for (const pl of welt.planeten) planetZeichnen(pl, planetenSicht);
    const mondSicht = erdeSicht * (1 - stueck(L, 0, 0.5));
    if (mondSicht > 0) planetZeichnen(welt.erdeMond, mondSicht);

    // ---- Das Rechenzentrum und der Computer ----
    const halle = stueck(L, 5.0, 5.6);
    if (halle > 0) halleZeichnen(L, halle, p, zeit, still);

    // ---- Das Ende: alles wird schwarz, dann der Spruch ----
    const dunkel = stueck(p, 0.96, 0.98);
    if (dunkel > 0) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = dunkel;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, B, H);
    }
    const spruch = stueck(p, 0.972, 0.992);
    if (spruch > 0) {
      ctx.globalAlpha = spruch;
      ctx.fillStyle = "#f4f2ee";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      gesperrt(SPRUCH, B / 2, H / 2, `500 ${Math.round(Math.min(44, B * 0.05))}px "Playfair Display", Georgia, serif`, 0.04);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
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

  // ---- Das Rechenzentrum: ein Gang zwischen Serverschraenken, am Ende der Tisch ----
  // Eigene kleine Welt: x quer (die Schraenke stehen ab 0,9), y hoch (Boden -0,9,
  // Decke 0,9), z in den Gang hinein; die Kamera faehrt von z = 0 bis vor den Tisch
  const TISCH_Z = 14.6, TISCH_Y = -0.2, MONITOR_BREITE = 0.55;   // in Einheiten der Halle
  function halleMasse() {
    const m = Math.min(B * (B < 700 ? 0.6 : 0.56), H * 0.6);    // Monitorbreite am Ende (px)
    const f2 = Math.min(B, H) * 0.9;
    const dz = (f2 * MONITOR_BREITE) / m;                        // Abstand zum Tisch am Ende
    const yKamera = TISCH_Y + (0.26 * H * dz) / f2;              // so liegt der Tisch bei 0,76 H
    return { m, f2, dz, yKamera, zEnde: TISCH_Z - dz };
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
  function halleZeichnen(L, sicht, p, zeit, still) {
    const hm = halleMasse();
    const zc = misch(0, hm.zEnde, stueck(L, HALLE_VON, ZOOM_ENDE));
    const P = (x, y, z) => { const dz = z - zc; if (dz < 0.05) return null; const s = hm.f2 / dz; return [B / 2 + x * s, H / 2 - (y - hm.yKamera) * s, s]; };
    const viereck = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); };
    ctx.globalCompositeOperation = "source-over";
    // Boden und Decke
    const horizont = H / 2;
    let g = ctx.createLinearGradient(0, horizont, 0, H);
    g.addColorStop(0, `rgba(10,13,20,${sicht.toFixed(3)})`);
    g.addColorStop(1, `rgba(22,27,38,${sicht.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, horizont, B, H - horizont);
    g = ctx.createLinearGradient(0, 0, 0, horizont);
    g.addColorStop(0, `rgba(8,10,16,${sicht.toFixed(3)})`);
    g.addColorStop(1, `rgba(3,4,8,${sicht.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, B, horizont);
    // Lichtstreifen an der Decke, mit Spiegelung am Boden
    for (let k = 0; k < 16; k++) {
      const z0 = 0.6 + k, a = P(-0.14, 0.88, z0), b = P(0.14, 0.88, z0), c = P(0.14, 0.88, z0 + 0.45), d = P(-0.14, 0.88, z0 + 0.45);
      if (!a || !b || !c || !d) continue;
      const nebel = clamp(1 - (z0 - zc) / 11, 0.1, 1) * sicht;
      ctx.fillStyle = `rgba(200,218,255,${(0.75 * nebel).toFixed(3)})`;
      viereck(a, b, c, d); ctx.fill();
      const a2 = P(-0.14, -0.9, z0), b2 = P(0.14, -0.9, z0), c2 = P(0.14, -0.9, z0 + 0.45), d2 = P(-0.14, -0.9, z0 + 0.45);
      if (a2 && b2 && c2 && d2) { ctx.fillStyle = `rgba(150,170,210,${(0.1 * nebel).toFixed(3)})`; viereck(a2, b2, c2, d2); ctx.fill(); }
    }
    // Die Schraenke, von hinten nach vorn
    for (let k = 14; k >= 0; k--) {
      const z0 = 1.2 + k;
      if (z0 + 0.85 < zc + 0.1) continue;
      const nebel = clamp(1 - (z0 - zc) / 10, 0.12, 1) * sicht;
      for (const s of [-1, 1]) {
        const x1 = s * 0.9, x2 = s * 1.6;
        const sa = P(x1, -0.9, z0 + 0.85), sb = P(x1, 0.78, z0 + 0.85), sc = P(x1, 0.78, z0), sd = P(x1, -0.9, z0);
        if (sa && sb && sc && sd) {
          ctx.fillStyle = `rgba(13,16,24,${nebel.toFixed(3)})`;
          viereck(sa, sb, sc, sd); ctx.fill();
          ctx.strokeStyle = `rgba(110,140,190,${(0.25 * nebel).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();
        }
        const fa = P(x1, -0.9, z0), fb = P(x1, 0.78, z0), fc = P(x2, 0.78, z0), fd = P(x2, -0.9, z0);
        if (!fa || !fb || !fc || !fd) continue;
        ctx.fillStyle = `rgba(9,11,17,${nebel.toFixed(3)})`;
        viereck(fa, fb, fc, fd); ctx.fill();
        ctx.strokeStyle = `rgba(110,140,190,${(0.35 * nebel).toFixed(3)})`; ctx.stroke();
        // Die Geraete im Schrank: Hoeheneinheiten als Linien, Leuchten davor
        const sk = fa[2];
        if (sk > 22) {
          ctx.strokeStyle = `rgba(110,140,190,${(0.14 * nebel).toFixed(3)})`;
          ctx.beginPath();
          for (let reihe = 0; reihe <= 8; reihe++) {
            const y = -0.82 + reihe * 0.2;
            const l1 = P(x1 + s * 0.03, y, z0 - 0.01), l2 = P(x2 - s * 0.03, y, z0 - 0.01);
            if (l1 && l2) { ctx.moveTo(l1[0], l1[1]); ctx.lineTo(l2[0], l2[1]); }
          }
          ctx.stroke();
          const gr = Math.max(1.5, sk * 0.018);
          for (let reihe = 0; reihe < 8; reihe++) {
            const y = -0.75 + reihe * 0.2;
            for (let sp = 0; sp < 2; sp++) {
              const x = s * (1.0 + sp * 0.22 + (s < 0 ? 0.25 : 0));
              const an = still || Math.sin(zeit * 2.3 + k * 1.7 + reihe * 0.9 + sp * 2.1 + s) > -0.3;
              if (!an) continue;
              const q1 = P(x, y, z0 - 0.01);
              if (!q1) continue;
              const farbe = (reihe + sp + k) % 5 === 0 ? "255,190,90" : (reihe + k) % 2 ? "90,220,130" : "90,160,255";
              ctx.fillStyle = `rgba(${farbe},${(0.9 * nebel).toFixed(3)})`;
              ctx.fillRect(q1[0] - gr / 2, q1[1] - gr / 2, gr, gr);
            }
          }
        }
      }
    }
    // Die Wand am Ende und der Tisch
    const wa = P(-2, -0.9, TISCH_Z + 0.9), wb = P(2, -0.9, TISCH_Z + 0.9), wc = P(2, 0.9, TISCH_Z + 0.9), wd = P(-2, 0.9, TISCH_Z + 0.9);
    if (wa && wb && wc && wd) { ctx.fillStyle = `rgba(6,8,12,${sicht.toFixed(3)})`; viereck(wa, wb, wc, wd); ctx.fill(); }
    const anker = P(0, TISCH_Y, TISCH_Z);
    if (!anker) return;
    const m = (hm.f2 * MONITOR_BREITE) / (TISCH_Z - zc);
    computerZeichnen(anker[0], anker[1], m, sicht, p, zeit, still);
  }

  // Der Computer auf dem Tisch: Monitor, daneben der Tower mit Glasseite und farbigem
  // Licht, Tastatur, Maus -- auf Holz, in einem Raum mit Farbe. m = Breite des
  // Monitorbilds in Bildpunkten, (ax, ay) = Fuss des Monitors.
  function computerZeichnen(ax, ay, m, sicht, p, zeit, still) {
    const glas = stueck(p, 0.865, 0.885);      // das Gehaeuse wird durchsichtig
    const fluss = stueck(p, 0.87, 0.89) * (1 - stueck(p, 0.93, 0.94));   // die Platine arbeitet, bis das Zeichen da ist
    const blitz = Math.sin(Math.PI * stueck(p, 0.932, 0.94));   // kurzes Aufleuchten
    const logo = stueck(p, 0.934, 0.946);      // das Zeichen erscheint
    const schrift = stueck(p, 0.942, 0.955);
    const einzeln = m > 40;
    const hue = still ? 200 : (zeit * 35) % 360;   // das wandernde Farblicht im Gehaeuse
    const farblicht = (versatz, a) => `hsla(${(hue + versatz) % 360},85%,62%,${a.toFixed(3)})`;
    const schmal = B < 700;
    ctx.globalCompositeOperation = "source-over";

    // Licht von der Decke ueber dem Tisch, warm
    ctx.globalAlpha = sicht;
    let g = ctx.createRadialGradient(ax, ay - 0.5 * m, 0, ax, ay - 0.5 * m, 1.6 * m);
    g.addColorStop(0, "rgba(190,170,140,0.22)"); g.addColorStop(1, "rgba(190,170,140,0)");
    ctx.fillStyle = g; ctx.fillRect(ax - 1.6 * m, ay - 2.1 * m, 3.2 * m, 3.2 * m);
    // Der Tisch: Holz, mit Maserung
    const tisch = ctx.createLinearGradient(0, ay - 0.12 * m, 0, ay + 0.1 * m);
    tisch.addColorStop(0, "#6a4a30");
    tisch.addColorStop(1, "#3e2a1a");
    ctx.fillStyle = tisch;
    ctx.beginPath();
    ctx.moveTo(ax - 1.45 * m, ay + 0.1 * m); ctx.lineTo(ax + 1.45 * m, ay + 0.1 * m);
    ctx.lineTo(ax + 1.15 * m, ay - 0.12 * m); ctx.lineTo(ax - 1.15 * m, ay - 0.12 * m);
    ctx.closePath(); ctx.fill();
    if (einzeln) {
      ctx.strokeStyle = "rgba(30,18,8,0.35)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9; ctx.moveTo(ax - 1.15 * m + (ax + 1.15 * m - (ax - 1.15 * m)) * t, ay - 0.12 * m); ctx.lineTo(ax - 1.45 * m + 2.9 * m * t, ay + 0.1 * m); }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,230,200,0.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax - 1.45 * m, ay + 0.1 * m + 0.5); ctx.lineTo(ax + 1.45 * m, ay + 0.1 * m + 0.5); ctx.stroke();
    // Schatten unter Monitor und Tower
    const tOff = schmal ? 0.6 : 0.72;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.ellipse(ax, ay + 0.01 * m, 0.3 * m, 0.035 * m, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ax + (tOff - 0.1) * m, ay + 0.03 * m, 0.32 * m, 0.04 * m, 0, 0, Math.PI * 2); ctx.fill();

    // ---- Der Tower rechts, mit Glasseite nach links: Deckel, Vorderseite, Glas ----
    const tx = ax + tOff * m, tb = ay + 0.02 * m, th = 0.72 * m, tw = (schmal ? 0.18 : 0.24) * m;
    const dxT = -(schmal ? 0.34 : 0.46) * m, dyT = -0.075 * m;   // die Tiefe des Gehaeuses, nach hinten links
    ctx.globalAlpha = sicht;
    ctx.fillStyle = "#1c1f26";
    ctx.beginPath(); ctx.moveTo(tx, tb - th); ctx.lineTo(tx + tw, tb - th); ctx.lineTo(tx + tw + dxT, tb - th + dyT); ctx.lineTo(tx + dxT, tb - th + dyT); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(200,210,230,0.35)"; ctx.stroke();
    g = ctx.createLinearGradient(tx, 0, tx + tw, 0);
    g.addColorStop(0, "#1a1d24"); g.addColorStop(1, "#111318");
    ctx.fillStyle = g;
    ctx.fillRect(tx, tb - th, tw, th);
    ctx.strokeStyle = "rgba(200,210,230,0.4)"; ctx.strokeRect(tx + 0.5, tb - th + 0.5, tw - 1, th - 1);
    if (einzeln) {
      // Luftgitter aus Punkten, Lichtstreifen am Rand, Knopf mit Ring
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      for (let r = 0; r < 14; r++) for (let c = 0; c < 5; c++) {
        const x = tx + tw * (0.2 + c * 0.15), y = tb - th * 0.72 + r * th * 0.045;
        ctx.fillRect(x, y, Math.max(1, tw * 0.05), Math.max(1, tw * 0.05));
      }
      g = ctx.createLinearGradient(0, tb - th, 0, tb);
      g.addColorStop(0, farblicht(0, 0.9)); g.addColorStop(0.5, farblicht(120, 0.9)); g.addColorStop(1, farblicht(240, 0.9));
      ctx.fillStyle = g;
      ctx.fillRect(tx + 1, tb - th + 0.04 * m, Math.max(1.5, tw * 0.035), th - 0.08 * m);
      ctx.strokeStyle = "rgba(220,230,255,0.8)"; ctx.lineWidth = Math.max(1, tw * 0.02);
      ctx.beginPath(); ctx.arc(tx + tw * 0.55, tb - th * 0.9, tw * 0.07, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(140,200,255,${(0.6 + 0.4 * fluss).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(tx + tw * 0.55, tb - th * 0.9, tw * 0.03, 0, Math.PI * 2); ctx.fill();
    }
    // Das Innere, durch das Glas: erst dunkel, dann die Platine
    ctx.save();
    ctx.transform(dxT, dyT, 0, -th, tx, tb);   // Einheiten der Glasscheibe: u quer, v hoch
    ctx.fillStyle = "#07080c";
    ctx.fillRect(0, 0, 1, 1);
    if (glas > 0) platineZeichnen(glas, fluss, zeit, still, farblicht);
    ctx.restore();
    // Die Glasscheibe mit Spiegelung
    ctx.globalAlpha = sicht;
    ctx.fillStyle = `rgba(10,12,18,${(0.96 - 0.86 * glas).toFixed(3)})`;
    ctx.beginPath(); ctx.moveTo(tx, tb); ctx.lineTo(tx, tb - th); ctx.lineTo(tx + dxT, tb - th + dyT); ctx.lineTo(tx + dxT, tb + dyT); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(200,210,230,0.45)"; ctx.lineWidth = 1; ctx.stroke();
    const spiegel = ctx.createLinearGradient(tx + dxT, tb - th, tx, tb);
    spiegel.addColorStop(0, "rgba(255,255,255,0)");
    spiegel.addColorStop(0.4, `rgba(255,255,255,${(0.11 * sicht).toFixed(3)})`);
    spiegel.addColorStop(0.5, "rgba(255,255,255,0)");
    ctx.fillStyle = spiegel; ctx.fill();

    // ---- Der Monitor ----
    const sx = ax, hb = 0.5 * m, hh = 0.28 * m;
    const unten = ay - 0.1 * m;                 // Unterkante des Gehaeuses
    const sy = unten - 0.04 * m - 0.025 * m - hh;   // Mitte des Schirms
    ctx.globalAlpha = sicht;
    ctx.fillStyle = "#14161b";
    ctx.beginPath(); ctx.ellipse(sx, ay, 0.17 * m, 0.032 * m, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(200,210,230,0.35)"; ctx.stroke();
    ctx.fillStyle = "#15171c";
    ctx.beginPath(); ctx.moveTo(sx - 0.03 * m, unten); ctx.lineTo(sx + 0.03 * m, unten); ctx.lineTo(sx + 0.035 * m, ay); ctx.lineTo(sx - 0.035 * m, ay); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#121419";
    rundRechteck(sx - hb - 0.025 * m, sy - hh - 0.025 * m, 2 * hb + 0.05 * m, 2 * hh + 0.065 * m, 0.012 * m);
    ctx.fill();
    ctx.strokeStyle = "rgba(200,210,230,0.45)"; ctx.stroke();
    // der Schirm ist an: er rechnet die Formeln durch, die im Prozessor ankommen --
    // bis das Zeichen kommt
    const an = 1;
    g = ctx.createRadialGradient(sx, sy, 0, sx, sy, hb * 1.1);
    g.addColorStop(0, "#101a30"); g.addColorStop(1, "#06080f");
    ctx.fillStyle = g;
    ctx.fillRect(sx - hb, sy - hh, 2 * hb, 2 * hh);
    if (logo < 1 && einzeln) konsoleZeichnen(sx, sy, hb, hh, m, p, zeit, still, sicht * (1 - logo));
    if (blitz > 0) {
      ctx.globalAlpha = sicht * blitz * 0.9;
      ctx.fillStyle = "#dfe6f5";
      ctx.fillRect(sx - hb, sy - hh, 2 * hb, 2 * hh);
    }
    if (logo > 0) {
      ctx.globalAlpha = sicht * logo;
      g = ctx.createRadialGradient(sx, sy, 0, sx, sy, hb * 1.1);
      g.addColorStop(0, "#16203a"); g.addColorStop(1, "#070a14");
      ctx.fillStyle = g;
      ctx.fillRect(sx - hb, sy - hh, 2 * hb, 2 * hh);
    }
    // das Zeichen und die Schrift
    if (logo > 0) {
      const sz = 0.26 * m, zx = sx, zy = sy - 0.06 * m;
      ctx.globalAlpha = sicht * logo;
      ctx.fillStyle = "#f4f2ee";
      for (const b of [{ x: 10, y: 22, b: 20, h: 56 }, { x: 40, y: 8, b: 20, h: 84 }, { x: 70, y: 22, b: 20, h: 56 }]) {
        ctx.fillRect(zx + (b.x / 100 - 0.5) * sz, zy + (b.y / 100 - 0.5) * sz, (b.b / 100) * sz, (b.h / 100) * sz);
      }
      if (schrift > 0) {
        ctx.globalAlpha = sicht * schrift;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        const wy = zy + sz * 0.5 + Math.max(20, 0.07 * m);
        ctx.fillStyle = "#f4f2ee";
        gesperrt("JKHD", zx, wy, `800 ${Math.round(Math.max(15, m * 0.05))}px Manrope, "Segoe UI", sans-serif`, 0.34);
        ctx.fillStyle = "#cfcdc8";
        gesperrt("Quant Systems", zx, wy + Math.max(16, m * 0.045), `700 ${Math.round(Math.max(10, m * 0.023))}px Manrope, "Segoe UI", sans-serif`, 0.05);
        ctx.fillStyle = "#9d9d99";
        gesperrt("Just Know How to Dominate.", zx, wy + Math.max(30, m * 0.085), `${Math.round(Math.max(9, m * 0.02))}px "Cascadia Code", Consolas, monospace`, 0.03);
      }
    }
    // Glanz auf dem Glas des Monitors, Betriebslicht
    ctx.globalAlpha = sicht;
    g = ctx.createLinearGradient(sx - hb, sy - hh, sx + hb * 0.3, sy + hh);
    g.addColorStop(0, "rgba(255,255,255,0.06)"); g.addColorStop(0.45, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(sx - hb, sy - hh, 2 * hb, 2 * hh);
    ctx.fillStyle = `rgba(120,220,160,${(0.6 + 0.4 * an).toFixed(3)})`;
    ctx.fillRect(sx + hb - 0.03 * m, unten - 0.018 * m, Math.max(1.5, 0.006 * m), Math.max(1.5, 0.006 * m));
    // Das Licht des Schirms faellt in den Raum, wenn er an ist
    if (an > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = sicht * an;
      g = ctx.createRadialGradient(sx, sy + hh, 0, sx, sy + hh, m * 1.2);
      g.addColorStop(0, "rgba(120,150,210,0.16)"); g.addColorStop(1, "rgba(120,150,210,0)");
      ctx.fillStyle = g; ctx.fillRect(sx - m * 1.2, sy - m * 0.4, m * 2.4, m * 1.8);
      ctx.globalCompositeOperation = "source-over";
    }

    // ---- Tastatur mit Lichtsaum und Maus ----
    if (einzeln) {
      ctx.globalAlpha = sicht;
      const kb = 0.5 * m, kh = 0.05 * m, kx = ax - 0.3 * m, ky = ay + 0.025 * m;
      ctx.globalCompositeOperation = "lighter";
      g = ctx.createLinearGradient(kx, 0, kx + kb, 0);
      g.addColorStop(0, farblicht(0, 0.18)); g.addColorStop(0.5, farblicht(120, 0.18)); g.addColorStop(1, farblicht(240, 0.18));
      ctx.fillStyle = g;
      ctx.fillRect(kx - 0.03 * m, ky - 0.012 * m, kb + 0.07 * m, kh + 0.03 * m);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#15171c";
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + kb, ky); ctx.lineTo(kx + kb + 0.02 * m, ky + kh); ctx.lineTo(kx - 0.02 * m, ky + kh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(200,210,230,0.35)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = "rgba(200,210,230,0.14)";
      ctx.beginPath();
      for (let i = 1; i < 4; i++) { const y = ky + (kh * i) / 4; ctx.moveTo(kx + 0.01 * m, y); ctx.lineTo(kx + kb - 0.01 * m, y); }
      for (let i = 1; i < 15; i++) { const x = kx + (kb * i) / 15; ctx.moveTo(x, ky + 0.005 * m); ctx.lineTo(x + 0.01 * m, ky + kh - 0.005 * m); }
      ctx.stroke();
      ctx.fillStyle = "#15171c";
      rundRechteck(ax + 0.32 * m, ay + 0.02 * m, 0.07 * m, 0.05 * m, 0.025 * m); ctx.fill();
      ctx.strokeStyle = "rgba(200,210,230,0.35)"; ctx.stroke();
      ctx.fillStyle = "rgba(255,80,80,0.85)";
      ctx.fillRect(ax + 0.352 * m, ay + 0.028 * m, Math.max(1, 0.006 * m), Math.max(1, 0.006 * m));
    }

  }

  // Der Monitor rechnet die Formeln durch -- im Takt des Scrollens: mit jedem Stueck
  // Weg kommt eine Zeile dazu (Formel, Pfeil, Ergebnis); bei der juengsten laufen
  // die Ziffern, bis sie sich gesetzt haben; darunter blinkt die Marke
  const RECHNEN_VON = 0.87, RECHNEN_BIS = 0.93;
  function konsoleZeichnen(sx, sy, hb, hh, m, p, zeit, still, sicht) {
    const g = Math.max(9, m * 0.026), zh = g * 1.75;
    const anzahl = Math.max(3, Math.floor((2 * hh - g * 1.6) / zh));
    const lauf = still ? FORMELN.length : clamp((p - RECHNEN_VON) / (RECHNEN_BIS - RECHNEN_VON), 0, 1) * FORMELN.length;
    const dran = Math.min(FORMELN.length - 1, Math.floor(lauf));   // diese Zeile rechnet gerade
    const bruch = still ? 1 : lauf - Math.floor(lauf);
    const zeilen = [];
    for (let i = Math.max(0, dran - anzahl + 1); i <= dran; i++) zeilen.push(i);
    ctx.save();
    ctx.beginPath(); ctx.rect(sx - hb, sy - hh, 2 * hb, 2 * hh); ctx.clip();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const links = sx - hb + g * 1.2;
    zeilen.forEach((i, k) => {
      const y = sy - hh + g * 1.3 + k * zh;
      const fertig = i < dran ? 1 : clamp(bruch / 0.75, 0, 1);
      ctx.globalAlpha = sicht;
      ctx.fillStyle = "#d8e2ff";
      const breite = formelZeichnen(FORMELN[i], links + 100 * g, y, g * 1.05, true);
      let wert = ERGEBNISSE[i] || "";
      if (fertig < 1) {
        // die Ziffern laufen noch, von links nach rechts setzen sie sich
        wert = wert.replace(/[0-9]/g, (d, j) => (j / wert.length < fertig ? d : String(Math.floor(((Math.sin(zeit * 41 + j * 7.3 + i) + 1) * 5) % 10))));
      }
      ctx.font = `${g.toFixed(1)}px "Cascadia Code", Consolas, monospace`;
      ctx.fillStyle = fertig < 1 ? "#ffd27a" : "#9fe3b0";
      ctx.fillText("  →  " + wert, links + breite, y);
    });
    // die Marke blinkt
    if (still || Math.sin(zeit * 6) > 0) {
      ctx.globalAlpha = sicht * 0.9;
      ctx.fillStyle = "#9fe3b0";
      ctx.fillRect(links, sy - hh + g * 1.3 + zeilen.length * zh - g * 0.45, g * 0.55, g * 0.9);
    }
    ctx.restore();
  }

  // Die Platine im Gehaeuse (Einheiten der Glasscheibe, u quer 0..1, v hoch 0..1):
  // Netzteil unten, Grafikkarte, der Prozessor mit Kuehler und Heatpipes, Arbeits-
  // speicher mit Lichtleisten, Chipsatz, Kondensatoren, Kabel, Luefter vorn mit
  // farbigen Ringen, Lichtleiste oben -- und die Leiterbahnen, auf denen Impulse
  // zum Prozessor laufen
  function platineZeichnen(glas, fluss, zeit, still, farblicht) {
    ctx.globalAlpha = glas;
    // Leiterplatte
    ctx.fillStyle = "#1c5a3c";
    ctx.fillRect(0.1, 0.1, 0.84, 0.82);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let i = 0; i < 6; i++) ctx.fillRect(0.12 + i * 0.14, 0.12, 0.07, 0.78);
    ctx.strokeStyle = "rgba(120,200,150,0.5)"; ctx.lineWidth = 0.004;
    ctx.strokeRect(0.1, 0.1, 0.84, 0.82);
    // Leiterbahnen in Kupfer
    ctx.strokeStyle = `rgba(226,176,104,${(0.6 + 0.4 * fluss).toFixed(3)})`;
    ctx.lineWidth = 0.005;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (const bahn of welt.bahnen) bahn.punkte.forEach((pt, i) => { if (i) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]); });
    ctx.stroke();
    // Netzteil (unten), Grafikkarte, Chipsatz
    ctx.fillStyle = "#15161b"; ctx.fillRect(0.12, 0.12, 0.3, 0.13);
    ctx.strokeStyle = "rgba(200,210,230,0.3)"; ctx.lineWidth = 0.003; ctx.strokeRect(0.12, 0.12, 0.3, 0.13);
    ctx.beginPath(); ctx.arc(0.27, 0.185, 0.045, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#1e2128"; ctx.fillRect(0.15, 0.3, 0.42, 0.12);
    ctx.strokeRect(0.15, 0.3, 0.42, 0.12);
    ctx.strokeStyle = "rgba(200,210,230,0.4)";
    ctx.beginPath(); ctx.arc(0.28, 0.36, 0.045, 0, Math.PI * 2); ctx.moveTo(0.495, 0.36); ctx.arc(0.45, 0.36, 0.045, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(240,244,255,0.85)"; ctx.fillRect(0.17, 0.405, 0.1, 0.008);   // Leuchtschrift der Karte
    ctx.fillStyle = "#2a2d35"; ctx.fillRect(0.6, 0.3, 0.08, 0.08);
    // Arbeitsspeicher mit Lichtleisten
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "#1a1d25"; ctx.fillRect(0.76 + i * 0.03, 0.45, 0.02, 0.4);
      ctx.fillStyle = `rgba(226,186,110,${(0.6 + 0.4 * fluss).toFixed(3)})`; ctx.fillRect(0.76 + i * 0.03, 0.45, 0.02, 0.015);
      ctx.fillStyle = farblicht(60 * i, 0.9); ctx.fillRect(0.76 + i * 0.03, 0.845, 0.02, 0.012);
    }
    // Kabel: rot-schwarzer Strang vom Netzteil, blaues Kabel zur Karte
    ctx.lineWidth = 0.012; ctx.lineCap = "round";
    ctx.strokeStyle = "#8a2a24";
    ctx.beginPath(); ctx.moveTo(0.42, 0.2); ctx.quadraticCurveTo(0.9, 0.22, 0.9, 0.5); ctx.stroke();
    ctx.strokeStyle = "#1a1a1f"; ctx.lineWidth = 0.008;
    ctx.beginPath(); ctx.moveTo(0.42, 0.21); ctx.quadraticCurveTo(0.88, 0.24, 0.885, 0.5); ctx.stroke();
    ctx.strokeStyle = "#2b5fd9"; ctx.lineWidth = 0.006;
    ctx.beginPath(); ctx.moveTo(0.9, 0.3); ctx.quadraticCurveTo(0.75, 0.28, 0.57, 0.36); ctx.stroke();
    // Kondensatoren
    for (const kd of welt.kondensatoren) {
      ctx.fillStyle = "#3a3f4a"; ctx.beginPath(); ctx.arc(kd[0], kd[1], 0.011, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.beginPath(); ctx.arc(kd[0] - 0.003, kd[1] - 0.003, 0.004, 0, Math.PI * 2); ctx.fill();
    }
    // Luefter vorn, mit farbigen Ringen; Lichtleiste oben im Gehaeuse
    for (const v of [0.32, 0.64]) {
      ctx.fillStyle = "#101217"; ctx.beginPath(); ctx.arc(0.06, v, 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = farblicht(v * 300, 0.35 + 0.6 * fluss); ctx.lineWidth = 0.009;
      ctx.beginPath(); ctx.arc(0.06, v, 0.085, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(200,210,230,0.3)"; ctx.lineWidth = 0.004;
      const dreh = still ? 0 : zeit * 4;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const w = dreh + (i / 5) * Math.PI * 2; ctx.moveTo(0.06, v); ctx.lineTo(0.06 + Math.cos(w) * 0.075, v + Math.sin(w) * 0.075); }
      ctx.stroke();
    }
    const leiste = ctx.createLinearGradient(0.05, 0, 0.95, 0);
    leiste.addColorStop(0, farblicht(0, 0.85)); leiste.addColorStop(0.5, farblicht(120, 0.85)); leiste.addColorStop(1, farblicht(240, 0.85));
    ctx.fillStyle = leiste; ctx.fillRect(0.05, 0.955, 0.9, 0.01);
    // Der Prozessor mit Kuehler: Lamellen, Heatpipes in Kupfer, darin der Kern
    ctx.fillStyle = "#2a2d33"; ctx.fillRect(0.52, 0.52, 0.2, 0.2);
    ctx.strokeStyle = "rgba(200,210,230,0.4)"; ctx.lineWidth = 0.003; ctx.strokeRect(0.52, 0.52, 0.2, 0.2);
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    for (let i = 1; i < 8; i++) { const v = 0.52 + i * 0.025; ctx.moveTo(0.52, v); ctx.lineTo(0.72, v); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(214,130,70,0.85)"; ctx.lineWidth = 0.007;
    ctx.beginPath(); ctx.moveTo(0.54, 0.73); ctx.lineTo(0.54, 0.5); ctx.moveTo(0.7, 0.73); ctx.lineTo(0.7, 0.5); ctx.stroke();
    ctx.fillStyle = `rgba(255,220,170,${(0.2 + 0.8 * fluss).toFixed(3)})`;
    ctx.fillRect(0.6, 0.6, 0.04, 0.04);
    if (fluss > 0) {
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(0.62, 0.62, 0, 0.62, 0.62, 0.3);
      g.addColorStop(0, `rgba(255,210,150,${(0.8 * fluss * glas).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,210,150,0)");
      ctx.fillStyle = g; ctx.fillRect(0.3, 0.3, 0.64, 0.64);
      // Impulse auf den Leiterbahnen, alle auf den Prozessor zu
      ctx.fillStyle = "#ffe7c0";
      ctx.strokeStyle = "#ffd9a0";
      for (const bahn of welt.bahnen) {
        for (const im of bahn.impulse) {
          const sw = ((still ? 0.6 : zeit * im.tempo + im.phase) % 1) * bahn.laenge;
          const xy = aufBahn(bahn, sw), hxy = aufBahn(bahn, Math.max(0, sw - 0.05));
          const h = fluss * glas * clamp(sw / 0.1, 0, 1);
          ctx.globalAlpha = h * 0.5; ctx.lineWidth = 0.009;
          ctx.beginPath(); ctx.moveTo(hxy[0], hxy[1]); ctx.lineTo(xy[0], xy[1]); ctx.stroke();
          ctx.globalAlpha = h;
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 0.009, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }
  }
  function aufBahn(bahn, s) {
    let i = 1;
    while (i < bahn.laengen.length - 1 && bahn.laengen[i] < s) i++;
    const t = (s - bahn.laengen[i - 1]) / (bahn.laengen[i] - bahn.laengen[i - 1] || 1);
    const a = bahn.punkte[i - 1], b = bahn.punkte[i];
    return [misch(a[0], b[0], t), misch(a[1], b[1], t)];
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
  let bildNr = 0;
  // Messgeraet: mittlere Zeichenzeit je Bild (ms) und der Abstand der Bilder; einmal je
  // Sekunde an der Leinwand (data-zeichenzeit, data-qualitaet) -- und wenn die Bilder
  // laenger als 24 ms auseinanderliegen, geht die Aufloesung eine Stufe herunter
  // (Gemessen wird die Zeichenzeit selbst, nicht der Abstand der Bilder: der haengt
  // am Takt des Bildschirms -- auf einem 30-Hz-Schirm oder im Stromsparmodus sind
  // 33 ms normal und kein Ruckeln.)
  let messSumme = 0, messAnzahl = 0, messSeit = 0, geprueft = 0, langsam = 0;
  function schleife(jetzt) {
    if (!laeuft) return;
    const dt = Math.min(0.05, (jetzt - letzte) / 1000 || 0.016);
    letzte = jetzt;
    const zielP = zielFortschritt();
    p += (zielP - p) * (1 - Math.exp(-dt * 6));   // weich, unabhaengig von der Bildrate
    if (Math.abs(zielP - p) < 0.0004) p = zielP;
    const ruhig = Math.abs(zielP - p) < 0.00001;
    bildNr++;
    if (!ruhig || bildNr % 2 === 0) {   // bei Stillstand reicht jedes zweite Bild
      const t0 = performance.now();
      bild(p, jetzt / 1000, false);
      messSumme += performance.now() - t0;
      messAnzahl++;
    }
    if (jetzt - messSeit > 1000) {
      const zeichenzeit = messAnzahl ? messSumme / messAnzahl : 0;
      leinwand.dataset.zeichenzeit = messAnzahl ? zeichenzeit.toFixed(1) : "";
      leinwand.dataset.qualitaet = qualitaet.toFixed(2);
      messSumme = 0; messAnzahl = 0; messSeit = jetzt;
      // erst zwei langsame Sekunden hintereinander zaehlen (die erste Sekunde einer
      // Phase enthaelt das Aufwaermen der Schrift-Zwischenspeicher)
      langsam = zeichenzeit > 11 && !ruhig ? langsam + 1 : 0;
      if (langsam >= 2 && jetzt - geprueft > 2500 && qualitaet > 0.55) {
        qualitaet -= 0.15;
        geprueft = jetzt;
        langsam = 0;
        groesseAnpassen();
      }
    }
    requestAnimationFrame(schleife);
  }
  function starten() {
    if (laeuft || reduziert.matches) return;
    weltSicher();
    laeuft = true;
    letzte = performance.now();
    geprueft = letzte;
    p = zielFortschritt();
    requestAnimationFrame(schleife);
  }
  function anhalten() { laeuft = false; }

  function einrichten() {
    abschnitt.classList.toggle("ist-still", reduziert.matches);
    groesseAnpassen();
    if (reduziert.matches) { anhalten(); weltSicher(); bild(0.95, 0, true); }
  }

  abschnitt.classList.add("ist-aktiv");
  einrichten();
  // Die Schriften (Playfair, Manrope) sind vielleicht noch nicht geladen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { schriftenBereit = true; if (reduziert.matches) bild(0.95, 0, true); });
  else schriftenBereit = true;

  new IntersectionObserver((eintraege) => {
    if (eintraege.some((e) => e.isIntersecting)) starten();
    else anhalten();
  }).observe(abschnitt);
  // Die Erdbilder holen, sobald der Abschnitt in die Naehe kommt (einen Bildschirm davor)
  new IntersectionObserver((eintraege) => {
    if (eintraege.some((e) => e.isIntersecting)) erdeLaden();
  }, { rootMargin: "100% 0px" }).observe(abschnitt);

  window.addEventListener("resize", () => { groesseAnpassen(); if (reduziert.matches) bild(0.95, 0, true); });
  if (reduziert.addEventListener) reduziert.addEventListener("change", einrichten);
})();
