/**
 * Preferencias guardadas (tema y animaciones).
 * Se carga en <head> SIN defer para aplicar el tema antes del primer pintado
 * y evitar el "parpadeo" de colores al recargar la página.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  // Tema: preferencia guardada → preferencia del sistema → día
  var theme = read('portfolio-theme');
  if (!theme) {
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', theme);

  // Movimiento: "on" | "off" (sin valor se respeta prefers-reduced-motion vía CSS)
  var motion = read('portfolio-motion');
  if (motion) {
    root.setAttribute('data-motion', motion);
  }
})();
