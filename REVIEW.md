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
