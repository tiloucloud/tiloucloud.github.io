/*
 * Imaging: loading, document edge detection, perspective correction, scan filters.
 * Pure canvas / typed-array code — no dependencies.
 */
(function () {
  'use strict';

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  /** Decode a Blob/File into a canvas no larger than maxSide (honours EXIF orientation). */
  async function loadToCanvas(blob, maxSide) {
    let bmp;
    try {
      bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch (e) {
      bmp = await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
        img.src = url;
      });
    }
    const w0 = bmp.width, h0 = bmp.height;
    const s = Math.min(1, maxSide / Math.max(w0, h0));
    const c = makeCanvas(w0 * s, h0 * s);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    return c;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type || 'image/jpeg', quality || 0.9));
  }

  /* ---------------------------------------------------------------- */
  /* Edge detection                                                     */
  /* ---------------------------------------------------------------- */

  /** Default corners: a small inset from the image border. Order: TL, TR, BR, BL (normalised 0..1). */
  function defaultCorners(inset) {
    const i = inset == null ? 0.06 : inset;
    return [{ x: i, y: i }, { x: 1 - i, y: i }, { x: 1 - i, y: 1 - i }, { x: i, y: 1 - i }];
  }
  function fullCorners() { return defaultCorners(0); }

  /**
   * Find a document (a bright sheet on a darker background) and return its four
   * corners, normalised to 0..1, or null if nothing convincing is found.
   * Method: downscale → blurred luminance → Otsu threshold → largest bright
   * connected region (not touching too much border) → extreme points of x±y.
   */
  function detectDocument(srcCanvas) {
    const W = 256;
    const s = W / Math.max(srcCanvas.width, srcCanvas.height);
    const w = Math.max(8, Math.round(srcCanvas.width * s));
    const h = Math.max(8, Math.round(srcCanvas.height * s));
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.filter = 'blur(2px)';
    ctx.drawImage(srcCanvas, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const n = w * h;
    const lum = new Uint8Array(n);
    const hist = new Uint32Array(256);
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const v = (d[p] * 77 + d[p + 1] * 150 + d[p + 2] * 29) >> 8;
      lum[i] = v; hist[v]++;
    }
    // Otsu threshold
    let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
    let sumB = 0, wB = 0, best = 0, thr = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      const wF = n - wB; if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; thr = t; }
    }
    const mask = new Uint8Array(n);
    for (let i = 0; i < n; i++) mask[i] = lum[i] > thr ? 1 : 0;

    // Largest connected component (4-neighbour flood fill, iterative)
    const label = new Int32Array(n);
    const stack = new Int32Array(n);
    let bestLabel = 0, bestSize = 0, cur = 0, bestBorder = 0;
    for (let i = 0; i < n; i++) {
      if (!mask[i] || label[i]) continue;
      cur++;
      let sp = 0, size = 0, border = 0;
      stack[sp++] = i; label[i] = cur;
      while (sp) {
        const k = stack[--sp]; size++;
        const x = k % w, y = (k / w) | 0;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border++;
        if (x > 0 && mask[k - 1] && !label[k - 1]) { label[k - 1] = cur; stack[sp++] = k - 1; }
        if (x < w - 1 && mask[k + 1] && !label[k + 1]) { label[k + 1] = cur; stack[sp++] = k + 1; }
        if (y > 0 && mask[k - w] && !label[k - w]) { label[k - w] = cur; stack[sp++] = k - w; }
        if (y < h - 1 && mask[k + w] && !label[k + w]) { label[k + w] = cur; stack[sp++] = k + w; }
      }
      if (size > bestSize) { bestSize = size; bestLabel = cur; bestBorder = border; }
    }
    const areaFrac = bestSize / n;
    const perimeter = 2 * (w + h);
    if (!bestLabel || areaFrac < 0.12 || areaFrac > 0.97 || bestBorder > perimeter * 0.5) return null;

    // Extreme points
    let tl = null, tr = null, br = null, bl = null;
    let mTL = Infinity, mTR = -Infinity, mBR = -Infinity, mBL = Infinity;
    for (let i = 0; i < n; i++) {
      if (label[i] !== bestLabel) continue;
      const x = i % w, y = (i / w) | 0;
      const sxy = x + y, dxy = x - y;
      if (sxy < mTL) { mTL = sxy; tl = { x, y }; }
      if (sxy > mBR) { mBR = sxy; br = { x, y }; }
      if (dxy > mTR) { mTR = dxy; tr = { x, y }; }
      if (dxy < mBL) { mBL = dxy; bl = { x, y }; }
    }
    let quad = [tl, tr, br, bl].map((p) => ({ x: (p.x + 0.5) / w, y: (p.y + 0.5) / h }));
    // Pull corners ~1% towards the centre so the paper's own edge/shadow is not included.
    const cx = quad.reduce((a, p) => a + p.x, 0) / 4, cy = quad.reduce((a, p) => a + p.y, 0) / 4;
    quad = quad.map((p) => ({ x: p.x + (cx - p.x) * 0.012, y: p.y + (cy - p.y) * 0.012 }));
    // Reject degenerate quads (area too small relative to region → not a sheet)
    const qa = quadArea(quad);
    if (qa < areaFrac * 0.75) return null;
    return quad;
  }

  function quadArea(q) {
    let a = 0;
    for (let i = 0; i < 4; i++) { const p = q[i], r = q[(i + 1) % 4]; a += p.x * r.y - r.x * p.y; }
    return Math.abs(a) / 2;
  }

  /** True if the quad is convex and has a non-trivial area. */
  function isValidQuad(q) {
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (Math.abs(cross) < 1e-9) return false;
      const sg = cross > 0 ? 1 : -1;
      if (!sign) sign = sg; else if (sg !== sign) return false;
    }
    return quadArea(q) > 0.01;
  }

  /* ---------------------------------------------------------------- */
  /* Perspective correction                                             */
  /* ---------------------------------------------------------------- */

  // Solve the 8-unknown homography mapping unit square → quad (Heckbert's closed form).
  function squareToQuad(q) {
    const [p0, p1, p2, p3] = q;
    const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
    const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
    let g = 0, hh = 0;
    if (Math.abs(dx3) > 1e-12 || Math.abs(dy3) > 1e-12) {
      const den = dx1 * dy2 - dx2 * dy1;
      g = (dx3 * dy2 - dx2 * dy3) / den;
      hh = (dx1 * dy3 - dx3 * dy1) / den;
    }
    return {
      a: p1.x - p0.x + g * p1.x, b: p3.x - p0.x + hh * p3.x, c: p0.x,
      d: p1.y - p0.y + g * p1.y, e: p3.y - p0.y + hh * p3.y, f: p0.y,
      g, h: hh
    };
  }

  /**
   * Warp the quad (normalised corners) of src into a flat rectangle.
   * Output size follows the quad's edge lengths, capped to maxSide.
   */
  function warpPerspective(src, cornersN, maxSide) {
    const W = src.width, H = src.height;
    const q = cornersN.map((p) => ({ x: p.x * W, y: p.y * H }));
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    let outW = Math.max(dist(q[0], q[1]), dist(q[3], q[2]));
    let outH = Math.max(dist(q[0], q[3]), dist(q[1], q[2]));
    const s = Math.min(1, maxSide / Math.max(outW, outH));
    outW = Math.max(16, Math.round(outW * s));
    outH = Math.max(16, Math.round(outH * s));

    const sctx = src.getContext('2d', { willReadFrequently: true });
    const sd = sctx.getImageData(0, 0, W, H).data;
    const out = makeCanvas(outW, outH);
    const octx = out.getContext('2d');
    const img = octx.createImageData(outW, outH);
    const od = img.data;
    const m = squareToQuad(q);
    const Wm1 = W - 1, Hm1 = H - 1;
    let o = 0;
    for (let y = 0; y < outH; y++) {
      const v = (y + 0.5) / outH;
      for (let x = 0; x < outW; x++) {
        const u = (x + 0.5) / outW;
        const den = m.g * u + m.h * v + 1;
        let sx = (m.a * u + m.b * v + m.c) / den - 0.5;
        let sy = (m.d * u + m.e * v + m.f) / den - 0.5;
        if (sx < 0) sx = 0; else if (sx > Wm1) sx = Wm1;
        if (sy < 0) sy = 0; else if (sy > Hm1) sy = Hm1;
        const x0 = sx | 0, y0 = sy | 0;
        const x1 = x0 < Wm1 ? x0 + 1 : x0, y1 = y0 < Hm1 ? y0 + 1 : y0;
        const fx = sx - x0, fy = sy - y0;
        const i00 = (y0 * W + x0) << 2, i10 = (y0 * W + x1) << 2;
        const i01 = (y1 * W + x0) << 2, i11 = (y1 * W + x1) << 2;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        od[o] = sd[i00] * w00 + sd[i10] * w10 + sd[i01] * w01 + sd[i11] * w11;
        od[o + 1] = sd[i00 + 1] * w00 + sd[i10 + 1] * w10 + sd[i01 + 1] * w01 + sd[i11 + 1] * w11;
        od[o + 2] = sd[i00 + 2] * w00 + sd[i10 + 2] * w10 + sd[i01 + 2] * w01 + sd[i11 + 2] * w11;
        od[o + 3] = 255;
        o += 4;
      }
    }
    octx.putImageData(img, 0, 0);
    return out;
  }

  /** Rotate a canvas by a multiple of 90° (clockwise). */
  function rotate(src, quarterTurns) {
    const t = ((quarterTurns % 4) + 4) % 4;
    if (!t) return src;
    const swap = t % 2 === 1;
    const c = makeCanvas(swap ? src.height : src.width, swap ? src.width : src.height);
    const ctx = c.getContext('2d');
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((t * Math.PI) / 2);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);
    return c;
  }

  /* ---------------------------------------------------------------- */
  /* Filters                                                            */
  /* ---------------------------------------------------------------- */

  const FILTERS = ['original', 'enhance', 'gray', 'bw'];

  function applyFilter(src, filter) {
    if (filter === 'original' || !FILTERS.includes(filter)) return src;
    const w = src.width, h = src.height;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const n = w * h;

    if (filter === 'enhance') {
      // Per-channel percentile stretch (white-balances paper) + gentle contrast.
      const lo = [0, 0, 0], hi = [255, 255, 255];
      for (let ch = 0; ch < 3; ch++) {
        const hist = new Uint32Array(256);
        for (let p = ch; p < d.length; p += 4) hist[d[p]]++;
        let acc = 0; const loCut = n * 0.01, hiCut = n * 0.06;
        for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > loCut) { lo[ch] = v; break; } }
        acc = 0;
        for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > hiCut) { hi[ch] = v; break; } }
        if (hi[ch] - lo[ch] < 40) { lo[ch] = 0; hi[ch] = 255; }
      }
      const lut = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];
      for (let ch = 0; ch < 3; ch++) {
        const r = hi[ch] - lo[ch];
        for (let v = 0; v < 256; v++) {
          let t = (v - lo[ch]) / r; t = t < 0 ? 0 : t > 1 ? 1 : t;
          t = t * t * (3 - 2 * t) * 0.35 + t * 0.65; // soft S-curve
          lut[ch][v] = t * 255;
        }
      }
      for (let p = 0; p < d.length; p += 4) {
        d[p] = lut[0][d[p]]; d[p + 1] = lut[1][d[p + 1]]; d[p + 2] = lut[2][d[p + 2]];
      }
    } else if (filter === 'gray') {
      const hist = new Uint32Array(256);
      const g = new Uint8Array(n);
      for (let i = 0, p = 0; i < n; i++, p += 4) {
        const v = (d[p] * 77 + d[p + 1] * 150 + d[p + 2] * 29) >> 8; g[i] = v; hist[v]++;
      }
      let lo = 0, hi = 255, acc = 0;
      for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.01) { lo = v; break; } }
      acc = 0;
      for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.05) { hi = v; break; } }
      const r = Math.max(40, hi - lo);
      for (let i = 0, p = 0; i < n; i++, p += 4) {
        let v = ((g[i] - lo) * 255) / r; v = v < 0 ? 0 : v > 255 ? 255 : v;
        d[p] = d[p + 1] = d[p + 2] = v;
      }
    } else if (filter === 'bw') {
      // Bradley adaptive threshold using an integral image — copes with shadows.
      const g = new Uint8Array(n);
      for (let i = 0, p = 0; i < n; i++, p += 4) g[i] = (d[p] * 77 + d[p + 1] * 150 + d[p + 2] * 29) >> 8;
      const integ = new Float64Array((w + 1) * (h + 1));
      for (let y = 1; y <= h; y++) {
        let row = 0;
        for (let x = 1; x <= w; x++) {
          row += g[(y - 1) * w + (x - 1)];
          integ[y * (w + 1) + x] = integ[(y - 1) * (w + 1) + x] + row;
        }
      }
      const half = Math.max(8, Math.round(Math.max(w, h) / 32));
      const T = 0.13;
      for (let y = 0; y < h; y++) {
        const y0 = Math.max(0, y - half), y1 = Math.min(h, y + half + 1);
        for (let x = 0; x < w; x++) {
          const x0 = Math.max(0, x - half), x1 = Math.min(w, x + half + 1);
          const count = (x1 - x0) * (y1 - y0);
          const s = integ[y1 * (w + 1) + x1] - integ[y0 * (w + 1) + x1] - integ[y1 * (w + 1) + x0] + integ[y0 * (w + 1) + x0];
          const i = y * w + x;
          const v = g[i] * count <= s * (1 - T) ? 0 : 255;
          const p = i << 2;
          d[p] = d[p + 1] = d[p + 2] = v;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  /** Small preview copy of a canvas. */
  function thumbnail(src, maxSide) {
    const s = Math.min(1, maxSide / Math.max(src.width, src.height));
    const c = makeCanvas(src.width * s, src.height * s);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  /** Stamp a short text at the bottom of a page (used for optional watermark). */
  function stampText(src, text) {
    if (!text) return src;
    const c = makeCanvas(src.width, src.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const fs = Math.max(12, Math.round(src.width / 45));
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const tw = ctx.measureText(text).width;
    ctx.fillRect(c.width / 2 - tw / 2 - fs * 0.5, c.height - fs * 1.9, tw + fs, fs * 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(text, c.width / 2, c.height - fs * 0.6);
    return c;
  }

  window.Imaging = {
    makeCanvas, loadToCanvas, canvasToBlob, detectDocument, defaultCorners, fullCorners,
    isValidQuad, warpPerspective, rotate, applyFilter, thumbnail, stampText, FILTERS
  };
})();
