/*
 * Optional AdSense banners. Does nothing unless APP_CONFIG.ads.enabled is true
 * and a client ID + slot ID are set. The AdSense script is loaded lazily, only
 * when a banner is about to be shown, and never while offline.
 */
(function () {
  'use strict';
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.ads) || {};
  let scriptPromise = null;

  function slotId(name) {
    return cfg.enabled && cfg.client && cfg.slots && cfg.slots[name] ? cfg.slots[name] : '';
  }

  /** HTML placeholder for a banner, or '' when ads are off for that placement. */
  function placeholder(name) {
    return slotId(name) ? `<div class="ad-slot" data-ad-slot-name="${name}" aria-label="Advertisement"></div>` : '';
  }

  function loadScript() {
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(cfg.client);
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error('ads script')); };
      document.head.appendChild(s);
    });
    return scriptPromise;
  }

  /** Fill every empty placeholder inside root. Safe to call after each render. */
  function mount(root) {
    if (!cfg.enabled || !cfg.client || !navigator.onLine) return;
    const slots = [...(root || document).querySelectorAll('.ad-slot:not([data-filled])')];
    if (!slots.length) return;
    loadScript().then(() => {
      slots.forEach((el) => {
        const id = slotId(el.dataset.adSlotName);
        if (!id || !el.isConnected) return;
        el.dataset.filled = '1';
        el.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${cfg.client}"
          data-ad-slot="${id}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { el.remove(); }
      });
    }).catch(() => slots.forEach((el) => el.remove()));
  }

  window.Ads = { placeholder, mount, get enabled() { return !!(cfg.enabled && cfg.client); } };
})();
