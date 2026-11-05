import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

let lenis: Lenis | null = null;

/** Плавная прокрутка на тикере GSAP, как на смуззИИ: ScrollTrigger видит каждый кадр Lenis. */
function smooth() {
  if (reduce()) return;
  lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(500, 33);
  // Якоря ведём через Lenis, иначе он спорит с браузером
  $$<HTMLAnchorElement>('a[href*="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.hash;
      if (!id || a.pathname !== location.pathname) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis!.scrollTo(el as HTMLElement, { offset: -20 });
    });
  });
}

/** Шапка: прозрачная над первым экраном, прячется при прокрутке вниз и возвращается при прокрутке вверх. */
function header() {
  const top = $('[data-top]');
  const float = $('[data-float]');
  if (!top) return;
  const covered = new Set<Element>();
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      const y = s.scroll();
      top.classList.toggle('is-solid', y > 40);
      top.classList.toggle('is-hidden', s.direction === 1 && y > 400);
      float?.classList.toggle('is-on', y > innerHeight * 0.8 && !covered.size);
    },
  });
  // Кнопка Telegram не лежит поверх своих же кнопок: прячется, пока на экране призыв цен или контакты
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? covered.add(e.target) : covered.delete(e.target)));
    float?.classList.toggle('is-on', scrollY > innerHeight * 0.8 && !covered.size);
  });
  $$('[data-hide-float]').forEach((el) => io.observe(el));
}

/** Точка и кольцо вместо курсора; над работами кольцо растёт и подписывает действие. */
function cursor() {
  if (!fine() || reduce()) return;
  document.documentElement.classList.add('has-cursor');
  const dot = $('.cursor__dot')!, ring = $('.cursor__ring')!, label = $('.cursor__ring span')!;
  const dx = gsap.quickSetter(dot, 'x', 'px'), dy = gsap.quickSetter(dot, 'y', 'px');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as Element).closest('a, button, [data-cursor], summary, input[type=range]');
    const named = t?.getAttribute('data-cursor');
    label.textContent = named || '';
    gsap.to(ring, { scale: named ? 2.2 : t ? 1.5 : 1, backgroundColor: named ? 'rgba(35,30,27,.88)' : 'rgba(35,30,27,0)', duration: 0.35, ease: 'power3.out' });
    gsap.to(label, { opacity: named ? 1 : 0, scale: named ? 1 / 2.2 : 1, duration: 0.25 });
    gsap.to(dot, { scale: t ? 0 : 1, duration: 0.25 });
  });
}

/** Магнитные кнопки: тянутся к курсору на треть расстояния и пружинят обратно. */
function magnetic() {
  if (!fine() || reduce()) return;
  $$('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
  });
}

/** Первый экран: колода поднимается веером; на компьютере экран закрепляется, и при прокрутке веер
 *  раскладывается в ряд целиком на глазах у зрителя, только потом страница едет дальше. */
function hero() {
  const root = $('[data-hero]');
  const cards = $$('[data-hero-card]');
  if (!root) return;
  // В веере нет ни одной работы (сняли флажки в админке) — фраза первого экрана всё равно должна быть видна
  if (!cards.length) { $('[data-hero-say]')?.classList.add('hero__say--static'); return; }
  const n = cards.length, c = (n - 1) / 2;
  const w = () => cards[0].offsetWidth;
  const fan = (i: number) => ({
    rotation: (i - c) * 7,
    x: (i - c) * w() * 0.1,
    y: 0,
    zIndex: n - Math.abs(Math.round(i - c)),
  });
  cards.forEach((el, i) => gsap.set(el, fan(i)));
  if (reduce()) return;

  gsap.from(cards, { y: '+=220', x: 0, rotation: 0, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: { each: 0.08, from: 'center' }, delay: 0.15 });
  gsap.from($$('[data-hero-copy] > *'), { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.09 });

  const words = $$('.hero__w');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    const stage = $('[data-hero-stage]')!;
    const say = $('[data-hero-say]')!;
    // масштаб и шаг ряда — из одной формулы, иначе карточки наползают и режут надписи (скептик 01.11)
    const s = () => Math.min(1, (stage.offsetWidth - 120) / (n * w() * 1.12));
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top top', end: '+=210%', pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true },
    });
    tl.to({}, { duration: 0.12 }) // короткая пауза: сначала зритель видит веер
      .to($$('[data-hero-copy] > *'), { y: -70, opacity: 0, stagger: 0.03, duration: 0.45, ease: 'power2.in' }, '>')
      .to(cards, {
        x: (i) => (0.5 - 0.73) * stage.offsetWidth + (i - c) * w() * 1.12 * s(),
        // масштаб считается от точки вращения далеко под карточкой — возвращаем ряд к середине экрана
        y: (i) => { const h = w() * 4 / 3; return (i % 2 ? 22 : -22) - (1 - s()) * (1.6 * h - h / 2); },
        rotation: (i) => (i % 2 ? 1.5 : -1.5),
        scale: s,
        duration: 0.75, ease: 'power2.inOut', stagger: { each: 0.02, from: 'center' },
      }, '<0.1')
      .to({}, { duration: 0.1 })
      // ряд поднимается, а под ним проявляется фраза: движение кончается смыслом, а не пустым экраном
      .to(cards, { y: (i) => { const h = w() * 4 / 3; return (i % 2 ? 22 : -22) - (1 - s()) * (1.6 * h - h / 2) - innerHeight * 0.2; }, duration: 0.5, ease: 'power2.inOut' })
      .set(say, { opacity: 1 }, '<0.2')
      .fromTo(words, { opacity: 0.12, y: 14 }, { opacity: 1, y: 0, stagger: 0.035, duration: 0.25, ease: 'none' }, '<')
      .to({}, { duration: 0.22 }); // фраза дочитывается, пока экран не отпустит
  });
  mm.add('(max-width: 1023px)', () => {
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: '[data-hero-say]', start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
    });
  });
}

/** Работы: на компьютере лента едет вбок, пока секция закреплена, — в 2,2 раза быстрее прокрутки. */
function works() {
  const pin = $('[data-works-pin]'), track = $('[data-works-track]');
  if (!pin || !track) return;
  if (!reduce()) {
    gsap.matchMedia().add('(min-width: 1024px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      // лента едет быстрее прокрутки: закреп короче, а полоска снизу показывает, сколько осталось
      const bar = $('[data-works-progress]');
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => `+=${dist() / 2.2}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (st) => bar && gsap.set(bar, { scaleX: st.progress }),
        },
      });
    });
  }
  // Видео играют только на экране
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target as HTMLVideoElement;
    if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
  }), { threshold: 0.25 });
  $$<HTMLVideoElement>('video[data-autoplay]').forEach((v) => { v.preload = 'auto'; io.observe(v); });
  lightbox();
}

function lightbox() {
  const dlg = $<HTMLDialogElement>('[data-lb]');
  const data = JSON.parse($('[data-works-json]')?.textContent || '[]') as { img: string; video: string; title: string; niche: string }[];
  if (!dlg || !data.length) return;
  const img = $<HTMLImageElement>('[data-lb-img]', dlg)!, vid = $<HTMLVideoElement>('[data-lb-video]', dlg)!, cap = $('[data-lb-cap]', dlg)!;
  let at = 0;
  const show = (i: number) => {
    at = (i + data.length) % data.length;
    const d = data[at];
    vid.hidden = !d.video; img.hidden = !!d.video;
    if (d.video) { vid.src = d.video; vid.play().catch(() => {}); } else { vid.pause(); img.src = d.img; img.alt = d.title; }
    cap.textContent = d.title;
    if (!reduce()) gsap.fromTo([img, vid], { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' });
  };
  const open = (i: number) => { show(i); dlg.showModal(); lenis?.stop(); };
  const close = () => { dlg.close(); };
  dlg.addEventListener('close', () => { vid.pause(); lenis?.start(); });
  $$('[data-work]').forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.work))));
  $('[data-lb-close]', dlg)!.addEventListener('click', close);
  $('[data-lb-prev]', dlg)!.addEventListener('click', () => show(at - 1));
  $('[data-lb-next]', dlg)!.addEventListener('click', () => show(at + 1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  // Клавиши слушаем на всей странице: фокус уходит из окна после первого нажатия, а листать должно всегда
  document.addEventListener('keydown', (e) => {
    if (!dlg.open) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
  });
  let sx = 0;
  // Свайп листает работы, но не когда человек тянет ползунок самого видео
  dlg.addEventListener('pointerdown', (e) => { sx = (e.target as Element).closest('video') ? NaN : e.clientX; });
  dlg.addEventListener('pointerup', (e) => { const d = e.clientX - sx; if (Math.abs(d) > 50) show(at + (d < 0 ? 1 : -1)); });
}

/** До/после: ползунок, вкладки кейсов и подсказка движением при первом появлении. */
function cases() {
  const root = $('[data-cases]');
  if (!root) return;
  const set = (ba: HTMLElement, v: number) => {
    $('[data-ba-after]', ba)!.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    $('[data-ba-line]', ba)!.style.left = `${v}%`;
  };
  $$('[data-ba]', root).forEach((ba) => {
    const r = $<HTMLInputElement>('[data-ba-range]', ba)!;
    r.addEventListener('input', () => set(ba, Number(r.value)));
    set(ba, 50);
  });
  const tabs = $$('[data-case-tab]', root), arts = $$('[data-case]', root);
  tabs.forEach((t) => t.addEventListener('click', () => {
    const i = Number(t.dataset.caseTab);
    tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    arts.forEach((a) => { a.hidden = Number(a.dataset.case) !== i; });
    if (!reduce()) gsap.from(arts[i], { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out' });
    ScrollTrigger.refresh();
  }));
  if (reduce()) return;
  const first = $('[data-ba]', arts[0])!;
  ScrollTrigger.create({
    trigger: first, start: 'top 70%', once: true,
    onEnter: () => {
      const o = { v: 50 };
      gsap.timeline()
        .to(o, { v: 82, duration: 0.6, ease: 'power2.inOut', onUpdate: () => set(first, o.v) })
        .to(o, { v: 18, duration: 0.7, ease: 'power2.inOut', onUpdate: () => set(first, o.v) })
        .to(o, { v: 50, duration: 0.5, ease: 'power2.inOut', onUpdate: () => set(first, o.v) });
    },
  });
}

/** Появления: заголовки поднимаются, строки цен выезжают, фото раскрываются из центра. */
function reveals() {
  if (reduce()) return;
  $$('main h2').forEach((h) => gsap.from(h, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } }));
  $$('[data-reveal]').forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
  $$('[data-reveal-img] img').forEach((el) => gsap.fromTo(el,
    { clipPath: 'inset(18% 18% 18% 18%)', scale: 1.12 },
    { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 82%', once: true } }));
}

export function boot() {
  if (!reduce()) document.documentElement.classList.add('js-motion');
  smooth();
  header();
  cursor();
  magnetic();
  hero();
  works();
  cases();
  reveals();
  addEventListener('load', () => ScrollTrigger.refresh());
}
