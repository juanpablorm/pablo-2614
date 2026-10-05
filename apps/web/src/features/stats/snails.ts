/** Catálogo fijo de los 6 caracoles (CONTEXT.md, P5). El orden es el de la gráfica de barras. */
export const SNAILS = [
  { id: 'carloscol', name: 'Carloscol', color: '#F07E13' },
  { id: 'conchosio', name: 'Conchosio', color: '#7A5634' },
  { id: 'baberto', name: 'Baberto', color: '#58613A' },
  { id: 'lentejo', name: 'Lentejo', color: '#8F7358' },
  { id: 'espirolio', name: 'Espirolio', color: '#D9A52E' },
  { id: 'snailio', name: 'Snailio', color: '#B95332' },
] as const;

export type Snail = (typeof SNAILS)[number];
export type SnailId = Snail['id'];

const snailsById = new Map<string, Snail>(SNAILS.map((snail) => [snail.id, snail]));

export function getSnail(id: SnailId): Snail {
  // Todo SnailId existe en el catálogo; el tipo lo garantiza.
  return snailsById.get(id) as Snail;
}

export function isSnailId(id: string): id is SnailId {
  return snailsById.has(id);
}
