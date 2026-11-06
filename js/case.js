/* Case study pages: letters, layered entrances, slot-reel stats, "On this page" */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = 'IntersectionObserver' in window;

  /* ---------- Title letters: the same hover as the home hero (.char in style.css) ---------- */
  document.querySelectorAll('[data-letters]').forEach((title) => {
    const text = title.textContent.trim().replace(/\s+/g, ' ');
    title.setAttribute('aria-label', text);
    title.textContent = '';
    // letters grouped per word, so a long title only breaks between words
    let i = 0;
    text.split(' ').forEach((w, wi) => {
      if (wi) title.append(' ');
      const word = document.createElement('span');
      word.className = 'word';
      word.setAttribute('aria-hidden', 'true');
      [...w].forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.style.setProperty('--i', i++);
        span.textContent = ch;
        word.append(span);
      });
      title.append(word);
    });

    // touch has no hover: a tap or drag lights letters briefly
    const touchLight = (e) => {
      const t = e.touches[0];
      const el = t && document.elementFromPoint(t.clientX, t.clientY);
      if (!el || !el.classList.contains('char')) return;
      el.classList.add('is-hot');
      clearTimeout(el._hot);
      el._hot = setTimeout(() => el.classList.remove('is-hot'), 450);
    };
    title.addEventListener('touchstart', touchLight, { passive: true });
    title.addEventListener('touchmove', touchLight, { passive: true });
  });

  /* ---------- Layered entrances ---------- */
  // Text rises a little, pictures travel further and land later, so the
  // layers separate like parallax as each block arrives.
  const layers = [
    ['.case-hero .case-label, .case-hero__summary, .case-section > .case-label, .case-heading, .case-body, .case-split__text > *', 'near'],
    ['.case-figure, .case-split__image, .case-card, .case-facts > div, .case-stats li, .case-switch li, .case-next__top, .case-next__title, .case-next__nav, .case-footer .contact__grid > div:first-child', 'far'],
  ];
  const risers = [];
  layers.forEach(([sel, depth]) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.dataset.rise) return;
      el.dataset.rise = depth;
      risers.push(el);
    });
  });
  // siblings that arrive together are staggered
  risers.forEach((el) => {
    const group = [...el.parentElement.children].filter((c) => c.dataset.rise);
    el.style.setProperty('--i', Math.min(group.indexOf(el), 4));
  });

  const titleEl = document.querySelector('.case-hero__title');
  if (reduce || !canObserve) {
    risers.forEach((el) => el.classList.add('is-in'));
    titleEl?.classList.add('is-in');
  } else {
    document.documentElement.classList.add('has-rise');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    risers.forEach((el) => io.observe(el));
    requestAnimationFrame(() => requestAnimationFrame(() => titleEl?.classList.add('is-in')));
  }

  /* ---------- Stats: digits spin like slot-machine reels ---------- */
  const slots = [...document.querySelectorAll('[data-slot]')];
  const LOOPS = 2; // full turns of 0–9 before a reel lands
  slots.forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let reel = 0;
    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    [...text].forEach((ch) => {
      const digit = /\d/.test(ch);
      const letter = /[A-Z]/.test(ch);
      if (!digit && !letter) {
        const s = document.createElement('span');
        s.className = 'slot__static';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = ch;
        el.append(s);
        return;
      }
      const win = document.createElement('span');
      win.className = 'slot__window';
      win.setAttribute('aria-hidden', 'true');
      // an invisible copy of the final character sizes the window
      const sizer = document.createElement('span');
      sizer.className = 'slot__sizer';
      sizer.textContent = ch;
      const strip = document.createElement('span');
      strip.className = 'slot__strip';
      let faces;
      if (digit) {
        // 0–9 on a loop; later reels spin a full turn longer
        const stops = (LOOPS + reel) * 10 + Number(ch);
        faces = Array.from({ length: stops + 1 }, (_, i) => i % 10);
      } else {
        // a run of random letters landing on the right one
        const n = 8 + reel * 2;
        faces = Array.from({ length: n }, () => ABC[Math.floor(Math.random() * 26)]);
        faces.push(ch);
      }
      faces.forEach((f) => {
        const n = document.createElement('span');
        n.textContent = f;
        strip.append(n);
      });
      strip.style.setProperty('--stops', faces.length - 1);
      strip.style.setProperty('--r', digit ? reel : reel * .3); // long words stay snappy
      win.append(sizer, strip);
      el.append(win);
      reel += 1;
    });
  });
  if (slots.length) {
    if (reduce || !canObserve) {
      slots.forEach((el) => el.classList.add('is-spun', 'is-instant'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          // a beat after the block has risen in
          setTimeout(() => e.target.classList.add('is-spun'), 250);
        });
      }, { threshold: .6 });
      slots.forEach((el) => io.observe(el));
    }
  }

  /* ---------- Pinned "Let's connect" steps aside over the footer ---------- */
  const connect = document.querySelector('.case-rail__connect');
  const footer = document.querySelector('.case-footer');
  if (connect && footer && canObserve) {
    new IntersectionObserver(([e]) => connect.classList.toggle('is-away', e.isIntersecting))
      .observe(footer);
  }

  /* ---------- "On this page": highlight the section in view ---------- */
  const links = [...document.querySelectorAll('[data-toc]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!links.length || !sections.length) return;

  const setCurrent = (id) => {
    links.forEach((a) => {
      const on = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  };

  // current = the last section whose top has passed 40% of the screen;
  // once the last section is fully on screen (the footer follows), it wins
  const last = sections[sections.length - 1];
  const update = () => {
    const line = window.innerHeight * .4;
    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s; });
    if (last.getBoundingClientRect().bottom < window.innerHeight * .9) current = last;
    setCurrent(current ? current.id : '');
  };
  // only five sections, so it's cheap enough to run on every scroll event
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();
