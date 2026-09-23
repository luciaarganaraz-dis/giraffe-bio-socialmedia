# Giraffe Bio — piezas para social media

- Este repositorio es un estudio para producir piezas de redes. La prioridad es el encuadre, el material, el movimiento y la exportación; la diseñadora pidió no dedicar pases a distintas resoluciones de interfaz.
- El logo parte del SVG original proporcionado, conservando las curvas, la tipografía y las cinco piezas del isotipo. No reemplazarlo por texto de una fuente.
- Piedra es el acabado inicial: usa el shader, los mapas y la iluminación del hero del repositorio Giraffe bio (look 004_v2, revisión 97e5551). La copia vive en src/stone y public/rock; los dos proyectos siguen siendo independientes.
- El PNG es el render de la escena. Para GLB se hornea el material a mapas PBR de 2048 px para conservar las texturas fuera de Three.js; el grano más fino se suaviza al hornear. El GLB no incluye luces ni cámara.
- El servidor local corre en http://127.0.0.1:5187.
