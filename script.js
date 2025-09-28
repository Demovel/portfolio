// Тема с запоминанием (безопасное хранение + обновление meta theme-color)
const THEME_KEY = 'site-theme';
function safeGet(k){ try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k,v){ try { localStorage.setItem(k,v); } catch {} }
function applyThemeMeta() {
  // Обновляем текущий meta[name="theme-color"] (если он есть)
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  // metas[0] обычно для light, metas[1] для dark (в документе они заданы с media)
  metas.forEach(m => {
    if (m.hasAttribute('media')) {
      // Попробуем подставить подходящее значение в том же теге
      if (m.getAttribute('media').includes('dark')) {
        m.setAttribute('content', document.body.classList.contains('dark') ? '#1e1e1e' : '#2c3e50');
      } else if (m.getAttribute('media').includes('light')) {
        m.setAttribute('content', document.body.classList.contains('dark') ? '#1e1e1e' : '#2c3e50');
      }
    } else {
      m.setAttribute('content', document.body.classList.contains('dark') ? '#1e1e1e' : '#2c3e50');
    }
  });
}

(function initTheme() {
  const saved = safeGet(THEME_KEY);
  if (saved === 'dark') document.body.classList.add('dark');
  updateThemeButton();
  applyThemeMeta();
})();
function toggleTheme() {
  document.body.classList.toggle('dark');
  safeSet(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeButton();
  applyThemeMeta();
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
  if (!modal) return;
  const titleEl = modal.querySelector('#infoTitle');
  const bodyEl  = modal.querySelector('#infoDesc');
  const coverEl = modal.querySelector('#infoCover');
  const closeBtn = modal.querySelector('.modal-close');
  const okBtn = modal.querySelector('[data-close]');
  let lastTriggerEl = null;

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
    try {
      modal.showModal();
    } catch (err) {
      // В старых браузерах dialog может не поддерживаться — фоллбек (в простом виде)
      modal.setAttribute('open', '');
    }
    closeBtn.focus();
  }
  function closeModal() {
    try {
      modal.close();
    } catch (err) {
      modal.removeAttribute('open');
    }
    // Возвращаем фокус туда, откуда открывали
    if (lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
      lastTriggerEl.focus();
    }
  }

  closeBtn.addEventListener('click', closeModal);
  okBtn.addEventListener('click', closeModal);
  // Esc диалога (cancel) — тоже закрыть
  modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); });

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
        lastTriggerEl = moreBtn;
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
      lastTriggerEl = card;
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
      lastTriggerEl = section;
      openModal({
        title: section.getAttribute('data-modal-title'),
        body:  section.getAttribute('data-modal-body'),
        img:   null
      });
    }
  });

  // ESC закрывает (на уровне документа)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.open) closeModal();
  });

  // Клавиатурное открытие карточек (Enter/Space) — доступность
  document.addEventListener('keydown', (e) => {
    const targetCard = e.target.closest('.card.card-clickable');
    if (!targetCard) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      lastTriggerEl = targetCard;
      openModal({
        title: targetCard.getAttribute('data-modal-title'),
        body:  targetCard.getAttribute('data-modal-body'),
        img:   targetCard.getAttribute('data-modal-img')
      });
    }
  });
})();
