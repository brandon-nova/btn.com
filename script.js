(() => {
  const grid = document.querySelector('.grid');
  const tiles = Array.from(document.querySelectorAll('.tile'));
  const defaultBackground = '#ffffff';

  function setBodyGradient(color) {
    if (!color) {
      document.body.style.background = defaultBackground;
      return;
    }
    const gradient = `linear-gradient(135deg, ${color} 0%, #ffffff 100%)`;
    document.body.style.background = gradient;
  }

  function clearHoverState() {
    grid.classList.remove('dim-others');
    tiles.forEach(t => t.classList.remove('is-hovered'));
    setBodyGradient(null);
  }

  tiles.forEach(tile => {
    const color = tile.getAttribute('data-color');

    tile.addEventListener('mouseenter', () => {
      grid.classList.add('dim-others');
      tile.classList.add('is-hovered');
      // Special handling for Finnodec: darker background + page starfield
      if (tile.classList.contains('finnodec')) {
        document.body.classList.add('page-stars');
        // darker variant of the base purple
        setBodyGradient('#1b0d2e');
      } else {
        document.body.classList.remove('page-stars');
        setBodyGradient(color);
      }
    });

    tile.addEventListener('mouseleave', () => {
      tile.classList.remove('is-hovered');
      // If no other tiles are hovered, reset
      if (!tiles.some(t => t.matches(':hover'))) {
        clearHoverState();
      }
    });

    tile.addEventListener('focus', () => {
      grid.classList.add('dim-others');
      tile.classList.add('is-hovered');
      if (tile.classList.contains('finnodec')) {
        document.body.classList.add('page-stars');
        setBodyGradient('#1b0d2e');
      } else {
        document.body.classList.remove('page-stars');
        setBodyGradient(color);
      }
    });

    tile.addEventListener('blur', () => {
      tile.classList.remove('is-hovered');
      document.body.classList.remove('page-stars');
      clearHoverState();
    });
  });

  // On touch devices, avoid sticky hover
  window.addEventListener('touchstart', () => {
    clearHoverState();
  }, { passive: true });
})();


