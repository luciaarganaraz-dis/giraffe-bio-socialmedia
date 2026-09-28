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
