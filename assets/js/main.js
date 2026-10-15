(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const railCtrl = $('.cu-ctrl');
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
        rail.style.scrollSnapType = '';
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

  prev.addEventListener('click', () => { go(-1); restart(); });
  next.addEventListener('click', () => { go(1); restart(); });

  let wrapTimer = 0;
  rail.addEventListener('scroll', () => {
    if (anim) return;
    clearTimeout(wrapTimer);
    wrapTimer = setTimeout(wrap, 90);
  }, { passive: true });
  addEventListener('resize', wrap);

  let timer = 0;
  let paused = false;
  let resumeTimer = 0;
  const stop = () => { clearInterval(timer); timer = 0; };
  const start = () => {
    if (reduce || paused || timer) return;
    timer = setInterval(() => { if (!paused) go(1); }, 3400);
  };
  function restart() {
    stop();
    if (!paused) start();
  }
  const pause = () => {
    paused = true;
    stop();
    clearTimeout(resumeTimer);
    if (anim) cancelAnimationFrame(anim);
    anim = 0;
    rail.style.scrollSnapType = '';
  };
  const resumeSoon = () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { paused = false; start(); }, 700);
  };

  rail.addEventListener('pointerenter', pause);
  rail.addEventListener('pointerleave', resumeSoon);
  rail.addEventListener('focusin', pause);
  rail.addEventListener('focusout', (e) => { if (!rail.contains(e.relatedTarget)) resumeSoon(); });
  rail.addEventListener('pointerdown', pause);
  rail.addEventListener('touchend', resumeSoon, { passive: true });
  if (railCtrl) {
    railCtrl.addEventListener('pointerenter', pause);
    railCtrl.addEventListener('pointerleave', resumeSoon);
    railCtrl.addEventListener('focusin', pause);
    railCtrl.addEventListener('focusout', (e) => { if (!railCtrl.contains(e.relatedTarget)) resumeSoon(); });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!paused) start();
  });
  const railHovering = () => rail.matches(':hover') || (railCtrl && railCtrl.matches(':hover'));
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) { stop(); return; }
    if (!railHovering()) { paused = false; start(); }
  }, { threshold: 0.35 }).observe($('.custom'));

  /* ---------- Estados ligados à rolagem (sem depender do GSAP) ---------- */
  const hero = $('.hero');
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

  /* ---------- Movimento e Animações ---------- */
  if (!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  window.__vallechMotion = true;

  /* 1. ABERTURA: entrada curta. O scroll da hero só começa depois, para não gravar o blur inicial. */
  const clearHeroInline = () => {
    gsap.set('.hero-media img, .hero-title .line-in, [data-hero-fade], .top, .hero-body, .hero-media', {
      clearProps: 'filter,transform,opacity'
    });
  };

  const setupHeroScroll = () => {
    clearHeroInline();
    // Só um parallax leve. Sem opacidade e sem blur: isso deixava a foto preta na volta do scroll.
    gsap.fromTo('.hero-media', { yPercent: 0 }, {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    gsap.fromTo('.hero-media img', { scale: 1 }, {
      scale: 1.05,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
    // Se algum tween antigo deixou opacidade ou blur, voltar ao topo restaura a foto.
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        if (self.progress > 0.015) return;
        const img = document.querySelector('.hero-media img');
        if (!img) return;
        img.style.opacity = '';
        img.style.filter = '';
      },
    });
  };

  if (document.documentElement.classList.contains('motion')) {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        document.documentElement.classList.remove('motion');
        setupHeroScroll();
      },
    });

    tl.fromTo('.hero-media img',
      { opacity: 0, filter: 'blur(16px)', scale: 1.06 },
      { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.35, ease: 'power2.out' }
    )
    .fromTo('.hero-title .line-in',
      { opacity: 0, filter: 'blur(10px)', y: 18 },
      { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.05, stagger: 0.1, ease: 'power3.out' },
      0.35
    )
    .fromTo('.top',
      { opacity: 0 },
      { opacity: 1, duration: 0.8 },
      0.55
    )
    .fromTo('[data-hero-fade]',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power2.out' },
      0.6
    );
  } else {
    setupHeroScroll();
  }

  /* 3. TÍTULOS COM ENTRADA EM FADE SUAVE + DESFOQUE GAUSSIANO */
  $$('[data-split]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((w) => `<span class="w" aria-hidden="true"><span class="w-in">${w}</span></span>`).join(' ');

    gsap.fromTo(el.querySelectorAll('.w-in'), 
      { opacity: 0, filter: 'blur(14px)', y: 14 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1.2,
        ease: 'power2.out',
        stagger: 0.035,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onComplete: () => {
          gsap.set(el.querySelectorAll('.w-in'), { clearProps: 'filter,transform,opacity' });
        }
      }
    );
  });

  /* 4. TEXTOS E CTAs COM FADE IN SMOOTH + GAUSSIAN BLUR */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.fromTo(el, 
      { opacity: 0, filter: 'blur(10px)', y: 22 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onComplete: () => gsap.set(el, { clearProps: 'filter,transform,opacity' })
      }
    );
  });

  /* 5. ANIMAÇÕES VARIADAS DE IMAGENS COM FADE IN + DESFOQUE GAUSSIANO */

  // Variação 1: O Padrão Vallech - Foto do artesão (foco macro de estúdio com scale suave)
  const stdPortrait = $('.std-portrait img');
  if (stdPortrait) {
    gsap.fromTo(stdPortrait,
      { opacity: 0, filter: 'blur(26px)', scale: 1.08 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: 1.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.std-portrait', start: 'top 85%', once: true },
        onComplete: () => gsap.set(stdPortrait, { clearProps: 'filter' })
      }
    );
  }

  // Variação 2: O Padrão Vallech - Detalhe das mãos (flutuação lateral em drift + foco)
  const stdDetail = $('.std-detail img');
  if (stdDetail) {
    gsap.fromTo(stdDetail,
      { opacity: 0, filter: 'blur(18px)', x: -25, y: 30, scale: 0.96 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.std-detail', start: 'top 88%', once: true },
        onComplete: () => gsap.set(stdDetail, { clearProps: 'filter' })
      }
    );
  }

  // Funilaria: a seção trava ao chegar. Um trecho de scroll fica parado no antes, e só então a troca começa.
  const bodyShop = $('.body-shop');
  const bsBeforeLabel = $('[data-bs-before-label]');
  const bsAfterLabel = $('[data-bs-after-label]');
  if (bodyShop && document.documentElement.classList.contains('has-motion')) {
    const applyBs = (progress) => {
      const p = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.22, 0.84, 0, 1, progress));
      bodyShop.style.setProperty('--p', p.toFixed(4));
      const showAfter = p >= 0.5;
      const capBefore = bodyShop.querySelector('.bs-cap-before');
      const capAfter = bodyShop.querySelector('.bs-cap-after');
      if (capBefore) capBefore.style.opacity = showAfter ? '0' : '1';
      if (capAfter) capAfter.style.opacity = showAfter ? '1' : '0';
      if (bsBeforeLabel) bsBeforeLabel.classList.toggle('is-on', !showAfter);
      if (bsAfterLabel) bsAfterLabel.classList.toggle('is-on', showAfter);
    };

    ScrollTrigger.create({
      trigger: '.body-shop',
      start: 'top top',
      end: '+=155%',
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => applyBs(self.progress),
    });
  }

  // Picapes: entrada simples, sem deslocar as fotos (o parallax desalinhava o par)
  const fadePhoto = (img, trigger) => {
    if (!img) return;
    gsap.fromTo(img,
      { opacity: 0, filter: 'blur(12px)' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: { trigger, start: 'top 88%', once: true },
        onComplete: () => gsap.set(img, { clearProps: 'filter,opacity,transform' }),
      }
    );
  };
  fadePhoto($('.tr-main img'), '.tr-main');
  fadePhoto($('.tr-side img'), '.tr-side');
  fadePhoto($('.tr-alt img'), '.tr-alt');

  // Variação 7: Trilho de Personalização (onda sequencial em cascata com desfoque)
  const railItems = $$('[data-rail-item]');
  if (railItems.length) {
    gsap.fromTo(railItems,
      { opacity: 0, filter: 'blur(16px)', y: 30, scale: 0.98 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        scale: 1,
        duration: 1.3,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.rail', start: 'top 86%', once: true },
        onComplete: () => gsap.set(railItems, { clearProps: 'filter' })
      }
    );
  }

  // Variação 8: Contato (Traseira do Mustang se aproxima com foco abrindo)
  const ctImg = $('[data-ct-media] img');
  if (ctImg) {
    gsap.fromTo(ctImg,
      { scale: 1.15, filter: 'blur(20px)', opacity: 0.35 },
      {
        scale: 1,
        filter: 'blur(0px)',
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.contact',
          start: 'top bottom',
          end: 'center 60%',
          scrub: 0.8,
        }
      }
    );
  }

  // Lista do Índice de Serviços (revelação suave em cascata)
  const idxItems = $$('.idx-list li');
  if (idxItems.length) {
    gsap.fromTo(idxItems,
      { opacity: 0, filter: 'blur(8px)', x: -15 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        x: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.idx-list', start: 'top 85%', once: true },
        onComplete: () => gsap.set(idxItems, { clearProps: 'filter,transform,opacity' })
      }
    );
  }

  // Parallax de profundidade em elementos de tela média/larga
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    // Parallax suave entre camadas
    gsap.to('.std-detail', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.std', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Esconde o topo ao descer, mostra ao subir
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => top.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > innerHeight * 0.7),
    });
  });

  // "Aro 16 a 22" corre na horizontal com a rolagem
  gsap.fromTo('[data-drift]', { xPercent: 6 }, {
    xPercent: -12, ease: 'none',
    scrollTrigger: { trigger: '.trucks', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();