// ---- Constante d'espace de noms SVG ----
const SVG_NS = "http://www.w3.org/2000/svg";

// ---- Arborescence (données, modifiables ici) ----
const arbre = [
  { nom: "Rafraîchir", enfants: [] },
  { nom: "Signaler",   enfants: ["Fonctionnel", "Disfonctionnel", "Danger"] },
  { nom: "Découvrir",  enfants: ["Parcours", "Promotions"] },
];

// ---- Brique de base : sommets d'un hexagone pointe-en-haut ----
function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (90 - i * 60);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

// ---- Crée un <polygon> hexagonal ----
function makeHexPolygon(cx, cy, r) {
  const poly = document.createElementNS(SVG_NS, "polygon");
  poly.setAttribute("class", "hex");
  poly.setAttribute("points", hexPoints(cx, cy, r));
  return poly;
}

// ---- Crée une "ligne" hexagone + libellé (réutilisée pour parents et enfants) ----
function makeItem(label) {
  const item = document.createElement("div");
  item.setAttribute("class", "menu-item");

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "menu-hex");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.appendChild(makeHexPolygon(50, 50, 45));

  const span = document.createElement("span");
  span.setAttribute("class", "menu-label");
  span.textContent = label;

  item.appendChild(svg);
  item.appendChild(span);
  return item;
}

// ---- Génération de la ruche (1 centre + 6 autour) ----
function buildRuche() {
  const ruche = document.getElementById("ruche");
  const cx = 100, cy = 100, r = 30;
  const d = Math.sqrt(3) * r;

  ruche.appendChild(makeHexPolygon(cx, cy, r));
  for (let i = 0; i < 6; i++) {
    const theta = (Math.PI / 180) * (i * 60);
    const x = cx + d * Math.cos(theta);
    const y = cy - d * Math.sin(theta);
    ruche.appendChild(makeHexPolygon(x, y, r));
  }
  return ruche;
}

// ---- Suivi de la catégorie actuellement ouverte (une seule à la fois) ----
let nodeOuvert = null;

// ---- Génération de la colonne de menu à partir de l'arbre ----
function buildMenu() {
  const menu = document.getElementById("menu");

  arbre.forEach((categorie) => {
    // Bloc complet de la catégorie : sa ligne + ses enfants
    const node = document.createElement("div");
    node.setAttribute("class", "menu-node");

    // Ligne parente (hexagone cliquable + libellé)
    const parentItem = makeItem(categorie.nom);

    // Conteneur des enfants (masqué par défaut)
    const children = document.createElement("div");
    children.setAttribute("class", "children");
    categorie.enfants.forEach((nomEnfant) => {
      children.appendChild(makeItem(nomEnfant));
    });

    // Clic sur la catégorie
    parentItem.addEventListener("click", () => {
      const dejaOuvert = node.classList.contains("open");

      // 1. On referme systématiquement toute catégorie ouverte
      if (nodeOuvert) {
        nodeOuvert.classList.remove("open");
        nodeOuvert = null;
      }

      // 2. On ouvre la catégorie cliquée seulement si elle a des enfants
      //    et qu'elle n'était pas déjà ouverte (sinon un re-clic la laisse fermée = toggle)
      if (categorie.enfants.length > 0 && !dejaOuvert) {
        node.classList.add("open");
        nodeOuvert = node;
      }

      // 3. #menu reflète s'il reste une catégorie ouverte (pour l'aide contextuelle)
      menu.classList.toggle("categorie-ouverte", nodeOuvert !== null);
    });

    node.appendChild(parentItem);
    node.appendChild(children);
    menu.appendChild(node);
  });

  return menu;
}

// ---- Construction au chargement ----
const ruche = buildRuche();
const menu = buildMenu();
const aide = document.getElementById("aide");

// Ouvre/ferme la colonne de catégories avec animation de hauteur
function toggleMenu() {
  const estOuvert = menu.classList.contains("open");

  if (estOuvert) {
    // Fermeture
    menu.style.overflow = "hidden";
    // 1. Convertir l'éventuel "auto" en valeur chiffrée
    menu.style.height = menu.scrollHeight + "px";
    // 2. Forcer le navigateur à enregistrer cette hauteur (lecture = recalcul du layout)
    menu.offsetHeight;   // ligne volontaire : déclenche le reflow
    menu.classList.remove("open");
    // 3. Maintenant on anime vers 0
    menu.style.height = "0px";
  } else {
    // Ouverture : de 0 vers la hauteur naturelle
    menu.classList.add("open");
    menu.style.overflow = "hidden";
    menu.style.height = menu.scrollHeight + "px";
  }
}

// Quand l'animation se termine, on ajuste l'état final
menu.addEventListener("transitionend", (e) => {
  // On ne réagit qu'à la transition de hauteur du menu lui-même
  if (e.target !== menu || e.propertyName !== "height") return;

  if (menu.classList.contains("open")) {
    // Ouvert : hauteur flexible + overflow visible (pour ne pas couper les enfants)
    menu.style.height = "auto";
    menu.style.overflow = "visible";
  }
}, true);

ruche.addEventListener("click", toggleMenu);

aide.addEventListener("click", () => {
  menu.classList.toggle("show-labels");
});
