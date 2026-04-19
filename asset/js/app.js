import { initSolarSystem } from './solar-system.js';
import { works } from './works-data.js';

const holder = document.getElementById('gl-holder');
if (holder) {
  initSolarSystem(holder);
}

const worksGrid = document.getElementById('works-grid');
if (worksGrid) {
  works.forEach((work) => {
    const clickable = work.url && work.url !== '#';
    const card = document.createElement('article');
    card.className = `card${clickable ? ' clickable' : ''}`;

    const body = `
      <div class="thumb">
        ${work.thumb ? `<img src="${work.thumb}" alt="${work.title}">` : '<span style="opacity:.6">(screenshot later)</span>'}
      </div>
      <div class="body">
        <h3>${work.title}</h3>
        <div class="stack">${work.stack.map((stackItem) => `<span class="pill">${stackItem}</span>`).join(' ')}</div>
        <p style="margin:.5rem 0 0; color:var(--muted)">${work.desc || ''}</p>
      </div>
    `;

    card.innerHTML = clickable ? `<a href="${work.url}" target="_blank" rel="noopener">${body}</a>` : body;

    if (clickable) {
      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
          return;
        }

        window.open(work.url, '_blank', 'noopener');
      });
    }

    worksGrid.appendChild(card);
  });
}

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
