// VilleNova - detail.js
// Gère la page de détail d'un événement (event-detail.html).
// Récupère l'identifiant dans l'URL et affiche toutes les informations.

// -------------------------------------------------------
// SÉLECTION DES ÉLÉMENTS HTML
// -------------------------------------------------------

var conteneurDetail   = document.getElementById('event-detail');
var zoneStatut        = document.getElementById('detail-status');
var titreFil          = document.getElementById('breadcrumb-title');
var categorieFil      = document.getElementById('breadcrumb-category');
var sectionSimilaires = document.getElementById('related-events');
var grilleSimilaires  = document.getElementById('related-grid');

// -------------------------------------------------------
// FONCTIONS UTILITAIRES
// -------------------------------------------------------

// Lit l'identifiant "id" dans l'URL (ex: event-detail.html?id=3 → retourne "3")
function recupererIdDepuisUrl() {
  var params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Change le titre affiché dans l'onglet du navigateur
function changerTitrePage(titre) {
  document.title = titre + ' — VilleNova';
}

// Affiche un message de chargement ou d'erreur dans la zone de statut
function afficherStatut(type, message) {
  if (type === 'loading') {
    zoneStatut.innerHTML =
      '<div>' +
        '<div class="spinner" aria-hidden="true"></div>' +
        '<p>Chargement de l\'événement…</p>' +
      '</div>';

  } else if (type === 'error') {
    zoneStatut.innerHTML =
      '<p class="error-msg">' +
        '<span class="icon solid fa-exclamation-triangle" aria-hidden="true"></span> ' +
        message +
      '</p>';

  } else {
    zoneStatut.innerHTML = ''; // Effacer le message
  }
}

// -------------------------------------------------------
// AFFICHAGE DU DÉTAIL D'UN ÉVÉNEMENT
// -------------------------------------------------------

// Construit et affiche toutes les informations d'un événement
function afficherDetail(evenement) {
  // On récupère toutes les informations de l'événement
  var titre          = API.localizeField(evenement.title);
  var description    = API.localizeField(evenement.description || evenement.longDescription || '');
  var imageUrl       = API.getEventImage(evenement);
  var categorieSlug  = API.getCategorySlug(evenement);
  var categorieLabel = API.getCategoryLabel(categorieSlug);
  var prix           = API.formatPrice(evenement);

  // Construction du lieu
  var lieu = '';
  if (evenement.location) {
    lieu = evenement.location.name || '';
    if (evenement.location.city) lieu += ', ' + evenement.location.city;
  }

  // Date et heure
  var timing  = (evenement.timings && evenement.timings[0]) ? evenement.timings[0] : null;
  var dateStr = timing ? API.formatDate(timing.begin) : 'Date à confirmer';
  var heureStr = timing ? API.formatTime(timing.begin) : '';

  // Lien de réservation (si disponible)
  var lienReservation = (evenement.links && evenement.links[0]) ? evenement.links[0].link : null;

  // Mise à jour du titre de la page et du fil d'Ariane
  changerTitrePage(titre);
  titreFil.textContent     = titre;
  categorieFil.textContent = categorieLabel;

  // Description sans balises HTML
  var descPropre = description.replace(/<[^>]*>/g, '') || 'Description non disponible.';

  // HTML de l'heure (seulement si disponible)
  var heureHTML = '';
  if (heureStr) {
    heureHTML =
      '<div class="meta-item">' +
        '<span class="icon solid fa-clock" aria-hidden="true"></span>' +
        '<div>' +
          '<span class="meta-label">Heure</span>' +
          '<span class="meta-value">' + heureStr + '</span>' +
        '</div>' +
      '</div>';
  }

  // HTML du lieu (seulement si disponible)
  var lieuHTML = '';
  if (lieu) {
    lieuHTML =
      '<div class="meta-item">' +
        '<span class="icon solid fa-map-marker-alt" aria-hidden="true"></span>' +
        '<div>' +
          '<span class="meta-label">Lieu</span>' +
          '<span class="meta-value">' + lieu + '</span>' +
        '</div>' +
      '</div>';
  }

  // HTML du bouton de réservation (seulement si un lien existe)
  var reservationHTML = '';
  if (lienReservation) {
    reservationHTML = '<a href="' + lienReservation + '" target="_blank" rel="noopener noreferrer" class="btn-ticket">Réserver ma place</a>';
  }

  // On construit tout le HTML et on l'injecte dans la page
  conteneurDetail.innerHTML =
    '<div class="event-detail-hero">' +
      '<picture>' +
        '<img class="detail-img" src="' + imageUrl + '" alt="Visuel de l\'événement : ' + titre + '" loading="eager">' +
      '</picture>' +
      '<div class="detail-overlay">' +
        '<span class="badge badge-' + categorieSlug + '">' + categorieLabel + '</span>' +
        '<h1 id="event-title">' + titre + '</h1>' +
      '</div>' +
    '</div>' +

    '<div class="event-detail-body">' +
      '<section class="event-description">' +
        '<h2>À propos de cet événement</h2>' +
        '<p>' + descPropre + '</p>' +
      '</section>' +

      '<aside class="event-meta" aria-label="Informations pratiques">' +
        '<h3>Infos pratiques</h3>' +

        '<div class="meta-item">' +
          '<span class="icon solid fa-calendar-alt" aria-hidden="true"></span>' +
          '<div>' +
            '<span class="meta-label">Date</span>' +
            '<span class="meta-value">' + dateStr + '</span>' +
          '</div>' +
        '</div>' +

        heureHTML +
        lieuHTML +

        '<div class="meta-item">' +
          '<span class="icon solid fa-ticket-alt" aria-hidden="true"></span>' +
          '<div>' +
            '<span class="meta-label">Tarif</span>' +
            '<span class="meta-value">' + prix + '</span>' +
          '</div>' +
        '</div>' +

        reservationHTML +
      '</aside>' +
    '</div>';

  // Si l'image ne charge pas, on met l'image par défaut
  var img = conteneurDetail.querySelector('img');
  img.onerror = function() {
    img.src = API.config.defaultImage;
  };
}

// -------------------------------------------------------
// AFFICHAGE DES ÉVÉNEMENTS SIMILAIRES
// -------------------------------------------------------

// Crée la carte HTML d'un événement similaire
function creerCarteSimilaire(evenement) {
  var titre          = API.localizeField(evenement.title);
  var categorieSlug  = API.getCategorySlug(evenement);
  var categorieLabel = API.getCategoryLabel(categorieSlug);
  var imageUrl       = API.getEventImage(evenement);
  var dateStr        = (evenement.timings && evenement.timings[0]) ? API.formatDate(evenement.timings[0].begin) : '';

  // Date HTML (seulement si disponible)
  var dateHTML = '';
  if (dateStr) {
    dateHTML = '<p class="card-location">' + dateStr + '</p>';
  }

  // Création du conteneur
  var col = document.createElement('div');
  col.className = 'col-4';

  col.innerHTML =
    '<article class="event-card">' +
      '<a href="event-detail.html?id=' + evenement.uid + '" aria-label="Voir : ' + titre + '">' +
        '<div class="card-image">' +
          '<img src="' + imageUrl + '" alt="' + titre + '" loading="lazy">' +
          '<span class="card-category badge badge-' + categorieSlug + '">' + categorieLabel + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<h3>' + titre + '</h3>' +
          dateHTML +
        '</div>' +
      '</a>' +
    '</article>';

  // Si l'image ne charge pas, on met l'image par défaut
  var img = col.querySelector('img');
  img.onerror = function() {
    img.src = API.config.defaultImage;
  };

  return col;
}

// Affiche la liste des événements similaires
function afficherSimilaires(evenements) {
  if (!evenements || evenements.length === 0) return;

  grilleSimilaires.innerHTML = ''; // Vider la grille

  for (var i = 0; i < evenements.length; i++) {
    var carte = creerCarteSimilaire(evenements[i]);
    grilleSimilaires.appendChild(carte);
  }

  sectionSimilaires.hidden = false; // Rendre la section visible
}

// -------------------------------------------------------
// DÉMARRAGE
// -------------------------------------------------------

// Fonction principale : charge et affiche l'événement demandé
async function demarrer() {
  var idEvenement = recupererIdDepuisUrl();

  // Si pas d'identifiant dans l'URL, on affiche une erreur
  if (!idEvenement) {
    afficherStatut('error', 'Identifiant d\'événement manquant. Retournez à l\'accueil.');
    return;
  }

  afficherStatut('loading');

  try {
    // Chargement du détail de l'événement
    var evenement = await API.fetchEventDetail(idEvenement);
    afficherStatut(''); // Effacer le message de chargement
    afficherDetail(evenement);

    // Charger les événements similaires (sans bloquer l'affichage principal)
    var categorieSlug = API.getCategorySlug(evenement);
    API.fetchRelatedEvents(categorieSlug, idEvenement)
      .then(afficherSimilaires)
      .catch(function() {
        // Si le chargement des similaires échoue, on ne fait rien
      });

  } catch (erreur) {
    console.error('Erreur lors du chargement de l\'événement :', erreur);
    afficherStatut('error', 'Impossible de charger cet événement. Il a peut-être été supprimé.');
  }
}

// Lancer quand la page est prête
document.addEventListener('DOMContentLoaded', demarrer);
