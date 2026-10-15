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

  /* ---------- Movimento ---------- */
  if (!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  window.__vallechMotion = true;

  // Abertura: a imagem abre como uma faixa de luz, o título sobe linha a linha e o CTA chega por último
  if (document.documentElement.classList.contains('motion')) {
    gsap.set('.hero-title .line-in', { y: 0, yPercent: 108 });
    gsap.timeline({
      defaults: { ease: 'expo.out' },
      // Ao terminar, devolve o controle ao CSS sem estados escondidos
      onComplete: () => {
        document.documentElement.classList.remove('motion');
        gsap.set('.hero-media, .hero-title .line-in, [data-hero-fade], .top', { clearProps: 'clipPath,transform,opacity' });
      },
    })
      .fromTo('.hero-media', { clipPath: 'inset(44% 0% 44% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut' })
      .fromTo('.hero-media img', { scale: 1.22 }, { scale: 1, duration: 2.6 }, 0.15)
      .to('.hero-title .line-in', { yPercent: 0, duration: 1.3, stagger: 0.12 }, 1.0)
      .to('.top', { opacity: 1, duration: 1 }, 1.3)
      .to('[data-hero-fade]', { opacity: 1, duration: 1.1, stagger: 0.12 }, 1.45);
  }

  // Títulos entram por palavra, atrás de uma máscara
  $$('[data-split]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((w) => `<span class="w" aria-hidden="true"><span class="w-in">${w}</span></span>`).join(' ');
    gsap.from(el.querySelectorAll('.w-in'), {
      yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 28, opacity: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Fotos abrem de baixo para cima, com a imagem assentando dentro do quadro
  gsap.utils.toArray('[data-clip]').forEach((fig) => {
    const img = fig.querySelector('img');
    gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 86%', once: true } })
      .fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' })
      .fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform' }, 0.1);
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    // Profundidade: a foto some devagar e o texto do hero sai antes dela
    gsap.to('.hero-media img', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-body', { yPercent: -14, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

    // Pares de imagens em velocidades diferentes
    gsap.to('.std-detail', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '.std', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.tr-alt', { yPercent: -16, ease: 'none', scrollTrigger: { trigger: '.trucks', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.bs-before', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.body-shop', start: 'top bottom', end: 'bottom top', scrub: true } });

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

  // Fechamento: a traseira se aproxima enquanto a seção entra
  gsap.fromTo('[data-ct-media] img', { scale: 1.16 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center center', scrub: true },
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
