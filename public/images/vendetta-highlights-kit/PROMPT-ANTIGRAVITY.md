# Prompt para Antigravity — Highlights Vendetta

Implementa la franja de highlights situada inmediatamente después del hero actual de `vendetta.mx`, usando exclusivamente los recursos del directorio `vendetta-highlights-kit`. No modifiques el hero ni los paquetes.

## Objetivo

Traducir el diseño de flight case aprobado a una sección HTML/CSS/SVG compacta, original y responsive. Debe sentirse como equipo real de una gira de pop-rock para público adulto 30+, no como dashboard, plantilla SaaS, bloque de estadísticas ni estética gamer.

## Contenido exacto

1. `+500` — `EVENTOS REALIZADOS`
2. `+15` — `AÑOS DE EXPERIENCIA`
3. `5` — `MÚSICOS EN ESCENA`
4. `DESDE 2 H` — `DE SHOW EN VIVO`
5. `TOUR LEVEL` — `PRODUCCIÓN DE GIRA`

No presentar 2 horas como duración máxima. “DESDE” debe ser visualmente secundario y “2 H” el dato dominante.

## Recursos obligatorios

- Fondo: `flightcase-texture.avif`, con `flightcase-texture.webp` como fallback.
- Cable desktop: `cable-signal-desktop.svg`.
- Cable móvil: `cable-signal-mobile.svg`.
- Herrajes: `flightcase-hardware.svg`.
- Variables: `design-tokens.css`.
- Fuentes con `next/font/google`:
  - `Barlow_Condensed`: 600, 700, 800 y 900 para cifras, etiquetas y sellos.
  - `Inter`: 400, 500 y 600 para cualquier texto auxiliar.

No rasterices los textos. No conviertas toda la franja en una sola imagen.

## Layout desktop

- Ancho completo; contenido máximo 1440 px.
- Altura objetivo 280–320 px, sin transformarla en otra pantalla completa.
- El fondo se construye con textura repetible y una capa negra semitransparente para garantizar contraste.
- `flightcase-hardware.svg` cubre el contenedor como overlay decorativo con `pointer-events:none`.
- Distribución editorial horizontal y asimétrica, no cinco columnas idénticas.
- `+500` abre la composición con gran presencia.
- `+15`, `5` y `DESDE 2 H` se sienten como marcajes serigrafiados de producción.
- `TOUR LEVEL` ocupa la placa metálica derecha y funciona como sello final.
- Coloca `cable-signal-desktop.svg` atravesando la zona inferior/media, por detrás del texto y sin cruzar rostros ni dificultar lectura.
- Mantén zonas seguras para que cable, plugs y remaches no choquen con cifras.

## Tratamiento visual

- Blanco cálido y rojo Vendetta dominantes.
- Azul eléctrico únicamente como microacento: una pequeña marca, LED o línea de 2–4 px; nunca como resplandor general.
- Desgaste tipográfico muy moderado mediante una máscara reusable; las cifras deben conservar lectura perfecta.
- Borde y perfil metálico sobrios. Sin neón fuerte, chispas, ecualizadores, estrellas, iconos genéricos ni fotografías.
- `TOUR LEVEL` puede usar letras blancas sobre placa negra, borde metálico y un pequeño indicador rojo.
- Añade profundidad con sombras internas y brillos controlados, no con grano fotográfico.

## Responsive

Tablet:
- Mantener composición horizontal mientras exista espacio suficiente.
- Reducir cifras y espacios fluidamente con `clamp()`.

Móvil:
- Usar `cable-signal-mobile.svg`.
- Distribuir en dos filas: `+500`, `+15`, `5` arriba; `DESDE 2 H` y `TOUR LEVEL` abajo.
- Altura aproximada 400–460 px.
- Sin carrusel, sin scroll horizontal, sin ocultar ningún dato.
- Evitar que plugs o remaches invadan el texto.

## Implementación

- Crear un componente semántico `VendettaHighlights`.
- Renderizar los datos desde un arreglo configurable.
- Usar `section` y una lista accesible; decoraciones con `aria-hidden="true"`.
- Las imágenes deben usar rutas locales, dimensiones conocidas y carga optimizada.
- Usar AVIF primero y WebP como respaldo mediante `image-set()` o `picture` cuando corresponda.
- El SVG del cable puede animar una señal roja tenue de izquierda a derecha con `stroke-dashoffset`, máximo una vez al entrar al viewport.
- Desactivar toda animación bajo `prefers-reduced-motion: reduce`.
- Evitar dependencias nuevas.
- No modificar SEO, navegación, CTAs, formularios ni lógica comercial.
- Verificar a 1440, 1024, 768, 430 y 375 px.
- Evitar CLS y mantener el peso total adicional de la sección por debajo de 200 KB después de optimización.

## Criterios de aceptación

- Se percibe como un flight case real de gira, no como cinco cards.
- Los cinco mensajes se leen en menos de tres segundos.
- “DESDE 2 H” no comunica un límite.
- “PRODUCCIÓN DE GIRA” conserva protagonismo.
- El diseño funciona con teclado, lector de pantalla y reducción de movimiento.
- Entrega capturas desktop y móvil, lista de archivos modificados y peso final de los recursos.
