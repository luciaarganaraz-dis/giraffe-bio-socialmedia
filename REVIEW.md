# Revisión de la piedra esculpida

Verificado el 23 de septiembre de 2026.

- Referencia vigente: letra A de roca gris erosionada. Se reemplazó la dirección de mineral oscuro con pirita por relieve físico y piedra gris mate.
- Logo e isotipo revisados en el navegador local. No se amplió esta pasada a otras resoluciones de interfaz por pedido de la diseñadora.
- 17 mallas en el logo completo y 5 en el isotipo, generadas del SVG original.
- Caras subdivididas y desplazadas: variación frontal mayor a 0.12 unidades de escena, comprobada antes de exportar. La erosión afecta también el contorno y las paredes interiores.
- Exportación PNG transparente 3000 × 1500 y GLB con 3 mapas PBR incorporados verificada.
- GLB abierto con GLTFLoader y vuelto a renderizar con material neutro sin texturas: el relieve sigue presente. El grano fino del horneado es más suave que el shader vivo.
- Cambio entre piedra, grafito, cobre y marfil; logo/isotipo y profundidad comprobados. Los acabados lisos recuperan su geometría sin erosión.
- Movimiento reducido mantiene la composición estática. Giro y pausa disponibles en el estudio.
- Sin errores de consola. TypeScript y compilación de producción correctos.

`pnpm check:stone` regenera capturas en `.review/stone-*.png` y actualiza los archivos de piedra en `exports/`. `stone-geometry.png` muestra únicamente la geometría con un material neutro.

El GLB incluye la geometría y sus materiales; la iluminación, la cámara y el fondo pertenecen al estudio. La pieza de piedra pesa aproximadamente 35 MB por el relieve subdividido y los mapas incorporados.

## Fondo de piedra y control de luz

- Fondo de piedra con relieve y sombras propias de la escena, revisado en el navegador y en el PNG de 3000 × 1500.
- Punto de luz arrastrable y accesible por flechas; intensidad, relleno, contraluz, exposición y restablecimiento comprobados.
- Medición de los píxeles del visor: luminosidad media inicial 75.15, sin luces 0, intensidad al 180% 97.17. Restablecer devuelve exactamente 75.15.
- Exportación con fondo: alfa 255 en la esquina. Exportación transparente: alfa 0. Ambas restauran el fondo y el encuadre del visor.
- Los controles siguen aplicados al cambiar a cobre y al isotipo. Sin errores de consola.
- `pnpm check:lighting` y compilación de producción correctos. El detalle numérico está en `.review/lighting-report.json`.

## Escultura mineral — 28 de septiembre de 2026

- Una piedra con un solo isologo original, revisada en el navegador. Tres partes hundidas y dos salientes; un mismo material de roca en toda la figura. Se eliminó la segunda aplicación lateral.
- Una malla obtenida por sustracción y unión de volúmenes. En profundidad 78, los fondos están entre 0.42 y 0.61 unidades por debajo de la roca original y los relieves entre 0.44 y 0.52 por encima, medidos con rayos sobre las cinco partes.
- Profundidades 24, 78 y 130 comprobadas: los vaciados y los relieves aumentan en el sentido esperado. Los controles de luz siguen activos.
- PNG 2160 × 2700 comprobado, con fondo gris y variante transparente (alfa 0 en las esquinas).
- GLB reabierto y revisado: una malla, un material y tres mapas PBR. Las mediciones de cavidades y relieves coinciden con la vista local. Aproximadamente 11 MB.
- El selector de materiales aparece en Logo completo e Isotipo; Escultura conserva un material continuo. Ambos modos anteriores mantienen sus 17 y 5 mallas.
- Movimiento reducido revisado como composición estática. `pnpm check:sculpture`, TypeScript y compilación de producción correctos; sin errores de consola en las comprobaciones.
- El GLB conserva geometría y material; el detalle fino del horneado es más suave, especialmente en las paredes estrechas. No incluye el fondo ni la iluminación.

## Luz de la referencia — 28 de septiembre de 2026

- Principal blanca rasante desde arriba/derecha; relleno frontal suave, contraluz reducido y sombras completas en la escultura. Fondo gris con más claridad hacia abajo/izquierda.
- Inicio y restablecimiento: posición 80/45, intensidad 100%, relleno 22%, contraluz 35%, exposición 100%. El control sigue respondiendo al arrastre y al teclado.
- Misma geometría y mismo material de piedra. En el encuadre inicial, luminosidad media del frente 17.36 y del lateral iluminado 78.51 (escala 0–255). Sin relleno el frente baja a 1.16; restablecer recupera exactamente el valor inicial.
- PNG de escultura actualizado y revisado. La exportación transparente mantiene el alfa y restaura el fondo. La iluminación pertenece al estudio y al PNG; no cambia el material del GLB.
- `pnpm check:sculpture`, `pnpm check:lighting`, `pnpm check` y `pnpm build` correctos. Sin errores de consola. Los controles también funcionan al volver a Logo completo e Isotipo.
- Movimiento conservado: giro lento con flotación sutil; composición estática con movimiento reducido.

## Textura de la escultura — 28 de septiembre de 2026

- Fracturas del mapa de roca ampliadas 4.2 veces; relieve fino de grano desactivado y moteado mineral eliminado. Rugosidad mate con variación entre las caras. El bloque y el isologo usan el mismo material.
- Se conservaron la geometría del tallado y la configuración de luz. Revisión visual del local, PNG y GLB reabierto.
- PNG y GLB regenerados; este último incorpora los tres mapas del nuevo acabado y pesa aproximadamente 9.9 MB.
- `pnpm check:sculpture` confirma cavidades, salientes, controles de luz y descargas. Sin errores de consola. TypeScript y compilación de producción comprobados.
- Movimiento conservado: giro lento y flotación sutil.

## Forma irregular de la piedra — 28 de septiembre de 2026

- Silueta asimétrica, parte superior inclinada, dorso más estrecho y espesor desigual. Cinco pérdidas de material de tamaños diferentes quiebran los bordes y continúan a través de las caras.
- La variación de espesor en cinco cortes centrales pasó de 0.29 a 0.54 unidades de escena. Las concavidades ocupan un 16.04% de la envolvente convexa de la roca sin tallar, frente al 13.33% anterior. Medición guardada en `.review/shape-report.json`.
- Se conservaron las cinco formas originales del isologo, con tres hundidas y dos salientes. Las mediciones en profundidades 24, 78 y 130 siguen pasando; el GLB reabierto conserva los vaciados.
- Local, PNG y GLB revisados visualmente. Una malla y un material; GLB de aproximadamente 9.7 MB. Luz y textura conservadas.
- `pnpm check:sculpture`, `pnpm check` y `pnpm build` correctos, sin errores de consola.
- Movimiento conservado: giro lento con flotación sutil.

## Costados fracturados — 28 de septiembre de 2026

- Corrección centrada en el espesor: el costado del bloque tiene planos quebrados, salientes y una hendidura oblicua. Las paredes del isologo, tanto hundidas como salientes, también varían a lo largo de su profundidad. El frente mantiene la identidad del símbolo.
- Revisión del local y del GLB de perfil, con piedra y con material neutro sin texturas. Capturas: `.review/sculpture-side.png` y `.review/sculpture-geometry.png`.
- Trece cortes medidos en cada pared: desviación máxima respecto de un lateral recto de 0.209 unidades en la roca, 0.042 en el relieve y 0.071 en el vaciado. Las mismas mediciones coinciden al reabrir el GLB; no dependen del mapa de textura.
- Las profundidades 24, 78 y 130 conservan tres vaciados y dos relieves. Una malla, un material y tres mapas PBR. PNG y GLB actualizados; este último pesa aproximadamente 12.5 MB.
- `pnpm check:sculpture`, `pnpm check` y `pnpm build` correctos. Controles de luz, transparencia y exportación comprobados, sin errores de consola.
- Movimiento conservado: giro lento con flotación sutil.

## Panel de luz completo — 28 de septiembre de 2026

- 38 ajustes: cuatro luces independientes, posiciones en tres ejes, color, intensidad, encendido y sombras por luz. Foco con apertura, difusión y punto de enfoque. Ambiente, giro del entorno, exposición, intensidad y suavidad de sombras; luces fijas o relativas a la cámara.
- Cuatro combinaciones de partida y guardado local de una configuración. Deslizadores, valores numéricos exactos y punto arrastrable para la principal. Panel con accesos directos y desplazamiento propio; controles inspeccionados en el navegador local.
- Medidas sobre píxeles renderizados confirman cambios de cada fuente aislada, color, posición, apertura/difusión/enfoque, sombras por luz y suavidad. La diferencia media con/sin suavidad es 0.408 sobre 255; con luces fijas o relativas a cámara tras girarla, 6.837. Detalle en `.review/light-studio-report.json`.
- Guardar, restablecer, recuperar y recargar comprobados. La entrada numérica permite escribir valores completos y limita los valores fuera de rango. PNG con luz cálida/fría y PNG transparente verificados, sin alterar los ajustes del visor.
- `pnpm check:light-studio`, `pnpm check:lighting`, `pnpm check:sculpture`, `pnpm check` y `pnpm build` correctos; sin errores de consola. La geometría y el GLB permanecen iguales. Las luces pertenecen al estudio y al PNG.
- Movimiento conservado: giro lento con flotación sutil.

## Isologo completo, sin fragmentos tapados — 28 de septiembre de 2026

- Recuperados los contornos originales de las cinco formas del SVG. La erosión de las paredes ya no atraviesa ni tapa sus caras visibles: retira piedra hacia el interior del relieve y hacia el exterior del vaciado. La boca de los vaciados queda libre de la deformación lateral.
- Escala del conjunto ajustada de 1.43 a 1.24 y posición 0.10/0.10, con margen dentro del bloque. Se mantienen tres partes hundidas y dos salientes, el material compartido y los costados fracturados de la piedra.
- Comparación mediante 574 puntos repartidos por las cinco superficies: los 574 alcanzan la cara esperada en profundidades 24, 78 y 130. Repetido sobre el GLB reabierto con el mismo resultado. Captura frontal sin textura en `.review/sculpture-contours.png`.
- Frente, vista de tres cuartos, perfil y exportación revisados visualmente. Las paredes conservan variación física a través del espesor. PNG y GLB actualizados; GLB de aproximadamente 12.2 MB, una malla y un material.
- `pnpm check:sculpture`, `pnpm check` y `pnpm build` correctos, sin errores de consola. Se restauraron en el visor los valores de luz que la diseñadora estaba usando: posición horizontal 50, intensidad 90 y exposición 106.
- Movimiento conservado: giro lento con flotación sutil.


## Isologo completamente hundido — 28 de septiembre de 2026

- Las cinco formas del SVG ahora se sustraen de la roca. Se conserva un único isologo, una malla, un material y los costados fracturados.
- Las cinco superficies quedan por debajo de la piedra en profundidades 24, 78 y 130. A profundidad 78, el vaciado mide entre 0.49 y 0.76 unidades respecto de la roca original. Los 574 puntos del dibujo llegan al fondo esperado; la exportación GLB conserva los mismos resultados.
- Revisados el frente sin textura y el acercamiento del local con la luz de la diseñadora restaurada y profundidad 28. Captura sin controles en `exports/giraffe-bio-isologo-hundido.png` (518 × 550). PNG general de 2160 × 2700 y GLB actualizados, este último de aproximadamente 13.6 MB.
- `pnpm check:sculpture`, `pnpm check` y `pnpm build` correctos. Controles de luz, exportación y transparencia verificados, sin errores de consola en las pruebas.
- Movimiento pausado para la captura; se conserva el giro lento con flotación sutil al activarlo.


## Parámetros del estudio Giraffe original — 28 de septiembre de 2026

- Incorporados los nueve ajustes de textura del Q2 original y su base Original 004_v2. Paleta y parámetros de `LOOK` conservados; la base Piedra tallada actual sigue disponible. Geometría intacta: cinco vaciados, una malla y un material.
- Seis luces editables con los valores originales, tipos Sol/Puntual/Foco/Área, color, potencia, posición y orientación; apertura/difusión del foco y dimensiones/giro del área. Ambiente y exposición independientes. Órbita opcional en 15 segundos, inicialmente apagada. La principal tiene sombras para leer las cavidades; el área no proyecta sombra directa en WebGL.
- Revisión visual en el local y en capturas de ambos paneles. El panel de textura deja el visor disponible durante la edición. Se respetó el alcance de social media sin otra pasada de resoluciones.
- `check:giraffe` verifica cambios reales en los píxeles de cada control, las seis lámparas aisladas por encendido y los cuatro tipos por potencia. Verifica orientación/apertura/difusión del foco, forma del área, ambiente, exposición, independencia de material y luz, y persistencia tras recargar. Sin errores de consola.
- GLB comparado antes y después de bajar rugosidad: cambia el mapa de rugosidad/metal; color y normales permanecen idénticos. Incluye una malla, un material y tres mapas. El PNG de muestra del original es 2160 × 2700.
- Movimiento conservado: giro lento y flotación sutil; las luces pueden completar una órbita de 15 segundos al activar esa opción.

- Comprobaciones finales: `pnpm check`, `pnpm build`, `check:giraffe`, `check:light-studio` y `check:sculpture` correctas. La última repitió las 574 muestras del isologo en tres profundidades y en el GLB, todas intactas.


## Inspector de material, cámara y render — 28 de septiembre de 2026

- Siete pestañas: Luz, Textura, Material, Cámara, Objeto, Render y Textura avanzada. Parámetros físicos y procedurales conectados al render; temperatura y sombras por luz; formatos de imagen y descarga de ajustes JSON. Revisión visual del local y capturas de Material/Cámara en `.review/parameters-*-panel.png`.
- `check:parameters` confirma cambios renderizados de color, rugosidad, metal, IOR, especular, coat, sheen, anisotropía, película fina, transmisión, alfa, emisión, vetas y marcas de relieve. Comprueba temperatura y sombras, perspectiva/focal/giro, encuadre numérico y por arrastre, y persistencia de escala tras redimensionar. Se corrigió la inercia de órbita al introducir valores exactos de cámara.
- PNG personalizado verificado en 320 × 400 px (640 × 800 al 50%). GLB con una malla y un material: IOR 1.7 y coat 0.7 presentes en sus extensiones físicas, escala X 0.8 y posición X 0.3 conservadas. JSON y recarga mantienen valores de material, cámara, objeto y render. Sin errores de consola.
- `check:giraffe` sigue pasando: seis luces, cuatro tipos, nueve ajustes de textura, guardado y mapas exportados. `check:sculpture` vuelve a comprobar los 574 puntos del SVG a tres profundidades y en el GLB: todos llegan al fondo correspondiente; los cinco huecos permanecen completos. Sin errores de consola.
- Alcance: visor de Three.js con controles compatibles con conceptos de Blender, no Cycles ni nodos, subsurface o profundidad de campo. Material y textura avanzados corresponden a los acabados de piedra. El GLB incluye material físico y transformaciones; no luces ni cámara activa. No se agregó otra pasada de resoluciones de interfaz por tratarse de piezas para redes.
- Movimiento conservado: giro lento y flotación sutil; órbita opcional de luces en 15 segundos.
