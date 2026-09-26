/**
 * Sección "Mis repositorios en GitHub".
 * Consulta la API pública de GitHub (sin token, límite de 60 peticiones/hora)
 * y guarda la respuesta 15 minutos en sessionStorage para no agotar ese límite.
 * El usuario se configura en el atributo data-github-user de <section id="github">.
 */
(() => {
  'use strict';

  const section = document.getElementById('github');
  if (!section) return;

  const user = (section.dataset.githubUser || '').trim();
  const PAGE_SIZE = 6;
  const CACHE_KEY = `gh-cache-v2-${user.toLowerCase()}`;
  const CACHE_TTL = 15 * 60 * 1000;

  const els = {
    profile: document.getElementById('gh-profile'),
    avatar: document.getElementById('gh-avatar'),
    name: document.getElementById('gh-name'),
    stats: document.getElementById('gh-stats'),
    link: document.getElementById('gh-link'),
    toolbar: document.getElementById('gh-toolbar'),
    sort: document.getElementById('gh-sort'),
    lang: document.getElementById('gh-lang'),
    status: document.getElementById('gh-status'),
    list: document.getElementById('gh-repos'),
    more: document.getElementById('gh-more'),
  };

  const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });
  let repos = [];
  let visible = PAGE_SIZE;

  const setStatus = (message, type) => {
    els.status.className = type ? `alert alert--${type}` : 'alert';
    els.status.textContent = message;
  };

  /* Crea un elemento con clase y texto (textContent evita inyectar HTML de la API) */
  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  if (!user || user === 'TU_USUARIO') {
    els.toolbar.hidden = true;
    setStatus('Configura tu usuario de GitHub en el atributo data-github-user de la sección #github (index.html).', 'error');
    return;
  }

  /* ---------- Datos ---------- */
  async function fetchJSON(url) {
    const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) {
      const error = new Error(`GitHub respondió ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  function readCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.time < CACHE_TTL) return cached;
    } catch (error) {
      /* Caché inválida o no disponible: se vuelve a pedir */
    }
    return null;
  }

  function writeCache(profile, list) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), profile, list }));
    } catch (error) {
      /* Sin caché: no es crítico */
    }
  }

  async function loadData() {
    const cached = readCache();
    if (cached) return cached;

    const base = `https://api.github.com/users/${encodeURIComponent(user)}`;
    const [profile, list] = await Promise.all([
      fetchJSON(base),
      fetchJSON(`${base}/repos?per_page=100&sort=updated`),
    ]);
    writeCache(profile, list);
    return { profile, list };
  }

  /* ---------- Renderizado ---------- */
  function renderSkeletons() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 3; i += 1) {
      const item = create('li', 'repo-card repo-card--skeleton');
      item.setAttribute('aria-hidden', 'true');
      fragment.append(item);
    }
    els.list.replaceChildren(fragment);
    setStatus('Consultando los archivos del reino…');
  }

  function renderProfile(profile) {
    const displayName = profile.name || profile.login;
    els.avatar.src = profile.avatar_url;
    els.avatar.alt = `Foto de perfil de GitHub de ${displayName}`;
    els.name.textContent = displayName;
    els.stats.textContent =
      `@${profile.login} · ${profile.public_repos} repositorios públicos · ${profile.followers} seguidores`;
    els.link.href = profile.html_url;
    els.profile.hidden = false;
  }

  function fillLanguages() {
    const languages = [...new Set(repos.map((repo) => repo.language).filter(Boolean))].sort();
    languages.forEach((language) => els.lang.append(new Option(language, language)));
  }

  function sortedAndFiltered() {
    const lang = els.lang.value;
    const list = repos.filter((repo) => lang === 'all' || repo.language === lang);

    const sorters = {
      updated: (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at),
      stars: (a, b) => b.stargazers_count - a.stargazers_count,
      name: (a, b) => a.name.localeCompare(b.name, 'es'),
    };
    return list.sort(sorters[els.sort.value]);
  }

  function createRepoCard(repo) {
    const item = create('li', 'repo-card');

    const title = create('h3', 'repo-card__title');
    const link = create('a', '', repo.name);
    link.href = repo.html_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    title.append(link);

    const description = create('p', 'repo-card__desc', repo.description || 'Sin descripción por ahora.');

    const stats = create('ul', 'repo-card__stats');
    stats.setAttribute('aria-label', 'Datos del repositorio');
    if (repo.language) stats.append(create('li', 'badge', repo.language));
    stats.append(
      create('li', '', `★ ${repo.stargazers_count}`),
      create('li', '', `⑂ ${repo.forks_count}`),
      create('li', '', `Act. ${dateFormat.format(new Date(repo.pushed_at))}`)
    );

    item.append(title, description, stats);

    if (repo.homepage) {
      const demo = create('a', 'btn btn--ghost btn--sm', 'Ver demo');
      demo.href = repo.homepage;
      demo.target = '_blank';
      demo.rel = 'noopener noreferrer';
      item.append(demo);
    }

    return item;
  }

  function render() {
    const list = sortedAndFiltered();
    const page = list.slice(0, visible);

    els.list.replaceChildren(...page.map(createRepoCard));
    els.more.hidden = list.length <= visible;

    setStatus(
      list.length
        ? `Mostrando ${page.length} de ${list.length} repositorios públicos.`
        : 'No hay repositorios con ese lenguaje.'
    );
  }

  function renderError(error) {
    els.list.replaceChildren();
    els.toolbar.hidden = true;
    const messages = {
      404: `No se encontró el usuario "${user}" en GitHub. Revisa el atributo data-github-user.`,
      403: 'Se alcanzó el límite de consultas a la API de GitHub. Inténtalo de nuevo en unos minutos.',
    };
    setStatus(messages[error.status] || 'No se pudieron cargar los repositorios. Revisa tu conexión e inténtalo de nuevo.', 'error');
  }

  /* ---------- Eventos ---------- */
  els.sort.addEventListener('change', () => {
    visible = PAGE_SIZE;
    render();
  });

  els.lang.addEventListener('change', () => {
    visible = PAGE_SIZE;
    render();
  });

  els.toolbar.addEventListener('submit', (event) => event.preventDefault());

  els.more.addEventListener('click', () => {
    visible += PAGE_SIZE;
    render();
  });

  /* ---------- Inicio: se carga cuando la sección se acerca a la pantalla ---------- */
  async function start() {
    renderSkeletons();
    try {
      const { profile, list } = await loadData();
      // Solo repositorios públicos y propios (se excluyen privados y forks)
      repos = list.filter((repo) => !repo.private && repo.visibility !== 'private' && !repo.fork);
      renderProfile(profile);
      fillLanguages();
      render();
    } catch (error) {
      renderError(error);
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(section);
  } else {
    start();
  }
})();
