# Giraffe Bio — piezas para social media

- Este repositorio es un estudio para producir piezas de redes. La prioridad es el encuadre, el material, el movimiento y la exportación; la diseñadora pidió no dedicar pases a distintas resoluciones de interfaz.
- El logo parte del SVG original proporcionado, conservando su tipografía y las cinco piezas del isotipo. No reemplazarlo por texto de una fuente.
- La referencia vigente es la letra A de roca gris erosionada sobre negro. La diseñadora pidió volumen de piedra real: caras con relieve, contornos irregulares y bordes gastados. Reemplaza la primera dirección de textura mineral oscura con pirita.
- Piedra es el acabado inicial. `sculpt.ts` subdivide y desplaza caras, dorso y paredes; el acabado gris y las luces están en `carved-look.ts`. Los otros materiales conservan la extrusión lisa. Profundidad inicial: 78.
- El shader y los mapas del repositorio Giraffe bio (revisión 97e5551) siguen como base para el detalle fino; el look original queda en `look.ts` como procedencia, no es el acabado activo. Los proyectos siguen siendo independientes.
- El fondo es una pared de piedra gris oscura con relieve, iluminada por las mismas luces y receptora de la sombra del logo. Sigue detrás de la pieza al girar la cámara.
- El panel «Luz del estudio» permite arrastrar la luz principal y ajustar intensidad, relleno, contraluz y exposición. La posición se interpreta respecto de la cámara; los ajustes se mantienen al cambiar material o pieza. «Restablecer luz» recupera el estado inicial sin cambiar el encuadre.
- El PNG es el render de la escena con fondo de piedra por defecto (transparencia opcional); conserva la luz elegida. GLB conserva el volumen erosionado y hornea el acabado a mapas PBR de 2048 px; el grano más fino se suaviza al hornear. No incluye luces ni cámara.
- El servidor local corre en http://127.0.0.1:5187.
