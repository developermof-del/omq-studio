/* Accessible hash routes keep each study shareable and usable under a Pages project subpath. */
(() => {
  'use strict';
  const catalog = document.querySelector('[data-catalog]');
  const group = document.querySelector('.oc-filter-group');
  const count = document.getElementById('catalog-count');
  if (!catalog || !group || !count) return;
  const details = new Map([...document.querySelectorAll('[data-detail]')].map(panel => [panel.id, panel]));
  const cards = [...catalog.querySelectorAll('[data-card]')];
  const filters = [...group.querySelectorAll('[data-filter]')];
  const valid = new Set(filters.map(button => button.dataset.filter));
  const startTitle = 'المجموعة — عُمق';
  let lastRoute, restoreCard = null, restoreScroll = 0;
  const navigationKey = Math.random().toString(36).slice(2);

  function safeDetailId() { return location.hash.slice(1); }
  function mode() { const id = safeDetailId(); return details.has(id) ? id : null; }
  function activeFilter() {
    const query = new URL(location.href).searchParams.get('form');
    return valid.has(query) ? query : 'all';
  }
  function applyFilter(selected) {
    let n = 0;
    for (const card of cards) {
      card.hidden = selected !== 'all' && card.dataset.type !== selected;
      if (!card.hidden) n += 1;
    }
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.filter === selected));
    count.textContent = ({0:'لا توجد دراسات',1:'دراسة واحدة',2:'دراستان',3:'٣ دراسات'})[n] || String(n);
  }
  function collectionURL() { const url = new URL(location.href); url.hash = ''; return url; }
  function bindShopTargets() {
    for (const link of document.querySelectorAll('[data-product-url]')) {
      const setting = window.OMQ_CONFIG?.productUrls?.[link.dataset.productUrl];
      if (typeof setting !== 'string' || !setting.trim()) continue;
      try {
        const url = new URL(setting);
        if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) continue;
        link.href = url.href;
        link.hidden = false;
      } catch (_) { /* Unconfigured product stays a study. */ }
    }
  }
  function render(initial = false) {
    const id = mode();
    const previous = lastRoute;
    applyFilter(activeFilter());
    catalog.hidden = Boolean(id);
    for (const [key, panel] of details) {
      const open = key === id;
      panel.hidden = !open;
      panel.classList.toggle('is-open', open);
    }
    for (const link of document.querySelectorAll('[data-back-collection]')) link.href = collectionURL().href;
    document.title = id ? details.get(id).querySelector('h1').textContent + ' — المجموعة | عُمق' : startTitle;
    lastRoute = id;
    if (!initial && previous === id) return;
    if (id) {
      const title = details.get(id).querySelector('h1');
      requestAnimationFrame(() => {
        // Use the top of the page even after a direct hash load: the shared header stays reachable.
        if (mode() !== id) return;
        if (!initial) title.focus({preventScroll:true});
        window.scrollTo(0, 0);
      });
    } else if (!initial && previous) {
      const candidate = cards.find(card => card.dataset.card === restoreCard && !card.hidden)?.querySelector('a');
      requestAnimationFrame(() => {
        if (mode()) return;
        (candidate || document.getElementById('catalog-title')).focus({preventScroll:true});
        window.scrollTo(0, candidate ? restoreScroll : 0);
      });
    }
  }
  for (const filter of filters) filter.addEventListener('click', () => {
    const next = filter.dataset.filter;
    if (!valid.has(next) || next === activeFilter()) return;
    const url = collectionURL();
    if (next === 'all') url.searchParams.delete('form'); else url.searchParams.set('form', next);
    try { history.replaceState(history.state, '', url); } catch (_) { /* file-system preview still filters */ }
    applyFilter(next);
  });
  function changeRoute(id, replace = false) {
    const url = collectionURL();
    url.hash = id || '';
    try {
      const from = history.state;
      const level = mode() ? (from?.omqKey === navigationKey ? (from.omqLevel || 0) + 1 : 0) : 1;
      const state = id && level && restoreCard ? {omqKey:navigationKey,omqLevel:level} : {};
      history[replace ? 'replaceState' : 'pushState'](state, '', url);
      render();
    } catch (_) { location.hash = id || ''; }
  }
  function goBack() {
    // Close a directly shared detail without sending its visitor out of the collection.
    // Likewise, returning after multiple detail visits should go straight to the grid.
    const current = history.state;
    if (current?.omqKey === navigationKey && current.omqLevel > 0) {
      history.go(-current.omqLevel);
      return;
    }
    changeRoute('', true);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a');
    if (!link) return;
    if (link.matches('[data-back-collection]')) { event.preventDefault();goBack();return; }
    const href = link.getAttribute('href');
    if (!href?.startsWith('#') || !details.has(href.slice(1))) return;
    event.preventDefault();
    if (!mode()) {
      restoreCard = link.closest('[data-card]')?.dataset.card || null;
      restoreScroll = window.scrollY;
    }
    changeRoute(href.slice(1));
  });
  window.addEventListener('hashchange', () => render());
  window.addEventListener('popstate', () => render());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mode() && !event.defaultPrevented) {
      if (document.querySelector('[aria-expanded="true"][aria-controls]')) return;
      goBack();
    }
  });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  group.hidden = false; bindShopTargets(); render(true);
})();
