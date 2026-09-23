# Revisión del estudio 3D

Verificado el 23 de septiembre de 2026.

- Escritorio 1440 px, tablet 768 px y móvil 390 px: capturas revisadas, sin desborde horizontal.
- Movimiento reducido: composición estática; no se siguen pintando fotogramas al quedar quieta.
- 17 mallas en el logo completo y 5 en el isotipo, generadas del SVG original.
- Redimensionado 1440 → 768 → 390 → 1440: un solo lienzo y sin desbordes.
- Giro manual, zoom, controles por teclado, cambio de pieza y material comprobados.
- PNG transparente a 3000 × 1500 y PNG con fondo opaco descargados.
- GLB del logo y del isotipo descargados; estructura glTF 2.0 válida y volumen en Z.
- Sin errores de consola en las cuatro composiciones.
- TypeScript y compilación de producción correctos.

Las capturas y el informe con las medidas se regeneran con `pnpm shots` en `.review/`.
El modelo GLB incluye geometría y materiales; la iluminación y la cámara pertenecen al estudio del navegador.
