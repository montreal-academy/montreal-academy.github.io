document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (!body.classList.contains('page-home')) return;

  const content = document.querySelector('.content');
  if (!content) return;

  const dedupeConsecutiveImages = (root) => {
    const imgs = Array.from(root.querySelectorAll('img'));
    let prevSrc = null;
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (src && src === prevSrc) {
        const parent = img.parentElement;
        if (parent && parent.tagName === 'P') {
          parent.remove();
        } else {
          img.remove();
        }
      } else {
        prevSrc = src;
      }
    }
  };

  const blocks = Array.from(content.children);
  const imageBlocks = [];

  for (const el of blocks) {
    if (el.tagName === 'P') {
      const imgs = el.querySelectorAll('img');
      if (imgs.length === 1 && el.textContent.trim() === '') {
        imageBlocks.push(el);
        continue;
      }
    }
    break;
  }

  if (imageBlocks.length < 2) return;

  const slider = document.createElement('div');
  slider.className = 'hero-slider';

  const track = document.createElement('div');
  track.className = 'hero-slider__track';

  const slides = imageBlocks.slice(0, 3);
  slides.forEach((block) => {
    const img = block.querySelector('img');
    const slide = document.createElement('div');
    slide.className = 'hero-slider__slide';
    slide.appendChild(img);
    track.appendChild(slide);
    block.remove();
  });
  imageBlocks.slice(3).forEach((block) => block.remove());

  const prev = document.createElement('button');
  prev.className = 'hero-slider__nav hero-slider__nav--prev';
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous image');
  prev.textContent = '‹';

  const next = document.createElement('button');
  next.className = 'hero-slider__nav hero-slider__nav--next';
  next.type = 'button';
  next.setAttribute('aria-label', 'Next image');
  next.textContent = '›';

  slider.appendChild(track);
  slider.appendChild(prev);
  slider.appendChild(next);

  content.insertBefore(slider, content.firstChild);

  const scrollBySlide = (dir) => {
    const width = track.clientWidth;
    track.scrollBy({ left: dir * width, behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollBySlide(-1));
  next.addEventListener('click', () => scrollBySlide(1));

  // Split content into main and sidebar (news)
  const children = Array.from(content.children).filter((el) => el !== slider);
  const columns = document.createElement('div');
  columns.className = 'home-columns';
  const main = document.createElement('div');
  main.className = 'home-main';
  const side = document.createElement('aside');
  side.className = 'home-sidebar';
  columns.appendChild(main);
  columns.appendChild(side);
  content.appendChild(columns);

  children.forEach((el) => {
    if (el !== columns) main.appendChild(el);
  });

  const newsTitle = Array.from(main.children).find((el) => {
    const text = el.textContent.replace(/\s+/g, '');
    return text.includes('新着情報');
  });

  if (newsTitle) {
    const moved = [];
    let started = false;
    for (const el of Array.from(main.children)) {
      if (el === newsTitle) started = true;
      if (started) {
        if (el.tagName === 'H2' && el !== newsTitle) break;
        moved.push(el);
      }
    }
    moved.forEach((el) => side.appendChild(el));
  }

  // Remove standalone image blocks in main (avoid mismatched repeats)
  Array.from(main.querySelectorAll('p')).forEach((p) => {
    const imgs = p.querySelectorAll('img');
    if (imgs.length === 1 && p.textContent.trim() === '') {
      p.remove();
    }
  });

  // Link H2 titles to single-post pages when possible
  let postMap = new Map();
  const mapTag = document.getElementById('home-post-map');
  if (mapTag) {
    try {
      const data = JSON.parse(mapTag.textContent);
      data.forEach((item) => postMap.set(item.title, item.url));
    } catch (e) {
      postMap = new Map();
    }
  }
  Array.from(main.querySelectorAll('h2')).forEach((h2) => {
    const title = h2.textContent.trim();
    const url = postMap.get(title);
    if (!url) return;
    if (h2.querySelector('a')) return;
    const link = document.createElement('a');
    link.className = 'home-post-link';
    link.href = url;
    link.textContent = title;
    h2.textContent = '';
    h2.appendChild(link);
  });

  dedupeConsecutiveImages(content);
});
