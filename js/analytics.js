// Google Analytics 4 for every page on opus-net.net (corporate pages and /ailab/).
// The tag itself is fetched after the page has loaded so it does not slow the first view; gtag() calls
// made before then wait in dataLayer. Google signals and ad personalisation are off: the data is only
// used to see how the site is used (privacypolicy.html, section 4). Local previews send nothing.
// The stream's automatic measurement is limited to page views and scrolls; outbound clicks are sent below
// and completed inquiries from js/main.js, so every address that leaves the page has been cleaned here.
(function () {
  'use strict';
  var MEASUREMENT_ID = 'G-LN274MKLC6';
  if (location.hostname !== 'opus-net.net') return;

  // Send page and referrer addresses without their query strings (anything typed into a link could be
  // personal data), keeping only the utm_* ad tags on the page address so ad visits can still be told apart.
  function cleanUrl(href, keepAdTags) {
    try {
      var url = new URL(href);
      var clean = new URL(url.origin + url.pathname);
      if (keepAdTags) url.searchParams.forEach(function (value, key) { if (/^utm_/.test(key)) clean.searchParams.set(key, value); });
      return clean.href;
    } catch (e) {
      return '';
    }
  }
  var config = {
    page_location: cleanUrl(location.href, true),
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  };
  if (document.referrer) config.page_referrer = cleanUrl(document.referrer, false);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, config);

  // Clicks to other sites are sent from here (GA's own outbound-click measurement is off in the stream
  // settings) so the link address goes without its query string: links to the forms site carry the
  // visit's ad parameters over (js/ailab-meta-pixel.js). Middle clicks open links too, so they count.
  function trackOutbound(event) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    var link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    var url;
    try { url = new URL(link.href); } catch (e) { return; }
    if (!/^https?:$/.test(url.protocol) || url.hostname === location.hostname) return;
    window.gtag('event', 'click', { link_url: cleanUrl(url.href, false), link_domain: url.hostname, outbound: true });
  }
  document.addEventListener('click', trackOutbound, true);
  document.addEventListener('auxclick', trackOutbound, true);

  function load() {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(script);
  }
  if (document.readyState === 'complete') load(); else window.addEventListener('load', load, { once: true });
})();
