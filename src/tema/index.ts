/** Tokens aprobados de DESIGN.md y del brand board; consumidos por los estilos. */
export const colores = {
  fondo: '#0B1020',
  superficie: '#171E32',
  acento: '#B7A0FF',
  texto: '#F5F6FA',
  secundario: '#AAB3C7',
  borde: '#303A54',
  'por-ver': '#AAB3C7',
  viendo: '#F3C77C',
  vista: '#92D7B5',
  error: '#FF9FAE',
} as const;

export const espacios = {
  'esp-1': 4,
  'esp-2': 8,
  'esp-3': 12,
  'esp-4': 16,
  'esp-5': 24,
  'esp-6': 32,
  'esp-7': 48,
} as const;

export const radios = {
  'radio-control': 14,
  'radio-tarjeta': 16,
  'radio-poster': 18,
  'radio-pildora': 999,
} as const;

/** No son estilos TextStyle: preservar 750 sin elegir un reemplazo nativo. */
export const tipografia = {
  familia: 'sistema',
  tituloPantalla: { tamano: 32, interlinea: 39, peso: 800 },
  // Peso 700 aprobado para Mi año en cine; sin nueva interlínea inventada.
  tituloTelefono: { tamano: 30, tamanoEstrecho: 28, peso: 700 },
  seccion: { tamano: 24, interlinea: 30, peso: 700 },
  tituloTarjeta: { tamano: 18, interlinea: 25, peso: 'negrita' },
  cuerpo: { tamano: 16, interlinea: 26, peso: 'regular' },
  // DESIGN deja el peso de etiqueta a la jerarquía del componente.
  etiqueta: { tamano: 13, interlinea: 20 },
  auxiliar: { tamano: 12, interlinea: 17, peso: 'regular' },
  meses: { tamano: 12, interlinea: 17, peso: 'regular' },
  datoTarjeta: { tamano: 22, interlinea: 28, peso: 750 },
  datoExpresivo: { tamano: 48, interlinea: 53, peso: 800 },
  totalProtagonista: { tamano: 64, interlinea: 70, peso: 800 },
  wordmark: { tamanoBoard: 26, tamanoTelefono: 20 },
} as const;

export const accesibilidad = {
  tactil: 44,
  contrasteTextoMinimo: 4.5,
  foco: { grosor: 3, separacion: 4 },
} as const;
