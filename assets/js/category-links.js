document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (!body.classList.contains('page-news-category')) return;

  const mapTag = document.getElementById('home-post-map');
  if (!mapTag) return;

  let postMap = new Map();
  try {
    const data = JSON.parse(mapTag.textContent);
    data.forEach((item) => postMap.set(item.title, item.url));
  } catch (e) {
    return;
  }

  document.querySelectorAll('.content h2').forEach((h2) => {
    const title = h2.textContent.trim();
    const url = postMap.get(title);
    if (!url) return;
    if (h2.querySelector('a')) return;
    const link = document.createElement('a');
    link.href = url;
    link.textContent = title;
    link.className = 'home-post-link';
    h2.textContent = '';
    h2.appendChild(link);
  });
});
