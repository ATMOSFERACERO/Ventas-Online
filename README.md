# Segundamano (Ventas Online)

Prototipo sencillo de marketplace de artículos de segunda mano. React + TypeScript + Vite + Tailwind. Sin servidor: los datos de ejemplo y los anuncios nuevos se guardan en `localStorage`.

## Funciones (fase 1)
- Portada con búsqueda, filtro por categoría, precio máximo y ordenación.
- Ficha de artículo con contacto simulado.
- Publicar un artículo (formulario validado).
- Favoritos.
- Tema claro y oscuro automático.

## Abrir sin instalar nada
Abre `dist/index.html` con doble clic: es un único archivo autocontenido y funciona sin servidor.

> No abras el `index.html` de la raíz: es el de desarrollo y solo funciona con `npm run dev`.

## Desarrollo
```bash
npm install
npm run dev     # desarrollo
npm run build   # comprueba tipos y regenera dist/index.html
```

## Siguientes fases
- **Fase 2:** backend (autenticación, base de datos, fotos reales y mensajería).
- **Fase 3:** pagos y envíos, valoraciones, moderación y RGPD.
