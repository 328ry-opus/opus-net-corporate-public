// Top page only: 3D ring mark in the hero.
document.addEventListener('DOMContentLoaded', () => {
  initHeroRing();
});

// Stack darker copies of the ring behind the front face (already in the HTML) to give it thickness.
function initHeroRing() {
  const spin = document.getElementById('heroRing');
  if (!spin) return;

  const depth = 18;
  const layers = [];
  for (let i = depth; i >= 1; i--) {
    const t = 1 - i / depth;
    const ring = `rgb(${Math.round(20 + 10 * t)},${Math.round(36 + 20 * t)},${Math.round(170 + 40 * t)})`;
    const dot = `rgb(${Math.round(24 + 10 * t)},${Math.round(120 + 20 * t)},${Math.round(190 + 20 * t)})`;
    layers.push(`<svg class="home-hero__layer" viewBox="0 0 512 512" style="--z: ${i}"><circle cx="256" cy="256" r="174" fill="none" stroke="${ring}" stroke-width="68" pathLength="1257" stroke-dasharray="1089 168" transform="rotate(70 256 256)"/><circle cx="371.5" cy="375.5" r="42" fill="${dot}"/></svg>`);
  }
  spin.insertAdjacentHTML('afterbegin', layers.join(''));
}
