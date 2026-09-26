# Portafolio Medieval · Josué Fernando Guadalupe

Portafolio personal con temática medieval pixel art 2D, construido con **HTML5 semántico, CSS propio y JavaScript**, sin frameworks.

🔗 **Sitio publicado:** https://josueguadalupeee.github.io/Portafolio_Josue_Guadalupe/

## Secciones

| Sección | Contenido |
|---|---|
| Inicio | Presentación con escena animada (nubes, castillo, banderas, caballero caminando) |
| Sobre mí | Perfil profesional, formación y "ficha del personaje" |
| Habilidades | Skills por categoría con nivel de dominio (Aprendiz → Maestro) |
| Proyectos | Cards reutilizables con filtro por tecnología y modal de detalle |
| GitHub | Repositorios cargados en vivo desde la API pública de GitHub |
| Design System | Colores, tipografía, espaciado, bordes/sombras y componentes reales |
| Contacto | Formulario con validación en JavaScript |

## Funcionalidades JavaScript

1. Menú responsive (hamburguesa) con cierre por Escape o clic fuera.
2. Tema día/noche guardado en `localStorage` (respeta la preferencia del sistema).
3. Pausa/reanudación de animaciones guardada en `localStorage` (respeta `prefers-reduced-motion`).
4. Navegación activa según la sección visible y animación de aparición al hacer scroll.
5. Filtro de proyectos por tecnología.
6. Modal (`<dialog>`) con el detalle de cada proyecto.
7. Validación del formulario de contacto con mensajes accesibles.
8. Botón para volver al inicio.
9. Repositorios de GitHub con orden, filtro por lenguaje y "mostrar más".
10. El Design System muestra el valor real de cada color según el tema activo.

## Estructura

```
├── index.html
├── css/
│   ├── tokens.css       # Custom Properties: colores, tipografía, espaciado, sombras…
│   ├── base.css         # Reset, tipografía global y utilidades
│   ├── components.css   # Botones, badges, cards, formularios, navbar, modal…
│   ├── layout.css       # Estructura de secciones y media queries
│   └── animations.css   # Keyframes y control de movimiento
├── js/
│   ├── preferences.js   # Aplica tema/movimiento guardados antes de pintar
│   ├── main.js          # Interactividad principal
│   └── github.js        # Integración con la API de GitHub
└── assets/
    ├── img/             # Avatar, sprites y capturas (SVG pixel art)
    └── icons/           # Íconos de tecnologías (Devicon, licencia MIT)
```

## Personalización

- El usuario de GitHub se configura en el atributo `data-github-user` de la sección `#github`.
- El correo de destino del formulario está en el atributo `data-mailto` de `#contact-form`.
- Ajusta textos de formación, proyectos y niveles de habilidades según tu experiencia real.

## Créditos

- Tipografías: MedievalSharp, Alegreya y Pixelify Sans (Google Fonts).
- Íconos de tecnologías: [Devicon](https://devicon.dev/) (MIT).
- Sprites e ilustraciones: creados para este proyecto.
