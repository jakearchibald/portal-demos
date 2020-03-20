const sitesEl = document.querySelector('.sites');
const perspective = parseFloat(
  window.getComputedStyle(sitesEl.parentNode).perspective,
);
const pageDots = document.querySelector('.page-dots');

function sizePortals() {
  if (sitesEl.style.transform) return;
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

function getFullscreenTransformForPortal(portal) {
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
  return `translate(${leftShift}px, ${topShift}px) translateZ(${transformNeeded}px)`;
}

const noPortalReplace = new URL(location.href).searchParams.has(
  'no-portal-replace',
);
let lastActivatedPortal;
let bigCarouselMode = false;

addEventListener('portalactivate', event => {
  const portal = event.adoptPredecessor();
  // In reality, I'd want to assert something about the origin of the portal here.
  if (!noPortalReplace) {
    portal.style.cssText = lastActivatedPortal.style.cssText;
    lastActivatedPortal.replaceWith(portal);
  }
  sitesEl.animate(
    [{ transform: sitesEl.style.transform }, { transform: 'none' }],
    {
      easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      duration: 1000,
    },
  ).onfinish = () => {
    sitesEl.style.transform = '';
  };
});

// Prevent clicks while transitioning
let clickInProgress = false;

sitesEl.addEventListener('click', event => {
  const portal = event.target.closest('portal');
  if (!portal || clickInProgress) return;
  clickInProgress = true;
  // Stop any scroll intertia
  sitesEl.scrollLeft = sitesEl.scrollLeft;
  const transform = getFullscreenTransformForPortal(portal);

  // Show dots
  if (!bigCarouselMode) {
    const portalContainer = portal.parentNode;
    selectDot([...sitesEl.children].indexOf(portalContainer));
    pageDots.classList.add('active');
    pageDots.animate(
      [{ transform: 'translateY(calc(-100% - 20px))' }, { transform: 'none' }],
      {
        easing: 'ease-out',
        delay: 200,
        duration: 200,
        fill: 'backwards',
      },
    );
  }

  // Animate scroller
  sitesEl.animate([{ transform: 'none' }, { transform }], {
    easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    duration: bigCarouselMode ? 100 : 500,
  }).onfinish = () => {
    sitesEl.style.transform = transform;
    lastActivatedPortal = portal;
    portal.activate().then(() => {
      sitesEl.style.transform = '';
      activateBigCarouselMode();
      portal.scrollIntoView();
      sitesEl.style.transform = getFullscreenTransformForPortal(portal);
      clickInProgress = false;
    });
  };
});

pageDots.append(
  ...[...sitesEl.children].map(() => document.createElement('div')),
);

function selectDot(index) {
  const activeDot = pageDots.children[index];
  if (activeDot.classList.contains('active')) return;
  for (const dot of activeDot.parentNode.children) {
    dot.classList[dot === activeDot ? 'add' : 'remove']('active');
  }
}

function selectDots() {
  for (const [i, portalContainer] of [...sitesEl.children].entries()) {
    const bounds = portalContainer.getBoundingClientRect();
    if (bounds.left + innerWidth / 2 < 0) continue;
    selectDot(i);
    return;
  }
}

function activateBigCarouselMode() {
  bigCarouselMode = true;
  document.documentElement.classList.add('big-carousel-mode');
  sitesEl.style.transform = '';
  selectDots();
  sizePortals();
  sitesEl.addEventListener('scroll', selectDots);
}
