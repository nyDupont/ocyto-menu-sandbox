// ---- Constante d'espace de noms SVG (obligatoire pour créer des éléments SVG) ----
const SVG_NS = "http://www.w3.org/2000/svg";

// ---- Brique de base : calcule les 6 sommets d'un hexagone pointe-en-haut ----
// cx, cy = centre ; r = rayon (cercle circonscrit). Renvoie la chaîne "x1,y1 x2,y2 ..."
function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (90 - i * 60); // 90°, 30°, -30°, ... en radians
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

// ---- Crée un élément <polygon> hexagonal et le renvoie ----
function makeHexPolygon(cx, cy, r) {
  const poly = document.createElementNS(SVG_NS, "polygon");
  poly.setAttribute("class", "hex");
  poly.setAttribute("points", hexPoints(cx, cy, r));
  return poly;
}

// ---- Génération de la ruche (1 centre + 6 autour) ----
function buildRuche() {
  const ruche = document.getElementById("ruche");
  const cx = 100, cy = 100, r = 30;
  const d = Math.sqrt(3) * r; // distance entre centres voisins

  // Hexagone central
  ruche.appendChild(makeHexPolygon(cx, cy, r));

  // 6 hexagones périphériques aux angles 0, 60, 120, 180, 240, 300
  for (let i = 0; i < 6; i++) {
    const theta = (Math.PI / 180) * (i * 60);
    const x = cx + d * Math.cos(theta);
    const y = cy - d * Math.sin(theta);
    ruche.appendChild(makeHexPolygon(x, y, r));
  }
  return ruche;
}

// ---- Génération de la colonne de menu ----
const menuEntries = ["Rafraîchir", "Signaler", "Découvrir"];

function buildMenu() {
  const menu = document.getElementById("menu");

  menuEntries.forEach((label) => {
    // Ligne : hexagone + libellé
    const item = document.createElement("div");
    item.setAttribute("class", "menu-item");

    // SVG de l'hexagone (viewBox 100x100, hexagone régulier centré)
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "menu-hex");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.appendChild(makeHexPolygon(50, 50, 45));

    // Libellé texte
    const span = document.createElement("span");
    span.setAttribute("class", "menu-label");
    span.textContent = label;

    item.appendChild(svg);
    item.appendChild(span);
    menu.appendChild(item);
  });

  return menu;
}

// ---- Construction au chargement ----
const ruche = buildRuche();
const menu = buildMenu();
const aide = document.getElementById("aide");

// ---- Interactions ----
ruche.addEventListener("click", () => {
  menu.classList.toggle("open");
});

aide.addEventListener("click", () => {
  menu.classList.toggle("show-labels");
});