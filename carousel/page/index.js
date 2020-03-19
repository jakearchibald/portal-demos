addEventListener('portalactivate', event => {
  const portal = event.adoptPredecessor();
  const div = document.createElement('div');
  div.classList.add('aggregator-portal-container');
  portal.onclick = () => {
    portal.activate();
    div.remove();
  };
  div.append(portal);
  document.body.append(div);
});
