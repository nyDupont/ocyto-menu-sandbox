// ---- Constante d'espace de noms SVG ----
const SVG_NS = "http://www.w3.org/2000/svg";

// ---- Durée des animations (à garder synchronisée avec le CSS : 0.4s) ----
const DUREE = 400;        // ms, vitesse normale
const DUREE_RAPIDE = 200; // ms, fermeture via la ruche

// ---- Arborescence (données, modifiables ici) ----
const arbre = [
  { nom: "Rafraîchir", couleur: "#b8943c", enfants: [] },
  { nom: "Signaler",   couleur: "#2c3e50", enfants: [
    { nom: "Fonctionnel",    couleur: "#1f7a47", enfants: [] },
    { nom: "Disfonctionnel", couleur: "#a01b1b", enfants: [] },
    { nom: "Danger",         couleur: "#f39200", enfants: [] },
    { nom: "Suggestion",     couleur: "#6b4fb8", enfants: [] },
  ] },
  { nom: "Découvrir",  couleur: "#2c3e50", enfants: [
    { nom: "Parcours",   couleur: "#b0277b", enfants: [] },
    { nom: "Promotions", couleur: "#0e8aa8", enfants: [] },
  ] },
];

// ---- Liste à plat des feuilles, dans l'ordre de l'arbre ----
// Une feuille = un nœud sans enfants. L'ordre détermine la correspondance avec les hexagones de la ruche.
const feuilles = [];

function collecterFeuilles(noeuds) {
  noeuds.forEach((noeud) => {
    if (noeud.enfants && noeud.enfants.length > 0) {
      collecterFeuilles(noeud.enfants);   // descendre dans les enfants
    } else {
      noeud.active = true;                 // état initial : activée
      feuilles.push(noeud);                // l'objet feuille lui-même
    }
  });
}

collecterFeuilles(arbre);

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
function makeHexPolygon(cx, cy, r, couleur) {
  const poly = document.createElementNS(SVG_NS, "polygon");
  poly.setAttribute("class", "hex");
  poly.setAttribute("points", hexPoints(cx, cy, r));
  if (couleur) {
    poly.style.fill = couleur;
  }
  return poly;
}

// ---- Crée une "ligne" hexagone + libellé ----
function makeItem(noeud) {
  const item = document.createElement("div");
  item.setAttribute("class", "menu-item");

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "menu-hex");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.appendChild(makeHexPolygon(50, 50, 45, noeud.couleur));

  const span = document.createElement("span");
  span.setAttribute("class", "menu-label");
  span.textContent = noeud.nom;

  item.appendChild(svg);
  item.appendChild(span);

  // Une feuille (nœud sans enfants) devient un bouton toggleable
  const estFeuille = !noeud.enfants || noeud.enfants.length === 0;
  if (estFeuille) {
    appliquerEtatFeuille(svg, noeud);   // applique l'opacité initiale
    svg.addEventListener("click", (e) => {
      e.stopPropagation();              // ne pas déclencher l'ouverture du parent
      noeud.active = !noeud.active;     // bascule l'état
      appliquerEtatFeuille(svg, noeud); // met à jour l'opacité de l'hexagone
      majRuche();                       // répercute sur la ruche
    });
  }

  return item;
}

// ---- Applique l'apparence d'une feuille (opacité) selon son état actif ----
function appliquerEtatFeuille(svg, noeud) {
  svg.style.opacity = noeud.active ? "1" : "0.3";
  svg.style.cursor = "pointer";
}

// Tableau ordonné des polygones de la ruche : [centre, péri0, péri1, ... péri5]
const hexRuche = [];

// ---- Génération de la ruche (1 centre + 6 autour) ----
function buildRuche() {
  const ruche = document.getElementById("ruche");
  const cx = 100, cy = 100, r = 30;
  const d = Math.sqrt(3) * r;

  const centre = makeHexPolygon(cx, cy, r);
  ruche.appendChild(centre);
  hexRuche.push(centre);

  for (let i = 0; i < 6; i++) {
    const theta = (Math.PI / 180) * (i * 60);
    const x = cx + d * Math.cos(theta);
    const y = cy - d * Math.sin(theta);
    const hex = makeHexPolygon(x, y, r);
    ruche.appendChild(hex);
    hexRuche.push(hex);
  }
  return ruche;
}

// ---- Met à jour la couleur des hexagones de la ruche selon l'état des feuilles ----
function majRuche() {
  // On lit la couleur par défaut définie dans le CSS (:root)
  const couleurDefaut = getComputedStyle(document.documentElement)
    .getPropertyValue("--ruche-defaut").trim();

  feuilles.forEach((feuille, i) => {
    const hex = hexRuche[i];
    if (!hex) return;   // sécurité si moins d'hexagones que de feuilles
    hex.style.fill = feuille.active ? feuille.couleur : couleurDefaut;
  });
}

// ---- Suivi de la catégorie actuellement ouverte (une seule à la fois) ----
let nodeOuvert = null;

// ---- Génération de la colonne de menu à partir de l'arbre ----
function buildMenu() {
    const menu = document.getElementById("menu");

    const menuInner = document.createElement("div");
    menuInner.setAttribute("class", "menu-inner");

    arbre.forEach((categorie) => {
    const node = document.createElement("div");
    node.setAttribute("class", "menu-node");

    const parentItem = makeItem(categorie);

    const children = document.createElement("div");
    children.setAttribute("class", "children");

    const childrenInner = document.createElement("div");
    childrenInner.setAttribute("class", "children-inner");
    categorie.enfants.forEach((enfant) => {
      childrenInner.appendChild(makeItem(enfant));
    });
    children.appendChild(childrenInner);

    parentItem.addEventListener("click", () => {
      const dejaOuvert = node.classList.contains("open");

      // Toggle de CETTE catégorie uniquement (les autres restent dans leur état)
      if (categorie.enfants.length > 0) {
        if (dejaOuvert) {
          fermerEnfants(node);
        } else {
          ouvrirEnfants(node, children);
        }
      }

      // Aide contextuelle : actif s'il reste au moins une catégorie ouverte
      const auMoinsUneOuverte = menu.querySelector(".menu-node.open") !== null;
      menu.classList.toggle("categorie-ouverte", auMoinsUneOuverte);
    });

    node.appendChild(parentItem);
    node.appendChild(children);
    menuInner.appendChild(node);
  });

  menu.appendChild(menuInner);
  return menu;
}

// ---- Construction au chargement ----
// ---- Construction au chargement ----
const ruche = buildRuche();
const menu = buildMenu();
const aide = document.getElementById("aide");

majRuche();   // applique l'état initial des feuilles aux hexagones de la ruche
// ============================================================
//   Animations coordonnées par minuteur (setTimeout)
// ============================================================

// ---- Colonne de catégories (vertical, hauteur) ----

function ouvrirMenu() {
  menu.classList.add("open");
  menu.classList.add("visuel-ouvert");

  // Figer la hauteur courante (0 si fermé, valeur intermédiaire si repli en cours)
  const courante = menu.offsetHeight;
  menu.style.overflow = "hidden";

  // Mesurer la hauteur cible sur le contenu intérieur (jamais écrasé)
  const inner = menu.querySelector(".menu-inner");
  const cible = inner.scrollHeight + (inner.offsetHeight - inner.clientHeight);

  // Repartir de la hauteur courante figée, puis animer vers la cible
  menu.style.height = courante + "px";
  menu.offsetHeight;                 // reflow
  menu.style.height = cible + "px";

  // Fin d'ouverture : hauteur flexible + overflow visible (si toujours ouvert)
  setTimeout(() => {
    if (menu.classList.contains("open")) {
      menu.style.height = "auto";
      menu.style.overflow = "visible";
    }
  }, DUREE);
}

function fermerMenu(duree) {
  menu.style.overflow = "hidden";
  menu.style.height = menu.offsetHeight + "px"; // fige la hauteur réelle courante
  menu.offsetHeight;                            // reflow
  menu.classList.remove("open");
  menu.style.height = "0px";
  setTimeout(() => {
    // Ne retirer le cadre que si le menu est TOUJOURS fermé (sinon une réouverture l'a repris)
    if (!menu.classList.contains("open")) {
      menu.classList.remove("visuel-ouvert");
      menu.classList.remove("fermeture-rapide");
    }
  }, duree);
}

// ---- Enfants (horizontal, largeur) ----

function ouvrirEnfants(node, children) {
  node.classList.add("open");
  node.classList.add("visuel-ouvert");

  // Figer la largeur courante (0 si fermé, valeur intermédiaire si repli en cours)
  const courante = children.offsetWidth;
  children.style.overflow = "hidden";

  // Mesurer la largeur naturelle de .children lui-même (padding du conteneur inclus)
  children.style.width = "auto";
  const cible = children.scrollWidth;

  // Repartir de la largeur courante figée, puis animer vers la cible
  children.style.width = courante + "px";
  children.offsetWidth;                 // reflow : fige la largeur courante avant la transition
  children.style.width = cible + "px";
}

function fermerEnfants(node) {
  const children = node.querySelector(".children");
  node.classList.remove("open");
  children.style.overflow = "hidden";
  children.style.width = children.offsetWidth + "px"; // fige la largeur réelle
  children.offsetWidth;                               // reflow
  children.style.width = "0px";
  setTimeout(() => {
    if (!node.classList.contains("open")) {
      node.classList.remove("visuel-ouvert");
    }
  }, DUREE);
}

// ---- Interactions globales ----

// Clic ruche : si une sous-liste est ouverte, replier les enfants PUIS la colonne (rapide)
ruche.addEventListener("click", () => {
  const menuOuvert = menu.classList.contains("open");

  if (menuOuvert && nodeOuvert) {
    // Séquence accélérée
    menu.classList.add("fermeture-rapide");
    fermerEnfants(nodeOuvert);
    menu.classList.remove("categorie-ouverte");
    const node = nodeOuvert;
    nodeOuvert = null;
    // Après le repli des enfants (rapide), on replie la colonne (rapide)
    setTimeout(() => {
      fermerMenu(DUREE_RAPIDE);
    }, DUREE_RAPIDE);
  } else if (menuOuvert) {
    fermerMenu(DUREE);
  } else {
    ouvrirMenu();
  }
});

aide.addEventListener("click", () => {
  menu.classList.toggle("show-labels");
});