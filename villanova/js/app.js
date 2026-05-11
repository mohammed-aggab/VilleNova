// VilleNova - app.js
// Gère l'affichage de la liste des événements sur la page d'accueil.
// Fonctionnalités : filtres par catégorie, barre de recherche, pagination.


// VARIABLES GLOBALES (état de la page)


var pageCourante     = 1;     // Page actuellement affichée
var filtreActif      = 'all'; // Filtre de catégorie actif
var recherche        = '';    // Texte de recherche en cours
var totalEvenements  = 0;     // Nombre total d'événements trouvés
var enChargement     = false; // Vrai si un chargement est en cours


// SÉLECTION DES ÉLÉMENTS HTML

var grilleEvenements = document.getElementById('events-grid');
var zoneStatut       = document.getElementById('events-status');
var pagination       = document.getElementById('pagination');
var champRecherche   = document.getElementById('search-input');
var boutonRecherche  = document.getElementById('search-btn');
var boutonsFiltres   = document.querySelectorAll('.filter-btn');


// FONCTIONS D'AFFICHAGE


// Affiche un message de chargement, d'erreur ou "aucun résultat"
function afficherStatut(type, message) {
  if (type === 'loading') {
    zoneStatut.innerHTML =
      '<div>' +
        '<div class="spinner" aria-hidden="true"></div>' +
        '<p>Chargement des événements…</p>' +
      '</div>';

  } else if (type === 'error') {
    zoneStatut.innerHTML =
      '<p class="error-msg">' +
        '<span class="icon solid fa-exclamation-triangle" aria-hidden="true"></span> ' +
        message +
      '</p>';

  } else if (type === 'empty') {
    zoneStatut.innerHTML = '<p>' + (message || 'Aucun événement trouvé.') + '</p>';

  } else {
    // Efface le message
    zoneStatut.innerHTML = '';
  }
}

// Crée une carte HTML pour un événement et la retourne
function creerCarteEvenement(evenement) {
  // On récupère les informations de l'événement
  var categorieSlug  = API.getCategorySlug(evenement);
  var categorieLabel = API.getCategoryLabel(categorieSlug);
  var titre          = API.localizeField(evenement.title);
  var description    = API.localizeField(evenement.description || evenement.longDescription || '');
  var imageUrl       = API.getEventImage(evenement);
  var prix           = API.formatPrice(evenement);
  var lienDetail     = 'event-detail.html?id=' + evenement.uid;

  // Construction du lieu (nom + ville)
  var lieu = '';
  if (evenement.location) {
    lieu = evenement.location.name || '';
    if (evenement.location.city) lieu += ', ' + evenement.location.city;
  }

  // Date du premier timing
  var timing  = (evenement.timings && evenement.timings[0]) ? evenement.timings[0] : null;
  var dateStr = timing ? API.formatDate(timing.begin) : 'Date à confirmer';

  // Description courte (200 caractères max, sans balises HTML)
  var descCourte = description.replace(/<[^>]*>/g, '').slice(0, 200);

  // HTML du lieu (seulement si renseigné)
  var lieuHTML = '';
  if (lieu) {
    lieuHTML = '<p class="card-location"><span class="icon solid fa-map-marker-alt" aria-hidden="true"></span>' + lieu + '</p>';
  }

  // HTML de la description (seulement si disponible)
  var descHTML = '';
  if (descCourte) {
    descHTML = '<p class="card-desc">' + descCourte + '</p>';
  }

  // Création de l'élément article
  var article = document.createElement('article');
  article.className = 'event-card';
  article.setAttribute('data-category', categorieSlug);
  article.setAttribute('data-uid', evenement.uid);

  // On remplit l'article avec innerHTML
  article.innerHTML =
    '<a href="' + lienDetail + '" aria-label="Voir le détail : ' + titre + '">' +
      '<div class="card-image">' +
        '<picture>' +
          '<img src="' + imageUrl + '" alt="Illustration : ' + titre + '" loading="lazy" width="400" height="200">' +
        '</picture>' +
        '<span class="card-category badge badge-' + categorieSlug + '">' + categorieLabel + '</span>' +
        '<span class="card-date-badge" aria-label="Date : ' + dateStr + '">' + dateStr + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<h3>' + titre + '</h3>' +
        lieuHTML +
        descHTML +
      '</div>' +
      '<div class="card-footer">' +
        '<span class="card-price">' + prix + '</span>' +
        '<span class="card-link">En savoir plus →</span>' +
      '</div>' +
    '</a>';

  // Si l'image ne charge pas, on met l'image par défaut
  var img = article.querySelector('img');
  img.onerror = function() {
    img.src = API.config.defaultImage;
  };

  return article;
}

// Affiche tous les événements dans la grille
function afficherEvenements(evenements) {
  grilleEvenements.innerHTML = ''; // On vide la grille d'abord

  for (var i = 0; i < evenements.length; i++) {
    var carte = creerCarteEvenement(evenements[i]);
    grilleEvenements.appendChild(carte);
  }
}

// Affiche les boutons de pagination (numéros de pages)
function afficherPagination(total, page) {
  pagination.innerHTML = ''; // On vide la pagination d'abord

  var totalPages = Math.ceil(total / API.config.eventsPerPage);
  if (totalPages <= 1) return; // Pas besoin de pagination si une seule page

  // Bouton "page précédente"
  var btnPrec = document.createElement('button');
  btnPrec.textContent = '←';
  btnPrec.setAttribute('aria-label', 'Page précédente');
  btnPrec.disabled = (page === 1); // Désactivé si on est déjà sur la première page
  btnPrec.addEventListener('click', function() {
    chargerEvenements(page - 1);
  });
  pagination.appendChild(btnPrec);

  // Boutons numérotés (1, 2, 3, ...)
  for (var i = 1; i <= totalPages; i++) {
    var btn = document.createElement('button');
    btn.textContent = i;
    btn.setAttribute('aria-label', 'Page ' + i);

    // Marquer la page courante
    if (i === page) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    }

    // On utilise une fonction pour éviter le problème de closure dans les boucles
    (function(numPage) {
      btn.addEventListener('click', function() {
        chargerEvenements(numPage);
      });
    })(i);

    pagination.appendChild(btn);
  }

  // Bouton "page suivante"
  var btnSuiv = document.createElement('button');
  btnSuiv.textContent = '→';
  btnSuiv.setAttribute('aria-label', 'Page suivante');
  btnSuiv.disabled = (page === totalPages); // Désactivé si on est sur la dernière page
  btnSuiv.addEventListener('click', function() {
    chargerEvenements(page + 1);
  });
  pagination.appendChild(btnSuiv);
}


// CHARGEMENT DES DONNÉES


// Charge les événements depuis l'API et les affiche
async function chargerEvenements(page) {
  if (page === undefined) page = 1;

  // On évite de lancer deux chargements en même temps
  if (enChargement) return;
  enChargement = true;
  pageCourante = page;

  afficherStatut('loading');

  try {
    // Appel à l'API (ou aux données de test)
    var resultat = await API.fetchEvents({
      page:     page,
      search:   recherche,
      category: filtreActif
    });

    var evenements = resultat.events;
    totalEvenements = resultat.total;

    afficherStatut(''); // Effacer le message de chargement

    if (evenements.length === 0) {
      afficherStatut('empty', 'Aucun événement ne correspond à votre recherche.');
    } else {
      afficherEvenements(evenements);
      afficherPagination(totalEvenements, page);
    }

  } catch (erreur) {
    console.error('Erreur lors du chargement des événements :', erreur);
    afficherStatut('error', 'Impossible de charger les événements. Veuillez réessayer.');
  }

  enChargement = false;
}


// CONFIGURATION DES INTERACTIONS


// Configure les boutons de filtre (Tous, Concert, Exposition, ...)
function configurerFiltres() {
  for (var i = 0; i < boutonsFiltres.length; i++) {
    boutonsFiltres[i].addEventListener('click', function() {
      var filtre = this.dataset.filter;

      // Si on clique sur le filtre déjà actif, on ne fait rien
      if (filtre === filtreActif) return;

      // Désactiver tous les boutons
      for (var j = 0; j < boutonsFiltres.length; j++) {
        boutonsFiltres[j].classList.remove('active');
        boutonsFiltres[j].setAttribute('aria-pressed', 'false');
      }

      // Activer le bouton cliqué
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');

      filtreActif  = filtre;
      pageCourante = 1;
      chargerEvenements(1);
    });
  }
}

// Configure la barre de recherche
function configurerRecherche() {
  // Quand on clique sur le bouton "Rechercher"
  boutonRecherche.addEventListener('click', function() {
    recherche    = champRecherche.value.trim();
    pageCourante = 1;
    chargerEvenements(1);
  });

  // Quand on appuie sur la touche Entrée dans le champ
  champRecherche.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      recherche    = champRecherche.value.trim();
      pageCourante = 1;
      chargerEvenements(1);
    }
  });

  // Si on efface tout le texte du champ, on recharge sans filtre
  champRecherche.addEventListener('input', function() {
    if (champRecherche.value === '' && recherche !== '') {
      recherche = '';
      chargerEvenements(1);
    }
  });
}

// Configure les filtres depuis le menu de navigation (liens dropdown)
function configurerFiltresNav() {
  var liens = document.querySelectorAll('[data-filter]');

  for (var i = 0; i < liens.length; i++) {
    liens[i].addEventListener('click', function(e) {
      e.preventDefault(); // Empêche la navigation du lien
      var filtre = this.dataset.filter;

      // Mettre à jour l'apparence des boutons de filtre
      for (var j = 0; j < boutonsFiltres.length; j++) {
        var correspond = boutonsFiltres[j].dataset.filter === filtre;
        if (correspond) {
          boutonsFiltres[j].classList.add('active');
          boutonsFiltres[j].setAttribute('aria-pressed', 'true');
        } else {
          boutonsFiltres[j].classList.remove('active');
          boutonsFiltres[j].setAttribute('aria-pressed', 'false');
        }
      }

      filtreActif  = filtre;
      pageCourante = 1;
      chargerEvenements(1);

      // Faire défiler jusqu'à la section des événements
      var sectionEvenements = document.getElementById('events');
      if (sectionEvenements) {
        sectionEvenements.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}


// DÉMARRAGE


// Tout commence ici, quand la page est complètement chargée
document.addEventListener('DOMContentLoaded', function() {
  configurerFiltres();
  configurerRecherche();
  configurerFiltresNav();
  chargerEvenements(1); // Charger la première page au démarrage
});
