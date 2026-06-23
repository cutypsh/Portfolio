const root = document.documentElement;
const body = document.body;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Theme */
const themeToggle = document.getElementById('theme-toggle');
const themeKey = 'portfolio-theme';

function readStoredTheme() {
  try {
    return localStorage.getItem(themeKey);
  } catch {
    return null;
  }
}

function setTheme(theme, persist = false) {
  if (theme === 'cool') {
    root.dataset.theme = 'cool';
  } else {
    delete root.dataset.theme;
  }

  const isCool = theme === 'cool';
  themeToggle?.setAttribute('aria-label', isCool ? '기본 색상 테마로 전환' : '쿨 색상 테마로 전환');
  themeToggle?.setAttribute('title', isCool ? '기본 테마' : '쿨 테마');

  if (persist) {
    try {
      localStorage.setItem(themeKey, isCool ? 'cool' : 'warm');
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }
}

setTheme(readStoredTheme() === 'cool' ? 'cool' : 'warm');

themeToggle?.addEventListener('click', () => {
  const nextTheme = root.dataset.theme === 'cool' ? 'warm' : 'cool';
  setTheme(nextTheme, true);
});

/* Mobile navigation */
const menuToggle = document.getElementById('menu-toggle');
const navLinksPanel = document.getElementById('nav-links');

function closeMenu() {
  body.classList.remove('nav-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', '메뉴 열기');
}

function toggleMenu() {
  const willOpen = !body.classList.contains('nav-open');
  body.classList.toggle('nav-open', willOpen);
  menuToggle?.setAttribute('aria-expanded', String(willOpen));
  menuToggle?.setAttribute('aria-label', willOpen ? '메뉴 닫기' : '메뉴 열기');
}

menuToggle?.addEventListener('click', toggleMenu);
navLinksPanel?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('click', (event) => {
  if (!body.classList.contains('nav-open')) return;
  if (event.target.closest('.nav-actions')) return;
  closeMenu();
});

/* Scroll progress and floating controls */
const progress = document.getElementById('progress');
const backToTop = document.getElementById('back-to-top');
let progressFrame = 0;

function updateScrollUI() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const value = height > 0 ? (scrollTop / height) * 100 : 0;

  if (progress) progress.style.width = value + '%';
  backToTop?.classList.toggle('is-visible', scrollTop > 720);
  progressFrame = 0;
}

document.addEventListener('scroll', () => {
  if (!progressFrame) progressFrame = requestAnimationFrame(updateScrollUI);
}, { passive: true });

backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
});
updateScrollUI();

/* Hero phrase rotation */
const heroPhrase = document.getElementById('hero-phrase');
const heroPhrases = [
  '사업의 가능성을',
  '흩어진 정보를',
  '복잡한 숫자를',
  '기술의 가치를',
];
let heroPhraseIndex = 0;
let heroPhraseTimer = 0;

function rotateHeroPhrase() {
  if (!heroPhrase || reducedMotion || document.hidden) return;
  heroPhrase.classList.add('is-changing');

  window.setTimeout(() => {
    heroPhraseIndex = (heroPhraseIndex + 1) % heroPhrases.length;
    heroPhrase.textContent = heroPhrases[heroPhraseIndex];
    heroPhrase.classList.remove('is-changing');
  }, 280);
}

function startHeroRotation() {
  if (!heroPhrase || reducedMotion || heroPhraseTimer) return;
  heroPhraseTimer = window.setInterval(rotateHeroPhrase, 3200);
}

function stopHeroRotation() {
  window.clearInterval(heroPhraseTimer);
  heroPhraseTimer = 0;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopHeroRotation();
  else startHeroRotation();
});
startHeroRotation();

/* Numeric counters */
const counters = [...document.querySelectorAll('.count-up')];

function animateCounter(element) {
  if (element.dataset.counted === 'true') return;
  element.dataset.counted = 'true';

  const target = Number(element.dataset.count || 0);
  const suffix = element.dataset.suffix || '';
  const duration = reducedMotion ? 0 : 900;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const ratio = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - ratio, 3);
    element.textContent = Math.round(target * eased) + suffix;

    if (ratio < 1) {
      requestAnimationFrame(tick);
    } else {
      element.classList.add('is-counted');
    }
  }

  requestAnimationFrame(tick);
}

if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.65 });

  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach(animateCounter);
}

/* Project filtering */
const filterButtons = [...document.querySelectorAll('.filter-button')];
const projectCards = [...document.querySelectorAll('.project[data-category]')];
const filterStatus = document.getElementById('filter-status');

function filterProjects(filter) {
  let visibleCount = 0;

  projectCards.forEach((card) => {
    const categories = card.dataset.category.split(/\s+/);
    const matches = filter === 'all' || categories.includes(filter);
    card.hidden = !matches;

    if (matches) {
      visibleCount += 1;
      card.classList.remove('filter-enter');
      void card.offsetWidth;
      card.classList.add('filter-enter');
      window.setTimeout(() => card.classList.remove('filter-enter'), 380);
    } else {
      card.querySelectorAll('.project-evidence[open]').forEach((details) => {
        details.open = false;
      });
    }
  });

  if (filterStatus) {
    filterStatus.textContent = `${visibleCount}건`;
  }
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });

    filterProjects(button.dataset.filter);
  });
});

/* Evidence accordion */
const evidenceGroups = [...document.querySelectorAll('.project-evidence')];

evidenceGroups.forEach((group) => {
  const items = [...group.querySelectorAll('.media-button')];
  const count = items.length;
  const summaryCount = group.querySelector('.sample-count');
  const grid = group.querySelector('.evidence-grid');
  const content = group.querySelector('.evidence-content');

  if (summaryCount) summaryCount.textContent = `${count}개 보기`;

  if (grid && content) {
    const tools = document.createElement('div');
    tools.className = 'evidence-rail-tools';
    tools.innerHTML = `
      <span class="evidence-rail-label">${count}개 산출물</span>
      <span class="evidence-rail-actions">
        <button class="evidence-rail-button prev" type="button" aria-label="이전 산출물">‹</button>
        <button class="evidence-rail-button next" type="button" aria-label="다음 산출물">›</button>
      </span>`;
    content.insertBefore(tools, grid);

    const prev = tools.querySelector('.prev');
    const next = tools.querySelector('.next');

    const updateRailState = () => {
      const maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth);
      prev.disabled = grid.scrollLeft <= 4;
      next.disabled = grid.scrollLeft >= maxScroll - 4;
    };

    const moveRail = (direction) => {
      grid.scrollBy({
        left: direction * grid.clientWidth * 0.82,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    };

    prev.addEventListener('click', () => moveRail(-1));
    next.addEventListener('click', () => moveRail(1));
    grid.addEventListener('scroll', updateRailState, { passive: true });

    if ('ResizeObserver' in window) {
      new ResizeObserver(updateRailState).observe(grid);
    }

    requestAnimationFrame(updateRailState);
  }

  group.addEventListener('toggle', () => {
    if (!group.open) return;
    evidenceGroups.forEach((other) => {
      if (other !== group) other.open = false;
    });

    const grid = group.querySelector('.evidence-grid');
    if (grid) requestAnimationFrame(() => grid.dispatchEvent(new Event('scroll')));
  });
});

/* Media lightbox */
const lightbox = document.getElementById('proof-lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

let activeItems = [];
let activeIndex = 0;

function renderLightbox(index) {
  if (!activeItems.length) return;
  activeIndex = (index + activeItems.length) % activeItems.length;
  const item = activeItems[activeIndex];
  const title = item.dataset.title;

  lightboxImage.src = item.dataset.image;
  lightboxImage.alt = title + ' 크게 보기';
  lightboxTitle.textContent = title;
  lightboxCounter.textContent = `${activeIndex + 1} / ${activeItems.length}`;

  const multiple = activeItems.length > 1;
  lightboxPrev.hidden = !multiple;
  lightboxNext.hidden = !multiple;
}

function openLightbox(button) {
  const group = button.closest('.project-evidence');
  activeItems = [...group.querySelectorAll('.media-button')];
  activeIndex = activeItems.indexOf(button);
  renderLightbox(activeIndex);

  if (typeof lightbox.showModal === 'function') {
    lightbox.showModal();
  } else {
    lightbox.setAttribute('open', '');
  }
}

document.querySelectorAll('.media-button').forEach((button) => {
  button.addEventListener('click', () => openLightbox(button));
});

lightboxPrev?.addEventListener('click', () => renderLightbox(activeIndex - 1));
lightboxNext?.addEventListener('click', () => renderLightbox(activeIndex + 1));
lightboxClose?.addEventListener('click', () => lightbox.close());

lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

/* Scroll reveal */
const revealTargets = [...document.querySelectorAll('.section-head, .card, .project, .skillbox, .matrix-row')];
root.classList.add('reveal-ready');

revealTargets.forEach((target, index) => {
  target.classList.add('reveal-target');
  target.style.setProperty('--reveal-delay', `${(index % 4) * 55}ms`);
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px' });

  revealTargets.forEach((target) => {
    const rect = target.getBoundingClientRect();
    const initiallyVisible = rect.top < window.innerHeight * 1.05 && rect.bottom > 0;

    if (initiallyVisible) {
      target.classList.add('is-visible');
    } else {
      revealObserver.observe(target);
    }
  });
} else {
  revealTargets.forEach((target) => target.classList.add('is-visible'));
}

/* Active navigation */
const navLinks = [...document.querySelectorAll('.links a[href^="#"]')];
const sectionMap = new Map(
  navLinks
    .map((link) => [document.querySelector(link.getAttribute('href')), link])
    .filter(([section]) => section)
);

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach((link) => {
      const active = sectionMap.get(visible.target) === link;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-22% 0px -62%', threshold: [0, 0.2, 0.5] });

  sectionMap.forEach((link, section) => navObserver.observe(section));
}

/* Pointer-responsive surfaces */
if (finePointer && !reducedMotion) {
  const tiltSurfaces = [...document.querySelectorAll('.hero-card, .website-preview, .evidence-item')];

  tiltSurfaces.forEach((surface) => {
    surface.classList.add('tilt-surface');
    let tiltFrame = 0;

    surface.addEventListener('pointermove', (event) => {
      if (tiltFrame) return;

      tiltFrame = requestAnimationFrame(() => {
        const rect = surface.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        surface.style.setProperty('--tilt-x', `${(-y * 2.4).toFixed(2)}deg`);
        surface.style.setProperty('--tilt-y', `${(x * 2.4).toFixed(2)}deg`);
        surface.style.setProperty('--tilt-lift', '-2px');
        surface.classList.add('is-tilting');
        tiltFrame = 0;
      });
    });

    surface.addEventListener('pointerleave', () => {
      surface.style.setProperty('--tilt-x', '0deg');
      surface.style.setProperty('--tilt-y', '0deg');
      surface.style.setProperty('--tilt-lift', '0px');
      surface.classList.remove('is-tilting');
    });
  });
}

/* Keyboard conveniences */
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();

  if (lightbox?.open) {
    if (event.key === 'ArrowLeft') renderLightbox(activeIndex - 1);
    if (event.key === 'ArrowRight') renderLightbox(activeIndex + 1);
    return;
  }

  if (event.key.toLowerCase() === 't' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    themeToggle?.click();
  }
});

root.dataset.js = 'ready';
