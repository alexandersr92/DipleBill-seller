export interface UnitOption {
  value: string;
  label: string;
  symbol: string;
  aliases?: string[];
}

export interface UnitCategory {
  label: string;
  units: UnitOption[];
}

/**
 * Los valores canónicos están en inglés para alinearse con el backend.
 * Las etiquetas y símbolos se muestran en español.
 * `aliases` mantiene compatibilidad con productos antiguos que se guardaron
 * con valores en español.
 */
export const measurementUnits: UnitCategory[] = [
  {
    label: 'Peso',
    units: [
      { value: 'kg', label: 'Kilogramo', symbol: 'kg', aliases: ['kilogramo', 'kilogram'] },
      { value: 'g', label: 'Gramo', symbol: 'g', aliases: ['gramo', 'gram'] },
      { value: 'lb', label: 'Libra', symbol: 'lb', aliases: ['libra', 'pound'] },
      { value: 'oz', label: 'Onza', symbol: 'oz', aliases: ['onza', 'ounce'] }
    ]
  },
  {
    label: 'Volumen',
    units: [
      { value: 'l', label: 'Litro', symbol: 'L', aliases: ['litro', 'liter', 'litre'] },
      { value: 'ml', label: 'Mililitro', symbol: 'mL', aliases: ['mililitro', 'milliliter'] },
      { value: 'gal', label: 'Galón', symbol: 'gal', aliases: ['galon', 'gallon'] },
      {
        value: 'fl_oz',
        label: 'Onza líquida',
        symbol: 'fl oz',
        aliases: ['onza_liquida', 'fluid_ounce']
      }
    ]
  },
  {
    label: 'Longitud',
    units: [
      { value: 'm', label: 'Metro', symbol: 'm', aliases: ['metro', 'meter', 'metre'] },
      { value: 'cm', label: 'Centímetro', symbol: 'cm', aliases: ['centimetro', 'centimeter'] },
      { value: 'mm', label: 'Milímetro', symbol: 'mm', aliases: ['milimetro', 'millimeter'] },
      { value: 'in', label: 'Pulgada', symbol: 'in', aliases: ['pulgada', 'inch'] },
      { value: 'ft', label: 'Pie', symbol: 'ft', aliases: ['pie', 'foot'] }
    ]
  },
  {
    label: 'Unidades de Conteo',
    units: [
      { value: 'unit', label: 'Unidad', symbol: 'ud', aliases: ['unidad', 'u'] },
      { value: 'pack', label: 'Paquete', symbol: 'pqt', aliases: ['paquete', 'package'] },
      { value: 'pair', label: 'Par', symbol: 'pr', aliases: ['par'] },
      { value: 'dozen', label: 'Docena', symbol: 'dz', aliases: ['docena'] },
      { value: 'lot', label: 'Lote', symbol: 'lt', aliases: ['lote', 'batch'] }
    ]
  },
  {
    label: 'Área',
    units: [
      {
        value: 'm2',
        label: 'Metro cuadrado',
        symbol: 'm²',
        aliases: ['metro_cuadrado', 'sqm', 'square_meter']
      },
      {
        value: 'cm2',
        label: 'Centímetro cuadrado',
        symbol: 'cm²',
        aliases: ['centimetro_cuadrado', 'square_centimeter']
      }
    ]
  },
  {
    label: 'Envases',
    units: [
      { value: 'barrel', label: 'Barril', symbol: 'br', aliases: ['barril'] },
      { value: 'bucket', label: 'Cubeta', symbol: 'cb', aliases: ['cubeta'] },
      { value: 'box', label: 'Caja', symbol: 'cj', aliases: ['caja'] },
      { value: 'roll', label: 'Rollo', symbol: 'rl', aliases: ['rollo'] }
    ]
  }
];

/**
 * Locate a unit option by its canonical value or any of its aliases.
 * Useful when the backend returns alternative spellings (e.g. "unit" instead of "unidad").
 */
export const findUnitByValueOrAlias = (value: string | undefined | null): UnitOption | undefined => {
  if (!value) return undefined;
  const all = measurementUnits.flatMap((category) => category.units);
  return all.find(
    (unit) => unit.value === value || (unit.aliases?.includes(value) ?? false)
  );
};

/**
 * Flat list of every accepted unit identifier (canonical values + aliases).
 * Use this for validation so the backend can send either spelling.
 */
export const allowedUnitValues: string[] = measurementUnits.flatMap((category) =>
  category.units.flatMap((unit) => [unit.value, ...(unit.aliases ?? [])])
);
