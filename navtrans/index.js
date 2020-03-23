const form = document.querySelector('.option-form');
const main = document.querySelector('main');

form.preload.oninput = () => {
  if (form.preload.checked) {
    for (const link of document.querySelectorAll('a[href]')) {
      getTransitionPortal(link.href);
    }
  } else {
    for (const portal of preloadedPortals.values()) portal.remove();
    preloadedPortals.clear();
  }
};

function getTransitionPortal(url) {
  const preloadedPortal = preloadedPortals.get(url);
  if (preloadedPortal) return preloadedPortal;
  const portal = document.createElement('portal');
  portal.classList.add('transition-portal', 'hidden');
  portal.src = url;
  loadPromises.set(
    portal,
    new Promise((r) => portal.addEventListener('load', () => r())),
  );
  document.body.append(portal);
  preloadedPortals.set(url, portal);
  return portal;
}

const preloadedPortals = new Map();
const loadPromises = new WeakMap();

addEventListener('click', async (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  event.preventDefault();

  document.documentElement.style.pointerEvents = 'none';

  const portal = getTransitionPortal(link.href);

  portal.classList.remove('hidden');

  if (form.waitForOnload.checked) {
    await loadPromises.get(portal);
  }

  if (form.animateNav.checked) {
    await Promise.all(
      [main, portal].map(
        (el) =>
          new Promise((resolve) => {
            el.animate(
              [{ transform: 'none' }, { transform: 'translateX(-100vw)' }],
              {
                duration: form.duration.valueAsNumber,
                easing: 'ease-out',
                fill: 'forwards',
              },
            ).onfinish = resolve;
          }),
      ),
    );
  }

  portal.activate();
});
