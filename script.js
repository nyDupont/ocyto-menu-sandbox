// Éléments
const ruche = document.getElementById("ruche");
const menu = document.getElementById("menu");
const aide = document.getElementById("aide");

// Clic sur la ruche : afficher / masquer la colonne d'hexagones
ruche.addEventListener("click", () => {
  menu.classList.toggle("open");
});

// Clic sur Aide : afficher / masquer les libellés
aide.addEventListener("click", () => {
  menu.classList.toggle("show-labels");
});