/*
 * Importers: turn any supported file into page images (canvases).
 *  - Photos / images            → 1 canvas (edge detection happens later)
 *  - PDF                         → 1 canvas per page            (vendor/pdf.min.mjs, loaded on demand)
 *  - Word .docx                  → pages laid out like A4       (vendor/mammoth.browser.min.js)
 *  - Excel .xlsx/.xls/.ods/.csv  → one or more pages per sheet  (vendor/xlsx.full.min.js)
 *  - Text / HTML / Markdown / …  → pages laid out like A4
 * Heavy libraries are only downloaded the first time such a file is imported.
 */
(function () {
  'use strict';
  const IM = window.Imaging;

  const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|svg|ico|jfif|heic|heif|tiff?)$/i;
  const SHEET_EXT = /\.(xlsx|xlsm|xlsb|xls|ods|fods|csv|tsv|numbers)$/i;
  const TEXT_EXT = /\.(txt|text|md|markdown|json|xml|log|ini|cfg|conf|yml|yaml|rtf|srt|vtt|js|css|py|java|c|cpp|h|sh)$/i;
  const HTML_EXT = /\.(html?|xhtml|mht)$/i;

  /** Which importer handles this file. */
  function kindOf(file) {
    const n = (file.name || '').toLowerCase(), m = (file.type || '').toLowerCase();
    if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
    if (n.endsWith('.docx') || n.endsWith('.docm') || n.endsWith('.dotx') || m.includes('wordprocessingml')) return 'docx';
    if (SHEET_EXT.test(n) || m.includes('spreadsheet') || m.includes('ms-excel') || m === 'text/csv') return 'sheet';
    if (HTML_EXT.test(n) || m === 'text/html') return 'html';
    if (m.startsWith('image/') || IMAGE_EXT.test(n)) return 'image';
    if (TEXT_EXT.test(n) || m.startsWith('text/') || m === 'application/json') return 'text';
    if (/\.(doc|dot|odt|pptx?|ppsx?|odp|pages|key|epub)$/i.test(n)) return 'unsupported';
    return 'unknown';
  }

  /* ---------------------------------------------------------------- */
  /* On-demand loading of the bundled libraries                         */
  /* ---------------------------------------------------------------- */

  const base = () => new URL('vendor/', document.baseURI).href;
  const loaded = {};
  function loadScript(file, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (!loaded[file]) {
      loaded[file] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = base() + file;
        s.onload = () => (window[globalName] ? resolve(window[globalName]) : reject(new Error('lib')));
        s.onerror = () => { delete loaded[file]; reject(new Error('lib')); };
        document.head.appendChild(s);
      });
    }
    return loaded[file];
  }
  let pdfjsPromise = null;
  function loadPdfJs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import(base() + 'pdf.min.mjs').then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = base() + 'pdf.worker.min.mjs';
        return lib;
      }).catch((e) => { pdfjsPromise = null; throw e; });
    }
    return pdfjsPromise;
  }

  /* ---------------------------------------------------------------- */
  /* PDF                                                                */
  /* ---------------------------------------------------------------- */

  async function pdfToCanvases(file, maxSide, onProgress) {
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
    const out = [];
    try {
      for (let i = 1; i <= doc.numPages; i++) {
        if (onProgress) onProgress(i, doc.numPages);
        const page = await doc.getPage(i);
        const v1 = page.getViewport({ scale: 1 });
        const scale = Math.min(4, maxSide / Math.max(v1.width, v1.height));
        const vp = page.getViewport({ scale });
        const c = IM.makeCanvas(vp.width, vp.height);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        page.cleanup();
        out.push(c);
      }
    } finally { doc.destroy(); }
    return out;
  }

  /* ---------------------------------------------------------------- */
  /* HTML → A4 pages (used for Word, Excel, text and HTML files)        */
  /* ---------------------------------------------------------------- */

  const PAGE_W = 794, PAGE_H = 1123, MARGIN = 64;          // A4 at 96 dpi
  const CONTENT_W = PAGE_W - 2 * MARGIN, CONTENT_H = PAGE_H - 2 * MARGIN;
  const DOC_CSS = `
    .wq-doc{display:flow-root;padding:0;margin:0;font-family:'Noto Naskh Arabic','Noto Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;background:#fff;width:${CONTENT_W}px;word-wrap:break-word;overflow-wrap:anywhere}
    .wq-doc *{box-sizing:border-box;max-width:100%}
    .wq-doc p{margin:0 0 .7em}
    .wq-doc h1{font-size:24px;margin:.4em 0 .5em}.wq-doc h2{font-size:20px;margin:.4em 0 .5em}.wq-doc h3{font-size:17px;margin:.4em 0 .4em}
    .wq-doc img{height:auto}
    .wq-doc table{border-collapse:collapse;margin:0 0 1em;font-size:12px;max-width:none}
    .wq-doc td,.wq-doc th{border:1px solid #9ca3af;padding:3px 6px;vertical-align:top;text-align:start}
    .wq-doc pre,.wq-doc .wq-line{white-space:pre-wrap;font-family:inherit;margin:0}
    .wq-doc .wq-mono{font-family:'Roboto Mono',Consolas,monospace;font-size:12px}
    .wq-doc .wq-sheet{font-weight:700;font-size:15px;margin:0 0 .6em;color:#0F766E}`;
  const BREAK_SEL = 'p,li,tr,h1,h2,h3,h4,h5,h6,img,pre,blockquote,.wq-line,hr,dt,dd,figure';

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /** Remove anything active or external from imported HTML. */
  function sanitize(root) {
    root.querySelectorAll('script,iframe,object,embed,link,meta,base,form,input,button,select,textarea,video,audio,canvas,noscript').forEach((e) => e.remove());
    root.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((a) => {
        const n = a.name.toLowerCase();
        if (n.startsWith('on') || n === 'srcset') el.removeAttribute(a.name);
        if ((n === 'src' || n === 'href' || n === 'xlink:href') && !/^data:image\//i.test(a.value)) {
          if (el.tagName === 'IMG') el.remove(); else el.removeAttribute(a.name);
        }
      });
    });
  }

  function svgToCanvas(svg, w, h) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = IM.makeCanvas(w, h);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c);
      };
      img.onerror = () => reject(new Error('render'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  /** Lay out an HTML fragment on A4 pages and draw each page into a canvas. */
  async function htmlToCanvases(html, maxSide, opts) {
    opts = opts || {};
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none';
    host.innerHTML = `<style>${DOC_CSS}</style><div class="wq-doc" dir="auto"></div>`;
    const docEl = host.lastChild;
    docEl.innerHTML = html;
    sanitize(docEl);
    docEl.querySelectorAll('p,li,td,th,h1,h2,h3,h4,h5,h6,div').forEach((e) => { if (!e.hasAttribute('dir')) e.setAttribute('dir', 'auto'); });
    document.body.appendChild(host);
    try {
      await Promise.all([...docEl.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
      // Shrink content that is wider than the page (wide tables, big images).
      const wide = docEl.scrollWidth;
      let zoom = 1;
      if (wide > CONTENT_W + 2) { zoom = Math.max(0.35, CONTENT_W / wide); docEl.style.zoom = zoom; docEl.style.width = (CONTENT_W / zoom) + 'px'; }
      const top0 = docEl.getBoundingClientRect().top;
      const total = Math.ceil(docEl.getBoundingClientRect().height);
      const marks = [...new Set([...docEl.querySelectorAll(BREAK_SEL)]
        .map((e) => Math.round(e.getBoundingClientRect().bottom - top0)))].filter((b) => b > 0).sort((a, b) => a - b);
      const ranges = [];
      let start = 0;
      while (start < total - 1 && ranges.length < 400) {
        const limit = start + CONTENT_H;
        let end = limit;
        if (limit < total) {
          let best = -1;
          for (const b of marks) { if (b > start + CONTENT_H * 0.3 && b <= limit) best = b; if (b > limit) break; }
          if (best > 0) end = best;
        } else end = total;
        ranges.push([start, end]);
        start = end;
      }
      if (!ranges.length) ranges.push([0, Math.max(1, total)]);

      const xhtml = new XMLSerializer().serializeToString(docEl);
      const style = new XMLSerializer().serializeToString(host.firstChild);
      const scale = maxSide / PAGE_H;
      const W = Math.round(PAGE_W * scale), H = Math.round(PAGE_H * scale);
      const out = [];
      for (let i = 0; i < ranges.length; i++) {
        if (opts.onProgress) opts.onProgress(i + 1, ranges.length);
        const [a, b] = ranges[i];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">` +
          `<rect width="100%" height="100%" fill="#fff"/>` +
          `<foreignObject x="${MARGIN}" y="${MARGIN}" width="${CONTENT_W}" height="${b - a}">` +
          `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${CONTENT_W}px;height:${b - a}px;overflow:hidden">${style}` +
          `<div style="margin-top:${-a}px">${xhtml}</div></div></foreignObject></svg>`;
        out.push(await svgToCanvas(svg, W, H));
      }
      return out;
    } finally { host.remove(); }
  }

  /* ---------------------------------------------------------------- */
  /* Per-format converters                                              */
  /* ---------------------------------------------------------------- */

  async function docxToCanvases(file, maxSide, onProgress) {
    const mammoth = await loadScript('mammoth.browser.min.js', 'mammoth');
    const res = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const html = res.value && res.value.trim() ? res.value : '<p></p>';
    return htmlToCanvases(html, maxSide, { onProgress });
  }

  async function sheetToCanvases(file, maxSide, onProgress) {
    const XLSX = await loadScript('xlsx.full.min.js', 'XLSX');
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array', cellDates: true, dense: true });
    const out = [];
    const names = wb.SheetNames.slice(0, 50);
    for (let s = 0; s < names.length; s++) {
      const ws = wb.Sheets[names[s]];
      if (!ws || !ws['!ref']) continue;
      const tableHtml = XLSX.utils.sheet_to_html(ws, { header: '', footer: '' });
      const tmp = document.createElement('div');
      tmp.innerHTML = tableHtml;
      const table = tmp.querySelector('table');
      if (!table || !table.textContent.trim()) continue;
      const title = names.length > 1 ? `<div class="wq-sheet" dir="auto">${escapeHtml(names[s])}</div>` : '';
      const pages = await htmlToCanvases(title + table.outerHTML, maxSide,
        { onProgress: (i, n) => onProgress && onProgress(out.length + i, out.length + n) });
      out.push(...pages);
    }
    if (!out.length) out.push(...(await htmlToCanvases('<p></p>', maxSide)));
    return out;
  }

  async function textToCanvases(file, maxSide, onProgress) {
    const text = (await file.text()).replace(/\r\n?/g, '\n');
    const mono = /\.(json|xml|log|ini|cfg|conf|yml|yaml|js|css|py|java|c|cpp|h|sh)$/i.test(file.name || '');
    const lines = text.split('\n').slice(0, 20000).map((l) => `<div class="wq-line" dir="auto">${escapeHtml(l) || '&#8203;'}</div>`).join('');
    return htmlToCanvases(`<div class="${mono ? 'wq-mono' : ''}">${lines}</div>`, maxSide, { onProgress });
  }

  async function htmlFileToCanvases(file, maxSide, onProgress) {
    const doc = new DOMParser().parseFromString(await file.text(), 'text/html');
    return htmlToCanvases(doc.body ? doc.body.innerHTML : '', maxSide, { onProgress });
  }

  async function looksLikeText(file) {
    const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    if (!head.length) return false;
    let bad = 0;
    for (const b of head) { if (b === 0) return false; if (b < 9 || (b > 13 && b < 32)) bad++; }
    return bad / head.length < 0.02;
  }

  /**
   * Convert a file into page canvases.
   * Returns { kind: 'image' | 'document', canvases: [...] }.
   * Throws Error('unsupported') for formats that cannot be read in the browser.
   */
  async function fileToCanvases(file, maxSide, onProgress) {
    let kind = kindOf(file);
    if (kind === 'unknown') {
      try { return { kind: 'image', canvases: [await IM.loadToCanvas(file, maxSide)] }; } catch (e) { /* not an image */ }
      if (await looksLikeText(file)) kind = 'text'; else throw new Error('unsupported');
    }
    if (kind === 'unsupported') throw new Error('unsupported');
    if (kind === 'image') return { kind, canvases: [await IM.loadToCanvas(file, maxSide)] };
    const fn = { pdf: pdfToCanvases, docx: docxToCanvases, sheet: sheetToCanvases, text: textToCanvases, html: htmlFileToCanvases }[kind];
    return { kind: 'document', canvases: await fn(file, maxSide, onProgress) };
  }

  window.Importers = { kindOf, fileToCanvases, htmlToCanvases };
})();
