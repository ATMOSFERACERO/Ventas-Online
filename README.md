# Segundamano (Ventas Online)

Prototipo sencillo de marketplace de artículos de segunda mano. React + TypeScript + Vite + Tailwind. Sin servidor: los datos de ejemplo y los anuncios nuevos se guardan en `localStorage`.

## Funciones (fase 1)
- Portada con búsqueda, filtro por categoría, precio máximo y ordenación.
- Ficha de artículo con contacto simulado.
- Publicar un artículo (formulario validado).
- Favoritos.
- Tema claro y oscuro automático.
- **Asistente de compra** (botón flotante) con conexiones configurables en **Ajustes**:
  - *Cuentas de IA*: Anthropic, OpenAI, Gemini o servidor compatible. Añadir (modal), editar, borrar (todas, también la activa), una activa a la vez y «Probar conexión».
  - *Flujos (n8n y similares)*: webhook de n8n, Fluxion8n, Power Automate u otro, con autenticación por cabecera, Basic o Bearer.
  - **Respaldo automático**: si el flujo activo falla, responde sola la cuenta de IA elegida y se avisa en el chat.
  - Sin conexiones (o sin ninguna activa) el botón del asistente queda bloqueado.

## Abrir sin instalar nada
Abre `dist/index.html` con doble clic: es un único archivo autocontenido y funciona sin servidor.

> No abras el `index.html` de la raíz: es el de desarrollo y solo funciona con `npm run dev`.

## Desarrollo
```bash
npm install
npm run dev     # desarrollo
npm test        # pruebas de la lógica del asistente
npm run build   # comprueba tipos y regenera dist/index.html
```

## Siguientes fases
- **Fase 2:** backend (autenticación, base de datos, fotos reales y mensajería).
- **Fase 3:** pagos y envíos, valoraciones, moderación y RGPD.
