/**
 * Colores de las gráficas. Recharts los escribe como atributos SVG, que no leen variables CSS,
 * así que aquí van literales. Deben coincidir con los tokens de styles/index.css.
 */
export const CHART_COLORS = {
  /** --color-primary: barras. */
  bar: '#F07E13',
  /** --color-highlight: líderes. */
  leader: '#D9A52E',
  /** --color-text: ejes y etiquetas. */
  axis: '#432304',
  /** --color-text-muted: valores del eje. */
  muted: '#7A5634',
  /** --color-secondary: apuestas ganadas. */
  won: '#58613A',
  /** --color-accent: apuestas perdidas. */
  lost: '#B95332',
} as const;
