// Тема с запоминанием + корректное обновление meta theme-color под монохром
const THEME_KEY = 'site-theme';
function safeGet(k){ try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k,v){ try { localStorage.setItem(k,v); } catch {} }

function applyThemeMeta() {
  const light = '#ffffff';
  const dark  = '#0b0b0b';
  const isDark = document.body.classList.contains('dark');

  const metas = document.querySelectorAll('meta[name="theme-color"]');
  metas.forEach(m => {
    if (m.hasAttribute('media')) {
      if (m.getAttribute('media').includes('dark')) {
        m.setAttribute('content', dark);
      } else if (m.getAttribute('media').includes('light')) {
        m.setAttribute('content', light);
      }
    } else {
      m.setAttribute('content', isDark ? dark : light);
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
    // Минималистичная кнопка: символ + доступный label
    const isDark = document.body.classList.contains('dark');
    btn.textContent = '◐';
    btn.setAttribute('aria-label', isDark ? 'Светлая тема' : 'Тёмная тема');
    btn.setAttribute('title', isDark ? 'Светлая тема' : 'Тёмная тема');
  }
}

// Анимации появления
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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

  function openModal({ title, body, img, pdf }) {  
    titleEl.textContent = title || 'Информация';
    bodyEl.innerHTML = body || 'Описание отсутствует.';
    
    // Добавляем строку с иконкой и кнопкой, если есть PDF
    if (pdf) {
      // Контейнер-строка для выравнивания иконки слева от кнопки
      const row = document.createElement('div');
      row.className = 'more-row';
    
      // Иконка ℹ︎ (отдельно от кнопки)
      const infoIcon = document.createElement('span');
      infoIcon.className = 'info-icon';
      infoIcon.tabIndex = 0;
      infoIcon.setAttribute('aria-label', 'Подсказка');
      infoIcon.setAttribute(
        'data-tip',
        'Полную информацию о проекте можно получить в формате PDF. Документ включает детальное описание всех этапов работы, достигнутых результатов и потенциальных рисков.'
      );
      infoIcon.textContent = '\u2139\uFE0E'; // ℹ︎
    
      // Кнопка «Подробнее» (без иконки)
      const moreBtn = document.createElement('a');
      moreBtn.className = 'btn btn--ghost btn--more';
      moreBtn.href = pdf;
      moreBtn.setAttribute('download', '');
      moreBtn.textContent = 'Подробнее';
    
      // Сначала иконка, потом кнопка
      row.appendChild(infoIcon);
      row.appendChild(moreBtn);
    
      bodyEl.appendChild(row);
    }   
    if (img) {
      coverEl.src = img;
      coverEl.style.display = 'block';
      coverEl.alt = title ? `Обложка: ${title}` : 'Обложка';
    } else {
      coverEl.removeAttribute('src');
      coverEl.style.display = 'none';
      coverEl.alt = '';
    }
    try { modal.showModal(); } catch { modal.setAttribute('open', ''); }
    closeBtn?.focus();
  }
  
  function closeModal() {
    try { modal.close(); } catch { modal.removeAttribute('open'); }
    if (lastTriggerEl && typeof lastTriggerEl.focus === 'function') lastTriggerEl.focus();
  }

  closeBtn?.addEventListener('click', closeModal);
  okBtn?.addEventListener('click', closeModal);
  modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); });

  modal.addEventListener('click', (e) => {
    const rect = modal.getBoundingClientRect();
    const inside = (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top  && e.clientY <= rect.bottom);
    if (!inside) closeModal();
  });

  document.addEventListener('click', (e) => {
    const moreBtn = e.target.closest('.more-btn');
    if (moreBtn) {
      const card = moreBtn.closest('.card.card-clickable');
      if (card) {
        lastTriggerEl = moreBtn;
        openModal({
          title: card.getAttribute('data-modal-title'),
          body:  card.getAttribute('data-modal-body'),
          img:   card.getAttribute('data-modal-img'),
          pdf:   card.getAttribute('data-modal-pdf')
        });
      }
      return;
    }

    const isInteractive = e.target.closest('a, button, [role="button"], input, textarea, select, summary, label');
    if (isInteractive) return;

    const card = e.target.closest('.card.card-clickable');
    if (card) {
      lastTriggerEl = card;
      openModal({
        title: card.getAttribute('data-modal-title'),
        body:  card.getAttribute('data-modal-body'),
        img:   card.getAttribute('data-modal-img'),
        pdf:   card.getAttribute('data-modal-pdf')
      });
      return;
    }

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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.open) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    const targetCard = e.target.closest('.card.card-clickable');
    if (!targetCard) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      lastTriggerEl = targetCard;
      openModal({
        title: targetCard.getAttribute('data-modal-title'),
        body:  targetCard.getAttribute('data-modal-body'),
        img:   targetCard.getAttribute('data-modal-img'),
        pdf:   targetCard.getAttribute('data-modal-pdf')
      });
    }
  });
})();

// ===== МОБИЛЬНОЕ МЕНЮ =====
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.site-nav');
  
  if (!toggle || !nav) return;

  // Функция для закрытия меню
  function closeMenu() {
    nav.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // Функция для открытия меню
  function openMenu() {
    nav.classList.add('active');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  // Переключение меню по клику на гамбургер
  toggle.addEventListener('click', () => {
    const isActive = nav.classList.contains('active');
    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Закрываем меню при клике на любую ссылку в навигации
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Закрываем меню при изменении размера экрана (например, поворот устройства)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  // Закрываем меню при клике вне его области (только на мобильных)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        nav.classList.contains('active') && 
        !nav.contains(e.target) && 
        !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  // Закрываем меню по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      closeMenu();
      toggle.focus(); // Возвращаем фокус на кнопку меню
    }
  });

  // Улучшенная навигация с клавиатуры в меню
  nav.addEventListener('keydown', (e) => {
    if (!nav.classList.contains('active')) return;

    const menuItems = nav.querySelectorAll('a, button');
    const currentIndex = Array.from(menuItems).indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % menuItems.length;
      menuItems[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
      menuItems[prevIndex].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      menuItems[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      menuItems[menuItems.length - 1].focus();
    }
  });
}

// ===== УЛУЧШЕННЫЙ ФУНКЦИОНАЛ EMAIL КНОПКИ =====
function initEmailButton() {
  const copyBtn = document.querySelector('.copy-email-btn');
  const emailBtn = document.querySelector('.email-btn');
  
  if (copyBtn) {
    const email = copyBtn.getAttribute('data-email');
    
    // Добавляем email в тултип основной кнопки
    if (emailBtn && email) {
      emailBtn.setAttribute('data-email', email);
    }
    
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        // Современный способ копирования
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
          showCopyNotification(copyBtn, 'Email скопирован!');
        } else {
          // Fallback для старых браузеров
          const textArea = document.createElement('textarea');
          textArea.value = email;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            showCopyNotification(copyBtn, 'Email скопирован!');
          } else {
            showCopyNotification(copyBtn, 'Не удалось скопировать');
          }
        }
      } catch (err) {
        console.error('Ошибка копирования:', err);
        showCopyNotification(copyBtn, 'Ошибка копирования');
        
        // Fallback - показываем email в alert для ручного копирования
        setTimeout(() => {
          alert(`Скопируйте email вручную: ${email}`);
        }, 1000);
      }
    });
    
    // Добавляем визуальную обратную связь при наведении
    copyBtn.addEventListener('mouseenter', () => {
      copyBtn.style.transform = 'scale(1.05)';
    });
    
    copyBtn.addEventListener('mouseleave', () => {
      copyBtn.style.transform = '';
    });
  }
  
  // Улучшаем основную email кнопку
  if (emailBtn) {
    emailBtn.addEventListener('click', (e) => {
      // Проверяем, поддерживается ли mailto
      if (!window.location.protocol.startsWith('http')) {
        return; // В file:// протоколе mailto может не работать
      }
      
      // Добавляем аналитику клика (если нужно)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'email_click', {
          'event_category': 'contact',
          'event_label': 'email_button'
        });
      }
      
      // Добавляем визуальную обратную связь
      emailBtn.style.transform = 'translateY(1px)';
      setTimeout(() => {
        emailBtn.style.transform = '';
      }, 150);
    });
    
    // Проверка доступности mailto на загрузке
    const testMailto = () => {
      const isFileProtocol = window.location.protocol === 'file:';
      const hasMailClient = navigator.userAgent.includes('Mobile') ? 
        true : // На мобильных обычно есть почтовые клиенты
        !!(window.navigator.msSaveOrOpenBlob || window.navigator.msSaveBlob); // Примерная проверка
      
      if (isFileProtocol) {
        emailBtn.setAttribute('title', 'Email: zlatislava1395@icloud.com (откройте сайт в браузере для автоматического открытия почты)');
      }
    };
    
    testMailto();
  }
}

function showCopyNotification(button, message) {
  // Удаляем существующее уведомление если есть
  const existingNotification = button.querySelector('.copy-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Создаем новое уведомление
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');
  button.appendChild(notification);
  
  // Показываем уведомление с анимацией
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });
  
  // Добавляем звуковую обратную связь (опционально)
  if (message.includes('скопирован')) {
    // Можно добавить тихий звук успеха если нужно
    // new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuY3u/BcSUSMLPh8teEOgYZa7zs4Z9UFQ1OqeHws2YdCDOd2+7NeSsFJYLB7t2QQwwTaLXn7dSHOwkgaur05VYcB0fD5fu3XycIHXS98tm9cCQNQKDc5V4cCT+6Xc...').play().catch(()=>{}); // Пример короткого звука
  }
  
  // Скрываем через 2.5 секунды
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 2500);
  
  // Анимация кнопки копирования
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = '';
  }, 100);
}

// ===== ИНИЦИАЛИЗАЦИЯ ВСЕХ ФУНКЦИЙ =====
document.addEventListener('DOMContentLoaded', () => {
  // Инициализация переключателя темы
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Инициализация мобильного меню
  initMobileMenu();
  
  // Инициализация улучшенной email кнопки
  initEmailButton();

  // Плавная прокрутка к якорям (улучшенная для мобильных)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        // Учитываем высоту фиксированной шапки
        const headerHeight = document.querySelector('.site-header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 10; // 10px отступ
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Обновление активной ссылки в навигации при скролле
  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
    
    let current = '';
    const headerHeight = document.querySelector('.site-header').offsetHeight;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - headerHeight - 50;
      const sectionHeight = section.offsetHeight;
      
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  // Обновляем активную ссылку при скролле (с троттлингом для производительности)
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (scrollTimer !== null) {
      clearTimeout(scrollTimer);
    }
    scrollTimer = setTimeout(updateActiveNavLink, 150);
  });

  // Инициализация активной ссылки при загрузке
  updateActiveNavLink();
});

// ===== УТИЛИТЫ ДЛЯ УЛУЧШЕНИЯ UX НА МОБИЛЬНЫХ =====

// Предотвращение случайного зума при двойном тапе на iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Улучшение производительности скролла на мобильных
let ticking = false;
function updateScrollbar() {
  const scrollbar = document.querySelector('.scrollbar');
  if (scrollbar) {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercent = scrollTop / (docHeight - winHeight);
    scrollbar.style.transform = `scaleY(${scrollPercent})`;
  }
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateScrollbar);
    ticking = true;
  }
});

// Инициализация скроллбара при загрузке
document.addEventListener('DOMContentLoaded', updateScrollbar);

// ===== ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ =====

// Проверка онлайн/офлайн статуса
window.addEventListener('online', () => {
  const liveRegion = document.getElementById('live');
  if (liveRegion) {
    liveRegion.textContent = 'Соединение восстановлено';
    setTimeout(() => liveRegion.textContent = '', 3000);
  }
});

window.addEventListener('offline', () => {
  const liveRegion = document.getElementById('live');
  if (liveRegion) {
    liveRegion.textContent = 'Нет соединения с интернетом';
  }
});

// Улучшение доступности: уведомления для скрин-ридеров
function announceToScreenReader(message) {
  const liveRegion = document.getElementById('live');
  if (liveRegion) {
    liveRegion.textContent = message;
    setTimeout(() => liveRegion.textContent = '', 1000);
  }
}

// Сохранение позиции скролла при перезагрузке
window.addEventListener('beforeunload', () => {
  safeSet('scrollPosition', window.scrollY.toString());
});

window.addEventListener('load', () => {
  const savedPosition = safeGet('scrollPosition');
  if (savedPosition) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedPosition, 10));
      localStorage.removeItem('scrollPosition');
    }, 100);
  }
});
