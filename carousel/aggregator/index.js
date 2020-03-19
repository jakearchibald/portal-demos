function sizePortals() {
  const containers = document.querySelectorAll('.portal-container');
  const portals = document.querySelectorAll('.portal-container portal');
  if (containers.length === 0) return;
  // Assume all portal containers are the same size:
  const containerBounds = containers[0].getBoundingClientRect();
  const portalSizeRatio = containerBounds.width / innerWidth;

  for (const container of containers) {
    container.style.height = innerHeight * portalSizeRatio + 'px';
  }
  for (const portal of portals) {
    portal.style.transform = `scale(${portalSizeRatio})`;
    portal.style.display = 'block';
  }
}

sizePortals();
addEventListener('resize', sizePortals);

const sitesEl = document.querySelector('.sites');
const perspective = parseFloat(
  window.getComputedStyle(sitesEl.parentNode).perspective,
);
const pageDots = document.querySelector('.page-dots');

sitesEl.addEventListener('click', event => {
  const portal = event.target.closest('portal');
  if (!portal) return;
  // This involves a little layout thrashing.
  // It's possible to do it without, but maths is hard and I'm tired.
  let portalBounds = portal.getBoundingClientRect();
  const scaleNeeded = innerWidth / portalBounds.width;
  const transformNeeded = (perspective * (scaleNeeded - 1)) / scaleNeeded;
  sitesEl.style.transform = `translateZ(${transformNeeded}px)`;
  portalBounds = portal.getBoundingClientRect();
  const leftShift = -(portalBounds.left / scaleNeeded);
  const topShift = -(portalBounds.top / scaleNeeded);
  sitesEl.style.transform = '';
  const transform = `translate(${leftShift}px, ${topShift}px) translateZ(${transformNeeded}px)`;
  sitesEl.animate([{ transform: 'none' }, { transform }], {
    easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    duration: 500,
  }).onfinish = () => {
    sitesEl.style.transform = transform;
    portal.activate();
  };
});

pageDots.append(
  ...[...sitesEl.children].map(() => document.createElement('div')),
);

function selectDot(activeDot) {
  if (activeDot.classList.contains('active')) return;
  for (const dot of activeDot.parentNode.children) {
    dot.classList[dot === activeDot ? 'add' : 'remove']('active');
  }
}

function selectDots() {
  for (const [i, portalContainer] of [...sitesEl.children].entries()) {
    const bounds = portalContainer.getBoundingClientRect();
    if (bounds.left + innerWidth / 2 < 0) continue;
    selectDot(pageDots.children[i]);
    return;
  }
}

function bigCarouselMode() {
  document.documentElement.classList.add('big-carousel-mode');
  selectDots();
  sizePortals();
  sitesEl.addEventListener('scroll', selectDots);
}
