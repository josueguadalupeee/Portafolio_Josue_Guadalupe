/**
 * Interactividad principal del portafolio.
 * Cada funcionalidad vive en su propia función init* para mantenerlas independientes:
 *  1. Menú responsive             5. Filtro de proyectos
 *  2. Tema día / noche            6. Modal de detalle de proyecto
 *  3. Pausa de animaciones        7. Validación del formulario de contacto
 *  4. Navegación activa y         8. Botón volver arriba
 *     animaciones al hacer scroll 9. Valores de color en vivo (Design System)
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* localStorage puede fallar (modo privado, cookies bloqueadas): se envuelve siempre */
  const storage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        /* Sin persistencia: la preferencia dura solo esta visita */
      }
    },
  };

  const isMotionPaused = () =>
    root.dataset.motion === 'off' || (!root.dataset.motion && reducedMotionQuery.matches);

  /* ---------- 1. Menú responsive ---------- */
  function initMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
    };
    const isOpen = () => nav.classList.contains('is-open');

    toggle.addEventListener('click', () => setOpen(!isOpen()));

    // Cerrar al elegir un enlace, al pulsar Escape o al hacer clic fuera
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (isOpen() && !nav.contains(event.target) && !toggle.contains(event.target)) {
        setOpen(false);
      }
    });

    // Al pasar a escritorio el menú se muestra siempre: reiniciar estado
    window.matchMedia('(min-width: 70em)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  /* ---------- 2. Tema día / noche (persistido en localStorage) ---------- */
  function initTheme() {
    const button = document.querySelector('.theme-toggle');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!button) return;

    const sync = () => {
      const isDark = root.dataset.theme === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      if (metaTheme) metaTheme.content = isDark ? '#14111f' : '#f3e3bf';
      updateTokenValues();
    };

    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      storage.set('portfolio-theme', next);
      sync();
    });

    sync();
  }

  /* ---------- 3. Pausar / reanudar animaciones (persistido) ---------- */
  function initMotion() {
    const button = document.querySelector('.motion-toggle');
    if (!button) return;

    const sync = () => button.setAttribute('aria-pressed', String(isMotionPaused()));

    button.addEventListener('click', () => {
      const next = isMotionPaused() ? 'on' : 'off';
      root.dataset.motion = next;
      storage.set('portfolio-motion', next);
      sync();
    });

    reducedMotionQuery.addEventListener('change', sync);
    sync();
  }

  /* ---------- 4a. Navegación activa según la sección visible ---------- */
  function initScrollSpy() {
    const links = [...document.querySelectorAll('.site-nav .nav__link')];
    const sections = document.querySelectorAll('main > section[id]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const linkById = new Map(links.map((link) => [link.hash.slice(1), link]));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const active = linkById.get(entry.target.id);
          if (!active) return;
          links.forEach((link) => link.removeAttribute('aria-current'));
          active.setAttribute('aria-current', 'true');
        });
      },
      // Una sección es "activa" cuando cruza la franja central de la pantalla
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ---------- 4b. Aparición de elementos al hacer scroll ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');

    // Al terminar se quitan las clases para no interferir con los :hover de los componentes
    const finish = (element) => {
      element.classList.add('is-visible');
      window.setTimeout(() => element.classList.remove('reveal', 'is-visible'), 800);
    };

    if (!('IntersectionObserver' in window)) {
      items.forEach(finish);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            finish(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    items.forEach((item) => observer.observe(item));
  }

  /* ---------- 5. Filtro de proyectos por tecnología ---------- */
  function initProjectFilter() {
    const buttons = document.querySelectorAll('#proyectos [data-filter]');
    const cards = document.querySelectorAll('#proyectos .project-card');
    const emptyMessage = document.querySelector('.projects-empty');
    const status = document.getElementById('filter-status');

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        let visibleCount = 0;

        buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));

        cards.forEach((card) => {
          const techs = card.dataset.tech.split(' ');
          const matches = filter === 'all' || techs.includes(filter);
          card.hidden = !matches;
          if (matches) visibleCount += 1;
        });

        if (emptyMessage) emptyMessage.hidden = visibleCount > 0;
        if (status) {
          status.textContent = `${visibleCount} ${visibleCount === 1 ? 'proyecto mostrado' : 'proyectos mostrados'}`;
        }
      });
    });
  }

  /* ---------- 6. Modal con el detalle de cada proyecto ---------- */
  function initProjectModal() {
    const modal = document.getElementById('project-modal');
    if (!modal || typeof modal.showModal !== 'function') return;

    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    let lastTrigger = null;

    const fillModal = (card) => {
      title.textContent = card.querySelector('.project-card__title').textContent;
      body.replaceChildren();

      const image = card.querySelector('.project-card__media img').cloneNode();
      image.removeAttribute('loading');
      body.append(image);

      card.querySelectorAll('.project-card__text, .badge-list').forEach((element) => {
        body.append(element.cloneNode(true));
      });

      const details = card.querySelector('.project-card__details');
      if (details) {
        const detailsClone = details.cloneNode(true);
        detailsClone.hidden = false;
        body.append(detailsClone);
      }

      const actions = card.querySelector('.project-card__actions').cloneNode(true);
      actions.querySelector('[data-project-open]')?.remove();
      if (actions.children.length) body.append(actions);
    };

    document.querySelectorAll('[data-project-open]').forEach((button) => {
      button.addEventListener('click', () => {
        lastTrigger = button;
        fillModal(button.closest('.project-card'));
        modal.showModal();
      });
    });

    // Cerrar con el botón o haciendo clic en el fondo oscuro (Escape funciona de forma nativa)
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('[data-modal-close]')) {
        modal.close();
      }
    });

    modal.addEventListener('close', () => lastTrigger?.focus());
  }

  /* ---------- 7. Validación del formulario de contacto ---------- */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const status = document.getElementById('form-status');
    const counter = document.getElementById('message-count');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // Cada regla devuelve true o el mensaje de error
    const rules = {
      name: (value) => value.trim().length >= 3 || 'Escribe tu nombre (mínimo 3 caracteres).',
      email: (value) => emailPattern.test(value.trim()) || 'Ingresa un correo válido, por ejemplo nombre@dominio.com.',
      subject: (value) => value !== '' || 'Selecciona el motivo de tu mensaje.',
      message: (value) =>
        value.trim().length >= 20 || `El mensaje necesita al menos 20 caracteres (llevas ${value.trim().length}).`,
    };

    const fields = Object.keys(rules).map((name) => form.elements[name]);

    const validate = (field) => {
      const result = rules[field.name](field.value);
      const isValid = result === true;
      field.setAttribute('aria-invalid', String(!isValid));
      document.getElementById(`${field.name}-error`).textContent = isValid ? '' : result;
      return isValid;
    };

    const setStatus = (message, type) => {
      status.className = `alert alert--${type}`;
      status.textContent = message;
    };

    fields.forEach((field) => {
      field.addEventListener('blur', () => {
        if (field.value) validate(field);
      });
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validate(field);
      });
    });

    form.elements.message.addEventListener('input', (event) => {
      counter.textContent = event.target.value.length;
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const firstInvalid = fields.filter((field) => !validate(field))[0];
      if (firstInvalid) {
        setStatus('Revisa los campos marcados antes de enviar.', 'error');
        firstInvalid.focus();
        return;
      }

      // Sitio estático (GitHub Pages): el mensaje se entrega a través del cliente de correo
      const data = new FormData(form);
      const subject = `[Portafolio] ${data.get('subject')} - ${data.get('name')}`;
      const body = `${data.get('message')}\n\n— ${data.get('name')} (${data.get('email')})`;
      const mailto = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      setStatus('¡Tu cuervo ha partido! Se abrirá tu aplicación de correo con el mensaje listo para enviar.', 'success');
      window.location.href = mailto;

      form.reset();
      counter.textContent = '0';
      fields.forEach((field) => field.removeAttribute('aria-invalid'));
    });
  }

  /* ---------- 8. Botón volver arriba ---------- */
  function initBackToTop() {
    const button = document.querySelector('.back-to-top');
    if (!button) return;

    const onScroll = () => {
      button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: isMotionPaused() ? 'auto' : 'smooth' });
      document.querySelector('.brand')?.focus({ preventScroll: true });
    });
  }

  /* ---------- 9. Design System: muestra el valor real de cada token ---------- */
  function updateTokenValues() {
    const styles = getComputedStyle(root);
    document.querySelectorAll('[data-token]').forEach((element) => {
      const value = styles.getPropertyValue(element.dataset.token).trim();
      if (value) element.textContent = value;
    });
  }

  function initYear() {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  }

  initMenu();
  initTheme();
  initMotion();
  initScrollSpy();
  initReveal();
  initProjectFilter();
  initProjectModal();
  initContactForm();
  initBackToTop();
  initYear();
})();
