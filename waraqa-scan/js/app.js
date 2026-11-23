/*
 * Waraqa Scan — application UI.
 * Screens: home (library) → document (pages) → editor (crop → filter) ; settings.
 */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG;
  const { t } = window.I18n;
  const IM = window.Imaging;
  const app = document.getElementById('app');

  /* ------------------------------------------------------------------ */
  /* Helpers                                                              */
  /* ------------------------------------------------------------------ */

  const ICONS = {
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pdf: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 18v-6M9 15l3 3 3-3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    magic: '<path d="m15 4 1.5 3L20 8.5 16.5 10 15 13l-1.5-3L10 8.5 13.5 7zM6 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    install: '<path d="M12 3v12M7 10l5 5 5-5"/><rect x="4" y="17" width="16" height="4" rx="1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'
  };
  const ICON_TORCH = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';
  const icon = (name, cls) => `<svg class="i ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const appName = () => CFG.appName[window.I18n.lang] || CFG.appName.en;

  // Object URLs created for the current screen; revoked on every screen change.
  let urls = [];
  const blobUrl = (b) => { const u = URL.createObjectURL(b); urls.push(u); return u; };
  const freeUrls = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls = []; };

  function formatDate(ts) {
    try { return new Intl.DateTimeFormat(window.I18n.locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(ts); }
    catch (e) { return new Date(ts).toLocaleString(); }
  }
  function stampName(ts) {
    const d = new Date(ts), p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}.${p(d.getMinutes())}`;
  }
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

  /* ------------------------------------------------------------------ */
  /* Overlays: toast, loading, sheet, dialogs                             */
  /* ------------------------------------------------------------------ */

  let toastTimer = null;
  function toast(msg) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 2600);
  }

  let loadingEl = null;
  function loading(on, msg) {
    if (on) {
      if (!loadingEl) { loadingEl = document.createElement('div'); loadingEl.className = 'loading'; document.body.appendChild(loadingEl); }
      loadingEl.innerHTML = `<div class="box"><div class="spinner"></div><div>${esc(msg || t('processing'))}</div></div>`;
    } else if (loadingEl) { loadingEl.remove(); loadingEl = null; }
  }

  function overlay(html, cls) {
    const bd = document.createElement('div');
    bd.className = 'backdrop ' + (cls || '');
    bd.innerHTML = html;
    document.body.appendChild(bd);
    return bd;
  }

  /** Bottom sheet with rows: [{icon,label,danger,onClick}] */
  function sheet(title, rows) {
    return new Promise((resolve) => {
      const bd = overlay(`<div class="sheet" role="dialog" aria-modal="true">
        <div class="grip"></div>${title ? `<h3>${esc(title)}</h3>` : ''}
        ${rows.map((r, i) => `<button class="row ${r.danger ? 'danger' : ''}" data-i="${i}">${icon(r.icon)}<span>${esc(r.label)}</span></button>`).join('')}
      </div>`);
      const close = (val) => { bd.remove(); resolve(val); };
      bd.addEventListener('click', (e) => {
        const b = e.target.closest('[data-i]');
        if (b) { const r = rows[+b.dataset.i]; close(r); r.onClick && r.onClick(); }
        else if (e.target === bd) close(null);
      });
      const first = $('[data-i]', bd); if (first) first.focus();
    });
  }

  function confirmDialog(message, okLabel, danger) {
    return new Promise((resolve) => {
      const bd = overlay(`<div class="dialog" role="alertdialog" aria-modal="true">
        <p>${esc(message)}</p>
        <div class="btns"><button class="btn" data-a="no">${esc(t('cancel'))}</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" data-a="yes">${esc(okLabel || t('done'))}</button></div></div>`, 'dialog-wrap');
      bd.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]');
        if (a || e.target === bd) { bd.remove(); resolve(!!a && a.dataset.a === 'yes'); }
      });
      $('[data-a="yes"]', bd).focus();
    });
  }

  function promptDialog(label, value) {
    return new Promise((resolve) => {
      const bd = overlay(`<form class="dialog" role="dialog" aria-modal="true">
        <p><label for="dlg-in">${esc(label)}</label></p>
        <input id="dlg-in" maxlength="80" value="${esc(value)}" autocomplete="off">
        <div class="btns"><button type="button" class="btn" data-a="no">${esc(t('cancel'))}</button>
        <button type="submit" class="btn primary">${esc(t('save'))}</button></div></form>`, 'dialog-wrap');
      const input = $('#dlg-in', bd);
      input.focus(); input.select();
      $('form', bd).addEventListener('submit', (e) => { e.preventDefault(); const v = input.value.trim(); bd.remove(); resolve(v || null); });
      bd.addEventListener('click', (e) => { if (e.target === bd || e.target.closest('[data-a="no"]')) { bd.remove(); resolve(null); } });
    });
  }

  /* ------------------------------------------------------------------ */
  /* File picking                                                         */
  /* ------------------------------------------------------------------ */

  function pickFiles(opts) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (opts.accept) input.accept = opts.accept;   // no accept = every file type
      if (opts.multiple) input.multiple = true;
      if (opts.camera) input.setAttribute('capture', 'environment');
      input.className = 'visually-hidden';
      document.body.appendChild(input);
      let done = false;
      const finish = (files) => { if (done) return; done = true; input.remove(); resolve(files); };
      input.addEventListener('change', () => finish([...(input.files || [])]));
      input.addEventListener('cancel', () => finish([]));
      input.click();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Page processing                                                      */
  /* ------------------------------------------------------------------ */

  const SRC_MAX = () => Math.round(CFG.maxPageResolution * 1.15);

  /**
   * Build a page from a canvas. Photos get edge detection and the default scan filter;
   * pages that come from digital files (PDF, Word…) keep the whole page and the original colours.
   */
  async function newPageFromCanvas(canvas, kind, corners) {
    const isPhoto = kind !== 'document';
    const detected = isPhoto ? (corners || IM.detectDocument(canvas)) : null;
    const page = {
      id: window.uid(),
      src: await IM.canvasToBlob(canvas, 'image/jpeg', 0.92),
      corners: isPhoto ? (detected || IM.defaultCorners(0.02)) : IM.fullCorners(),
      detected: !!detected,
      rotation: 0,
      filter: isPhoto ? window.Settings.get('defaultFilter', CFG.defaultFilter) : 'original'
    };
    return { page, canvas };
  }

  /** Render a page's final image from its source + settings and attach out/thumb blobs. */
  async function renderPage(page, srcCanvas, warpedCache) {
    const src = srcCanvas || (await IM.loadToCanvas(page.src, 99999));
    const warped = warpedCache || IM.warpPerspective(src, page.corners, CFG.maxPageResolution);
    const final = IM.rotate(IM.applyFilter(warped, page.filter), page.rotation);
    page.out = await IM.canvasToBlob(final, 'image/jpeg', CFG.jpegQuality);
    page.w = final.width; page.h = final.height;
    page.thumb = await IM.canvasToBlob(IM.thumbnail(final, 360), 'image/jpeg', 0.8);
    return page;
  }

  /* ------------------------------------------------------------------ */
  /* Routing (hardware back button aware)                                 */
  /* ------------------------------------------------------------------ */

  const state = { doc: null, editor: null, installPrompt: null };

  function go(route, replace) {
    try { history[replace ? 'replaceState' : 'pushState'](route, ''); } catch (e) { /* sandboxed */ }
    show(route);
  }
  window.addEventListener('popstate', (e) => {
    $$('.backdrop').forEach((b) => b.remove());
    show(e.state || { name: 'home' });
  });
  function back() {
    if (history.state && history.state.name !== 'home' && history.length > 1) history.back();
    else go({ name: 'home' }, true);
  }

  async function show(route) {
    freeUrls();
    if (route.name !== 'camera') stopCamera();
    window.scrollTo(0, 0);
    if (route.name === 'doc') {
      if (!state.doc || state.doc.id !== route.id) state.doc = await window.Store.get(route.id);
      if (!state.doc) return go({ name: 'home' }, true);
      return renderDoc();
    }
    if (route.name === 'editor') {
      if (!state.editor) return state.doc && state.doc.pages.length ? go({ name: 'doc', id: state.doc.id }, true) : go({ name: 'home' }, true);
      return renderEditor();
    }
    if (route.name === 'settings') return renderSettings();
    if (route.name === 'camera') return renderCamera();
    state.editor = null;
    return renderHome();
  }

  /* ------------------------------------------------------------------ */
  /* Home                                                                 */
  /* ------------------------------------------------------------------ */

  async function renderHome() {
    const docs = await window.Store.all();
    const persistent = window.Store.isPersistent();
    app.innerHTML = `<section class="screen" data-screen="home">
      <header class="topbar">
        <div class="brand"><div class="brand-mark">${icon('scan')}</div>
          <div><h1>${esc(appName())}</h1><small>${esc(CFG.tagline[window.I18n.lang] || CFG.tagline.en)}</small></div></div>
        ${state.installPrompt ? `<button class="icon-btn" data-act="install" aria-label="${esc(t('install'))}" title="${esc(t('install'))}">${icon('install')}</button>` : ''}
        <button class="icon-btn" data-act="settings" aria-label="${esc(t('settings'))}" title="${esc(t('settings'))}">${icon('settings')}</button>
      </header>
      ${persistent ? '' : `<div class="banner">${esc(t('storageWarning'))}</div>`}
      <main class="content">
        ${docs.length ? `<h2 class="section-title">${esc(t('documents'))}</h2>
          <div class="doc-list">${docs.map((d) => `
            <button class="doc-card" data-doc="${esc(d.id)}">
              ${d.pages[0] && d.pages[0].thumb ? `<img class="doc-thumb" alt="" src="${blobUrl(d.pages[0].thumb)}">` : '<div class="doc-thumb"></div>'}
              <div class="doc-meta"><strong>${esc(d.name)}</strong><span>${esc(t('pages', d.pages.length))} · ${esc(formatDate(d.updated))}</span></div>
              ${icon('right', 'flip-rtl')}
            </button>`).join('')}</div>`
        : `<div class="empty"><div class="art">${icon('doc')}</div><h2>${esc(t('emptyTitle'))}</h2><p>${esc(t('emptyBody'))}</p>
            <div class="privacy-pill">${icon('lock')}${esc(t('privacyNote'))}</div></div>`}
        ${window.Ads ? window.Ads.placeholder('home') : ''}
      </main>
      <footer class="actionbar"><div class="inner">
        <button class="btn" data-act="import">${icon('image')}${esc(t('import'))}</button>
        <button class="btn primary" data-act="scan">${icon('camera')}${esc(t('scan'))}</button>
      </div></footer>
    </section>`;
    if (window.Ads) window.Ads.mount(app);
    app.onclick = async (e) => {
      const d = e.target.closest('[data-doc]');
      if (d) return go({ name: 'doc', id: d.dataset.doc });
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'settings') go({ name: 'settings' });
      if (a.dataset.act === 'scan' || a.dataset.act === 'import') {
        state.doc = { id: window.uid(), name: t('newDocName', stampName(Date.now())), created: Date.now(), pages: [] };
        await addPages(a.dataset.act === 'scan' ? 'camera' : 'choose');
      }
      if (a.dataset.act === 'install' && state.installPrompt) {
        state.installPrompt.prompt();
        state.installPrompt = null;
        renderHome();
      }
    };
  }

  /** Pick photos; one photo → open editor, several → process all and show the document. */
  const DOC_ACCEPT = '.pdf,.docx,.docm,.xlsx,.xlsm,.xls,.ods,.csv,.tsv,.txt,.md,.json,.xml,.html,.htm,.rtf,' +
    'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,' +
    'application/vnd.oasis.opendocument.spreadsheet,text/csv,text/plain,text/html,image/*';

  /** Add pages. mode: 'camera' (live camera), 'gallery' (photo picker), 'files' (PDF, Word, Excel…), 'choose' (ask). */
  async function addPages(mode) {
    if (mode === true || mode === 'camera') return openCamera();
    if (mode === 'choose' || mode === false) {
      return sheet(t('import'), [
        { icon: 'image', label: t('importGallery'), onClick: () => addPages('gallery') },
        { icon: 'doc', label: t('importFiles'), onClick: () => addPages('files') }
      ]);
    }
    const files = await pickFiles({ multiple: true, accept: mode === 'gallery' ? 'image/*' : DOC_ACCEPT });
    if (files.length) await importFiles(files);
  }

  /** Open the editor on one photo (crop → filter), e.g. right after a capture. */
  async function editNewPhoto(canvas, corners, replaceRoute) {
    const { page } = await newPageFromCanvas(canvas, 'image', corners);
    state.editor = { page, srcCanvas: canvas, isNew: true, step: 'crop' };
    go({ name: 'editor' }, replaceRoute);
    if (!page.detected) toast(t('notDetected'));
  }

  /**
   * Import files of any type. A single photo opens the crop editor; anything else
   * (several photos, PDF, Word, Excel, text…) is converted and added straight to the document.
   */
  async function importFiles(files, replaceRoute) {
    const results = [];
    let failed = 0, unsupported = 0;
    for (let i = 0; i < files.length; i++) {
      const label = files.length > 1 ? `${t('importing')} ${i + 1}/${files.length}` : t('importing');
      loading(true, label + '…');
      await nextFrame();
      try {
        const r = await window.Importers.fileToCanvases(files[i], SRC_MAX(), (p, n) => loading(true, `${label} · ${t('page')} ${p}/${n}`));
        results.push(r);
      } catch (err) {
        console.warn(err);
        if (err && err.message === 'unsupported') unsupported++; else failed++;
      }
    }
    const total = results.reduce((n, r) => n + r.canvases.length, 0);
    if (total === 1 && results[0].kind === 'image') {
      loading(false);
      await editNewPhoto(results[0].canvases[0], null, replaceRoute);
    } else if (total) {
      let k = 0;
      for (const r of results) {
        for (const canvas of r.canvases) {
          k++;
          loading(true, `${t('processing')} ${k}/${total}`);
          await nextFrame();
          try {
            const { page } = await newPageFromCanvas(canvas, r.kind);
            await renderPage(page, canvas);
            delete page.detected;
            state.doc.pages.push(page);
          } catch (err) { console.warn(err); failed++; }
          canvas.width = canvas.height = 1; // free memory early
        }
      }
      loading(false);
      if (state.doc.pages.length) {
        await window.Store.put(state.doc);
        const onDoc = replaceRoute || (history.state && history.state.name === 'doc');
        go({ name: 'doc', id: state.doc.id }, onDoc);
      }
    } else loading(false);
    if (unsupported) toast(t('unsupportedFile') + (unsupported > 1 ? ` (${unsupported})` : ''));
    else if (failed) toast(t('errorFile') + (failed > 1 ? ` (${failed})` : ''));
  }

  /* ------------------------------------------------------------------ */
  /* Live camera with automatic edge detection and auto-capture           */
  /* ------------------------------------------------------------------ */

  let cam = null; // { stream, track, timer, ... } while the camera screen is open

  function stopCamera() {
    if (!cam) return;
    cam.stopped = true;
    clearTimeout(cam.timer);
    if (cam.ro) cam.ro.disconnect();
    cam.stream.getTracks().forEach((tr) => tr.stop());
    cam = null;
  }

  async function openCamera() {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return cameraFallback();
    go({ name: 'camera' });
  }

  /** No live camera available: use the system camera app instead. */
  async function cameraFallback(replaceRoute) {
    const files = await pickFiles({ accept: 'image/*', camera: true });
    if (files.length) await importFiles(files, replaceRoute);
    else if (replaceRoute) back();
  }

  /** The live camera could not start: explain why and offer retry / the phone's camera app. */
  function cameraError(err) {
    const name = (err && err.name) || 'Error';
    const denied = name === 'NotAllowedError' || name === 'SecurityError';
    const box = document.createElement('div');
    box.className = 'cam-error';
    box.innerHTML = `<p><strong>${esc(t('cameraDenied'))}</strong></p>
      ${denied ? `<p>${esc(t('camHelpDenied'))}</p>` : ''}
      <p class="cam-code">${esc(name)}${err && err.message ? ' — ' + esc(String(err.message).slice(0, 120)) : ''}</p>
      <div class="btns">
        <button class="btn primary" data-act="retry">${esc(t('camRetry'))}</button>
        <button class="btn" data-act="system">${icon('camera')}${esc(t('camSystem'))}</button>
      </div>`;
    const view = $('.cam-view');
    if (view) view.appendChild(box);
    const hint = $('.cam-hint'); if (hint) hint.hidden = true;
    app.onclick = async (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'close') back();
      if (a.dataset.act === 'retry') renderCamera();
      if (a.dataset.act === 'system') cameraFallback(true);
      if (a.dataset.act === 'gallery') { const files = await pickFiles({ multiple: true, accept: 'image/*' }); if (files.length) await importFiles(files, true); }
    };
  }

  async function renderCamera() {
    if (!state.doc) return go({ name: 'home' }, true);
    const auto = window.Settings.get('autoCapture', true);
    app.innerHTML = `<section class="screen camera-screen" data-screen="camera">
        <div class="cam-view">
          <video class="cam-video" playsinline muted autoplay></video>
          <canvas class="cam-overlay"></canvas>
          <div class="cam-flash"></div>
        </div>
        <div class="cam-top">
          <button class="cam-round" data-act="close" aria-label="${esc(t('back'))}">${icon('back', 'flip-rtl')}</button>
          <button class="cam-pill ${auto ? 'on' : ''}" data-act="auto" aria-pressed="${auto}">${icon('magic')}<span>${esc(t(auto ? 'camAuto' : 'camManual'))}</span></button>
          <button class="cam-round" data-act="torch" aria-label="${esc(t('torch'))}" hidden>${ICON_TORCH}</button>
        </div>
        <div class="cam-hint" role="status">${esc(t('camFind'))}</div>
        <div class="cam-bar">
          <button class="cam-side" data-act="gallery">${icon('image')}<span>${esc(t('gallery'))}</span></button>
          <button class="shutter" data-act="shoot" aria-label="${esc(t('scan'))}">
            <svg viewBox="0 0 80 80" aria-hidden="true"><circle class="ring-bg" cx="40" cy="40" r="36"/><circle class="ring" cx="40" cy="40" r="36"/></svg>
            <span class="dot"></span>
          </button>
          <span class="cam-side cam-pages">${state.doc.pages.length ? `${icon('doc')}<span>${state.doc.pages.length}</span>` : ''}</span>
        </div>
      </section>`;
    const video = $('.cam-video'), overlay = $('.cam-overlay'), hint = $('.cam-hint');
    const ring = $('.shutter .ring');
    const RING = 2 * Math.PI * 36;
    ring.style.strokeDasharray = RING; ring.style.strokeDashoffset = RING;

    // Some phones refuse high resolutions (NotReadableError / OverconstrainedError): try smaller requests.
    const ATTEMPTS = [
      { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1440 } },
      { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      { facingMode: { ideal: 'environment' } },
      true
    ];
    let stream = null, lastErr = null;
    for (const video of ATTEMPTS) {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video }); break; }
      catch (err) {
        console.warn('getUserMedia', err);
        lastErr = err;
        if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) break;
      }
    }
    if (!$('[data-screen="camera"]')) { if (stream) stream.getTracks().forEach((tr) => tr.stop()); return; }
    if (!stream) return cameraError(lastErr);
    const track = stream.getVideoTracks()[0];
    cam = { stream, track, auto, quad: null, shown: null, stable: 0, capturing: false, torch: false, stopped: false };
    video.srcObject = stream;
    try { await video.play(); } catch (e) { /* autoplay attribute will start it */ }
    try {
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      if (caps.torch) $('[data-act="torch"]').hidden = false;
      if (caps.focusMode && caps.focusMode.includes('continuous')) track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
    } catch (e) { /* optional */ }

    const small = IM.makeCanvas(2, 2);
    const sctx = small.getContext('2d', { willReadFrequently: true });
    const NEED = 7;           // stable detections in a row before an automatic capture (~1 s)
    const MOVE = 0.022;       // max corner movement between two detections (fraction of the frame)

    // Map normalised video coordinates to the on-screen (object-fit: cover) video element.
    function mapper() {
      const vw = video.videoWidth, vh = video.videoHeight, ew = overlay.clientWidth, eh = overlay.clientHeight;
      const sc = Math.max(ew / vw, eh / vh);
      const dx = (ew - vw * sc) / 2, dy = (eh - vh * sc) / 2;
      return (p) => ({ x: dx + p.x * vw * sc, y: dy + p.y * vh * sc });
    }
    function drawOverlay() {
      const dpr = window.devicePixelRatio || 1;
      const w = overlay.clientWidth, h = overlay.clientHeight;
      if (overlay.width !== Math.round(w * dpr)) { overlay.width = Math.round(w * dpr); overlay.height = Math.round(h * dpr); }
      const ctx = overlay.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!cam || !cam.shown || !video.videoWidth) return;
      const m = mapper();
      const pts = cam.shown.map(m);
      const progress = Math.min(1, cam.stable / NEED);
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = `rgba(15,118,110,${0.18 + 0.22 * progress})`;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = progress >= 1 ? '#22C55E' : (CFG.colors.accent || '#F59E0B');
      ctx.stroke();
      ctx.fillStyle = '#fff';
      pts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); });
    }
    function setRing(progress) { ring.style.strokeDashoffset = RING * (1 - progress); }

    function tick() {
      if (!cam || cam.stopped) return;
      cam.timer = setTimeout(tick, 110);
      if (cam.capturing || video.readyState < 2 || !video.videoWidth) return;
      const s = 320 / Math.max(video.videoWidth, video.videoHeight);
      const w = Math.round(video.videoWidth * s), h = Math.round(video.videoHeight * s);
      if (small.width !== w || small.height !== h) { small.width = w; small.height = h; }
      sctx.drawImage(video, 0, 0, w, h);
      const q = IM.detectDocument(small);
      if (q && cam.quad && Math.max(...q.map((p, i) => Math.hypot(p.x - cam.quad[i].x, p.y - cam.quad[i].y))) < MOVE) cam.stable++;
      else cam.stable = q ? 1 : 0;
      cam.quad = q;
      if (q) cam.shown = cam.shown ? cam.shown.map((p, i) => ({ x: p.x + (q[i].x - p.x) * 0.55, y: p.y + (q[i].y - p.y) * 0.55 })) : q;
      else if (cam.stable === 0) cam.shown = null;
      const progress = cam.auto ? Math.min(1, cam.stable / NEED) : 0;
      setRing(progress);
      hint.textContent = !q ? t('camFind') : (cam.auto ? t('camHold') : t('camTap'));
      hint.classList.toggle('ready', !!q);
      drawOverlay();
      if (cam.auto && cam.stable >= NEED) capture();
    }

    async function capture() {
      if (!cam || cam.capturing || !video.videoWidth) return;
      cam.capturing = true;
      const quad = cam.quad;
      $('.cam-flash').classList.add('on');
      if (navigator.vibrate) navigator.vibrate(40);
      hint.textContent = t('camShot');
      const vw = video.videoWidth, vh = video.videoHeight;
      const sc = Math.min(1, SRC_MAX() / Math.max(vw, vh));
      const frame = IM.makeCanvas(vw * sc, vh * sc);
      const fctx = frame.getContext('2d');
      fctx.imageSmoothingQuality = 'high';
      fctx.drawImage(video, 0, 0, frame.width, frame.height);
      const corners = IM.detectDocument(frame) || quad || null;
      stopCamera();
      loading(true);
      await nextFrame();
      try { loading(false); await editNewPhoto(frame, corners, true); }
      catch (err) { console.error(err); loading(false); toast(t('errorImage')); back(); }
    }

    cam.ro = new ResizeObserver(drawOverlay);
    cam.ro.observe(overlay);
    tick();

    app.onclick = async (e) => {
      const a = e.target.closest('[data-act]');
      if (!a || !cam) return;
      const act = a.dataset.act;
      if (act === 'close') { stopCamera(); back(); }
      if (act === 'shoot') capture();
      if (act === 'auto') {
        cam.auto = !cam.auto;
        window.Settings.set('autoCapture', cam.auto);
        a.classList.toggle('on', cam.auto);
        a.setAttribute('aria-pressed', cam.auto);
        a.querySelector('span').textContent = t(cam.auto ? 'camAuto' : 'camManual');
        cam.stable = 0; setRing(0);
      }
      if (act === 'torch') {
        cam.torch = !cam.torch;
        cam.track.applyConstraints({ advanced: [{ torch: cam.torch }] }).catch(() => {});
        a.classList.toggle('on', cam.torch);
      }
      if (act === 'gallery') {
        const files = await pickFiles({ multiple: true, accept: 'image/*' });
        if (!files.length) return;
        stopCamera();
        await importFiles(files, true);
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Document                                                             */
  /* ------------------------------------------------------------------ */

  function renderDoc() {
    const doc = state.doc;
    app.innerHTML = `<section class="screen" data-screen="doc">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="${esc(t('back'))}">${icon('back', 'flip-rtl')}</button>
        <button class="title-btn" data-act="rename" title="${esc(t('rename'))}"><h1>${esc(doc.name)}</h1></button>
        <button class="icon-btn" data-act="menu" aria-label="${esc(t('more'))}">${icon('more')}</button>
      </header>
      <main class="content">
        <h2 class="section-title">${esc(t('pages', doc.pages.length))}</h2>
        <div class="page-grid">
          ${doc.pages.map((p, i) => `<button class="page-tile" data-page="${i}" aria-label="${esc(t('page'))} ${i + 1}">
            <img alt="" src="${blobUrl(p.thumb)}"><span class="page-num">${i + 1}</span></button>`).join('')}
          <button class="add-tile" data-act="add">${icon('plus')}${esc(t('addPage'))}</button>
        </div>
      </main>
      <footer class="actionbar"><div class="inner">
        <button class="btn" data-act="add">${icon('camera')}${esc(t('addPage'))}</button>
        <button class="btn primary" data-act="export" ${doc.pages.length ? '' : 'disabled'}>${icon('pdf')}${esc(t('exportPdf'))}</button>
      </div></footer>
    </section>`;

    app.onclick = async (e) => {
      const tile = e.target.closest('[data-page]');
      if (tile) return pageMenu(+tile.dataset.page);
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'back') back();
      if (act === 'rename') {
        const name = await promptDialog(t('docName'), doc.name);
        if (name) { doc.name = name; await window.Store.put(doc); renderDoc(); }
      }
      if (act === 'menu') {
        sheet(doc.name, [
          { icon: 'edit', label: t('rename'), onClick: () => $('[data-act="rename"]').click() },
          { icon: 'pdf', label: t('exportPdf'), onClick: () => exportDoc() },
          { icon: 'trash', label: t('deleteDoc'), danger: true, onClick: async () => {
            if (await confirmDialog(t('confirmDeleteDoc'), t('delete'), true)) {
              await window.Store.remove(doc.id); state.doc = null; go({ name: 'home' }, true);
            } } }
        ]);
      }
      if (act === 'add') {
        sheet(t('addPage'), [
          { icon: 'camera', label: t('scan'), onClick: () => addPages('camera') },
          { icon: 'image', label: t('importGallery'), onClick: () => addPages('gallery') },
          { icon: 'doc', label: t('importFiles'), onClick: () => addPages('files') }
        ]);
      }
      if (act === 'export') exportDoc();
    };
  }

  function pageMenu(i) {
    const doc = state.doc;
    const n = doc.pages.length;
    const rows = [{ icon: 'edit', label: t('editPage'), onClick: () => editExisting(i) }];
    const rtl = document.documentElement.dir === 'rtl';
    if (i > 0) rows.push({ icon: rtl ? 'right' : 'left', label: t('moveBefore'), onClick: () => movePage(i, -1) });
    if (i < n - 1) rows.push({ icon: rtl ? 'left' : 'right', label: t('moveAfter'), onClick: () => movePage(i, 1) });
    rows.push({ icon: 'trash', label: t('delete'), danger: true, onClick: async () => {
      if (!(await confirmDialog(t('confirmDeletePage'), t('delete'), true))) return;
      doc.pages.splice(i, 1);
      if (!doc.pages.length) { await window.Store.remove(doc.id); state.doc = null; return go({ name: 'home' }, true); }
      await window.Store.put(doc); renderDoc();
    } });
    sheet(`${t('page')} ${i + 1} ${t('of')} ${n}`, rows);
  }

  async function movePage(i, dir) {
    const p = state.doc.pages;
    [p[i], p[i + dir]] = [p[i + dir], p[i]];
    await window.Store.put(state.doc);
    freeUrls(); renderDoc();
  }

  async function editExisting(i) {
    loading(true);
    try {
      const page = { ...state.doc.pages[i], corners: state.doc.pages[i].corners.map((c) => ({ ...c })) };
      const canvas = await IM.loadToCanvas(page.src, 99999);
      state.editor = { page, srcCanvas: canvas, isNew: false, index: i, step: 'crop' };
      loading(false);
      go({ name: 'editor' });
    } catch (err) { loading(false); toast(t('errorGeneric')); }
  }

  /* ------------------------------------------------------------------ */
  /* Export                                                               */
  /* ------------------------------------------------------------------ */

  function safeFileName(name) {
    const base = String(name || 'scan').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'scan';
    return base + '.pdf';
  }

  async function exportDoc() {
    const doc = state.doc;
    if (!doc.pages.length) return;
    loading(true, t('exporting'));
    await nextFrame();
    try {
      const pages = [];
      for (const p of doc.pages) {
        let blob = p.out, w = p.w, h = p.h;
        if (CFG.exportWatermark) {
          const c = IM.stampText(await IM.loadToCanvas(p.out, 99999), CFG.exportWatermark);
          blob = await IM.canvasToBlob(c, 'image/jpeg', CFG.jpegQuality); w = c.width; h = c.height;
        }
        pages.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width: w, height: h });
      }
      const size = window.Settings.get('pageSize', CFG.defaultPageSize);
      const pdf = window.PdfWriter.buildPdf(pages, { pageSize: size, title: doc.name, producer: CFG.appName.en });
      const fileName = safeFileName(doc.name);
      const file = new File([pdf], fileName, { type: 'application/pdf' });
      state.lastExport = file;
      loading(false);
      exportSheet(file);
    } catch (err) {
      console.error(err);
      loading(false); toast(t('errorGeneric'));
    }
  }

  function exportSheet(file) {
    const canShare = !!(navigator.canShare && (() => { try { return navigator.canShare({ files: [file] }); } catch (e) { return false; } })());
    const bd = overlay(`<div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div>
      <h3>${esc(t('exported'))}</h3>
      <div class="export-file"><div class="pdf-badge">PDF</div><div><strong>${esc(file.name)}</strong>
        <span>${esc(t('pages', state.doc.pages.length))} · ${formatSize(file.size)}</span></div></div>
      <div class="btns">
        ${canShare ? `<button class="btn" data-a="share">${icon('share')}${esc(t('share'))}</button>` : ''}
        <button class="btn primary" data-a="download">${icon('download')}${esc(t('download'))}</button>
      </div>${window.Ads ? window.Ads.placeholder('afterExport') : ''}</div>`);
    if (window.Ads) window.Ads.mount(bd);
    bd.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]');
      if (e.target === bd) return bd.remove();
      if (!a) return;
      if (a.dataset.a === 'download') {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        bd.remove();
      }
      if (a.dataset.a === 'share') {
        try { await navigator.share({ files: [file], title: file.name }); bd.remove(); }
        catch (err) { if (err && err.name !== 'AbortError') toast(t('errorGeneric')); }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Editor: crop step + filter step                                      */
  /* ------------------------------------------------------------------ */

  function renderEditor() {
    const ed = state.editor;
    if (ed.step === 'crop') renderCrop(); else renderFilter();
  }

  function editorCancel() {
    const ed = state.editor;
    state.editor = null;
    if (!ed.isNew || (state.doc && state.doc.pages.length)) back();
    else go({ name: 'home' }, true);
  }

  function renderCrop() {
    const ed = state.editor;
    const page = ed.page;
    if (!ed.display) ed.display = IM.thumbnail(ed.srcCanvas, 1400);
    app.innerHTML = `<section class="screen editor" data-screen="crop">
      <header class="topbar">
        <button class="icon-btn" data-act="cancel" aria-label="${esc(t('cancel'))}">${icon('back', 'flip-rtl')}</button>
        <h1>${esc(t('crop'))}</h1>
      </header>
      <div class="stage" id="stage"><div class="stage-inner" id="inner"></div></div>
      <p class="hint">${esc(t('adjustHint'))}</p>
      <div class="toolrow">
        <button class="tool" data-act="auto">${icon('magic')}${esc(t('autoDetect'))}</button>
        <button class="tool" data-act="full">${icon('expand')}${esc(t('fullImage'))}</button>
      </div>
      <div class="editor-footer">
        <button class="btn" data-act="cancel">${esc(t('cancel'))}</button>
        <button class="btn primary" data-act="next">${esc(t('next'))}</button>
      </div>
    </section>`;

    const stage = $('#stage'), inner = $('#inner');
    const disp = ed.display;
    disp.className = 'crop-canvas';
    inner.appendChild(disp);
    inner.insertAdjacentHTML('beforeend', `<svg class="crop-svg" aria-hidden="true"><path class="shade"/><polygon class="edge"/></svg>
      ${[0, 1, 2, 3].map((i) => `<div class="handle" tabindex="0" role="slider" data-h="${i}" aria-label="${i + 1}"></div>`).join('')}
      <div class="loupe hidden"><canvas width="112" height="112"></canvas></div>`);

    let W = 0, H = 0;
    function layout() {
      const sw = stage.clientWidth - 56, sh = stage.clientHeight - 56;
      const s = Math.min(sw / disp.width, sh / disp.height);
      W = Math.max(50, Math.floor(disp.width * s)); H = Math.max(50, Math.floor(disp.height * s));
      disp.style.width = W + 'px'; disp.style.height = H + 'px';
      inner.style.width = W + 'px'; inner.style.height = H + 'px';
      draw();
    }
    function draw() {
      const c = page.corners;
      const pts = c.map((p) => `${p.x * W},${p.y * H}`).join(' ');
      $('.edge', inner).setAttribute('points', pts);
      $('.edge', inner).classList.toggle('invalid', !IM.isValidQuad(c));
      $('.shade', inner).setAttribute('d', `M0 0H${W}V${H}H0Z M${c.map((p) => `${p.x * W} ${p.y * H}`).join(' L')}Z`);
      $$('.handle', inner).forEach((h, i) => { h.style.left = c[i].x * W + 'px'; h.style.top = c[i].y * H + 'px'; });
      $('.crop-svg', inner).setAttribute('viewBox', `0 0 ${W} ${H}`);
      $('[data-act="next"]').disabled = !IM.isValidQuad(c);
    }
    const loupe = $('.loupe', inner), lctx = $('canvas', loupe).getContext('2d');
    function showLoupe(p) {
      loupe.classList.remove('hidden');
      const px = p.x * W, py = p.y * H;
      loupe.style.left = Math.min(Math.max(px - 56, -20), W - 92) + 'px';
      loupe.style.top = (py > 150 ? py - 150 : py + 40) + 'px';
      const zoom = 2.5, sx = (p.x * disp.width), sy = (p.y * disp.height);
      const span = (112 / zoom) * (disp.width / W);
      lctx.fillStyle = '#000'; lctx.fillRect(0, 0, 112, 112);
      lctx.drawImage(disp, sx - span / 2, sy - span / 2, span, span, 0, 0, 112, 112);
      lctx.strokeStyle = CFG.colors.accent; lctx.lineWidth = 2;
      lctx.beginPath(); lctx.moveTo(56, 40); lctx.lineTo(56, 72); lctx.moveTo(40, 56); lctx.lineTo(72, 56); lctx.stroke();
    }

    let drag = null;
    inner.addEventListener('pointerdown', (e) => {
      const h = e.target.closest('.handle');
      if (!h) return;
      e.preventDefault();
      h.setPointerCapture(e.pointerId);
      const r = inner.getBoundingClientRect();
      const i = +h.dataset.h;
      drag = { i, id: e.pointerId, dx: e.clientX - (r.left + page.corners[i].x * W), dy: e.clientY - (r.top + page.corners[i].y * H) };
      showLoupe(page.corners[i]);
    });
    inner.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const r = inner.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - drag.dx - r.left) / W));
      const y = Math.min(1, Math.max(0, (e.clientY - drag.dy - r.top) / H));
      page.corners[drag.i] = { x, y };
      draw(); showLoupe(page.corners[drag.i]);
    });
    const end = () => { drag = null; loupe.classList.add('hidden'); };
    inner.addEventListener('pointerup', end);
    inner.addEventListener('pointercancel', end);
    inner.addEventListener('keydown', (e) => {
      const h = e.target.closest('.handle'); if (!h) return;
      const step = e.shiftKey ? 0.02 : 0.004;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!d) return;
      e.preventDefault();
      const c = page.corners[+h.dataset.h];
      c.x = Math.min(1, Math.max(0, c.x + d[0])); c.y = Math.min(1, Math.max(0, c.y + d[1]));
      draw();
    });

    const ro = new ResizeObserver(() => layout());
    ro.observe(stage);
    layout();

    app.onclick = async (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'cancel') { ro.disconnect(); editorCancel(); }
      if (act === 'auto') {
        const q = IM.detectDocument(ed.srcCanvas);
        if (q) page.corners = q; else toast(t('notDetected'));
        draw();
      }
      if (act === 'full') { page.corners = IM.fullCorners(); draw(); }
      if (act === 'next') {
        if (!IM.isValidQuad(page.corners)) return;
        ro.disconnect();
        loading(true); await nextFrame();
        ed.warped = IM.warpPerspective(ed.srcCanvas, page.corners, CFG.maxPageResolution);
        ed.preview = IM.thumbnail(ed.warped, 1200);
        ed.chipBase = IM.thumbnail(ed.warped, 180);
        ed.step = 'filter';
        loading(false);
        renderFilter();
      }
    };
  }

  function renderFilter() {
    const ed = state.editor;
    const page = ed.page;
    if (!ed.warped) { ed.step = 'crop'; return renderCrop(); }
    const chips = IM.FILTERS.map((f) => {
      const c = IM.applyFilter(ed.chipBase, f);
      return { f, url: c.toDataURL('image/jpeg', 0.7) };
    });
    app.innerHTML = `<section class="screen editor" data-screen="filter">
      <header class="topbar">
        <button class="icon-btn" data-act="back-crop" aria-label="${esc(t('back'))}">${icon('back', 'flip-rtl')}</button>
        <h1>${esc(t('filters.' + page.filter))}</h1>
        <button class="icon-btn" data-act="rotate" aria-label="${esc(t('rotate'))}" title="${esc(t('rotate'))}">${icon('rotate')}</button>
      </header>
      <div class="stage" id="stage"><div class="stage-inner" id="inner"></div></div>
      <div class="filter-row" role="radiogroup">
        ${chips.map((c) => `<button class="filter-chip ${c.f === page.filter ? 'active' : ''}" role="radio" aria-checked="${c.f === page.filter}" data-f="${c.f}">
          <img alt="" src="${c.url}"><span>${esc(t('filters.' + c.f))}</span></button>`).join('')}
      </div>
      <div class="editor-footer">
        <button class="btn" data-act="back-crop">${esc(t('crop'))}</button>
        <button class="btn primary" data-act="done">${esc(t('done'))}</button>
      </div>
    </section>`;

    const stage = $('#stage'), inner = $('#inner');
    let previewCanvas = null;
    function paint() {
      previewCanvas = IM.rotate(IM.applyFilter(ed.preview, page.filter), page.rotation);
      inner.innerHTML = '';
      inner.appendChild(previewCanvas);
      layout();
    }
    function layout() {
      if (!previewCanvas) return;
      const sw = stage.clientWidth - 56, sh = stage.clientHeight - 56;
      const s = Math.min(sw / previewCanvas.width, sh / previewCanvas.height);
      previewCanvas.style.width = Math.floor(previewCanvas.width * s) + 'px';
      previewCanvas.style.height = Math.floor(previewCanvas.height * s) + 'px';
    }
    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    paint();

    app.onclick = async (e) => {
      const chip = e.target.closest('[data-f]');
      if (chip) {
        page.filter = chip.dataset.f;
        $$('.filter-chip').forEach((c) => { const on = c.dataset.f === page.filter; c.classList.toggle('active', on); c.setAttribute('aria-checked', on); });
        $('.topbar h1').textContent = t('filters.' + page.filter);
        return paint();
      }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'rotate') { page.rotation = (page.rotation + 1) % 4; paint(); }
      if (a.dataset.act === 'back-crop') { ro.disconnect(); ed.step = 'crop'; ed.warped = null; renderCrop(); }
      if (a.dataset.act === 'done') {
        ro.disconnect();
        loading(true); await nextFrame();
        try {
          await renderPage(page, ed.srcCanvas, ed.warped);
          delete page.detected;
          const doc = state.doc;
          if (ed.isNew) doc.pages.push(page); else doc.pages[ed.index] = page;
          await window.Store.put(doc);
          state.editor = null;
          loading(false);
          go({ name: 'doc', id: doc.id }, true);
        } catch (err) { console.error(err); loading(false); toast(t('errorGeneric')); }
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Settings                                                             */
  /* ------------------------------------------------------------------ */

  function renderSettings() {
    const S = window.Settings;
    const curFilter = S.get('defaultFilter', CFG.defaultFilter);
    const curSize = S.get('pageSize', CFG.defaultPageSize);
    const seg = (key, items, cur) => `<div class="seg" data-key="${key}">${items.map((v) =>
      `<button data-v="${esc(v.v)}" aria-pressed="${v.v === cur}">${esc(v.l)}</button>`).join('')}</div>`;
    app.innerHTML = `<section class="screen" data-screen="settings">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="${esc(t('back'))}">${icon('back', 'flip-rtl')}</button>
        <h1>${esc(t('settings'))}</h1>
      </header>
      <main class="content">
        <div class="card"><h3>${esc(t('language'))}</h3>
          ${seg('lang', CFG.languages.map((l) => ({ v: l, l: window.I18n.STRINGS[l].langName })), window.I18n.lang)}</div>
        <div class="card"><h3>${esc(t('defaultFilter'))}</h3>
          ${seg('defaultFilter', IM.FILTERS.map((f) => ({ v: f, l: t('filters.' + f) })), curFilter)}</div>
        <div class="card"><h3>${esc(t('pageSize'))}</h3>
          ${seg('pageSize', ['a4', 'letter', 'fit'].map((s) => ({ v: s, l: t('sizes.' + s) })), curSize)}</div>
        <div class="card"><h3>${esc(t('about'))}</h3>
          <div class="about"><strong>${esc(appName())}</strong><br>${esc(t('privacyNote'))}
          ${CFG.privacyPolicyUrl ? `<br><a href="${esc(CFG.privacyPolicyUrl)}" target="_blank" rel="noopener">${esc(t('privacyPolicy'))}</a>` : ''}
          ${CFG.supportEmail ? `<br><a href="mailto:${esc(CFG.supportEmail)}">${esc(t('contact'))}</a>` : ''}</div></div>
      </main>
    </section>`;
    app.onclick = (e) => {
      if (e.target.closest('[data-act="back"]')) return back();
      const b = e.target.closest('.seg button');
      if (!b) return;
      const key = b.parentElement.dataset.key;
      if (key === 'lang') { S.set('lang', b.dataset.v); window.I18n.setLang(b.dataset.v); document.title = appName(); }
      else S.set(key, b.dataset.v);
      renderSettings();
    };
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                 */
  /* ------------------------------------------------------------------ */

  function boot() {
    const root = document.documentElement.style;
    root.setProperty('--primary', CFG.colors.primary);
    root.setProperty('--primary-dark', CFG.colors.primaryDark);
    root.setProperty('--accent', CFG.colors.accent);
    window.I18n.setLang(window.I18n.pickInitial(CFG.defaultLanguage, CFG.languages, window.Settings.get('lang', null)));
    document.title = appName();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.installPrompt = e;
      if (history.state == null || history.state.name === 'home') renderHome();
    });
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.WARAQA_NO_SW) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    const s0 = history.state;
    let navType = 'navigate';
    try { navType = performance.getEntriesByType('navigation')[0].type; } catch (e) { /* older browsers */ }
    if (s0 && navType !== 'navigate' && (s0.name === 'doc' || s0.name === 'settings')) show(s0); else go({ name: 'home' }, true);
  }

  window.WaraqaApp = { state, renderPage };
  boot();
})();
