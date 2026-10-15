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

  /* ---------- Trilho de personalização ---------- */
  const rail = $('[data-rail]');
  const prev = $('[data-rail-prev]');
  const next = $('[data-rail-next]');
  const syncRail = () => {
    prev.disabled = rail.scrollLeft < 8;
    next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
  };
  const step = (dir) => rail.scrollBy({ left: dir * rail.clientWidth * 0.6, behavior: reduce ? 'auto' : 'smooth' });
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  rail.addEventListener('scroll', syncRail, { passive: true });
  syncRail();

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

  /* 1. ABERTURA (INTRO): FADE IN SMOOTH COM DESFOQUE GAUSSIANO */
  if (document.documentElement.classList.contains('motion')) {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        document.documentElement.classList.remove('motion');
        gsap.set('.hero-media img, .hero-title .line-in, [data-hero-fade], .top', {
          clearProps: 'filter,transform,opacity'
        });
      },
    });

    tl.fromTo('.hero-media img', 
      { opacity: 0, filter: 'blur(32px)', scale: 1.12 }, 
      { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 2.2, ease: 'power2.out' }
    )
    .fromTo('.hero-title .line-in', 
      { opacity: 0, filter: 'blur(16px)', y: 24 }, 
      { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.4, stagger: 0.14, ease: 'power3.out' }, 
      0.6
    )
    .fromTo('.top', 
      { opacity: 0, filter: 'blur(8px)' }, 
      { opacity: 1, filter: 'blur(0px)', duration: 1.1 }, 
      1.1
    )
    .fromTo('[data-hero-fade]', 
      { opacity: 0, filter: 'blur(10px)', y: 16 }, 
      { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.2, stagger: 0.12, ease: 'power2.out' }, 
      1.2
    );
  }

  /* 2. PARALLAX NA HERO (INTERATIVO COM O SCROLL) */
  // O fundo do hero desce com desfoque e escurecimento gradual conforme o scroll
  gsap.to('.hero-media', {
    yPercent: 24,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });

  gsap.to('.hero-media img', {
    scale: 1.08,
    filter: 'blur(12px)',
    opacity: 0.3,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });

  // O texto do hero sobe com velocidade diferente e evapora com desfoque gaussiano
  gsap.to('.hero-body', {
    yPercent: -26,
    opacity: 0,
    filter: 'blur(10px)',
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: '15% top',
      end: '85% top',
      scrub: true,
    }
  });

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

  // Variação 3: Funilaria "Antes" (Raptor na chegada - fade documental suave)
  const bsBefore = $('.bs-before img');
  if (bsBefore) {
    gsap.fromTo(bsBefore,
      { opacity: 0, filter: 'blur(18px)', y: 26 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.bs-before', start: 'top 88%', once: true },
        onComplete: () => gsap.set(bsBefore, { clearProps: 'filter' })
      }
    );
  }

  // Variação 4: Funilaria "Depois" (Raptor reconstruída - revelação de foco límpido)
  const bsAfter = $('.bs-after img');
  if (bsAfter) {
    gsap.fromTo(bsAfter,
      { opacity: 0, filter: 'blur(28px)', scale: 1.05 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.bs-after', start: 'top 84%', once: true },
        onComplete: () => gsap.set(bsAfter, { clearProps: 'filter' })
      }
    );
  }

  // Variação 5: Picapes (Raptor frontal - foco interativo por rolagem contínua)
  const trMain = $('.tr-main img');
  if (trMain) {
    gsap.fromTo(trMain,
      { opacity: 0.25, filter: 'blur(22px)', scale: 1.07 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: '.tr-main',
          start: 'top 92%',
          end: 'center 55%',
          scrub: 0.8,
        }
      }
    );
  }

  // Variação 6: Picapes Laterais (tr-side e tr-alt - desfoque alternado com drift suave)
  const trSide = $('.tr-side img');
  if (trSide) {
    gsap.fromTo(trSide,
      { opacity: 0, filter: 'blur(18px)', x: 25, y: 20 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        x: 0,
        y: 0,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.tr-side', start: 'top 88%', once: true },
        onComplete: () => gsap.set(trSide, { clearProps: 'filter' })
      }
    );
  }

  const trAlt = $('.tr-alt img');
  if (trAlt) {
    gsap.fromTo(trAlt,
      { opacity: 0, filter: 'blur(18px)', y: 35, scale: 0.97 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.tr-alt', start: 'top 86%', once: true },
        onComplete: () => gsap.set(trAlt, { clearProps: 'filter' })
      }
    );
  }

  // Variação 7: Trilho de Personalização (onda sequencial em cascata com desfoque)
  const railItems = $$('.rail-item');
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
    gsap.to('.std-portrait', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.std', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.std-detail', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '.std', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.bs-before', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.body-shop', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.bs-after', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.body-shop', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.tr-main', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.trucks', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.tr-alt', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.trucks', start: 'top bottom', end: 'bottom top', scrub: true } });

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