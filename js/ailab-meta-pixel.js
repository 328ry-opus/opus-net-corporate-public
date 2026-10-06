// Meta Pixel for the AIラボ pages (same pixel as the forms site, opus-ai-forms.pages.dev).
// Only PageView is sent here; the Lead events live on the forms site, after a form is accepted.
// Nothing about the visitor is handed to Meta: init gets no user data and automatic
// form/button detection is switched off.
(function () {
  'use strict';
  var PIXEL_ID = '1781097483035135';
  var FORMS_ORIGIN = 'https://opus-ai-forms.pages.dev';
  // Ad parameters carried over to the forms site, so a Lead there can be tied back to the ad.
  var AD_PARAMS = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  // Meta's standard base code (queueing stub + async loader).
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  // Must come before init: stops the pixel from reading button text and form fields on its own.
  fbq('set', 'autoConfig', false, PIXEL_ID);
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  var landing = new URLSearchParams(location.search);
  var carried = AD_PARAMS.filter(function (key) { return landing.get(key); });
  if (!carried.length) return;
  // Rewrite when a link is about to be used, so links added later (the seminar list is fetched after
  // load) are covered too. contextmenu/touchstart cover "open in new tab" and "copy link" menus.
  function carry(event) {
    var link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.href.indexOf(FORMS_ORIGIN + '/') !== 0) return;
    var url = new URL(link.href);
    carried.forEach(function (key) { if (!url.searchParams.has(key)) url.searchParams.set(key, landing.get(key)); });
    link.href = url.toString();
  }
  document.addEventListener('click', carry, true);
  document.addEventListener('auxclick', carry, true);
  document.addEventListener('contextmenu', carry, true);
  document.addEventListener('touchstart', carry, { capture: true, passive: true });
})();
