/* =========================================================
   Math drawings — everything is written with one monoline "pen"
   1. Loader: the Poisson limit theorem, written by hand.
   2. One continuous line that draws itself on scroll and turns into
      ∑, ∫, the ln x curve and ∂, each completed by a handwritten formula.
   ========================================================= */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  const el = (name, attrs = {}, parent) => {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  };

  /* ---------------------------------------------------------
     Pen alphabet: monoline strokes, 100-unit em, baseline at y=0
     (x-height ≈ 45, ascender ≈ 80, descender ≈ 28). Each entry is
     an advance width and the strokes, in writing order; extra
     strokes are pen lifts (i dots, crossbars, arrowheads).
     --------------------------------------------------------- */
  const PEN = {
    l: [24, 'M0 0C6-8 16-30 18-56C19-72 16-82 12-82C7-82 6-70 7-52C8-30 8-12 10-5C12 1 18 1 24-4'],
    i: [16, 'M1-40C3-30 3-12 4-5C5 1 10 1 14-4', 'M6-62L8-57'],
    m: [47, 'M0 0C1-14 2-30 3-42C4-46 9-47 13-46C19-45 19-38 19-30C19-18 18-8 18 0C18-12 19-28 22-38C25-46 31-47 34-46C39-44 38-36 38-28C38-16 37-8 38-3C39 1 43 1 47-4'],
    n: [30, 'M0 0C1-14 2-30 3-42C4-46 9-47 13-46C19-45 19-38 19-30C19-18 18-8 19-3C20 1 24 1 29-4'],
    k: [34, 'M6-80C4-50 2-20 1 0', 'M2-18C10-30 22-46 26-40C28-34 16-26 6-22C14-16 20-4 26-1C29 0 32-2 34-4'],
    p: [30, 'M2-42C3-30 2 0 0 28', 'M2-30C8-46 26-48 26-28C26-10 12-2 2-8'],
    e: [26, 'M1-16C10-14 22-22 20-34C18-46 2-42 1-24C0-6 12 2 24-6'],
    x: [32, 'M0-38C8-44 12-30 16-18C20-6 24 2 32-4', 'M28-42C20-34 10-12 1 0'],
    y: [30, 'M0-40C2-24 6-6 15-6C23-6 27-24 27-42C27-10 25 14 17 26C11 34 1 30 3 22'],
    d: [38, 'M26-34C20-46 2-44 2-22C2-4 18-2 26-14', 'M30-82C28-50 26-20 28-6C29 1 33 1 37-3'],
    f: [26, 'M26-76C22-84 12-82 10-66C8-40 8 0 4 24C2 32-4 32-6 26', 'M0-42L22-44'],
    h: [38, 'M4-80C3-50 2-20 1 0C3-20 8-44 20-44C30-44 28-20 28-8C28 0 34 0 38-4'],
    0: [30, 'M15-74C1-74-1-30 4-10C8 4 24 2 26-20C28-46 25-74 13-72'],
    1: [20, 'M2-58C8-62 12-68 14-74C12-50 10-24 9 0'],
    2: [32, 'M2-60C6-76 26-78 26-60C26-44 8-24 0 0C10-2 20-2 30 0'],
    6: [32, 'M24-74C10-70 2-46 2-24C2-4 12 2 20 0C28-2 30-14 28-24C26-36 12-38 4-24'],
    '!': [12, 'M9-76C8-50 7-30 6-18', 'M5-3L6-1'],
    '(': [16, 'M15-80C1-60-1-10 15 22'],
    ')': [16, 'M1-80C15-60 17-10 1 22'],
    '−': [30, 'M2-24C10-25 18-25 27-25'],
    '+': [30, 'M15-40L14-8', 'M1-24L28-25'],
    '=': [30, 'M2-33C10-34 18-34 27-34', 'M2-16C10-17 18-17 27-17'],
    ',': [12, 'M6-3C6 2 4 8 1 10'],
    '/': [26, 'M24-80L2 16'],
    'λ': [32, 'M2-78C10-78 14-60 20-30C23-14 26-2 31 0', 'M16-40C10-26 5-10 0 0'],
    'π': [42, 'M0-40C10-46 24-44 39-46', 'M12-44C12-28 10-12 6 0', 'M28-45C27-30 28-10 32-2C34 1 38 0 41-4'],
    '∂': [38, 'M6-64C12-78 30-80 34-60C38-36 30 0 14 0C2 0 0-14 6-24C12-34 26-36 33-30'],
    '√': [30, 'M0-30L6-34L16 0L28-82L74-82'],
    '→': [40, 'M0-25C12-26 24-26 35-25', 'M25-33L36-25L25-17'],
    '∞': [42, 'M21-24C27-36 39-36 39-24C39-12 27-12 21-24C15-36 3-36 3-24C3-12 15-12 21-24'],
  };

  // Every pen mark is a path; pathLength=1 lets CSS draw it with a 0→1 dash
  function penPath(g, d, transform, opts = {}) {
    const p = el('path', {
      d,
      class: 'm-stroke' + (opts.muted ? ' is-muted' : ''),
      pathLength: 1,
    }, g);
    if (transform) p.setAttribute('transform', transform);
    p.dataset.len = (p.getTotalLength() * (opts.scale || 1)).toFixed(1);
    return p;
  }

  // Same on-screen pen width for every mark, whatever its scale.
  // (vector-effect: non-scaling-stroke would do this, but it breaks the dash animation.)
  function setPenWidth(root, px) {
    root.querySelectorAll('.m-stroke').forEach((p) => {
      const m = p.getScreenCTM();
      const scale = m ? Math.hypot(m.a, m.b) : 1;
      p.style.strokeWidth = (px / (scale || 1)).toFixed(3);
    });
  }

  // Write a string with the pen; returns its advance width
  function glyph(g, s, x, y, size, opts = {}) {
    const k = size / 100;
    let cx = x;
    for (const ch of s) {
      const gl = PEN[ch];
      if (!gl) { cx += size * .3; continue; }
      const [w, ...strokes] = gl;
      const t = `translate(${cx.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(4)}) skewX(-8)`;
      strokes.forEach((d) => penPath(g, d, t, { ...opts, scale: k }));
      cx += (w + 5) * k;
    }
    return cx - x - 5 * k;
  }

  function stroke(g, d, size, accent) {
    return penPath(g, d, null, { accent });
  }

  function paren(g, x, yTop, yBot, w, size, right) {
    const mid = (yTop + yBot) / 2;
    const d = right
      ? `M${x} ${yTop} Q${x + w * 1.5} ${mid} ${x} ${yBot}`
      : `M${x + w} ${yTop} Q${x - w * .5} ${mid} ${x + w} ${yBot}`;
    stroke(g, d, size);
  }

  function typeset(g, items, x, y, size) {
    let cx = x;
    for (const it of items) {
      if (it.gap != null) { cx += it.gap * size; continue; }

      if (it.sup === 2) { // superscript of a superscript (the ² in e^{−x²})
        cx += glyph(g, it.s, cx, y - size * .78, size * .42, it) + size * .04;
        continue;
      }

      if (it.sup || it.sub) {
        const dy = it.sup ? -size * .42 : size * .24;
        cx += glyph(g, it.s, cx, y + dy, size * .62, it) + size * .06;
        continue;
      }

      if (it.subsup) {
        const s = size * .5;
        const wb = glyph(g, it.subsup[0], cx, y + size * .3, s, { up: true });
        const wt = glyph(g, it.subsup[1], cx + size * .12, y - size * .62, s, { up: true });
        cx += Math.max(wb, wt + size * .12) + size * .08;
        continue;
      }

      if (it.under) {
        const base = el('g', {}, g);
        const wb = glyph(base, it.under, 0, 0, size, { up: true });
        const below = el('g', {}, g);
        const wl = typeset(below, it.below, 0, 0, size * .42);
        const w = Math.max(wb, wl);
        base.setAttribute('transform', `translate(${cx + (w - wb) / 2} ${y})`);
        below.setAttribute('transform', `translate(${cx + (w - wl) / 2} ${y + size * .5})`);
        cx += w + size * .2;
        continue;
      }

      if (it.binom) {
        const s = size * .66;
        const pw = size * .22;
        const yTop = y - size * .92;
        const yBot = y + size * .34;
        const top = el('g', {}, g);
        const bot = el('g', {}, g);
        const wt = typeset(top, [{ s: it.binom[0] }], 0, 0, s);
        const wb = typeset(bot, [{ s: it.binom[1] }], 0, 0, s);
        const w = Math.max(wt, wb);
        const ix = cx + pw + size * .08;
        paren(g, cx, yTop, yBot, pw, size, false);
        g.appendChild(top); // re-append so drawing order is ( n k )

        g.appendChild(bot);
        top.setAttribute('transform', `translate(${ix + (w - wt) / 2} ${y - size * .36})`);
        bot.setAttribute('transform', `translate(${ix + (w - wb) / 2} ${y + size * .2})`);
        paren(g, ix + w + size * .04, yTop, yBot, pw, size, true);
        cx = ix + w + size * .04 + pw + size * .14;
        continue;
      }

      if (it.frac) {
        const s = size * .8;
        const num = el('g', {}, g);
        const wn = typeset(num, it.frac[0], 0, 0, s);
        const den = el('g', {}, g);
        const wd = typeset(den, it.frac[1], 0, 0, s);
        const w = Math.max(wn, wd) + size * .3;
        const axis = y - size * .26;
        num.setAttribute('transform', `translate(${cx + (w - wn) / 2} ${axis - size * .2})`);
        stroke(g, `M${cx} ${axis} L${cx + w} ${axis}`, size, it.accent);
        g.appendChild(den); // bar is drawn between numerator and denominator
        den.setAttribute('transform', `translate(${cx + (w - wd) / 2} ${axis + size * .76})`);
        cx += w + size * .1;
        continue;
      }

      cx += glyph(g, it.s, cx, y, size, it) + size * (it.after ?? .03);
    }
    return cx - x;
  }

  /* Handwriting: strokes in order at a constant pen speed (time ∝ stroke length),
     with a short pause for every pen lift. Returns total duration in ms. */
  function writeIn(root, { delay = 0, total = 2, lift = .03 } = {}) {
    const parts = [...root.querySelectorAll('.m-stroke')];
    const lens = parts.map((p) => Number(p.dataset.len) || 1);
    const sum = lens.reduce((a, b) => a + b, 0) || 1;
    const ink = Math.max(.2, total - lift * parts.length);
    let t = delay;
    parts.forEach((p, i) => {
      const dur = Math.max(.025, (lens[i] / sum) * ink);
      p.style.setProperty('--d', `${t.toFixed(3)}s`);
      p.style.setProperty('--dur', `${dur.toFixed(3)}s`);
      t += dur + lift;
    });
    root.classList.add('is-writable');
    root.getBoundingClientRect();
    requestAnimationFrame(() => root.classList.add('is-drawn'));
    return t * 1000;
  }

  /* ---------------------------------------------------------
     1. Poisson limit theorem (loader)
     lim_{n→∞} C(n,k) p^k (1−p)^{n−k} = λ^k e^{−λ} / k!,  np → λ
     --------------------------------------------------------- */
  const POISSON = {
    main: [
      { under: 'lim', below: [{ s: 'n→∞' }] },
      { binom: ['n', 'k'] },
      { s: 'p' }, { s: 'k', sup: true },
      { gap: .1 },
      { s: '(' }, { s: '1' }, { gap: .1 }, { s: '−' }, { gap: .1 },
      { s: 'p' }, { s: ')' }, { s: 'n−k', sup: true },
      { gap: .3 }, { s: '=' }, { gap: .3 },
      { frac: [
        [{ s: 'λ' }, { s: 'k', sup: true }, { gap: .12 }, { s: 'e' }, { s: '−λ', sup: true }],
        [{ s: 'k!' }],
      ] },
    ],
    note: [
      { s: 'n→∞,', muted: true, after: .9 },
      { s: 'p→0,', muted: true, after: .9 },
      { s: 'np→λ', muted: true },
    ],
  };

  // Theorem across the full width of the loader, signature-style: a long pen
  // stroke comes in from the left edge, the formula is written, then a swash
  // loops back under it and runs off the right edge.
  function buildFormula(svg) {
    svg.textContent = '';
    const size = 64;
    const g = el('g', {}, svg);
    const lead = el('g', {}, g); // first in DOM = written first
    const main = el('g', {}, g);
    const w = typeset(main, POISSON.main, 0, 0, size);
    const mb = main.getBBox();
    const bottom = mb.y + mb.height;
    const swash = el('g', {}, g);
    const note = el('g', {}, g);
    const nw = typeset(note, POISSON.note, 0, 0, size * .46);
    const noteY = bottom + size * 1.35;
    note.setAttribute('transform', `translate(${(w - nw) / 2} ${noteY})`);

    // Fit the formula to the screen; the viewBox matches the svg's own aspect
    // the stage can report 0×0 before first layout (e.g. a background tab)
    const W = svg.clientWidth || innerWidth || 1280;
    const H = svg.clientHeight || innerHeight * .6 || 480;
    const contentH = noteY - mb.y;
    let k = Math.min((W * .82) / w, (H * .72) / contentH, 2.4);
    if (!Number.isFinite(k) || k <= 0) k = 1;
    const vbW = W / k; const vbH = H / k;
    const vbX = w / 2 - vbW / 2;
    const vbY = (mb.y + noteY) / 2 - vbH / 2;
    svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);

    penPath(lead, spline([
      [vbX - 20, size * .2], [vbX + vbW * .1, size * .26], [-size * 1.8, size * .12], [-size * .5, size * .04], [0, 0],
    ]));
    penPath(swash, spline([
      [mb.x + mb.width + size * .1, bottom - size * .08],
      [w * .72, bottom + size * .58], [w * .12, bottom + size * .66],
      [-size * .3, bottom + size * .52], [-size * .12, bottom + size * .34], [size * .12, bottom + size * .5],
      [w * .55, bottom + size * .7], [w + size * 1.2, bottom + size * .56], [vbX + vbW + 20, bottom + size * .46],
    ]));
    setPenWidth(g, W < 768 ? 1.8 : 2.4);
    return g;
  }

  /* Loader: write the theorem, count to 100, slide away */
  function runLoader() {
    const root = document.documentElement;
    const loader = document.querySelector('[data-loader]');
    const svg = loader && loader.querySelector('[data-formula-svg]');
    const done = () => document.dispatchEvent(new Event('loader:done'));

    if (!loader || !root.classList.contains('is-loading') || reduced()) {
      root.classList.remove('is-loading');
      loader?.remove();
      done();
      return;
    }

    const g = buildFormula(svg);
    const writeMs = writeIn(g, { delay: .1, total: 1.8 });
    const total = writeMs + 200;
    const count = loader.querySelector('[data-loader-count]');
    const t0 = performance.now();
    let finished = false;
    let loaded = document.readyState === 'complete';
    addEventListener('load', () => { loaded = true; }, { once: true });

    // 1 → 100 in step with the handwriting; holds at 99 until the page has really loaded
    const tickCount = (now) => {
      if (finished) return;
      const p = Math.min(1, (now - t0) / total);
      const pct = Math.max(1, Math.round(p * 100));
      count.textContent = String(loaded ? pct : Math.min(pct, 99));
      if (p >= 1 && loaded) {
        setTimeout(finish, 150); // a beat on 100 before the hero
      } else {
        requestAnimationFrame(tickCount);
      }
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      count.textContent = '100';
      loader.classList.add('is-leaving');
      root.classList.remove('is-loading');
      done();
      setTimeout(() => loader.remove(), 800);
    };

    requestAnimationFrame(tickCount);
    // Click or any key skips the intro
    loader.addEventListener('click', finish);
    addEventListener('keydown', finish, { once: true });
  }

  /* ---------------------------------------------------------
     2. Scroll-drawn line
     --------------------------------------------------------- */

  // Sample a chain of cubic Béziers into points: start + [[c1, c2, end], ...]
  function bezier(start, segs, n = 12) {
    const pts = [start];
    let p0 = start;
    for (const [c1, c2, p3] of segs) {
      for (let i = 1; i <= n; i++) {
        const t = i / n; const u = 1 - t;
        pts.push([
          u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
        ]);
      }
      p0 = p3;
    }
    return pts;
  }

  // Glyph strokes in a unit box (y grows downward), entry point first.
  const SHAPES = {
    // ∑ — top bar right-to-left, in to the middle, out to the bottom corner, bottom bar
    sigma: {
      ratio: .82,
      pts: bezier([1, .04], [
        [[.7, -.01], [.3, .01], [.02, 0]],
        [[.2, .17], [.4, .34], [.56, .5]],
        [[.4, .66], [.2, .83], [0, 1]],
        [[.3, .985], [.7, .975], [1.02, .97]],
      ]),
    },
    // ∫ — italic integral, written bottom-up: in through the lower hook (from the left),
    // up the slanted stem, out through the upper hook to the right
    integral: {
      ratio: .4,
      approach: 'left',
      pts: bezier([.86, .12], [
        [[.93, .02], [.78, -.03], [.67, .04]],
        [[.58, .12], [.55, .35], [.5, .5]],
        [[.45, .65], [.42, .88], [.33, .96]],
        [[.24, 1.03], [.1, 1.01], [.12, .9]],
      ]).reverse(),
    },
    // y = ln x on x ∈ [0.02, 4]: comes up out of the asymptote, flattens out
    log: {
      ratio: 2.3,
      pts: (() => {
        const lo = Math.log(.02); const hi = Math.log(4);
        const pts = [];
        for (let i = 0; i <= 28; i++) {
          const x = .02 * Math.pow(200, i / 28); // log-spaced: dense near the asymptote
          pts.push([x / 4, (hi - Math.log(x)) / (hi - lo)]);
        }
        return pts;
      })(),
    },
    // ∂ — drawn bowl-first so the line can swoop in from the right:
    // round the bowl, down and under, up the back, over the top, out through the hook
    partial: {
      ratio: .74,
      pts: bezier([.18, .22], [
        [[.2, .06], [.42, -.02], [.6, .02]],
        [[.82, .07], [.92, .3], [.88, .52]],
        [[.83, .8], [.62, 1], [.4, .99]],
        [[.18, .98], [.08, .82], [.14, .66]],
        [[.2, .5], [.4, .44], [.58, .47]],
        [[.72, .5], [.82, .58], [.86, .64]],
      ]).reverse(),
    },
  };

  const unit = (a, b) => {
    const dx = b[0] - a[0]; const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  };

  // Arrays are standalone labels. Objects complete the glyph the line just drew:
  // limits go above/below it, the rest of the formula is written to its right.
  const LABELS = {
    basel: {
      limits: 'center',
      top: [{ s: '∞' }],
      bottom: [{ s: 'n=1' }],
      right: [
        { frac: [[{ s: '1' }], [{ s: 'n' }, { s: '2', sup: true }]] },
        { gap: .2 }, { s: '=' }, { gap: .2 },
        { frac: [[{ s: 'π' }, { s: '2', sup: true }], [{ s: '6' }]] },
      ],
    },
    gauss: {
      limits: 'integral',
      top: [{ s: '∞', up: true }],
      bottom: [{ s: '0', up: true }],
      right: [
        { s: 'e' }, { s: '−x', sup: true }, { s: '2', sup: 2 }, { gap: .14 }, { s: 'dx', after: .2 },
        { s: '=', up: true, after: .2 }, { s: '√', up: true, after: 0 }, { s: 'π' },
        { s: '/', up: true }, { s: '2', up: true },
      ],
    },
    log: [{ s: 'y', after: .2 }, { s: '=', up: true, after: .2 }, { s: 'ln', up: true, after: .15 }, { s: 'x' }],
    partial: [
      { frac: [[{ s: '∂', up: true }, { s: 'f' }], [{ s: '∂', up: true }, { s: 'x' }]] },
      { s: '=', up: true, after: .2 },
      { under: 'lim', below: [{ s: 'h' }, { s: '→', up: true }, { s: '0', up: true }] },
      { frac: [[{ s: 'f' }, { s: '(', up: true }, { s: 'x' }, { s: '+', up: true }, { s: 'h' }, { s: ')', up: true },
                { s: '−', up: true }, { s: 'f' }, { s: '(', up: true }, { s: 'x' }, { s: ')', up: true }],
               [{ s: 'h' }]] },
    ],
  };

  // Catmull-Rom through points → smooth cubic Bézier path
  function spline(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  // Page-space rect for an element
  const rectOf = (node) => {
    const r = node.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height,
             cx: r.left + scrollX + r.width / 2, cy: r.top + scrollY + r.height / 2,
             r: r.right + scrollX, b: r.bottom + scrollY };
  };

  // Like rectOf, but where the element will rest once its entrance animation
  // (transform / translate on it or its ancestors) has finished
  const settledRect = (node) => {
    const r = rectOf(node);
    let dx = 0; let dy = 0;
    for (let a = node; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.transform && cs.transform !== 'none') {
        const m = new DOMMatrixReadOnly(cs.transform);
        dx += m.m41; dy += m.m42;
      }
      if (cs.translate && cs.translate !== 'none') {
        const [tx, ty = '0px'] = cs.translate.split(' ');
        if (tx.endsWith('px')) dx += parseFloat(tx);
        if (ty.endsWith('px')) dy += parseFloat(ty);
      }
    }
    return { ...r, x: r.x - dx, r: r.r - dx, cx: r.cx - dx, y: r.y - dy, b: r.b - dy, cy: r.cy - dy };
  };

  // Fit a unit shape inside a rect, centered, leaving `reserve` px below for a label
  function placeShape(shape, box, fill = .82, reserve = 0) {
    let h = (box.h - reserve) * fill;
    let w = h * shape.ratio;
    if (w > box.w * fill) { w = box.w * fill; h = w / shape.ratio; }
    const x0 = box.x + (box.w - w) / 2;
    const y0 = box.y + (box.h - reserve - h) / 2;
    return { pts: shape.pts.map(([u, v]) => [x0 + u * w, y0 + v * h]), x: x0, y: y0, w, h };
  }

  // Place a zone's glyph. When its label completes the formula, glyph + formula
  // are centered together and the glyph leaves room on its right.
  function placeZone(zone, baseSize) {
    const kind = zone.dataset.glyph;
    const box = rectOf(zone);
    const label = LABELS[zone.dataset.label];
    const size = Math.max(16, Math.min(baseSize * (Number(zone.dataset.scale) || 1), box.h * .3));

    if (Array.isArray(label)) {
      const isLog = kind === 'log';
      const placed = placeShape(SHAPES[kind], box, isLog ? .9 : .86, isLog ? 0 : size * 2.4);
      return { kind, box, size, label, placed };
    }

    const tmp = el('g', {}, scribble.svg);
    const rightW = typeset(tmp, label.right, 0, 0, size);
    tmp.remove();
    const gap = size * (label.limits === 'integral' ? .9 : .45);
    const placed = placeShape(SHAPES[kind], { x: box.x, y: box.y, w: box.w - rightW - gap, h: box.h }, .78);
    const dx = box.x + (box.w - (placed.w + gap + rightW)) / 2 - placed.x;
    placed.x += dx;
    placed.pts = placed.pts.map(([x, y]) => [x + dx, y]);
    return { kind, box, size, label, placed, gap };
  }

  // Write the rest of a formula around a drawn glyph (absolute page coords)
  function attachFormula(g, def) {
    const { placed, size, label, gap } = def;
    const ls = size * .7;
    const part = (items, s) => {
      const pg = el('g', {}, g);
      typeset(pg, items, 0, 0, s);
      return { bb: pg.getBBox(), at: (x, y) => pg.setAttribute('transform', `translate(${x} ${y})`) };
    };
    const integral = label.limits === 'integral';
    if (label.top) {
      const p = part(label.top, ls);
      if (integral) p.at(placed.x + placed.w * .95, placed.y - ls * .35);
      else p.at(placed.x + (placed.w - p.bb.width) / 2, placed.y - ls * .45);
    }
    if (label.bottom) {
      const p = part(label.bottom, ls);
      if (integral) p.at(placed.x + placed.w * .5, placed.y + placed.h + ls * .3);
      else p.at(placed.x + (placed.w - p.bb.width) / 2, placed.y + placed.h + ls * 1.2);
    }
    part(label.right, size).at(placed.x + placed.w + gap, placed.y + placed.h / 2 + size * .3);
  }

  // Wobbly hand-drawn loop around a rect
  function loopAround(r, padX, padY, startDeg = 200, turns = 1.12, n = 16) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = (startDeg * Math.PI) / 180 + t * turns * Math.PI * 2;
      const wob = 1 + .05 * Math.sin(a * 3 + 1) + t * .06;
      pts.push([r.cx + Math.cos(a) * (r.w / 2 + padX) * wob, r.cy + Math.sin(a) * (r.h / 2 + padY) * wob]);
    }
    return pts;
  }

  const scribble = {
    svg: null, inkPath: null, lightPath: null, tip: null,
    total: 0, lens: [], maxY: [], darkRects: [], labels: [],
    introLen: 0, introStart: 0, introDone: false, introArmed: false,
    cur: 0, running: false,
  };

  function lengthAt(pts, upto) {
    const p = el('path', { d: spline(pts.slice(0, upto + 1)) }, scribble.svg);
    const len = p.getTotalLength();
    p.remove();
    return len;
  }

  function buildScribble() {
    const s = scribble;
    const svg = s.svg;
    svg.textContent = '';

    // collapse the drawing first: measured with it, the page could never shrink
    // (a stale height would leave empty space under the footer)
    svg.style.height = '0px';
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.width = `${W}px`;
    svg.style.height = `${H}px`;

    const mobile = W < 768;
    const container = rectOf(document.querySelector('.hero .container, .case'));
    // case pages keep the line inside the right margin, clear of the page edge
    const caseEl = document.querySelector('.case');
    const laneR = caseEl && !mobile
      ? W - (parseFloat(getComputedStyle(caseEl).paddingRight) || 16) / 2 - 6
      : Math.min(W - 12, container.r - (mobile ? 8 : 0));

    const pts = [];
    const marks = {};

    const labelSize = Math.max(18, Math.min(30, W * .02));
    s.labelDefs = [];

    let u = 1;     // Figma px → screen px
    let halo = []; // where the intro line comes to rest

    const isHome = !!document.querySelector('[data-scribble-start]');
    if (!isHome) {
      // Case study: from the eyebrow over the title, a loop in the top-right
      // corner, then down the right side, writing formulas in the free space
      const main = rectOf(document.querySelector('.case-main'));
      const title = settledRect(document.querySelector('.case-hero__title'));
      // the eyebrow's text, not its full-width block
      const lblEl = document.querySelector('.case-hero .case-label');
      const range = document.createRange();
      range.selectNodeContents(lblEl);
      const tr = range.getBoundingClientRect();
      const lift = settledRect(lblEl).y - rectOf(lblEl).y;
      const lbl = { r: tr.right + scrollX, cy: tr.top + tr.height / 2 + scrollY + lift };
      const right = mobile ? laneR - 18 : main.r - 70;
      pts.push([lbl.r + 18, lbl.cy]);
      pts.push([lbl.r + 70, lbl.cy - 6]);
      pts.push([(lbl.r + right) / 2, lbl.cy - 2]);
      // each case page can pick its own flourish (body[data-flourish])
      const flourish = document.body.dataset.flourish;
      if (flourish === 'infinity' && !mobile) { // phones: no room beside the title
        // a hand-drawn ∞: in at the left tip, one and a half turns, out of the right tip
        const a = 58;
        const c = [right - a * .6, lbl.cy + 30];
        pts.push([c[0] - a - 40, lbl.cy + 2]);
        const n = 30;
        for (let i = 0; i <= n; i++) {
          const t = Math.PI + (i / n) * Math.PI * 3;
          const k = 1 + Math.sin(t) ** 2;
          const wob = 1 + .06 * (i / n);
          pts.push([c[0] + (a * Math.cos(t) / k) * wob, c[1] + (a * Math.sin(t) * Math.cos(t) / k) * 1.15 * wob]);
        }
        halo = [c[0] + a * .7, title.cy + 4];
      } else if (flourish === 'spiral' && !mobile) {
        // a spiral that winds in and ends on the dot at its centre
        const c = [right - 20, (lbl.cy + title.cy) / 2 + 14];
        const R = 64;
        pts.push([c[0] - R - 50, lbl.cy + 2]);
        const n = 34;
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          const ang = Math.PI + t * Math.PI * 4.5; // two and a quarter turns
          const r = R * (1 - t * .9);
          pts.push([c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r * .82]);
        }
        halo = pts.pop();
      } else if (flourish === 'wave' && !mobile) {
        // a sine wave whose swing dies away, then a drop onto the dot
        pts.length -= 2; // the wave starts straight from the label
        const x0 = lbl.r + 46;
        const x1 = right + 20;
        const n = 40;
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          const amp = 22 * (1 - t * .75);
          pts.push([x0 + (x1 - x0) * t, lbl.cy + 6 + Math.sin(t * Math.PI * 7) * amp]);
        }
        // the last swing bends straight down onto the dot
        halo = [x1 + 10, title.cy + 4];
      } else {
        pts.push([right - 40, lbl.cy + 6]);
        const curl = { cx: right, cy: lbl.cy + 34, w: 44, h: 30 };
        pts.push(...loopAround(curl, 10, 8, 200, .95, 12));
        halo = [right + 6, title.cy + 10];
      }
      pts.push(halo);
      marks.intro = pts.length - 1;
      pts.push([laneR - 4, title.b + 80]);
      if (mobile) {
        // no room beside the content: run down the right margin past each section
        document.querySelectorAll('.case-section').forEach((sec) => {
          const r = rectOf(sec);
          pts.push([laneR - 2, r.y + 20]);
          pts.push([laneR, r.b - 20]);
        });
      }
    }

    if (isHome) {

    // Hero: from the eyebrow dot along the top, straight down into a ∑ beside
    // "I SEE PATTERNS" (the rest of the formula is written next to it), then
    // down past it, a small curl and a stop on a dot with a halo just above
    // the first focus tile.
    const start = settledRect(document.querySelector('[data-scribble-start]'));
    const tile = settledRect(document.querySelector('[data-scribble-target] .hero__tile'));
    const em = parseFloat(getComputedStyle(document.querySelector('.hero__display')).fontSize);
    u = em / 138;
    halo = [tile.cx, tile.y - 32 * u];
    const heroZone = placeZone(document.querySelector('[data-hero-glyph]'), labelSize);
    const sig = heroZone.placed.pts;
    const sigTop = heroZone.placed.y - heroZone.size * 1.1; // clear of the upper limit
    // run along the gap under the eyebrow row, not through its letters
    const eyebrow = rectOf(document.querySelector('.hero__meta'));
    const runY = Math.min(eyebrow.b + 12 * u, sigTop - 4);

    // drop straight out of the dot and round smoothly into the run under the text
    const drop = runY - start.cy;
    pts.push([start.cx, start.cy]);
    pts.push([start.cx + drop * .12, start.cy + drop * .62]);
    pts.push([start.cx + drop * .55, runY - drop * .06]);
    // then out along the run with gradually wider steps, so the spline never kinks back
    [1.3, 2.6, 5, 9].forEach((k) => pts.push([start.cx + drop * k, runY]));
    if (mobile) {
      // ∑ sits under the headline: run out to the right margin, down past it, then in
      pts.push([laneR - 30, runY + 4]);
      pts.push([laneR - 6, runY + 40]);
      pts.push([laneR - 8, sig[0][1] - 40]);
      pts.push([sig[0][0] + 14, sig[0][1] - 10]);
    } else {
      pts.push([(start.cx + sig[0][0]) / 2, runY + 2]);
      pts.push([sig[0][0] - 36, runY + 4]);
      pts.push([sig[0][0] - 2, runY + 18]); // round the shoulder, then straight down
    }
    pts.push(sig[0]); // doubled point = sharp corner into the top bar
    const sigIdx = pts.length;
    pts.push(...sig);
    s.labelDefs.push({ ...heroZone, idx: sigIdx, end: pts.length - 1 });
    const sigEnd = sig[sig.length - 1];
    if (mobile) {
      pts.push([sigEnd[0] + 30, sigEnd[1] + 50]);
      pts.push([laneR - 6, halo[1] - 70]);
    } else {
      // out of the ∑ and straight down towards the tiles, clear of the headline
      pts.push([sigEnd[0] + 18 * u, sigEnd[1] + 30 * u]);
    }
    // small curl, then down onto the dot
    // curl to the right of the dot, clear of the ∑'s lower limit
    const curl = { cx: halo[0] + 40 * u, cy: halo[1] - 62 * u, w: 40 * u, h: 22 * u };
    pts.push(...loopAround(curl, 12 * u, 10 * u, 200, .95, 10));
    pts.push(halo);
    marks.intro = pts.length - 1;
    // once scrolling starts, the line leaves the dot to the right, clear of the tiles
    pts.push([laneR, halo[1] - 6]);
    pts.push([laneR + 4, halo[1] + 140]);

    // About: an underline under "DESIGN FOR PEOPLE." (drawn right to left, with
    // the little hook from the Figma swash), then a loop round the "1000+" stat
    const underlined = document.querySelector('[data-scribble-underline]');
    const circled = document.querySelector('[data-scribble-circle] strong');
    if (underlined && circled) {
      const range = document.createRange();
      range.selectNodeContents(underlined);
      // the text itself, not the full-width line; on phones the phrase wraps,
      // so underline just its last line
      const lines = range.getClientRects();
      const tr = mobile && lines.length ? lines[lines.length - 1] : range.getBoundingClientRect();
      const t = { x: tr.left + scrollX, r: tr.right + scrollX, b: tr.bottom + scrollY, w: tr.width };
      const lead = rectOf(document.querySelector('.about__lead'));
      const stat = rectOf(circled);
      const panel = document.querySelector('.profile');
      const k = Math.min(1, t.w / 760);
      const aboutTop = rectOf(document.querySelector('#about')).y;

      // come down the gutter between the text and the profile panel
      const p = panel && rectOf(panel);
      const gapX = p && !mobile && p.x > t.r ? Math.max(t.r + 80 * k, p.x - 60) : laneR;
      if (!mobile) {
        pts.push([gapX + 20, aboutTop + 20]);
        pts.push([gapX, t.b - 70 * k]);
      } else {
        // phones: keep to the right margin past the heading, then cut in level with its last line
        pts.push([laneR, aboutTop + 20]);
        pts.push([laneR - 2, t.b - 70]);
        pts.push([Math.min(laneR - 20, t.r + 90), t.b - 34]);
      }
      pts.push([t.r + 66 * k, t.b - 22 * k]);
      pts.push([t.r + 58 * k, t.b + 4]);          // hook
      pts.push([t.r + 44 * k, t.b + 16 * k]);
      pts.push([t.r - 10, t.b + 13 * k]);
      pts.push([t.x + t.w * .5, t.b + 8 * k]);     // long, slightly bowed swash
      pts.push([t.x + 20, t.b + 18 * k]);
      // round the left margin, past the lead paragraph, then across to the last stat
      pts.push([Math.max(6, t.x - 22), lead.y + lead.h * .2]);
      pts.push([Math.max(8, t.x - 18), lead.b + 6]);
      pts.push([t.x + t.w * .3, lead.b + 30]);
      pts.push([stat.x - 24, stat.y - 18]);
      pts.push(...loopAround(stat, 22, 18, 215, 1.1, 16));
      // leave to the right and back down the gutter, clear of the paragraphs
      const aboutBottom = rectOf(document.querySelector('#about')).b;
      pts.push([gapX - 10, stat.cy + 10]);
      pts.push([gapX + 6, aboutBottom - 40]);
    }

    // Selected work pins while its cards turn, so the line just runs down the
    // far right edge, clear of the cards, like a progress rule
    const workSec = document.querySelector('[data-work]');
    if (workSec && !mobile) {
      const w = rectOf(workSec);
      const edge = W - Math.max(12, (W - container.r) / 2);
      pts.push([edge - 20, w.y + 30]);
      pts.push([edge, w.y + 160]);
      pts.push([edge, w.b - 200]);
      pts.push([edge - 30, w.b - 40]);
    }

    // How I work: in at the top of the ring, round its left half (js/main.js
    // draws the right half to the same height), out of the bottom and on down
    const ringEl = document.querySelector('[data-how-ring]');
    const ringSvg = ringEl && ringEl.querySelector('[data-how-svg]');
    if (ringEl && ringSvg && getComputedStyle(ringSvg).display !== 'none') {
      const r = rectOf(ringEl);
      const R = r.w / 2 - 1;
      const prev = pts[pts.length - 1];
      // a loose S across the top of the section, then a small curl into the ring's top
      pts.push([(prev[0] + r.cx) / 2 + 120, r.y - 190]);
      pts.push([r.cx + 70, r.y - 110]);
      pts.push([r.cx + 34, r.y - 40]);
      pts.push([r.cx + 8, r.y - 8]);
      const n = 28;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI;
        pts.push([r.cx - R * Math.sin(a), r.cy - R * Math.cos(a)]);
      }
      pts.push([r.cx + 14, r.b + 40]);
      pts.push([r.cx + 10, r.b + 120]);
    } else {
      // list layout: keep to the right margin past the stages
      const howSec = document.querySelector('[data-how]');
      if (howSec) {
        const h = rectOf(howSec);
        pts.push([laneR - 6, h.y + 80]);
        pts.push([laneR, h.b - 80]);
      }
    }
    } // end home route

    // Section glyphs (hidden zones, e.g. on phones, are skipped)
    const zones = [...document.querySelectorAll('.section [data-glyph], .case-page [data-glyph]')]
      .filter((z) => z.getBoundingClientRect().width > 40);
    zones.forEach((zone) => {
      const def = placeZone(zone, labelSize);
      const { kind, placed } = def;
      const isLog = kind === 'log';
      const g = placed.pts;
      const next = !isHome && zone.closest('.case-footer') && document.querySelector('.case-next');
      if (next) {
        // down the right margin, clear of the case switcher cards
        const nr = rectOf(next);
        const gx = W - parseFloat(getComputedStyle(next.firstElementChild).paddingRight) / 2;
        pts.push([gx, nr.y + 40]);
        pts.push([gx, nr.b - 60]);
      } else if (!isHome && pts.length) {
        // long way to the next formula: run down the right margin, not across the content
        const p = pts[pts.length - 1];
        const top = rectOf(zone).y;
        if (top - p[1] > 400) {
          const pad = parseFloat(getComputedStyle(document.querySelector('.case')).paddingRight) || 16;
          const gx = W - pad / 2; // middle of the right margin
          pts.push([gx - 4, p[1] + 120]);
          // a gradual turn in toward the formula (evenly spaced points, so the
          // spline doesn't swing out past the page edge)
          pts.push([gx, top - 130], [gx - 10, top - 80], [gx - 50, top - 52], [gx - 120, top - 40]);
        }
      }
      const prev = pts[pts.length - 1];

      // approach: arrive along the glyph's own starting direction
      const t0 = unit(g[1], g[0]); // pointing backwards, away from the stroke
      const lead = Math.min(70, placed.h * .25);
      const entry = [g[0][0] + t0[0] * lead, g[0][1] + t0[1] * lead];
      if (SHAPES[kind].approach === 'left') {
        // swing round the left of the glyph instead of cutting through it
        pts.push([placed.x - placed.w * .6, placed.y + placed.h * .15]);
      } else {
        pts.push([(prev[0] + entry[0]) / 2, (prev[1] + entry[1]) / 2]);
      }
      pts.push(entry);

      const startIdx = pts.length;
      pts.push(...g);
      s.labelDefs.push({ ...def, idx: startIdx, end: pts.length - 1 });

      // leave along the glyph's final direction, then fall toward the next section
      const last = g[g.length - 1];
      const t1 = unit(g[g.length - 2], last);
      pts.push([last[0] + t1[0] * 36, last[1] + t1[1] * 36]);
      if (isLog) {
        pts.push([Math.min(laneR, last[0] + 50), last[1] + 160]);
      } else if (kind === 'integral' || kind === 'sigma') {
        // out of the upper hook: right, above the integrand, then down the outer lane
        const y = placed.y + placed.h * .3;
        if (isHome) {
          pts.push([laneR - 16, y]);
        } else {
          // case pages: ease into the margin instead of swinging past the page edge
          pts.push([laneR - 70, y], [laneR - 28, y + 24], [laneR - 12, y + 80]);
        }
        pts.push([laneR - 8, placed.y + placed.h + 90]);
      } else {
        // ended near the top (∂ hook): fall down the left side, clear of its label
        const x = Math.min(last[0], placed.x) - 50;
        pts.push([x, placed.y + placed.h * .6]);
        pts.push([x + 10, placed.y + placed.h + def.size * 3.2]);
      }
    });

    // Finish: loop around "Back to top"
    const end = document.querySelector('[data-scribble-end]');
    if (end) {
      const r = rectOf(end);
      const prev = pts[pts.length - 1];
      pts.push([(prev[0] + r.cx) / 2, r.y - 60]);
      pts.push(...loopAround(r, 10, 8, 250, 1.05, 12));
    }

    const d = spline(pts);

    // Dark sections: the line turns white on them
    s.darkRects = [...document.querySelectorAll('[data-dark]')].map(rectOf);
    const defs = el('defs', {}, svg);
    const inkMask = el('mask', { id: 'scribble-ink', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, inkMask);
    const lightMask = el('mask', { id: 'scribble-light', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
    s.darkRects.forEach((r) => {
      el('rect', { x: 0, y: r.y, width: W, height: r.h, fill: '#000' }, inkMask);
      el('rect', { x: 0, y: r.y, width: W, height: r.h, fill: '#fff' }, lightMask);
    });

    s.inkPath = el('path', { d, class: 'scribble__path scribble__path--ink', mask: 'url(#scribble-ink)' }, svg);
    s.lightPath = el('path', { d, class: 'scribble__path scribble__path--light', mask: 'url(#scribble-light)' }, svg);
    // Pulsing ring that travels with the tip and shows wherever the line comes to rest
    s.halo = el('g', { class: 'scribble__halo' }, svg);
    el('circle', { cx: 0, cy: 0, r: 19.5 * u, class: 'scribble__halo-wave' }, s.halo);
    el('circle', { cx: 0, cy: 0, r: 19.5 * u, class: 'scribble__halo-ring' }, s.halo);
    s.tip = el('circle', { r: 6, class: 'scribble__tip' }, svg); // 12px "Trail endpoint" in Figma

    s.total = s.inkPath.getTotalLength();
    [s.inkPath, s.lightPath].forEach((p) => { p.style.strokeDasharray = `${s.total} ${s.total}`; });

    // Lookup: path length ↔ furthest y reached so far (monotone, for scroll mapping)
    s.lens = []; s.maxY = [];
    const steps = Math.ceil(s.total / 6);
    const introGuess = lengthAt(pts, marks.intro);
    let maxY = -Infinity;
    let bestLen = introGuess; let bestDist = Infinity;
    for (let i = 0; i <= steps; i++) {
      const len = (s.total * i) / steps;
      const p = s.inkPath.getPointAtLength(len);
      maxY = Math.max(maxY, p.y);
      s.lens.push(len); s.maxY.push(maxY);
      // the hero line must stop exactly on the halo's centre
      if (Math.abs(len - introGuess) < 200) {
        const dist = Math.hypot(p.x - halo[0], p.y - halo[1]);
        if (dist < bestDist) { bestDist = dist; bestLen = len; }
      }
    }
    // refine to sub-sample precision
    for (let len = bestLen - 6; len <= bestLen + 6; len += .5) {
      const p = s.inkPath.getPointAtLength(Math.max(0, len));
      const dist = Math.hypot(p.x - halo[0], p.y - halo[1]);
      if (dist < bestDist) { bestDist = dist; bestLen = len; }
    }
    s.introLen = bestLen;

    // Formulas written by hand once the line has finished each glyph
    s.labels = s.labelDefs.map((def) => {
      const g = el('g', { class: 'scribble__label' }, svg);
      const { placed, size } = def;
      if (Array.isArray(def.label)) {
        typeset(g, def.label, 0, 0, size);
        const bb = g.getBBox();
        let x; let y;
        if (def.kind === 'log') {
          x = placed.x + placed.w * .55;
          y = placed.y + placed.h * .78;
        } else {
          x = placed.x + placed.w / 2 - bb.width / 2;
          y = placed.y + placed.h + size * 1.9 - (bb.y + bb.height) * .3;
        }
        x = Math.max(8, Math.min(x, W - bb.width - 8));
        g.setAttribute('transform', `translate(${x - bb.x} ${y})`);
      } else {
        attachFormula(g, def);
      }
      setPenWidth(g, 1.7);
      const midY = placed.y + placed.h / 2;
      g.classList.toggle('is-light', s.darkRects.some((r) => midY >= r.y && midY <= r.b));
      return { g, at: lengthAt(pts, def.end), shown: false };
    });

    if (reduced()) {
      s.cur = s.total;
      s.labels.forEach((l) => { l.shown = true; });
    } else if (s.introDone) {
      s.cur = target();
      s.labels.forEach((l) => {
        if (s.cur >= l.at) { l.shown = true; } else { l.g.classList.add('is-writable'); }
      });
    } else {
      s.cur = 0;
      s.labels.forEach((l) => l.g.classList.add('is-writable'));
    }
    render();
    setResting(s.cur > 2 && (reduced() || s.introDone));
  }

  function scrollLen() {
    const s = scribble;
    // At the top the hero line rests on its dot; otherwise the tip follows the
    // scroll both ways, so the line also draws back up when scrolling up
    if (scrollY < 8) return 0;
    // over the last screen of the page the tip slides down to the screen's
    // bottom edge, so the very end (footer formula, "Back to top") is reachable
    const max = document.documentElement.scrollHeight - innerHeight;
    const f = Math.min(1, Math.max(0, (scrollY - (max - innerHeight)) / innerHeight));
    const y = scrollY + innerHeight * (.72 + .28 * f);
    let lo = 0; let hi = s.maxY.length - 1;
    if (s.maxY[0] > y) return 0;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (s.maxY[mid] <= y) lo = mid; else hi = mid - 1;
    }
    return s.lens[lo];
  }

  function target() {
    const s = scribble;
    if (reduced()) return s.total;
    if (!s.introDone) {
      if (!s.introArmed) return 0;
      const t = Math.min(1, (performance.now() - s.introStart) / 1200);
      const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (t >= 1) s.introDone = true;
      return e * s.introLen;
    }
    return Math.max(s.introLen, scrollLen());
  }

  function render() {
    const s = scribble;
    const off = Math.max(0, s.total - s.cur);
    s.inkPath.style.strokeDashoffset = off;
    s.lightPath.style.strokeDashoffset = off;

    const p = s.inkPath.getPointAtLength(Math.max(0, s.cur));
    s.tip.setAttribute('cx', p.x);
    s.tip.setAttribute('cy', p.y);
    s.tip.style.opacity = s.cur > 2 ? 1 : 0;
    const onDark = s.darkRects.some((r) => p.y >= r.y && p.y <= r.b);
    s.tip.classList.toggle('is-light', onDark);
    s.halo.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    s.halo.classList.toggle('is-light', onDark);
    // let the page follow the tip (How I work draws the ring's other half with it)
    document.dispatchEvent(new CustomEvent('scribble:tip', { detail: { x: p.x, y: p.y } }));

    s.labels.forEach((l) => {
      if (!l.shown && s.cur >= l.at) {
        l.shown = true;
        writeIn(l.g, { total: 1.8 });
      } else if (l.shown && s.cur < l.at - 2 && !reduced()) {
        // the line drew back past this glyph: rub its formula out, ready to rewrite
        l.shown = false;
        l.g.classList.add('is-writable');
        l.g.classList.remove('is-drawn');
      }
    });
  }

  // The ring shows (and the dot pulses) only while the line stands still
  function setResting(on) {
    const s = scribble;
    s.halo.classList.toggle('is-on', on);
    s.tip.classList.toggle('is-resting', on);
  }

  function tick() {
    const s = scribble;
    const t = target();
    const prev = s.cur;
    s.cur += (t - s.cur) * (s.introDone ? .14 : 1);
    if (Math.abs(t - s.cur) < .5) s.cur = t;
    render();
    const moving = Math.abs(s.cur - prev) > .05 || (s.introArmed && !s.introDone);
    setResting(!moving && s.cur > 2);
    if (s.cur !== t || (s.introArmed && !s.introDone)) {
      requestAnimationFrame(tick);
    } else {
      s.running = false;
    }
  }

  function kick() {
    if (scribble.running || !scribble.inkPath) return;
    scribble.running = true;
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  async function init() {
    scribble.svg = document.querySelector('[data-scribble]');

    try {
      // the line is measured against the headings, so wait for Anton
      await document.fonts.load('64px "Anton"');
      await document.fonts.ready;
    } catch (e) { /* fall back to system fonts */ }

    if (!scribble.svg) { runLoader(); return; }

    // The hero line starts right after the loader, alongside the headline's entrance
    // (it measures where things will land, see settledRect)
    document.addEventListener('loader:done', () => {
      setTimeout(() => {
        buildScribble();
        scribble.introArmed = true;
        scribble.introStart = performance.now();
        kick();
      }, reduced() ? 0 : 350); // start with the headline, not after it
    }, { once: true });

    buildScribble();
    runLoader();

    addEventListener('scroll', kick, { passive: true });

    let resizeTimer;
    const rebuild = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { buildScribble(); kick(); }, 150);
    };
    addEventListener('resize', rebuild);
    // Hero items rise into place; re-measure once they land
    // (case pages: blocks rising in as they scroll into view)
    document.addEventListener('transitionend', (e) => {
      if (e.target.matches('.hero [data-reveal], .hero__line, .hero__focus li, .hero__tile, .case-hero [data-rise]')) rebuild();
    });
    new ResizeObserver(rebuild).observe(document.querySelector('main'));
    motionQuery.addEventListener('change', rebuild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
