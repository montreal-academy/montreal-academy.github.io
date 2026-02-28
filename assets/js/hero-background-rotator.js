document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (!body.classList.contains('page-home')) return;

  const hero = document.querySelector('.page-home .hero');
  if (!hero) return;

  const heroImages = [
    '/assets/images/imported/home-4c9308c481ee.jpeg',
    '/assets/images/imported/home-626e83279b38.jpg',
    '/assets/images/imported/home-f798e5ba79b5.jpg',
    '/assets/images/imported/home-9671d1edb6b7.jpg'
  ];

  if (heroImages.length === 0) return;

  heroImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  let currentIndex = 0;
  hero.style.setProperty('--home-hero-bg-image', `url("${heroImages[currentIndex]}")`);
  hero.style.setProperty('--home-hero-bg-opacity', '0.78');

  const changeIntervalMs = 8000;
  const fadeOutMs = 350;

  window.setInterval(() => {
    if (heroImages.length < 2) return;

    const nextIndex = (currentIndex + 1) % heroImages.length;
    hero.style.setProperty('--home-hero-bg-opacity', '0');

    window.setTimeout(() => {
      currentIndex = nextIndex;
      hero.style.setProperty('--home-hero-bg-image', `url("${heroImages[currentIndex]}")`);
      hero.style.setProperty('--home-hero-bg-opacity', '0.78');
    }, fadeOutMs);
  }, changeIntervalMs);
});
