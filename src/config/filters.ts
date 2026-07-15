/**
 * Rangos de precio predefinidos para el filtro de propiedades.
 * Los IDs deben coincidir con los `value` de priceOptions en FiltersBar.tsx.
 */
export interface PriceRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: 'under-60k', label: 'Menor a $60k USD', min: 0, max: 59_999 },
  { id: '60k-100k', label: '$60k – $100k USD', min: 60_000, max: 100_000 },
  { id: 'above-100k', label: 'Mayor a $100k USD', min: 100_001, max: Infinity },
];