// VilleNova - api.js
// Gère la communication avec l'API OpenAgenda.

// --- Configuration ---
var CLE_API         = 'a9a51f8cc727406086ac573b23737887';
var AGENDA_UID      = '18927841';
var URL_BASE        = 'https://api.openagenda.com/v2';
var EVENEMENTS_PAGE = 9;
var IMAGE_DEFAUT    = 'images/placeholder.jpg';


// FONCTIONS UTILITAIRES


// Transforme une date ISO en texte lisible (ex: "Sam. 14 juin 2025")
function formatDate(dateISO) {
  if (!dateISO) return 'Date à confirmer';
  var date = new Date(dateISO);
  if (isNaN(date)) return 'Date à confirmer';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Transforme une date ISO en heure (ex: "20:00")
function formatTime(dateISO) {
  if (!dateISO) return '';
  var date = new Date(dateISO);
  if (isNaN(date)) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Récupère le texte en français d'un champ (ou anglais si pas de français)
function localizeField(champ) {
  if (!champ) return '';
  if (typeof champ === 'string') return champ;
  return champ.fr || champ.en || Object.values(champ)[0] || '';
}

// Retourne l'URL de l'image d'un événement
function getEventImage(evenement) {
  if (evenement.image && evenement.image.base) {
    return evenement.image.base + evenement.image.filename;
  }
  if (evenement.thumbnail) return evenement.thumbnail;
  return IMAGE_DEFAUT;
}

// Retourne la catégorie d'un événement selon ses mots-clés
function getCategorySlug(evenement) {
  var mots = localizeField(evenement.keywords || '').toLowerCase();
  if (mots.includes('concert') || mots.includes('musique')) return 'concert';
  if (mots.includes('exposition') || mots.includes('art'))  return 'exposition';
  if (mots.includes('spectacle') || mots.includes('théâtre') || mots.includes('danse')) return 'spectacle';
  if (mots.includes('festival')) return 'festival';
  return 'default';
}

// Retourne le nom lisible de la catégorie (ex: "concert" → "Concert")
function getCategoryLabel(slug) {
  if (slug === 'concert')    return 'Concert';
  if (slug === 'exposition') return 'Exposition';
  if (slug === 'spectacle')  return 'Spectacle';
  if (slug === 'festival')   return 'Festival';
  return 'Événement';
}

// Retourne le prix de l'événement sous forme de texte
function formatPrice(evenement) {
  if (!evenement.registration || evenement.registration.length === 0) {
    return 'Entrée libre';
  }
  var reg = evenement.registration[0];
  if (reg.price === 0) return 'Gratuit';
  if (reg.price) return reg.price + ' €';
  return 'Voir conditions';
}

// -------------------------------------------------------
// APPELS API OPENAGENDA
// -------------------------------------------------------

// Récupère une liste d'événements (avec pagination, recherche, filtre)
async function fetchEvents(options) {
  var page      = (options && options.page)     ? options.page     : 1;
  var recherche = (options && options.search)   ? options.search   : '';
  var categorie = (options && options.category) ? options.category : '';

  var offset = (page - 1) * EVENEMENTS_PAGE;

  var params = new URLSearchParams({
    key:           CLE_API,
    size:          EVENEMENTS_PAGE,
    offset:        offset,
    sort:          'timingsWithAggregations.nextTiming,-1',
    includeLabels: 1,
    monolingual:   'fr'
  });

  if (recherche.trim()) {
    params.set('search[text]', recherche.trim());
  }
  if (categorie && categorie !== 'all') {
    params.set('search[keywords]', categorie);
  }

  var url = URL_BASE + '/agendas/' + AGENDA_UID + '/events?' + params;
  var reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error('Erreur API : ' + reponse.status + ' ' + reponse.statusText);
  }

  var data = await reponse.json();
  return { events: data.events || [], total: data.total || 0, currentPage: page };
}

// Récupère le détail d'un événement par son identifiant
async function fetchEventDetail(uid) {
  var url = URL_BASE + '/agendas/' + AGENDA_UID + '/events/' + uid + '?key=' + CLE_API + '&monolingual=fr';
  var reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error('Événement introuvable (' + reponse.status + ')');
  }
  var data = await reponse.json();
  return data.event || data;
}

// Récupère des événements similaires (même catégorie, sans l'événement courant)
async function fetchRelatedEvents(categorie, idExclure) {
  var params = new URLSearchParams({
    key:         CLE_API,
    size:        3,
    monolingual: 'fr',
    sort:        'timingsWithAggregations.nextTiming,-1'
  });
  if (categorie && categorie !== 'default') {
    params.set('search[keywords]', categorie);
  }

  var url = URL_BASE + '/agendas/' + AGENDA_UID + '/events?' + params;
  var reponse = await fetch(url);
  if (!reponse.ok) return [];

  var data = await reponse.json();
  var resultats = [];
  var liste = data.events || [];
  for (var i = 0; i < liste.length; i++) {
    if (String(liste[i].uid) !== String(idExclure)) {
      resultats.push(liste[i]);
    }
  }
  return resultats.slice(0, 3);
}

// -------------------------------------------------------
// OBJET API GLOBAL (utilisé par app.js et detail.js)
// -------------------------------------------------------

var API = {
  fetchEvents:        fetchEvents,
  fetchEventDetail:   fetchEventDetail,
  fetchRelatedEvents: fetchRelatedEvents,
  formatDate:         formatDate,
  formatTime:         formatTime,
  localizeField:      localizeField,
  getEventImage:      getEventImage,
  getCategorySlug:    getCategorySlug,
  getCategoryLabel:   getCategoryLabel,
  formatPrice:        formatPrice,
  config: {
    eventsPerPage: EVENEMENTS_PAGE,
    defaultImage:  IMAGE_DEFAUT
  }
};
