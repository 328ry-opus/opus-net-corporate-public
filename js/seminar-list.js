(function () {
  'use strict';
  var API = 'https://opus-ai-forms.pages.dev/api/events?series=';
  var WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  function startsAt(event) {
    return new Date(event.eventDate + 'T' + event.startsAt + '+09:00').getTime();
  }
  function isUpcoming(event, now) {
    return event && /^\d{4}-\d{2}-\d{2}$/.test(event.eventDate) &&
      /^\d{2}:\d{2}(:\d{2})?$/.test(event.startsAt) &&
      /^\d{2}:\d{2}(:\d{2})?$/.test(event.endsAt) &&
      Number.isFinite(startsAt(event)) && startsAt(event) > now &&
      !event.isFull && !event.isClosed;
  }
  function price(event) {
    if (event.format === 'online') return '参加無料';
    var venue = Number.isFinite(event.venuePriceYen) && event.venuePriceYen > 0
      ? '会場 ' + event.venuePriceYen.toLocaleString('ja-JP') + '円（税込）'
      : event.venuePriceYen === 0 ? '会場参加無料' : '会場参加費は詳細をご確認ください';
    if (event.isVenueFull) venue += '（満席）';
    else if (event.isVenueClosed) venue += '（受付終了）';
    return event.format === 'hybrid' ? venue + '\nオンライン無料' : venue;
  }
  // Expose display rules for verification outside a browser.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isUpcoming: isUpcoming, price: price };
  }
  if (typeof document === 'undefined') return;
  var list = document.querySelector('#upcoming-seminars');
  if (!list) return;
  var templates = Array.from(list.querySelectorAll('[data-series]')).map(function (node) {
    return { key: node.dataset.series, node: node.cloneNode(true) };
  });
  var empty = document.querySelector('#seminar-empty');
  var loaded = false;
  var failed = false;
  var failedKeys = [];
  var fallbackLinks = document.createElement('p');
  fallbackLinks.className = 'seminar-note';
  fallbackLinks.hidden = true;
  empty.after(fallbackLinks);
  var set = function (node, selector, value) { node.querySelector(selector).textContent = value; };
  function renderEvent(template, event) {
    var node = template.cloneNode(true);
    var date = event.eventDate.split('-');
    node.dataset.startsAt = event.eventDate + 'T' + event.startsAt + '+09:00';
    set(node, '.seminar-event__year', date[0]);
    set(node, '.seminar-event__day', Number(date[1]) + '/' + Number(date[2]));
    set(node, '.seminar-event__weekday', '（' + WEEK[new Date(event.eventDate + 'T12:00:00+09:00').getUTCDay()] + '）');
    var time = node.querySelector('time');
    time.dateTime = event.eventDate;
    time.setAttribute('aria-label', date[0] + '年' + Number(date[1]) + '月' + Number(date[2]) + '日');
    set(node, '.seminar-event__time', event.startsAt.slice(0, 5) + '〜' + event.endsAt.slice(0, 5));
    set(node, '.seminar-event__venue', event.format === 'online' ? 'オンライン' : (event.venueName || '会場は詳細をご確認ください') + (event.format === 'hybrid' ? '＋オンライン' : ''));
    set(node, '.seminar-event__price', price(event));
    set(node, '.seminar-event__status', '受付中');
    return node;
  }
  function prune() {
    Array.from(list.children).forEach(function (node) {
      if (new Date(node.dataset.startsAt).getTime() <= Date.now()) node.remove();
    });
    empty.hidden = list.children.length > 0;
    empty.textContent = !loaded ? '開催日程を確認しています。' : failed ? '開催予定を取得できませんでした。各セミナーの案内ページをご確認ください。' : '現在、受付中のセミナーはありません。次回の開催が決まり次第、このページでご案内します。';
    fallbackLinks.replaceChildren();
    templates.filter(function (template) {
      return failedKeys.includes(template.key) && !Array.from(list.children).some(function (node) { return node.dataset.series === template.key; });
    }).forEach(function (template) {
      var link = template.node.querySelector('a').cloneNode(true);
      link.className = '';
      link.textContent = template.node.querySelector('h3').textContent;
      fallbackLinks.append(link, document.createElement('br'));
    });
    fallbackLinks.hidden = !loaded || !fallbackLinks.children.length;
    if (!fallbackLinks.hidden && list.children.length) {
      var notice = document.createElement('span');
      notice.textContent = '開催予定を取得できませんでした。各セミナーの案内ページをご確認ください。';
      fallbackLinks.prepend(notice, document.createElement('br'));
    }
  }
  prune();
  Promise.all(templates.map(async function (template) {
    try {
      var options = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? { signal: AbortSignal.timeout(10000) } : {};
      var response = await fetch(API + encodeURIComponent(template.key), options);
      if (!response.ok) throw new Error('Unavailable');
      var events = await response.json();
      if (!Array.isArray(events)) throw new Error('Invalid list');
      return events.filter(function (event) { return isUpcoming(event, Date.now()); })
        .map(function (event) { return renderEvent(template.node, event); });
    } catch (_) {
      // Keep the dated fallback without claiming that registration is open.
      failed = true;
      failedKeys.push(template.key);
      var fallback = template.node.cloneNode(true);
      set(fallback, '.seminar-event__status', '受付状況は詳細ページをご確認ください');
      return new Date(fallback.dataset.startsAt).getTime() > Date.now() ? [fallback] : [];
    }
  })).then(function (groups) {
    var nodes = groups.flat().sort(function (a, b) { return new Date(a.dataset.startsAt) - new Date(b.dataset.startsAt); });
    list.replaceChildren.apply(list, nodes);
    list.dataset.loaded = 'true';
    loaded = true;
    prune();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) prune(); });
  setInterval(prune, 60000);
})();
