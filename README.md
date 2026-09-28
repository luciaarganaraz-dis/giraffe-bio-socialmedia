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
- Alternar entre Escultura (vista inicial), el logo completo y las cinco piezas del isotipo. La escultura integra un solo símbolo, con las cinco formas hundidas en la misma roca oscura.
- Ajustar la profundidad para acentuar el vaciado y el relieve. En Logo completo e Isotipo también se puede elegir piedra, grafito, cobre o marfil; la escultura mantiene un único material de roca.
- Pausar el movimiento y restablecer la vista.
- Trabajar la luz en el panel «Luz del estudio»: elegir Principal, Relleno, Contraluz o Foco de acento para ajustar cada fuente. El punto arrastrable mueve la principal; también responde a las flechas del teclado.
- Cada luz tiene encendido, intensidad hasta 300%, color, posición en tres ejes y sombras. El foco de acento suma apertura del haz, difusión del borde y punto de enfoque horizontal/vertical. Arranca apagado.
- «Ambiente / sombras» controla luz ambiente, giro del entorno, intensidad y suavidad de sombras, y si las luces siguen la cámara. La exposición completa los 38 ajustes. Podés arrastrar los controles o escribir valores exactos.
- Probar Referencia, Suave, Contraste o Cálida/fría. «Guardar mi luz» guarda una configuración en este navegador; «Recuperar» la restaura incluso después de cerrar y volver a abrir la página.
- «Restablecer luz» recupera los valores iniciales sin cambiar el encuadre. Los ajustes se conservan al cambiar de material o pieza.
- Descargar PNG: 2160 × 2700 para la escultura (4:5), 3000 × 1500 para el logo o 2048 × 2048 para el isotipo. Conserva el fondo y la iluminación elegida; transparencia opcional.
- Descargar GLB: geometría y materiales, para abrir en Blender u otra herramienta 3D. El GLB de piedra incorpora mapas de color, relieve y rugosidad/metallicidad horneados a 2048 px desde el acabado de piedra gris. El grano fino puede verse más suave que en el shader vivo. El GLB conserva las transformaciones del panel Objeto y el material editado; no incorpora el fondo ni luces o cámaras activas del estudio.
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

La composición se inspira en la referencia de Neurath X compartida el 28/09. La corrección de la diseñadora define **un solo isologo y el mismo material de piedra en toda la figura**. Las cinco partes originales del isologo se sustraen del bloque: todo el símbolo queda tallado hacia adentro. La pieza resultante es una sola malla; los huecos incluyen fondo y paredes interiores reales. El control de profundidad modifica cuánto se hunden las cinco formas.

La roca tiene una silueta asimétrica, espesor variable y bordes quebrados por pérdidas desiguales de material. Los costados cambian de sección a través del espesor, con fracturas, entrantes y salientes; también se quiebran las paredes interiores y exteriores del tallado. Esas irregularidades existen en la geometría y se conservan al exportar.

El isologo conserva las cinco siluetas del SVG. Su tamaño y posición dejan margen dentro de la roca. El desgaste se aplica detrás del contorno visible, para que las paredes irregulares no tapen ni recorten las cinco partes hundidas.

La textura usa las fracturas del mapa original de Giraffe bio a una escala mayor, con poco grano y sin relieve de arena. Un mismo acabado negro mate recorre el bloque y el isologo, incluidas las paredes talladas.

La luz inicial toma la referencia: fuente rasante arriba/derecha, frente oscuro con relleno suave, contraluz contenido y sombras profundas dentro del tallado. «Restablecer luz» recupera esa iluminación. El fondo gris es más claro hacia abajo a la izquierda.

La cámara inicia en tres cuartos. El giro y la flotación son suaves; movimiento reducido mantiene una vista estática. Las luces se editan desde el panel lateral. El PNG de la escultura usa una composición vertical 4:5. El GLB incorpora un solo material con tres mapas PBR horneados a 2048 px; la iluminación y el fondo pertenecen al estudio.

`pnpm check:sculpture` verifica la composición, controles, PNG vertical y transparente, GLB con un único material y regreso a logo/isotipo. Mide con rayos los cinco fondos hundidos respecto de la roca original en tres profundidades; compara 574 puntos repartidos por las cinco formas contra el SVG para detectar partes tapadas o recortadas. Repite la medición después de reabrir el GLB. Comprueba que los costados se aparten de una pared recta y captura frente y perfil sin textura. Las capturas quedan en `.review/sculpture-*.png`; los entregables están en `exports/giraffe-bio-escultura.png` y `.glb`.

La captura `exports/giraffe-bio-isologo-hundido.png` muestra un acercamiento sin controles, con profundidad 28 y la iluminación que estaba usando la diseñadora.


## Controles del Giraffe Bio original

El panel lateral tiene pestañas **Luz** y **Textura**. En Luz, el selector de esquema permite elegir el estudio actual o **Giraffe original · 6 luces**, adaptado de los controles Q2 del repo Giraffe bio (revisión `002f979`). Cada una de las seis lámparas admite tipo Sol, Puntual, Foco o Área; encendido, potencia, color, posición y orientación. El foco añade apertura y difusión; el área, ancho, alto y giro. El ambiente tiene intensidad de reflejos, rotación y exposición independientes. La órbita opcional completa una vuelta en 15 segundos y se pausa con el visor. Sólo la principal proyecta sombras; una luz de área no proyecta sombra directa en este renderizador.

En Textura se elige **Piedra tallada actual** o **Giraffe · Original 004_v2**. Los nueve ajustes son escala, relieve de superficie, detalle escaneado, vetas, rugosidad, cantidad y tamaño del mineral dorado, motas y brillo. El 100% corresponde a los valores de la base elegida. Los ajustes Giraffe se guardan automáticamente. Restablecer afecta sólo a su panel; cambiar la textura mantiene la luz y el tallado.

El PNG incluye el material editado y la iluminación. El GLB conserva la geometría y hornea los valores reales de rugosidad y metal, además de los uniformes de textura; no incluye la iluminación del estudio. `exports/giraffe-bio-original-004-v2.png` es una muestra con los valores originales.

`pnpm check:giraffe` comprueba cambios de píxeles para los nueve controles de textura, las seis luces y sus cuatro tipos, ambiente, exposición y foco. También comprueba independencia de luz y material, guardado tras recargar y que cambiar rugosidad modifique sólo el mapa correspondiente del GLB.


## Inspector ampliado — controles compatibles con Blender

Siete pestañas junto al visor: **Luz, Textura, Material, Cámara, Objeto, Render y Textura avanzada**. Los controles actúan en tiempo real, tienen valores numéricos, restablecimiento por panel y guardado automático en este navegador. El esquema anterior de cuatro luces mantiene su guardado manual.

- **Luz:** las seis luces Giraffe suman temperatura de color (1000–12000 K), sombras por fuente, intensidad, filtro, sesgo, sesgo de normales y resolución de 512 a 4096 px. Puntual y Foco suman distancia de corte y caída. Área conserva ancho, alto y giro; no proyecta sombra directa en este visor.
- **Material de piedra:** tinte base, rugosidad, metal, IOR, especular, anisotropía, recubrimiento, brillo superficial, transmisión, espesor y absorción, película fina, emisión, alfa y doble cara. La rugosidad y el metal propios se habilitan con su casilla; al restablecer se recuperan los valores de la piedra.
- **Textura avanzada:** capa opcional sobre la base actual con paleta mineral, vetas, grano, mezcla entre caras, oclusión, pirita, inclusiones, forma del depósito dorado y marcas direccionales de relieve. Comienza apagada para conservar el aspecto elegido. Los controles de oro necesitan activar oro o motas en Textura para hacerse visibles en la piedra.
- **Cámara:** perspectiva u ortográfica, focal y sensor en perspectiva, zoom, desplazamiento de encuadre, distancia, giro, elevación, rotación, punto de mira y planos de recorte. Arrastrar el visor actualiza los valores; escribirlos detiene la inercia previa.
- **Objeto:** ubicación, rotación y escala por eje. El escalado se mantiene al redimensionar o descargar; no se compensa automáticamente con la cámara.
- **Render:** AgX, ACES Filmic, Neutral, Reinhard o Lineal; exposición en EV, fuerza del entorno, fondo de estudio y grano, calidad del visor, formatos para redes y tamaño PNG personalizado hasta 4096 px por lado. Los colores del fondo se usan en Escultura. Cambiar la proporción de salida reencuadra la pieza conservando ángulo y zoom.

**Descargar ajustes .json** guarda una descripción de la escena con los controles de los paneles, luz, pieza y profundidad. Es una copia de los valores, no un archivo `.blend` ni un importador de escenas. El PNG conserva la apariencia; el GLB hornea la piedra a mapas e incluye los acabados físicos admitidos por glTF, además de las transformaciones del objeto. Cámara y render se guardan como metadatos del GLB, no como una cámara o un motor de render activo.

Este inspector usa el motor en tiempo real de Three.js. Los nombres de material se corresponden con conceptos de Principled; sus valores y resultados no son idénticos a Blender. No implementa Cycles, editor de nodos, dispersión subsuperficial, profundidad de campo, compositing ni todos los paneles de Blender. No hay controles simulados para esas funciones.

`src/parameters/` contiene los paneles y la aplicación de estos ajustes. `pnpm check:parameters` comprueba cambios de píxeles, cámaras, exportación PNG personalizada, extensiones físicas y transformaciones del GLB, JSON y persistencia. Se complementa con `check:giraffe` y `check:sculpture`.
