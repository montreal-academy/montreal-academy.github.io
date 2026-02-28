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

  const removeImageOnlyParagraphs = (root) => {
    Array.from(root.querySelectorAll('p')).forEach((p) => {
      if (p.children.length === 1 && p.firstElementChild?.tagName === 'IMG' && p.textContent.trim() === '') {
        p.remove();
      }
    });
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

  let slider = null;
  // Remove the top image-only blocks; no center slider section on homepage.
  if (imageBlocks.length > 0) {
    imageBlocks.forEach((block) => block.remove());
  }

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

  const normalizeDateText = (text) =>
    text
      .replace(/==/g, '')
      .replace(/\s+/g, '')
      .trim();

  const isNewsDate = (text) => /^\d{4}年\d{1,2}月\d{1,2}日$/.test(normalizeDateText(text));

  const formatHomeNews = (root) => {
    if (!root || root.children.length === 0) return;

    const childrenNow = Array.from(root.children);
    const titleNode = childrenNow.find((el) => el.textContent.replace(/\s+/g, '').includes('新着情報'));
    if (!titleNode) return;

    const heading = document.createElement('h2');
    heading.className = 'home-news-title';
    heading.textContent = '新着情報';
    titleNode.replaceWith(heading);

    const nodes = Array.from(root.children).filter((el) => el !== heading);
    if (nodes.length === 0) return;

    const list = document.createElement('div');
    list.className = 'home-news-list';
    root.appendChild(list);

    let current = null;
    nodes.forEach((node) => {
      const text = node.textContent.trim();
      if (!text) {
        node.remove();
        return;
      }

      if (isNewsDate(text)) {
        current = document.createElement('article');
        current.className = 'home-news-item';

        const date = document.createElement('p');
        date.className = 'home-news-date';
        date.textContent = normalizeDateText(text);
        current.appendChild(date);

        list.appendChild(current);
        node.remove();
        return;
      }

      if (!current) {
        current = document.createElement('article');
        current.className = 'home-news-item';
        list.appendChild(current);
      }

      const body = document.createElement('p');
      body.className = 'home-news-body';
      body.innerHTML = node.innerHTML;
      current.appendChild(body);
      node.remove();
    });
  };

  formatHomeNews(side);

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

  // Build card grid from image + heading blocks in home main area.
  const childrenForCards = Array.from(main.children);
  const cardModels = [];
  const nodesToRemove = new Set();

  for (let i = 0; i < childrenForCards.length; i += 1) {
    const first = childrenForCards[i];
    if (!first || first.tagName !== 'P') continue;
    const firstImg = first.querySelector('img');
    if (!firstImg || first.textContent.trim() !== '') continue;

    let heading = null;
    let headingIndex = -1;
    for (let j = i + 1; j < Math.min(i + 5, childrenForCards.length); j += 1) {
      const next = childrenForCards[j];
      if (!next) continue;
      if (next.tagName === 'H2') {
        heading = next;
        headingIndex = j;
        break;
      }
      if (next.tagName !== 'P') break;
    }

    if (!heading) continue;
    const title = heading.textContent.trim();
    const url = postMap.get(title);
    cardModels.push({
      title,
      url: url || null,
      imgSrc: firstImg.getAttribute('src') || '',
      imgAlt: firstImg.getAttribute('alt') || title
    });

    nodesToRemove.add(first);
    for (let j = i + 1; j < headingIndex; j += 1) {
      const next = childrenForCards[j];
      if (next && next.tagName === 'P' && next.querySelector('img') && next.textContent.trim() === '') {
        nodesToRemove.add(next);
      }
    }
    nodesToRemove.add(heading);
    i = headingIndex;
  }

  if (cardModels.length > 0) {
    const heading = document.createElement('h2');
    heading.className = 'home-featured-title';
    heading.textContent = 'Featured Articles';
    const grid = document.createElement('div');
    grid.className = 'home-blog-grid';

    cardModels.forEach((model) => {
      const card = document.createElement(model.url ? 'a' : 'article');
      card.className = 'home-blog-card';
      if (model.url) card.href = model.url;

      const img = document.createElement('img');
      img.src = model.imgSrc;
      img.alt = model.imgAlt;

      const title = document.createElement('h3');
      title.textContent = model.title;

      card.appendChild(img);
      card.appendChild(title);
      grid.appendChild(card);
    });

    nodesToRemove.forEach((node) => node.remove());
    main.appendChild(heading);
    main.appendChild(grid);
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

  removeImageOnlyParagraphs(main);
  removeImageOnlyParagraphs(side);
  dedupeConsecutiveImages(content);
});
