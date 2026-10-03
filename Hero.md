# Hero — Formato del banner del landing

Documentación del formato visual del hero principal del landing (`src/app/components/landing/`).
Describe estructura, layout, tamaños, degradado y comportamiento responsive para poder
replicarlo en otros contextos.

> **Nota sobre colores:** los colores (fondo, texto, flechas) son intencionalmente
> variables porque cambian según la foto que se muestre en cada slide del carrusel. Por eso
> acá se documenta **cómo** se compone el degradado y dónde van las capas, pero no los valores
> de color concretos.

---

## Estructura (HTML)

El hero es un contenedor con layout en grid de 2 columnas:

```
.landing
└── .landing__hero                 ← contenedor del banner (grid 2 col + overflow oculto)
    ├── .landing__hero-arrow--prev ← flecha carrusel izquierda (absoluta)
    ├── .landing__hero-contenido   ← columna izquierda: texto + CTA
    │   ├── .landing__titulo        (h1)
    │   └── .landing__bajada        (p)
    ├── .landing__hero-media        ← columna derecha: foto / imagen del slide
    └── .landing__hero-arrow--next ← flecha carrusel derecha (absoluta)
```

- La columna **izquierda** lleva el contenido textual alineado a la izquierda.
- La columna **derecha** lleva la imagen del slide.
- Las **flechas** se posicionan de forma absoluta sobre los costados, centradas verticalmente,
  por encima del contenido (van superpuestas, no ocupan columna del grid).

---

## Layout del contenedor (`.landing__hero`)

| Propiedad | Valor | Para qué |
|---|---|---|
| `display` | `grid` | Divide texto / imagen |
| `grid-template-columns` | `1fr 1fr` | Dos columnas iguales (50/50) |
| `align-items` | `center` | Centra verticalmente ambas columnas |
| `gap` | `2rem` | Separación entre texto e imagen |
| `width` | `100%` | Ocupa todo el ancho disponible |
| `max-width` | `100%` | No se limita a sí mismo |
| `min-height` | `420px` | Alto mínimo del banner en desktop |
| `padding` | `2.75rem clamp(2.5rem, 6vw, 4.5rem)` | Respiro interno; el horizontal es fluido |
| `border-radius` | `24px` | Esquinas redondeadas |
| `overflow` | `hidden` | Recorta la imagen/degradado al radio |
| `position` | `relative` | Ancla las flechas absolutas |
| `text-align` | `left` | Texto alineado a la izquierda |
| `box-sizing` | `border-box` | El padding no agranda el ancho |

El padding horizontal es **fluido**: `clamp(2.5rem, 6vw, 4.5rem)` crece con el viewport pero
queda acotado entre `2.5rem` y `4.5rem`.

---

## Degradado del fondo (el "fade")

El fondo se compone de **dos capas** apiladas en una sola propiedad `background` (la primera
declarada queda arriba):

1. **Capa de brillo — `radial-gradient`**
   - Posición/forma: `130% 120% at 82% -20%` → foco grande desplazado hacia la esquina
     superior derecha, por fuera del borde.
   - Transición: de un blanco translúcido hacia transparente alrededor del `55%`.
   - Efecto: un halo/luz suave en la esquina superior derecha que da profundidad.

2. **Capa base — `linear-gradient`**
   - Ángulo: `115deg` (diagonal, de arriba-izquierda hacia abajo-derecha).
   - Tres paradas: `0%` → `52%` → `100%`, de un tono claro a uno más saturado/oscuro.
   - Efecto: el degradado de color principal del banner.

Esquema (valores de color omitidos a propósito):

```css
background:
  radial-gradient(130% 120% at 82% -20%, <blanco translúcido>, transparent 55%),
  linear-gradient(115deg, <claro> 0%, <medio> 52%, <saturado> 100%);
```

**Para cambiar el color según la foto:** reemplazá sólo los colores dentro de las dos capas;
mantené los porcentajes, ángulos y posiciones para conservar el mismo "fade".

---

## Tipografía del contenido

### Columna de contenido (`.landing__hero-contenido`)
- `display: flex` en columna, `align-items: flex-start`, `gap: 1.35rem`.
- `z-index: 1` para quedar por encima del degradado.

### Título (`.landing__titulo`)
| Propiedad | Valor |
|---|---|
| `font-size` | `clamp(2rem, 4.6vw, 3.5rem)` — fluido entre 32px y 56px |
| `font-weight` | `800` |
| `line-height` | `1.06` (apretado) |
| `letter-spacing` | `-0.02em` |
| `margin` | `0` |

### Bajada (`.landing__bajada`)
| Propiedad | Valor |
|---|---|
| `font-size` | `clamp(1rem, 2vw, 1.15rem)` — fluido entre 16px y ~18px |
| `line-height` | `1.5` |
| `opacity` | `0.82` (texto secundario, levemente atenuado) |
| `max-width` | `44ch` (limita el largo de línea para legibilidad) |
| `margin` | `0` |

---

## Imagen / media (`.landing__hero-media`)

Columna derecha donde va la foto del slide (hoy un placeholder).

| Propiedad | Valor |
|---|---|
| `min-height` | `300px` |
| `height` | `100%` (iguala el alto del banner) |
| `border-radius` | `18px` |
| `display` | `flex` centrado (centra el placeholder) |
| `z-index` | `1` (sobre el degradado) |

El fondo translúcido y el borde punteado son sólo del estado placeholder; se reemplazan por
la foto real cuando esté disponible.

---

## Flechas del carrusel (`.landing__hero-arrow`)

Botones circulares posicionados sobre los costados del banner.

| Propiedad | Valor |
|---|---|
| `position` | `absolute`, `top: 50%` + `transform: translateY(-50%)` → centradas en vertical |
| `width` / `height` | `46px` × `46px` |
| `border-radius` | `50%` (círculo) |
| `z-index` | `2` (por encima de todo el contenido) |
| ícono SVG | `22px` × `22px` |
| sombra | sombra suave hacia abajo |
| hover (habilitada) | `scale(1.08)` manteniendo el centrado vertical |
| disabled | `opacity: 0.55`, cursor normal |

Posición horizontal: `--prev` a `left: 14px`, `--next` a `right: 14px`.

---

## Responsive

### Mobile — `@media (max-width: 860px)`
- El grid pasa a **1 columna** (`grid-template-columns: 1fr`): la imagen se apila sobre/bajo el texto.
- `min-height: auto`, `gap: 1.5rem`, `padding: 2.25rem 1.5rem`.
- El contenido se **centra** (`text-align: center`, `align-items: center`); la bajada se centra con `margin-inline: auto`.
- La imagen va primero (`order: 1`) y baja su `min-height` a `200px`.
- Las **flechas se ocultan** (`display: none`).

### Desktop grande — `@media (min-width: 1000px)`
- El wrapper `.landing` se limita a `var(--content-max-width)` y se centra (`margin: 0 auto`).
- Aumenta el padding general a `4rem 2rem 3rem`.
- Por debajo de este breakpoint el layout mobile queda intacto.

---

## Resumen de medidas clave

| Elemento | Medida |
|---|---|
| Alto mínimo banner (desktop) | `420px` |
| Radio del banner | `24px` |
| Radio de la imagen | `18px` |
| Columnas | `1fr 1fr` (desktop) → `1fr` (≤860px) |
| Gap entre columnas | `2rem` → `1.5rem` (mobile) |
| Título | `clamp(2rem, 4.6vw, 3.5rem)`, peso 800, line-height 1.06 |
| Bajada | `clamp(1rem, 2vw, 1.15rem)`, line-height 1.5, max 44ch |
| Flecha | círculo `46px`, ícono `22px` |
| Ángulo degradado base | `115deg` |
| Foco del brillo radial | `at 82% -20%` |
