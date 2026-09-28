# Giraffe bio. — Brand studio

Un estudio local para crear piezas 3D de Giraffe Bio: escultura mineral, logo completo e isotipo, con materiales, luces y exportación.

## Abrir

Requiere Node.js 22.13+ y pnpm 11.20.

```sh
pnpm install
pnpm dev
```

Abrir **http://127.0.0.1:5187**. El servidor usa un puerto fijo y sólo escucha en la computadora local.

## Usar

- Arrastrar el logo para girarlo; rueda o gesto de dos dedos para acercar.
- Alternar entre Escultura (vista inicial), el logo completo y las cinco piezas del isotipo. La escultura integra un solo símbolo, con partes hundidas y salientes en la misma roca oscura.
- Ajustar la profundidad para acentuar el vaciado y el relieve. En Logo completo e Isotipo también se puede elegir piedra, grafito, cobre o marfil; la escultura mantiene un único material de roca.
- Pausar el movimiento y restablecer la vista.
- Trabajar la luz en el panel «Luz del estudio»: elegir Principal, Relleno, Contraluz o Foco de acento para ajustar cada fuente. El punto arrastrable mueve la principal; también responde a las flechas del teclado.
- Cada luz tiene encendido, intensidad hasta 300%, color, posición en tres ejes y sombras. El foco de acento suma apertura del haz, difusión del borde y punto de enfoque horizontal/vertical. Arranca apagado.
- «Ambiente / sombras» controla luz ambiente, giro del entorno, intensidad y suavidad de sombras, y si las luces siguen la cámara. La exposición completa los 38 ajustes. Podés arrastrar los controles o escribir valores exactos.
- Probar Referencia, Suave, Contraste o Cálida/fría. «Guardar mi luz» guarda una configuración en este navegador; «Recuperar» la restaura incluso después de cerrar y volver a abrir la página.
- «Restablecer luz» recupera los valores iniciales sin cambiar el encuadre. Los ajustes se conservan al cambiar de material o pieza.
- Descargar PNG: 2160 × 2700 para la escultura (4:5), 3000 × 1500 para el logo o 2048 × 2048 para el isotipo. Conserva el fondo y la iluminación elegida; transparencia opcional.
- Descargar GLB: geometría y materiales, para abrir en Blender u otra herramienta 3D. El GLB de piedra incorpora mapas de color, relieve y rugosidad/metallicidad horneados a 2048 px desde el acabado de piedra gris. El grano fino puede verse más suave que en el shader vivo. El GLB contiene la pieza centrada; no incorpora el fondo, la cámara ni la iluminación del estudio.
- Con el visor enfocado: flechas para girar, `+` / `−` para acercar y `Home` para restablecer.

El movimiento automático se desactiva al manipular la pieza. Se respeta la preferencia de movimiento reducido del sistema. El símbolo y las letras parten de los trazados del SVG original, sin sustituir la tipografía. En piedra, el contorno y las superficies se erosionan de forma determinista; la silueta general y los huecos siguen reconocibles.

## Archivos

- `public/giraffe-bio.svg`: SVG proporcionado, sin redibujar.
- `src/logo.ts`: unión de trazos superpuestos, extrusión, bisel y normales suavizadas.
- `src/studio.ts`: cámara, iluminación, interacción y captura.
- `src/materials.ts`: acabados de la pieza.
- `src/lighting.ts` y `src/light-controls.ts`: luces del estudio y panel de edición.
- `src/light-settings.ts` y `src/light-markup.ts`: valores iniciales, combinaciones y controles de las cuatro luces.
- `src/stone/backdrop.ts`: pared de piedra con relieve, material y sombras.
- `src/styles/`: composición y colores del estudio.
- `src/sculpture/`: monolito de geometría irregular, isologo tallado, fondo gris y exportación con materiales PBR.
- `src/stone/sculpt.ts`: subdivisión y erosión real de caras, bordes y paredes.
- `src/stone/carved-look.ts`: gris mineral, poros y luces del acabado actual.
- `src/stone/`: shader base del sitio y conversión a texturas PBR para GLB.
- `public/rock/`: mapas de relieve y ARM, más el entorno de iluminación original.
- `exports/`: logo en piedra y grafito (GLB y PNG transparente), más isotipo en cobre y PNG del logo sobre fondo de piedra.

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

## Fondo y luz

La escultura tiene un fondo gris de estudio. En los modos Logo completo e Isotipo, el fondo es una malla de piedra iluminada dentro de la escena, con relieve y sombra del logo. Reutiliza los mapas existentes y deforma sus coordenadas para romper la repetición. La fuente principal se mueve respecto de la cámara; izquierda en el control corresponde a izquierda en el visor.

El PNG incluye fondo e iluminación. Activar «PNG con fondo transparente» elimina temporalmente la pared durante la captura y luego la restaura en el visor. El GLB sigue exportando únicamente la pieza con sus materiales, sin pared, luces ni cámara.

`pnpm check:lighting` verifica cambios reales de luminosidad, arrastre y teclado, restablecimiento, y PNG con fondo y transparencia. Guarda capturas en `.review/lighting-*.png` y una pieza lista para usar en `exports/giraffe-bio-logo-stone-fondo.png`.

`pnpm check:light-studio` comprueba las cuatro fuentes por separado, colores, posiciones, foco, sombras por luz, suavidad, ambiente y luces fijas o ligadas a la cámara. Verifica entrada numérica, guardado y recuperación tras recargar, y que el PNG conserve la luz elegida. Guarda evidencia en `.review/light-studio-*`.

## Escultura mineral

La composición se inspira en la referencia de Neurath X compartida el 28/09. La corrección de la diseñadora define **un solo isologo y el mismo material de piedra en toda la figura**. Las tres partes superiores/izquierdas se sustraen del bloque y las dos inferiores/derechas se unen en relieve. La pieza resultante es una sola malla; los huecos incluyen fondo y paredes interiores reales. El control de profundidad modifica ambos sentidos.

La roca tiene una silueta asimétrica, espesor variable y bordes quebrados por pérdidas desiguales de material. Los costados cambian de sección a través del espesor, con fracturas, entrantes y salientes; también se quiebran las paredes interiores y exteriores del tallado. Esas irregularidades existen en la geometría y se conservan al exportar.

El isologo conserva las cinco siluetas del SVG. Su tamaño y posición dejan margen dentro de la roca. El desgaste se aplica detrás del contorno visible, para que las paredes irregulares no tapen ni recorten las partes hundidas y salientes.

La textura usa las fracturas del mapa original de Giraffe bio a una escala mayor, con poco grano y sin relieve de arena. Un mismo acabado negro mate recorre el bloque y el isologo, incluidas las paredes talladas.

La luz inicial toma la referencia: fuente rasante arriba/derecha, frente oscuro con relleno suave, contraluz contenido y sombras profundas dentro del tallado. «Restablecer luz» recupera esa iluminación. El fondo gris es más claro hacia abajo a la izquierda.

La cámara inicia en tres cuartos. El giro y la flotación son suaves; movimiento reducido mantiene una vista estática. Las luces se editan desde el panel lateral. El PNG de la escultura usa una composición vertical 4:5. El GLB incorpora un solo material con tres mapas PBR horneados a 2048 px; la iluminación y el fondo pertenecen al estudio.

`pnpm check:sculpture` verifica la composición, controles, PNG vertical y transparente, GLB con un único material y regreso a logo/isotipo. Mide con rayos los fondos hundidos y las caras salientes respecto de la roca original en tres profundidades; compara 574 puntos repartidos por las cinco formas contra el SVG para detectar partes tapadas o recortadas. Repite la medición después de reabrir el GLB. Comprueba que los costados se aparten de una pared recta y captura frente y perfil sin textura. Las capturas quedan en `.review/sculpture-*.png`; los entregables están en `exports/giraffe-bio-escultura.png` y `.glb`.
