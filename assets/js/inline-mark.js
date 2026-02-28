document.addEventListener('DOMContentLoaded', () => {
  const roots = Array.from(document.querySelectorAll('.content, .home-sidebar, .post-card__excerpt'));
  if (roots.length === 0) return;

  const skipTags = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'KBD', 'SAMP']);

  const replaceInlineMarks = (text) => {
    if (!text || text.indexOf('==') === -1) return null;
    const regex = /==([^=\n][\s\S]*?)==/g;
    let last = 0;
    let hasMatch = false;
    const frag = document.createDocumentFragment();
    let match;

    while ((match = regex.exec(text)) !== null) {
      hasMatch = true;
      if (match.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      const mark = document.createElement('mark');
      mark.textContent = match[1];
      frag.appendChild(mark);
      last = regex.lastIndex;
    }

    if (!hasMatch) return null;
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    return frag;
  };

  const walk = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE && skipTags.has(node.tagName)) return;

    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        const replaced = replaceInlineMarks(child.textContent);
        if (replaced) {
          child.parentNode.replaceChild(replaced, child);
        }
      } else {
        walk(child);
      }
    }
  };

  roots.forEach((root) => walk(root));
});
