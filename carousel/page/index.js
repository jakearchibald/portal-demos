import PointerTracker from 'https://unpkg.com/pointer-tracker@2.2.0/dist/PointerTracker.mjs?module';

let backPortal;
let backPortalContainer;
let tracker;

addEventListener('portalactivate', event => {
  backPortal = event.adoptPredecessor();
  // In reality, I'd want to assert something about the origin of the portal here.
  backPortalContainer = document.createElement('div');
  backPortalContainer.classList.add('aggregator-portal-container');
  addEventListener('scroll', adjustDotsOnScroll);
  document.scrollingElement.style.touchAction = 'pan-y pinch-zoom';
  setupPointerTracker();
  backPortal.onclick = () => activatePortal();
  backPortalContainer.append(backPortal);
  document.body.append(backPortalContainer);
});

let backReshowTimeout;

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function setupPointerTracker() {
  if (tracker) return;
  tracker = new PointerTracker(document.scrollingElement, {
    start(_, event) {
      if (!event.pointerType || event.pointerType !== 'touch') return;
      if (tracker.startPointers.length !== 0) return;
      return true;
    },
    move() {
      const start = tracker.startPointers[0];
      const now = tracker.currentPointers[0];
      const xDiff = Math.abs(start.clientX - now.clientX);
      if (!backReshowTimeout && xDiff > 25) {
        backPortalContainer.classList.remove('hide');
        backReshowTimeout = wait(100);
      }
      if (xDiff > 50) {
        backReshowTimeout.then(() => activatePortal());
      }
    },
    end() {
      backReshowTimeout = undefined;
    },
  });
}

function activatePortal() {
  backPortal.activate();
  backPortalContainer.remove();
}

function adjustDotsOnScroll() {
  const scroller = document.scrollingElement;
  if (scroller.scrollTop > 50) {
    backPortalContainer.classList.add('hide');
  } else {
    backPortalContainer.classList.remove('hide');
  }
}
