document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('page-start-living')) return;

  const content = document.querySelector('.content');
  if (!content) return;

  const sectionTitles = new Set([
    'SIN (Social Insurance Number) 申請',
    'Health insurance 申請',
    '在留届、運転免許',
    'Work permitの申請、更新',
    '銀行口座開設',
    '賃貸物件の探し方（現地での生活スタートアップサービスは こちら ）',
    '部屋のサイズ表記',
    '設備',
    '不審な家主',
    '契約書',
    '個人情報漏洩',
    '契約期間',
    '支払い',
    '契約時期・引っ越し'
  ]);

  const children = Array.from(content.children);
  const mainTitle = children.find((el) => el.tagName === 'H2');
  if (!mainTitle) return;

  // Convert known subtitle paragraphs to h3 for better hierarchy.
  Array.from(content.querySelectorAll('p')).forEach((p) => {
    const text = p.textContent.trim();
    if (sectionTitles.has(text)) {
      const h3 = document.createElement('h3');
      h3.className = 'living-subtitle';
      h3.textContent = text;
      p.replaceWith(h3);
      return;
    }

    // Turn standalone URL lines into clickable links.
    if (/^https?:\/\/\S+$/i.test(text)) {
      const a = document.createElement('a');
      a.href = text;
      a.textContent = text;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      const wrap = document.createElement('p');
      wrap.className = 'living-linkline';
      wrap.appendChild(a);
      p.replaceWith(wrap);
    }
  });

  const nodesAfterTitle = [];
  let foundTitle = false;
  Array.from(content.children).forEach((el) => {
    if (el === mainTitle) {
      foundTitle = true;
      return;
    }
    if (foundTitle) nodesAfterTitle.push(el);
  });

  nodesAfterTitle.forEach((n) => n.remove());

  const intro = document.createElement('div');
  intro.className = 'living-intro';
  const sections = document.createElement('div');
  sections.className = 'living-sections';

  let currentSection = null;
  nodesAfterTitle.forEach((node) => {
    if (node.tagName === 'H3' && node.classList.contains('living-subtitle')) {
      currentSection = document.createElement('article');
      currentSection.className = 'living-section';
      const idx = sections.children.length + 1;
      currentSection.id = `living-sec-${idx}`;
      currentSection.appendChild(node);
      sections.appendChild(currentSection);
      return;
    }

    if (currentSection) {
      currentSection.appendChild(node);
    } else {
      intro.appendChild(node);
    }
  });

  if (intro.children.length > 0) {
    mainTitle.insertAdjacentElement('afterend', intro);
  }

  if (sections.children.length > 0) {
    const toc = document.createElement('nav');
    toc.className = 'living-toc';
    const tocTitle = document.createElement('p');
    tocTitle.className = 'living-toc__title';
    tocTitle.textContent = '目次';
    toc.appendChild(tocTitle);

    const ul = document.createElement('ul');
    Array.from(sections.children).forEach((section) => {
      const h3 = section.querySelector('h3');
      if (!h3) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${section.id}`;
      a.textContent = h3.textContent;
      li.appendChild(a);
      ul.appendChild(li);
    });
    toc.appendChild(ul);

    if (intro.children.length > 0) {
      intro.insertAdjacentElement('afterend', toc);
    } else {
      mainTitle.insertAdjacentElement('afterend', toc);
    }
    toc.insertAdjacentElement('afterend', sections);
  }
});
