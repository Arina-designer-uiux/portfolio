(() => {
  /* ---------- Header: border on scroll ---------- */
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  const nav = document.querySelector('[data-nav]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  if (nav && navToggle) {
    const setOpen = (open) => {
      navToggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    };

    navToggle.addEventListener('click', () => {
      setOpen(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        navToggle.focus();
      }
    });
    window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- Nav: the dot follows the section in view ---------- */
  const navLinks = [...document.querySelectorAll('.nav__link[href^="#"]')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (navLinks.length && sections.length) {
    const setCurrent = (id) => {
      navLinks.forEach((a) => {
        const on = a.getAttribute('href') === `#${id}`;
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
    };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setCurrent(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' }); // a thin band across the middle of the screen
    sections.forEach((sec) => spy.observe(sec));
  }

  /* ---------- Headline lines drift apart as the hero scrolls away ---------- */
  const heroSection = document.querySelector('.hero');
  const heroTitle = document.querySelector('.hero__title');
  if (heroSection && heroTitle) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let queued = false;
    const update = () => {
      queued = false;
      if (reduce.matches) { heroTitle.style.removeProperty('--drift'); return; }
      const p = Math.min(1, Math.max(0, window.scrollY / heroSection.offsetHeight));
      heroTitle.style.setProperty('--drift', `${(p * window.innerWidth * .06).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ---------- Stats count up when they come into view ---------- */
  const counters = [...document.querySelectorAll('[data-count]')];
  if (counters.length) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fmt = (el, n) => { el.textContent = `${n}${el.dataset.suffix || ''}`; };
    const run = (el) => {
      const to = Number(el.dataset.count);
      const from = Number(el.dataset.from || 0);
      const dur = 1600;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic: fast start, gentle landing
        fmt(el, Math.round(from + (to - from) * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!reduce && 'IntersectionObserver' in window) {
      // measure once Anton has loaded: lock the width to the final number
      // so nothing around it jumps while the digits change
      document.fonts.ready.then(() => {
        counters.forEach((el) => {
          el.style.minWidth = `${el.getBoundingClientRect().width}px`;
          fmt(el, Number(el.dataset.from || 0));
        });
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            io.unobserve(e.target);
            run(e.target);
          });
        }, { threshold: .6 });
        counters.forEach((el) => io.observe(el));
      });
    }
  }

  /* ---------- Selected work: scroll turns the cards like a drum ---------- */
  const work = document.querySelector('[data-work]');
  if (work) {
    const cards = [...work.querySelectorAll('.work-card')];
    const n = cards.length;
    const projects = cards.map((c) => JSON.parse(c.dataset.project));
    // A full drum needs more slots than projects: copy the set once, so the ring
    // has 2n slots and both sides of the front card are always filled
    const list = work.querySelector('[data-work-cards]');
    const ring = [...cards];
    cards.forEach((c) => {
      const copy = c.cloneNode(true);
      copy.classList.add('is-clone');
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      list.appendChild(copy);
      ring.push(copy);
    });
    const m = ring.length;
    const out = {
      box: work.querySelector('.work__featured'),
      num: work.querySelector('[data-work-num]'),
      name: work.querySelector('[data-work-name]'),
      scope: work.querySelector('[data-work-scope]'),
      lead: work.querySelector('[data-work-lead]'),
      accent: work.querySelector('[data-work-accent]'),
      link: work.querySelector('[data-work-link]'),
    };
    const phone = window.matchMedia('(max-width: 767px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let shown = -1;  // the project whose text is on screen
    let t = 0;       // eased position of the drum, 0 … n−1
    let running = false;

    // Letters flicker through random glyphs before settling (the "scramble" in the video)
    const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const scramble = (el, text) => {
      if (reduce.matches) { el.textContent = text; return; }
      const t0 = performance.now();
      const dur = 420;
      const frame = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const fixed = Math.floor(p * text.length);
        el.textContent = [...text].map((ch, i) => (
          i < fixed || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        )).join('');
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    const show = (i) => {
      if (i === shown) return;
      shown = i;
      const p = projects[i];
      scramble(out.num, p.num);
      scramble(out.name, p.name);
      out.box.classList.add('is-swapping');
      setTimeout(() => {
        out.scope.textContent = p.scope;
        out.lead.textContent = p.lead;
        out.accent.textContent = p.accent;
        // projects without a case study page yet keep the link inert
        out.link.href = p.href || '#';
        out.link.toggleAttribute('aria-disabled', !p.href);
        out.box.classList.remove('is-swapping');
      }, 220);
    };

    const target = () => {
      const travel = work.offsetHeight - window.innerHeight;
      const p = travel > 0 ? (window.scrollY - work.offsetTop) / travel : 0;
      return Math.min(1, Math.max(0, p)) * (n - 1);
    };

    const layout = () => {
      const cw = cards[0].offsetWidth;
      const gap = parseFloat(getComputedStyle(work).getPropertyValue('--gap')) || 24;
      const step = cw + gap;
      const row = work.querySelector('.work__cards');
      const half = row.offsetWidth / 2;
      const front = half - cw / 2;         // the front card sits in the middle
      // Drum geometry: slots one angle apart on a cylinder. The radius is solved so
      // that, after perspective pulls far cards inwards, the centre of the second
      // card on each side still lands near the edge of the content width.
      const SLOT = 25 * Math.PI / 180;
      const P = parseFloat(getComputedStyle(row).perspective) || 1800;
      const reach = half - cw * .26;
      const sn = Math.sin(2 * SLOT);
      const cs = 1 - Math.cos(2 * SLOT);
      const R = Math.max(step, (reach * P) / Math.max(1, sn * P - reach * cs));
      row.style.setProperty('--po', `${half.toFixed(0)}px`);
      ring.forEach((card, k) => {
        // distance from the front, wrapped so the drum loops round
        let d = k - t;
        while (d < -m / 2) d += m;
        while (d >= m / 2) d -= m;
        const a = Math.abs(d);
        const theta = d * SLOT;
        // one step out: lightly blurred; two steps out: faint, as in the Figma states
        const blur = Math.min(a, 2) * 2;
        const op = a <= 1 ? 1 - .4 * a : Math.max(0, .6 - .4 * (a - 1) - .5 * Math.max(0, a - 2));
        card.style.setProperty('--x', `${(front + R * Math.sin(theta)).toFixed(1)}px`);
        card.style.setProperty('--z', `${(-R * (1 - Math.cos(theta))).toFixed(1)}px`);
        card.style.setProperty('--ry', `${(theta * 180 / Math.PI).toFixed(2)}deg`);
        card.style.setProperty('--s', (1 - .04 * Math.min(a, 1)).toFixed(3));
        card.style.setProperty('--b', `${blur.toFixed(2)}px`);
        card.style.setProperty('--o', op.toFixed(3));
        card.style.visibility = a > 2.9 ? 'hidden' : '';
        card.style.zIndex = String(20 - Math.round(a * 2));
        card.classList.toggle('is-active', a < .5);
        // only the front card is clickable / focusable (copies never are)
        card.inert = a > .5 || card.classList.contains('is-clone');
      });
      show(((Math.round(t) % n) + n) % n);
    };

    const tick = () => {
      const goal = target();
      t += (goal - t) * (reduce.matches ? 1 : .16);
      if (Math.abs(goal - t) < .001) t = goal;
      layout();
      if (t !== goal) requestAnimationFrame(tick); else running = false;
    };
    const kick = () => {
      if (phone.matches) return;
      if (!running) { running = true; requestAnimationFrame(tick); }
    };
    const reset = () => {
      if (phone.matches) {
        ring.forEach((c) => {
          c.removeAttribute('style');
          c.inert = c.classList.contains('is-clone'); // copies stay hidden on phones (CSS)
        });
      } else {
        t = target();
        layout();
      }
    };

    reset();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', reset);
    phone.addEventListener('change', reset);

    // the underline under MADE CLEAR. draws itself when the section arrives
    new IntersectionObserver((entries, io) => {
      if (entries[0].isIntersecting) { work.classList.add('is-inview'); io.disconnect(); }
    }, { threshold: .15 }).observe(work);
  }

  /* ---------- Halftone lens on the portrait ---------- */
  // A 160px circle follows the pointer and shows the dotted version of the photo.
  document.querySelectorAll('[data-lens]').forEach((photo) => {
    let trackTimer;
    const place = (e) => {
      const r = photo.getBoundingClientRect();
      photo.style.setProperty('--lx', `${(e.clientX - r.left).toFixed(1)}px`);
      photo.style.setProperty('--ly', `${(e.clientY - r.top).toFixed(1)}px`);
    };
    const show = (e) => {
      place(e);
      photo.classList.add('is-lensing');
      // let the circle grow open first, then follow the pointer without lag
      clearTimeout(trackTimer);
      trackTimer = setTimeout(() => photo.classList.add('is-tracking'), 350);
    };
    const hide = () => {
      clearTimeout(trackTimer);
      photo.classList.remove('is-lensing', 'is-tracking');
    };
    photo.addEventListener('pointerenter', show);
    photo.addEventListener('pointerdown', show);
    photo.addEventListener('pointermove', place);
    photo.addEventListener('pointerleave', hide);
    photo.addEventListener('pointercancel', hide);
  });

  /* ---------- Headline letters: stretch + colour swap under the pointer ---------- */
  // Each letter becomes its own inline-block span; the effect itself is CSS (.char:hover).
  document.querySelectorAll('[data-letters]').forEach((lettered) => {
    lettered.setAttribute('aria-label', lettered.textContent.replace(/\s+/g, ' ').trim());
    const walker = document.createTreeWalker(lettered, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      // letters are grouped per word so lines only break between words
      node.textContent.split(/(\s+)/).forEach((token) => {
        if (!token) return;
        if (/^\s+$/.test(token)) { frag.append(token); return; }
        const word = document.createElement('span');
        word.className = 'word';
        word.setAttribute('aria-hidden', 'true');
        for (const ch of token) {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch;
          word.append(span);
        }
        frag.append(word);
      });
      node.replaceWith(frag);
    });

    // Touch has no hover: a tap or drag across the headline lights letters briefly
    const touchLight = (e) => {
      const t = e.touches[0];
      const el = t && document.elementFromPoint(t.clientX, t.clientY);
      if (!el || !el.classList.contains('char')) return;
      el.classList.add('is-hot');
      clearTimeout(el._hot);
      el._hot = setTimeout(() => el.classList.remove('is-hot'), 450);
    };
    lettered.addEventListener('touchstart', touchLight, { passive: true });
    lettered.addEventListener('touchmove', touchLight, { passive: true });
  });

  /* ---------- How I work: the ring's right half + the stages ---------- */
  // The scroll line (js/math.js) draws the left half of the ring itself; this
  // draws the right half to the same height and lights each stage's node as
  // the line reaches it. On narrower screens it's a plain list that reveals.
  const how = document.querySelector('[data-how]');
  if (how) {
    const ring = how.querySelector('[data-how-ring]');
    const svg = how.querySelector('[data-how-svg]');
    const steps = [...how.querySelectorAll('.how-step')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const NS = 'http://www.w3.org/2000/svg';
    let arc = null; let len = 0; let D = 0; let R = 0; let nodes = [];
    let tipY = -Infinity; let ringMode = false;

    const setOn = (i, on) => {
      steps[i].classList.toggle('is-on', on);
      if (nodes[i]) nodes[i].c.classList.toggle('is-on', on);
    };

    const apply = () => {
      if (!ringMode || !arc) return;
      if (reduce.matches) {
        arc.style.strokeDashoffset = 0;
        steps.forEach((_, i) => setOn(i, true));
        return;
      }
      const y = tipY - (ring.getBoundingClientRect().top + window.scrollY); // tip, in ring space
      const cos = Math.max(-1, Math.min(1, (D / 2 - y) / R));
      const frac = y <= D / 2 - R ? 0 : Math.acos(cos) / Math.PI;
      arc.style.strokeDashoffset = len * (1 - frac);
      nodes.forEach((n, i) => setOn(i, y >= n.y - 1));
    };

    const layout = () => {
      ringMode = getComputedStyle(svg).display !== 'none';
      svg.textContent = '';
      arc = null; nodes = [];
      if (!ringMode) {
        steps.forEach((s) => { s.style.removeProperty('--nx'); s.style.removeProperty('--ny'); });
        return;
      }
      D = ring.offsetWidth;
      R = D / 2 - 1; // the same circle js/math.js runs the line round
      svg.setAttribute('viewBox', `0 0 ${D} ${D}`);
      arc = document.createElementNS(NS, 'path');
      arc.setAttribute('d', `M${D / 2} ${D / 2 - R} A${R} ${R} 0 0 1 ${D / 2} ${D / 2 + R}`);
      arc.setAttribute('class', 'how__arc');
      svg.append(arc);
      len = arc.getTotalLength();
      arc.style.strokeDasharray = `${len} ${len}`;
      arc.style.strokeDashoffset = len;
      nodes = steps.map((s) => {
        const a = (Number(s.dataset.angle) * Math.PI) / 180;
        const x = D / 2 + (s.dataset.side === 'left' ? -1 : 1) * R * Math.sin(a);
        const y = D / 2 - R * Math.cos(a);
        // the text hangs below its node; keep the whole block clear of the ring
        // where it bulges out beside the text, not just at the node
        const left = s.dataset.side === 'left';
        const top = y - 30;
        const bottom = top + s.offsetHeight;
        let edge = x;
        for (let yy = top; yy <= bottom; yy += 4) {
          const dy = yy - D / 2;
          if (Math.abs(dy) >= R) continue;
          const half = Math.sqrt(R * R - dy * dy);
          edge = left ? Math.min(edge, D / 2 - half) : Math.max(edge, D / 2 + half);
        }
        s.style.setProperty('--nx', `${edge}px`);
        s.style.setProperty('--ny', `${y}px`);
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 5);
        c.setAttribute('class', 'how__node');
        svg.append(c);
        return { c, y };
      });
      apply();
    };

    // the line's tip, reported by js/math.js every frame it moves
    document.addEventListener('scribble:tip', (e) => { tipY = e.detail.y; apply(); });

    // list mode: each stage sharpens as it scrolls in
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (ringMode) return;
        entries.forEach((e) => {
          if (e.isIntersecting) steps[steps.indexOf(e.target)].classList.add('is-on');
        });
      }, { rootMargin: '0px 0px -20% 0px' });
      steps.forEach((s) => io.observe(s));
    }

    layout();
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120); });
    document.fonts?.ready.then(layout);
  }

  /* ---------- Entrance ---------- */
  // Hero content rises in once the loader (js/math.js) has finished
  const hero = document.querySelector('.hero');
  if (hero) {
    const reveal = () => requestAnimationFrame(() => hero.classList.add('is-ready'));
    if (document.documentElement.classList.contains('is-loading')) {
      document.addEventListener('loader:done', reveal, { once: true });
    } else {
      reveal();
    }
  }
})();
