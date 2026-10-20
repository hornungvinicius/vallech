(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 767px)').matches;
  // Desfoque só no desktop com mouse: no celular ele pesa na GPU e engasga a rolagem.
  const fx = document.documentElement.classList.contains('fx');
  const blur = (px) => (fx ? { filter: `blur(${px}px)` } : {});
  const clearFx = fx ? 'filter,transform,opacity' : 'transform,opacity';
  const top = $('[data-top]');

  /* ---------- Menu ---------- */
  const menu = $('#menu');
  $$('[data-menu-open]').forEach((b) => b.addEventListener('click', () => menu.showModal()));
  $('[data-menu-close]').addEventListener('click', () => menu.close());
  menu.addEventListener('click', (e) => {
    if (e.target === menu || e.target.closest('a')) menu.close();
  });

  /* ---------- Índice: troca da imagem de prévia ---------- */
  const preview = $$('[data-preview-stage] img');
  $$('[data-preview]').forEach((a) => {
    const show = () => preview.forEach((img, i) => img.classList.toggle('is-on', i === +a.dataset.preview));
    a.addEventListener('pointerenter', show);
    a.addEventListener('focus', show);
  });

  /* ---------- Trilho de personalização: carrossel em loop ---------- */
  const rail = $('[data-rail]');
  const prev = $('[data-rail-prev]');
  const next = $('[data-rail-next]');
  [...rail.children].forEach((item) => {
    item.dataset.railItem = '1';
    const clone = item.cloneNode(true);
    clone.dataset.railClone = '1';
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    rail.appendChild(clone);
  });

  const pairDistance = (startSel, endSel) => {
    const a = rail.querySelector(startSel);
    const b = rail.querySelector(endSel);
    if (!a || !b) return 0;
    return b.getBoundingClientRect().left - a.getBoundingClientRect().left;
  };
  const stepSize = () => pairDistance('[data-rail-item]', '[data-rail-item] + [data-rail-item]') || rail.clientWidth * 0.7;
  const loopWidth = () => pairDistance('[data-rail-item]', '[data-rail-clone]');

  let anim = 0;
  const wrap = () => {
    const w = loopWidth();
    if (w <= 1) return;
    let guard = 0;
    while (rail.scrollLeft >= w - 1 && guard < 3) {
      rail.scrollLeft -= w;
      guard += 1;
    }
  };
  const animateBy = (delta, done) => {
    if (anim) cancelAnimationFrame(anim);
    const start = rail.scrollLeft;
    const dur = reduce ? 0 : 700;
    const t0 = performance.now();
    rail.style.scrollSnapType = 'none';
    const tick = (now) => {
      const p = dur === 0 ? 1 : Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      rail.scrollLeft = start + delta * e;
      if (p < 1) anim = requestAnimationFrame(tick);
      else {
        anim = 0;
        wrap();
        rail.style.scrollSnapType = rail.classList.contains('is-running') ? 'none' : '';
        if (done) done();
      }
    };
    anim = requestAnimationFrame(tick);
  };
  const go = (dir) => {
    const w = loopWidth();
    const step = stepSize();
    if (!step) return;
    if (dir < 0 && rail.scrollLeft < step * 0.4 && w) {
      rail.style.scrollSnapType = 'none';
      rail.scrollLeft += w;
    }
    animateBy(dir * step);
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  let wrapTimer = 0;
  rail.addEventListener('scroll', () => {
    if (anim || rail.classList.contains('is-running')) return;
    clearTimeout(wrapTimer);
    wrapTimer = setTimeout(wrap, 120);
  }, { passive: true });
  addEventListener('resize', wrap);

  // Rolagem automática só no desktop. No celular o dedo manda: deslizar com snap, sem o trilho fugindo.
  if (!mobile && !reduce) {
    let paused = false;
    let resumeTimer = 0;
    let railFrame = 0;
    let railLast = 0;
    const railSpeed = 90;
    const railTick = (now) => {
      railFrame = requestAnimationFrame(railTick);
      const dt = railLast ? Math.min(34, now - railLast) : 16;
      railLast = now;
      if (paused || anim) return;
      rail.scrollLeft += (railSpeed * dt) / 1000;
      const w = loopWidth();
      if (w > 1 && rail.scrollLeft >= w) rail.scrollLeft -= w;
    };
    const railPlay = () => {
      if (paused || railFrame) return;
      rail.classList.add('is-running');
      rail.style.scrollSnapType = 'none';
      railLast = 0;
      railFrame = requestAnimationFrame(railTick);
    };
    const railHalt = () => {
      cancelAnimationFrame(railFrame);
      railFrame = 0;
      rail.classList.remove('is-running');
      rail.style.scrollSnapType = '';
    };
    const pause = () => {
      paused = true;
      clearTimeout(resumeTimer);
      if (anim) cancelAnimationFrame(anim);
      anim = 0;
    };
    const resumeSoon = () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; railPlay(); }, 600);
    };
    rail.addEventListener('focusin', pause);
    rail.addEventListener('focusout', (e) => { if (!rail.contains(e.relatedTarget)) resumeSoon(); });
    rail.addEventListener('pointerenter', pause);
    rail.addEventListener('pointerleave', resumeSoon);
    [prev, next].forEach((b) => b.addEventListener('click', () => { pause(); resumeSoon(); }));
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !document.hidden) railPlay();
      else railHalt();
    }, { threshold: 0.05 }).observe($('.custom'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) railHalt(); });
  }

  /* ---------- Hero: três fotos em fade cruzado ---------- */
  const hero = $('.hero');
  const slides = $$('[data-slide]');
  const dots = $$('.hero-dots span');
  const SLIDE_MS = 5600;
  let slideIdx = 0;
  let slideTimer = 0;
  const showSlide = (i) => {
    slideIdx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-on', k === slideIdx));
    dots.forEach((d, k) => {
      d.classList.remove('is-on');
      if (k === slideIdx) { void d.offsetWidth; d.classList.add('is-on'); } // reinicia a barrinha
    });
  };
  const slidePlay = () => {
    if (reduce || slideTimer) return;
    slideTimer = setInterval(() => showSlide(slideIdx + 1), SLIDE_MS);
  };
  const slideStop = () => { clearInterval(slideTimer); slideTimer = 0; };
  hero.style.setProperty('--slide-ms', SLIDE_MS + 'ms');
  if (reduce) dots.forEach((d) => d.classList.remove('is-on'));
  // Só gira com a hero na tela e a aba visível
  let heroVisible = true;
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    heroVisible && !document.hidden ? slidePlay() : slideStop();
  }, { threshold: 0.15 }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden || !heroVisible ? slideStop() : slidePlay()));

  /* ---------- Estados ligados à rolagem (sem depender do GSAP) ---------- */
  new IntersectionObserver(([e]) => top.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' }).observe(hero);

  // Proteção: o item no centro da tela define a imagem fixa ao lado
  const stageImgs = $$('[data-stage] img');
  const steps = $$('[data-step]');
  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.step;
      steps.forEach((s) => s.classList.toggle('is-on', s === e.target));
      stageImgs.forEach((img, k) => img.classList.toggle('is-on', k === i));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => stepObserver.observe(s));
  steps[0].classList.add('is-on');

  // Link ativo na navegação
  const navLinks = $$('.top-nav a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.hash === '#' + e.target.id));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  ['servicos', 'funilaria', 'picapes', 'protecao', 'personalizacao', 'contato'].forEach((id) => navObserver.observe(document.getElementById(id)));

  /* ---------- Movimento ---------- */
  if (!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  // Barra de endereço do celular abrindo e fechando não deve recalcular tudo
  ScrollTrigger.config({ ignoreMobileResize: true });
  window.__vallechMotion = true;
  const mm = gsap.matchMedia();

  /* 1. Abertura: tudo em fade. A foto aparece, o título sobe de leve, o resto chega por último. */
  const setupHeroScroll = () => {
    gsap.set('.hero-title .line-in, [data-hero-fade], .top, .hero-media', { clearProps: clearFx });
    // Parallax: a foto desce mais devagar que a página. A hero corta o excesso, então não abre faixa vazia.
    gsap.fromTo('.hero-media', { yPercent: 0 }, {
      yPercent: mobile ? 12 : 24, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
    // Desktop: o texto sai antes da foto. No celular ele rola junto com a página (deslocar abria um vão escuro).
    mm.add('(min-width: 768px)', () => {
      gsap.to('.hero-body', {
        yPercent: -10, opacity: 0.2, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true },
      });
    });
  };

  if (document.documentElement.classList.contains('motion')) {
    gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        document.documentElement.classList.remove('motion');
        setupHeroScroll();
      },
    })
      .fromTo('.hero-media', { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power1.inOut' })
      .fromTo('.hero-title .line-in', { opacity: 0, y: 18, ...blur(10) }, { opacity: 1, y: 0, ...blur(0), duration: 1.1, stagger: 0.12 }, 0.45)
      .fromTo('.top', { opacity: 0 }, { opacity: 1, duration: 0.9 }, 0.6)
      .fromTo('[data-hero-fade]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.75);
  } else {
    setupHeroScroll();
  }

  /* 2. Títulos entram palavra por palavra */
  $$('[data-split]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((w) => `<span class="w" aria-hidden="true"><span class="w-in">${w}</span></span>`).join(' ');
    const words = el.querySelectorAll('.w-in');
    gsap.fromTo(words, { opacity: 0, y: 14, ...blur(14) }, {
      opacity: 1, y: 0, ...blur(0), duration: 1.1, ease: 'power2.out', stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onComplete: () => gsap.set(words, { clearProps: clearFx }),
    });
  });

  /* 3. Textos e CTAs */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 22, ...blur(10) }, {
      opacity: 1, y: 0, ...blur(0), duration: 1.1, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onComplete: () => gsap.set(el, { clearProps: clearFx }),
    });
  });

  /* 4. Imagens */
  const stdDetail = $('.std-detail img');
  if (stdDetail) {
    gsap.fromTo(stdDetail, { opacity: 0, y: 30, scale: 1.04, ...blur(18) }, {
      opacity: 1, y: 0, scale: 1, ...blur(0), duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: '.std-detail', start: 'top 88%', once: true },
      onComplete: () => gsap.set(stdDetail, { clearProps: clearFx }),
    });
  }

  // Funilaria: a foto da chegada é varrida pela foto do reparo pronto, conforme a rolagem
  const bodyShop = $('.body-shop');
  const bsBeforeLabel = $('[data-bs-before-label]');
  const bsAfterLabel = $('[data-bs-after-label]');
  const applyBs = (progress, from, to) => {
    const p = gsap.utils.clamp(0, 1, gsap.utils.mapRange(from, to, 0, 1, progress));
    bodyShop.style.setProperty('--p', p.toFixed(4));
    const showAfter = p >= 0.5;
    bsBeforeLabel.classList.toggle('is-on', !showAfter);
    bsAfterLabel.classList.toggle('is-on', showAfter);
  };
  // Desktop: a seção trava na tela e um trecho de scroll fica parado no antes
  mm.add('(min-width: 1024px)', () => {
    ScrollTrigger.create({
      trigger: '.body-shop', start: 'top top', end: '+=155%',
      pin: true, pinSpacing: true, anticipatePin: 1, scrub: true, invalidateOnRefresh: true,
      onUpdate: (self) => applyBs(self.progress, 0.22, 0.84),
    });
  });
  // Celular e tablet: sem travar a página. A varredura acompanha a foto passando pela tela.
  mm.add('(max-width: 1023px)', () => {
    ScrollTrigger.create({
      trigger: '.bs-frame', start: 'top 70%', end: 'bottom 45%', scrub: true,
      onUpdate: (self) => applyBs(self.progress, 0.08, 0.92),
    });
  });

  const truckImgs = $$('.tr-photos img');
  if (truckImgs.length) {
    gsap.fromTo(truckImgs, { opacity: 0, y: 24, ...blur(12) }, {
      opacity: 1, y: 0, ...blur(0), duration: 1.1, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: '.tr-photos', start: 'top 88%', once: true },
      onComplete: () => gsap.set(truckImgs, { clearProps: clearFx }),
    });
  }

  const railItems = $$('[data-rail-item]');
  if (railItems.length) {
    gsap.fromTo(railItems, { opacity: 0, y: 30, ...blur(16) }, {
      opacity: 1, y: 0, ...blur(0), duration: 1.2, stagger: 0.1, ease: 'power2.out',
      scrollTrigger: { trigger: '.rail', start: 'top 86%', once: true },
      onComplete: () => gsap.set(railItems, { clearProps: clearFx }),
    });
  }

  // Contato: a traseira se aproxima enquanto a faixa entra. Sem desfoque nem escurecer: a foto chega nítida.
  const ctImg = $('[data-ct-media] img');
  if (ctImg) {
    gsap.fromTo(ctImg, { scale: 1.14 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 25%', scrub: true },
    });
  }

  const idxItems = $$('.idx-list li');
  if (idxItems.length) {
    gsap.fromTo(idxItems, { opacity: 0, x: -15, ...blur(8) }, {
      opacity: 1, x: 0, ...blur(0), duration: 1.1, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: '.idx-list', start: 'top 85%', once: true },
      onComplete: () => gsap.set(idxItems, { clearProps: clearFx }),
    });
  }

  mm.add('(min-width: 768px)', () => {
    gsap.to('.std-detail', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.std', start: 'top bottom', end: 'bottom top', scrub: true } });
    // Esconde o topo ao descer, mostra ao subir
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => top.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > innerHeight * 0.7),
    });
  });

  // Faixa "Aro 13 a 22": as camadas cruzam com o scroll
  $$('[data-marquee]').forEach((track) => {
    const ghost = track.classList.contains('is-ghost');
    gsap.fromTo(track, { xPercent: ghost ? -22 : -4 }, {
      xPercent: ghost ? 6 : -28, ease: 'none',
      scrollTrigger: { trigger: '.trucks', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
