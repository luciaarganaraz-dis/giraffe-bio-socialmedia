import { color, number as n, select, type ParameterGroup } from './panel'
export const CAMERA_DEFAULTS = { projection: 'orthographic', focal: 50, sensor: 35, zoom: 1, distance: 20, azimuth: 0, elevation: 0, roll: 0, targetX: 0, targetY: 0, targetZ: 0, shiftX: 0, shiftY: 0, near: .1, far: 100 }
export type CameraSettings = typeof CAMERA_DEFAULTS
export const CAMERA_GROUPS: ParameterGroup[] = [
  { title: 'Lente y encuadre', fields: [select('projection', 'Proyección', { orthographic: 'Ortográfica', perspective: 'Perspectiva' }), n('focal', 'Distancia focal', 12, 200, 1, 'mm'), n('sensor', 'Ancho del sensor', 10, 70, 1, 'mm'), n('zoom', 'Zoom', .2, 5), n('shiftX', 'Desplazamiento horizontal', -1, 1), n('shiftY', 'Desplazamiento vertical', -1, 1)] },
  { title: 'Posición y orientación', fields: [n('distance', 'Distancia a la piedra', 4, 60, .1), n('azimuth', 'Giro horizontal', -180, 180, 1, '°'), n('elevation', 'Elevación', -85, 85, 1, '°'), n('roll', 'Rotación del encuadre', -180, 180, 1, '°'), n('targetX', 'Apuntar X', -5, 5), n('targetY', 'Apuntar Y', -5, 5), n('targetZ', 'Apuntar Z', -5, 5)] },
  { title: 'Recorte de cámara', fields: [n('near', 'Plano cercano', .01, 10), n('far', 'Plano lejano', 20, 200, 1)] },
]
export const OBJECT_DEFAULTS = { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1 }
export type ObjectSettings = typeof OBJECT_DEFAULTS
export const OBJECT_GROUPS: ParameterGroup[] = [
  { title: 'Ubicación', fields: [n('x', 'Ubicación X', -8, 8), n('y', 'Ubicación Y', -8, 8), n('z', 'Ubicación Z', -8, 8)] },
  { title: 'Rotación', fields: [n('rotationX', 'Rotación X', -180, 180, 1, '°'), n('rotationY', 'Rotación Y', -180, 180, 1, '°'), n('rotationZ', 'Rotación Z', -180, 180, 1, '°')] },
  { title: 'Escala', fields: [n('scaleX', 'Escala X', .1, 3), n('scaleY', 'Escala Y', .1, 3), n('scaleZ', 'Escala Z', .1, 3)] },
]
export const RENDER_DEFAULTS = { tone: 'agx', exposure: 0, environment: 100, backgroundTop: '#525252', backgroundBottom: '#a1a1a1', backgroundGrain: .025, quality: 2, width: 2160, height: 2700, outputScale: 100, outputPreset: 'auto' }
export type RenderSettings = typeof RENDER_DEFAULTS
export const RENDER_GROUPS: ParameterGroup[] = [
  { title: 'Gestión de color', fields: [select('tone', 'Transformación de vista', { agx: 'AgX', aces: 'ACES Filmic', neutral: 'Neutral', reinhard: 'Reinhard', linear: 'Lineal' }), n('exposure', 'Exposición', -5, 5, .1, 'EV'), n('environment', 'Fuerza del entorno', 0, 300, 1, '%')] },
  { title: 'Fondo de estudio', fields: [color('backgroundTop', 'Color superior'), color('backgroundBottom', 'Color inferior'), n('backgroundGrain', 'Grano del fondo', 0, .1, .001)] },
  { title: 'Salida PNG', note: 'La imagen se vuelve a encuadrar con esta proporción. Conserva el ángulo y el zoom.', fields: [select('outputPreset', 'Formato de salida', { auto: 'Según la pieza', portrait1080: 'Vertical · 1080 × 1350', portrait2160: 'Vertical · 2160 × 2700', square: 'Cuadrado · 1080 × 1080', story: 'Historia · 1080 × 1920', custom: 'Personalizado' }), n('width', 'Ancho de salida', 256, 4096, 1, 'px'), n('height', 'Alto de salida', 256, 4096, 1, 'px'), n('outputScale', 'Escala de salida', 25, 100, 1, '%'), n('quality', 'Calidad del visor', 1, 2, .25, '×')] },
]
