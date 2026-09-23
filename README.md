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
- Elegir piedra (acabado inicial), grafito, cobre o marfil y ajustar la profundidad.
- Pausar el movimiento y restablecer la vista.
- Descargar PNG: 3000 × 1500 para el logo o 2048 × 2048 para el isotipo, con fondo transparente opcional.
- Descargar GLB: geometría y materiales, para abrir en Blender u otra herramienta 3D. El GLB de piedra incorpora mapas de color, relieve y rugosidad/metallicidad horneados a 2048 px desde el acabado de piedra gris. El grano fino puede verse más suave que en el shader vivo. El GLB contiene la pieza centrada; no incorpora el fondo, la cámara ni la iluminación del estudio.
- Con el visor enfocado: flechas para girar, `+` / `−` para acercar y `Home` para restablecer.

El movimiento automático se desactiva al manipular la pieza. Se respeta la preferencia de movimiento reducido del sistema. El símbolo y las letras parten de los trazados del SVG original, sin sustituir la tipografía. En piedra, el contorno y las superficies se erosionan de forma determinista; la silueta general y los huecos siguen reconocibles.

## Archivos

- `public/giraffe-bio.svg`: SVG proporcionado, sin redibujar.
- `src/logo.ts`: unión de trazos superpuestos, extrusión, bisel y normales suavizadas.
- `src/studio.ts`: cámara, iluminación, interacción y captura.
- `src/materials.ts`: acabados de la pieza.
- `src/styles/`: composición y colores del estudio.
- `src/stone/sculpt.ts`: subdivisión y erosión real de caras, bordes y paredes.
- `src/stone/carved-look.ts`: gris mineral, poros y luces del acabado actual.
- `src/stone/`: shader base del sitio y conversión a texturas PBR para GLB.
- `public/rock/`: mapas de relieve y ARM, más el entorno de iluminación original.
- `exports/`: logo en piedra y grafito (GLB y PNG transparente), más isotipo en cobre.

El estudio usa Vite, TypeScript y Three.js. No necesita claves, servicios externos ni imágenes generadas. Los archivos se exportan en el navegador.

## Validación

```sh
pnpm check
pnpm build
pnpm shots
```

`pnpm shots` requiere Chrome instalado y el servidor local abierto. Verifica 1440, 768 y 390 px, movimiento reducido, redimensionado, exportación PNG/GLB y errores de consola. Guarda capturas y medidas en `.review/` (ignorado por Git) y actualiza las piezas de `exports/`.

Documentación técnica: [Three.js](https://threejs.org/docs/), [Vite](https://vite.dev/guide/).

## Material de piedra

La referencia actual es una letra A de roca gris erosionada sobre negro. El relieve es geometría: se subdivide la extrusión y se desplazan las caras, los bordes y las paredes interiores a varias escalas. Cada pieza tiene una semilla estable, por lo que cambiar el material o descargar el GLB no cambia su erosión. Las luces rasantes y las sombras propias muestran el volumen.

El detalle fino reutiliza la base del repositorio **Giraffe bio**, revisión `97e5551`: `lib/rock/look.ts`, `noise3d.ts`, `triplanar.ts` y `triplanar-shaders.ts`, junto con `dark_rock_nor_gl_1k.jpg`, `dark_rock_arm_1k.jpg` y `ferndale_studio_07_1k.hdr`. `carved-look.ts` adapta esa base a piedra gris mate sin pirita. El material se proyecta en el espacio de la pieza para que no se deslice al girarla.

```sh
pnpm check:stone
```

Esta prueba se concentra en la pieza para redes: captura el logo y el isotipo, descarga PNG y GLB, mide el relieve físico, verifica sus texturas incorporadas y vuelve a abrir el GLB tanto con el acabado PBR como con un material neutro sin texturas para revisar la geometría. Requiere el servidor local abierto y Chrome. Las capturas quedan en `.review/stone-*.png`.
