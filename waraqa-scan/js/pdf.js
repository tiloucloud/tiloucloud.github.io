/*
 * Minimal, dependency-free PDF writer for JPEG pages.
 * Each page embeds one JPEG (DCTDecode) — the file stays small and opens everywhere.
 */
(function () {
  'use strict';

  const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
  const enc = new TextEncoder();

  /** PDF text string: ASCII as (literal), anything else as UTF-16BE hex with BOM. */
  function pdfString(s) {
    s = String(s || '');
    if (/^[\x20-\x7e]*$/.test(s)) return '(' + s.replace(/([\\()])/g, '\\$1') + ')';
    let hex = 'FEFF';
    for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).padStart(4, '0');
    return '<' + hex.toUpperCase() + '>';
  }

  function pdfDate(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
  }

  /**
   * @param {Array<{jpeg:Uint8Array,width:number,height:number}>} pages
   * @param {{pageSize?:'a4'|'letter'|'fit', title?:string, margin?:number}} opts
   * @returns {Blob} application/pdf
   */
  function buildPdf(pages, opts) {
    opts = opts || {};
    const sizeKey = opts.pageSize || 'a4';
    const margin = opts.margin == null ? 18 : opts.margin;
    const chunks = [];
    let offset = 0;
    const offsets = [];
    const push = (data) => {
      const bytes = typeof data === 'string' ? enc.encode(data) : data;
      chunks.push(bytes);
      offset += bytes.length;
    };
    const startObj = (num) => { offsets[num] = offset; push(`${num} 0 obj\n`); };

    push('%PDF-1.4\n');
    push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // binary marker comment

    // Object numbering: 1 catalog, 2 pages, 3 info, then per page: page, content, image
    const n = pages.length;
    const pageObj = (i) => 4 + i * 3;
    const kids = pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ');

    startObj(1); push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    startObj(2); push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>\nendobj\n`);
    const now = pdfDate(new Date());
    startObj(3);
    push(`<< /Title ${pdfString(opts.title || 'Scan')} /Producer ${pdfString(opts.producer || 'Waraqa Scan')} /CreationDate (${now}) >>\nendobj\n`);

    pages.forEach((pg, i) => {
      const po = pageObj(i), co = po + 1, io = po + 2;
      let pw, ph, dw, dh, dx, dy;
      if (sizeKey === 'fit') {
        // Page = image at ~150 dpi, no margin.
        const scale = 72 / 150;
        pw = dw = pg.width * scale; ph = dh = pg.height * scale; dx = 0; dy = 0;
      } else {
        let [w, h] = PAGE_SIZES[sizeKey] || PAGE_SIZES.a4;
        if (pg.width > pg.height) [w, h] = [h, w]; // landscape scans get landscape pages
        pw = w; ph = h;
        const aw = w - margin * 2, ah = h - margin * 2;
        const s = Math.min(aw / pg.width, ah / pg.height);
        dw = pg.width * s; dh = pg.height * s;
        dx = (w - dw) / 2; dy = (h - dh) / 2;
      }
      const f = (v) => (Math.round(v * 100) / 100).toString();
      startObj(po);
      push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(pw)} ${f(ph)}] /Resources << /XObject << /Im${i} ${io} 0 R >> >> /Contents ${co} 0 R >>\nendobj\n`);
      const content = `q\n${f(dw)} 0 0 ${f(dh)} ${f(dx)} ${f(dy)} cm\n/Im${i} Do\nQ\n`;
      startObj(co);
      push(`<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);
      startObj(io);
      push(`<< /Type /XObject /Subtype /Image /Width ${pg.width} /Height ${pg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>\nstream\n`);
      push(pg.jpeg);
      push('\nendstream\nendobj\n');
    });

    const total = 4 + n * 3;
    const xrefAt = offset;
    let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let k = 1; k < total; k++) xref += String(offsets[k]).padStart(10, '0') + ' 00000 n \n';
    push(xref);
    push(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
    return new Blob(chunks, { type: 'application/pdf' });
  }

  window.PdfWriter = { buildPdf };
})();
