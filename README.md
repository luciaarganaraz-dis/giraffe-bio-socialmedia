# Giraffe bio. — Brand studio

El logo original convertido en un objeto 3D real, con un estudio local para explorar materiales y exportar piezas.

## Abrir

Requiere Node.js 22.13+ y pnpm 11.20.

```sh
pnpm install
pnpm dev
```

Abrir **http://127.0.0.1:5187**. El servidor usa un puerto fijo y sólo escucha en la computadora local.

## Usar

- Arrastrar el logo para girarlo; rueda o gesto de dos dedos para acercar.
- Alternar entre el logo completo y las cinco piezas del isotipo.
- Elegir grafito, cobre o marfil y ajustar la profundidad.
- Pausar el movimiento y restablecer la vista.
- Descargar PNG: 3000 × 1500 para el logo o 2048 × 2048 para el isotipo, con fondo transparente opcional.
- Descargar GLB: geometría y materiales, para abrir en Blender u otra herramienta 3D. El GLB contiene la pieza centrada; no incorpora el fondo, la cámara ni la iluminación del estudio.
- Con el visor enfocado: flechas para girar, `+` / `−` para acercar y `Home` para restablecer.

El movimiento automático se desactiva al manipular la pieza. Se respeta la preferencia de movimiento reducido del sistema. El símbolo y las letras conservan los trazados del SVG original; las curvas se muestrean para construir la malla, sin sustituir la tipografía.

## Archivos

- `public/giraffe-bio.svg`: SVG proporcionado, sin redibujar.
- `src/logo.ts`: unión de trazos superpuestos, extrusión, bisel y normales suavizadas.
- `src/studio.ts`: cámara, iluminación, interacción y captura.
- `src/materials.ts`: acabados de la pieza.
- `src/styles/`: composición y colores del estudio.
- `exports/`: logo en GLB y PNG transparente, más isotipo en cobre.

El estudio usa Vite, TypeScript y Three.js. No necesita claves, servicios externos ni imágenes generadas. Los archivos se exportan en el navegador.

## Validación

```sh
pnpm check
pnpm build
pnpm shots
```

`pnpm shots` requiere Chrome instalado y el servidor local abierto. Verifica 1440, 768 y 390 px, movimiento reducido, redimensionado, exportación PNG/GLB y errores de consola. Guarda capturas y medidas en `.review/` (ignorado por Git) y actualiza las piezas de `exports/`.

Documentación técnica: [Three.js](https://threejs.org/docs/), [Vite](https://vite.dev/guide/).
