/*
  VilleNova - main.js
  Script principal du template.
  Initialise trois choses :
    1. Le menu déroulant (desktop)
    2. Le menu mobile (panneau latéral)
    3. L'effet de transparence du header au défilement
*/

(function($) {

  // Récupère les éléments importants de la page
  var $window = $(window);
  var $body   = $('body');
  var $header = $('#header');
  var $banner = $('#banner');

  // Définit les tailles d'écran pour adapter l'affichage
  breakpoints({
    wide:     ('1281px', '1680px'),
    normal:   ('981px',  '1280px'),
    narrow:   ('737px',  '980px'),
    narrower: ('737px',  '840px'),
    mobile:   ('481px',  '736px'),
    mobilep:  (null,     '480px')
  });

  // Quand la page est chargée, on retire la classe "is-preload"
  // Cela déclenche les animations CSS d'entrée
  $window.on('load', function() {
    window.setTimeout(function() {
      $body.removeClass('is-preload');
    }, 100);
  });

  // Active le menu déroulant sur le bureau
  $('#nav > ul').dropotron({
    alignment: 'right'
  });

  // Crée le bouton hamburger pour ouvrir le menu mobile
  $('<div id="navButton"><a href="#navPanel" class="toggle"></a></div>')
    .appendTo($body);

  // Crée le panneau de navigation mobile (liste des liens du menu)
  $('<div id="navPanel"><nav>' + $('#nav').navList() + '</nav></div>')
    .appendTo($body)
    .panel({
      delay:        500,
      hideOnClick:  true,  // Ferme le menu quand on clique ailleurs
      hideOnSwipe:  true,  // Ferme le menu quand on swipe
      resetScroll:  true,  // Remet le scroll en haut à l'ouverture
      resetForms:   true,  // Réinitialise les formulaires
      side:         'left',
      target:       $body,
      visibleClass: 'navPanel-visible'
    });

  // Effet sur le header : il devient transparent quand on est sur la bannière,
  // et reprend son apparence normale quand on défile vers le bas.
  // (Désactivé sur mobile pour des raisons de performance)
  if (!browser.mobile && $header.hasClass('alt') && $banner.length > 0) {
    $window.on('load', function() {
      $banner.scrollex({
        bottom:    $header.outerHeight(),
        terminate: function() { $header.removeClass('alt'); },         // Fin de la bannière
        enter:     function() { $header.addClass('alt reveal'); },     // On entre dans la bannière
        leave:     function() { $header.removeClass('alt'); }          // On quitte la bannière
      });
    });
  }

})(jQuery);
