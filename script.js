// Тема с запоминанием
const THEME_KEY = 'site-theme';
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') document.body.classList.add('dark');
  updateThemeButton();
})();
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeButton();
}
function updateThemeButton() {
  const btn = document.querySelector('.theme-toggle');
  if (btn) {
    btn.textContent = document.body.classList.contains('dark') ? '☀️ Светлая тема' : '🌙 Тёмная тема';
  }
}
// Навешиваем обработчик на кнопку темы
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});

// Анимации появления
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(() => el.classList.add('visible'), delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

// ===== Модалки для секций и карточек (с обложкой) =====
(function initModals() {
  const modal = document.getElementById('infoModal');
  const titleEl = modal.querySelector('#infoTitle');
  const bodyEl  = modal.querySelector('#infoDesc');
  const coverEl = modal.querySelector('#infoCover');
  const closeBtn = modal.querySelector('.modal-close');
  const okBtn = modal.querySelector('[data-close]');

  function openModal({ title, body, img }) {
    titleEl.textContent = title || 'Информация';
    bodyEl.innerHTML = body || 'Описание отсутствует.';
    if (img) {
      coverEl.src = img;
      coverEl.style.display = 'block';
      coverEl.alt = title ? `Обложка: ${title}` : 'Обложка';
    } else {
      coverEl.removeAttribute('src');
      coverEl.style.display = 'none';
      coverEl.alt = '';
    }
    modal.showModal();
    closeBtn.focus();
  }
  function closeModal() { modal.close(); }

  closeBtn.addEventListener('click', closeModal);
  okBtn.addEventListener('click', closeModal);

  // Клик по фону — закрыть
  modal.addEventListener('click', (e) => {
    const rect = modal.getBoundingClientRect();
    const inside = (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top  && e.clientY <= rect.bottom);
    if (!inside) closeModal();
  });

  // Делегирование кликов
  document.addEventListener('click', (e) => {
    // Кнопка "Подробнее"
    const moreBtn = e.target.closest('.more-btn');
    if (moreBtn) {
      const card = moreBtn.closest('.card.card-clickable');
      if (card) {
        openModal({
          title: card.getAttribute('data-modal-title'),
          body:  card.getAttribute('data-modal-body'),
          img:   card.getAttribute('data-modal-img')
        });
      }
      return;
    }

    // Пропускаем интерактивные элементы
    const isInteractive = e.target.closest('a, button, [role="button"], input, textarea, select, summary, label');
    if (isInteractive) return;

    // Карточка
    const card = e.target.closest('.card.card-clickable');
    if (card) {
      openModal({
        title: card.getAttribute('data-modal-title'),
        body:  card.getAttribute('data-modal-body'),
        img:   card.getAttribute('data-modal-img')
      });
      return;
    }

    // Секция
    const section = e.target.closest('section.section-clickable');
    if (section) {
      openModal({
        title: section.getAttribute('data-modal-title'),
        body:  section.getAttribute('data-modal-body'),
        img:   null
      });
    }
  });

  // ESC закрывает
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.open) closeModal();
  });
})();
