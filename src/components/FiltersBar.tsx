import React, { useState, useRef, useEffect, memo } from 'react';
import { SlidersHorizontal, Home, Search, Info, X, ChevronDown, Check, DollarSign, Plus } from 'lucide-react';
import { PRICE_RANGES } from '../config/filters';

interface FiltersBarProps {
  uniqueLocations: string[];
  selectedPropertyType: string;
  selectedPriceRange: string;
  searchQuery: string;
  customMinPrice: string;
  customMaxPrice: string;
  filteredCount: number;
  totalCount: number;
  onPropertyTypeChange: (v: string) => void;
  onPriceRangeChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onCustomMinChange: (v: string) => void;
  onCustomMaxChange: (v: string) => void;
  onClearFilters: () => void;
  role?: 'client' | 'admin';
  onAddProperty?: () => void;
}

interface SelectOption {
  value: string;
  label: string;
  emoji?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  icon: React.ReactNode;
  placeholder: string;
  accentColor?: 'amber' | 'slate';
}

// rerender-memo: memoized so parent re-renders don't cascade into dropdowns
const CustomSelect = memo(function CustomSelect({ value, options, onChange, icon, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // client-event-listeners: AbortController is cleaner than remove+handler ref
    const controller = new AbortController();
    document.addEventListener(
      'mousedown',
      (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      },
      { signal: controller.signal }
    );
    return () => controller.abort();
  }, []);

  const selected = options.find(o => o.value === value);
  const label = selected ? selected.label : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 rounded-xl border py-2 pl-3 pr-2.5 text-xs cursor-pointer transition-all focus:outline-none
          ${open
            ? 'border-amber-400 bg-white ring-2 ring-amber-400/20 shadow-sm'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
          }`}
      >
        <span className="flex-shrink-0 text-amber-500">{icon}</span>
        <span className={`flex-1 text-left truncate ${value === options[0]?.value ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
          {selected?.emoji ? `${selected.emoji} ` : ''}{label}
        </span>
        <ChevronDown
          className={`flex-shrink-0 h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-amber-500' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open ? (
        <div
          className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/10 overflow-hidden"
          style={{ animation: 'selectDropIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Panel header line */}
          <div className="h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />

          <div className="py-1.5 max-h-56 overflow-y-auto custom-scrollbar">
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-all duration-100 cursor-pointer group
                    ${isSelected
                      ? 'bg-amber-50 text-amber-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                    ${i === 0 ? '' : 'border-t border-slate-50'}
                  `}
                >
                  {/* Check indicator */}
                  <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-amber-400 shadow-sm shadow-amber-300'
                      : 'border border-slate-200 group-hover:border-slate-300'
                    }`}
                  >
                    {isSelected ? <Check className="h-2.5 w-2.5 text-white stroke-[3]" /> : null}
                  </span>

                  <span className="flex-1 truncate font-medium">
                    {opt.emoji ? <span className="mr-1">{opt.emoji}</span> : null}
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
});



/**
 * Barra de filtros de propiedades.
 * Extraída de App.tsx para reducir el tamaño del archivo principal.
 *
 * rendering-hoist-jsx: the @keyframes + scrollbar CSS moved to index.css
 * so it doesn't get injected into the DOM on every render.
 */
const propertyTypeOptions: SelectOption[] = [
  { value: 'all', label: 'Todos los tipos' },
  { value: "anexo", label: "Anexo" },
  { value: 'casa', label: 'Casa' },
  { value: 'townhouse', label: 'Town House' },
  { value: 'departamento', label: 'Apartamento' },
  { value: 'parcela', label: 'Parcela' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'local', label: 'Local Comercial' },
  { value: "oficina", label: "Oficina" },
];

const priceOptions: SelectOption[] = [
  { value: 'all', label: 'Cualquier presupuesto' },
  ...PRICE_RANGES.map(range => ({ value: range.id, label: range.label })),
  { value: 'custom', label: 'Monto personalizado', emoji: '💰' },
];
const DOLLAR_ICON = <DollarSign className="h-3.5 w-3.5" />;
const HOME_ICON = <Home className="h-3.5 w-3.5" />;

export default function FiltersBar({
  uniqueLocations,
  selectedPropertyType,
  selectedPriceRange,
  searchQuery,
  customMinPrice,
  customMaxPrice,
  filteredCount,
  totalCount,
  onPropertyTypeChange,
  onPriceRangeChange,
  onSearchChange,
  onCustomMinChange,
  onCustomMaxChange,
  onClearFilters,
  role = 'client',
  onAddProperty,
}: FiltersBarProps) {
  const hasActiveFilters =
    selectedPropertyType !== 'all' || selectedPriceRange !== 'all' || searchQuery !== '';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };
  const handleCustomMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomMinChange(e.target.value);
  };
  const handleCustomMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomMaxChange(e.target.value);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
      {/* Header section with Filter Title and optional Add Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(15,23,43,0.06)' }}>
              <SlidersHorizontal className="h-4 w-4" style={{ color: '#0f172b' }} />
            </div>
            <h2 className="font-display font-bold text-slate-900">
              Filtros de Propiedades
            </h2>
          </div>
          {/* Add property button for admin */}
          {role === 'admin' && onAddProperty && (
            <button
              type='button'
              onClick={onAddProperty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow hover:-translate-y-0.5 transition-transform"
              style={{ background: '#ffb900' }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publicar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter inputs grid */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o zona..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="search-query"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all hover:border-slate-300 hover:bg-white"
          />
        </div>

        {/* Location custom select */}
        <CustomSelect
          value={selectedPropertyType}
          options={propertyTypeOptions}
          onChange={onPropertyTypeChange}
          icon={HOME_ICON}
          placeholder="Todos los tipos"
        />

        {/* Price range custom select */}
        <CustomSelect
          value={selectedPriceRange}
          options={priceOptions}
          onChange={onPriceRangeChange}
          icon={DOLLAR_ICON}
          placeholder="Cualquier presupuesto"
        />

        {/* Custom price range inputs */}
        {selectedPriceRange === 'custom' ? (
          <>
            <div className="relative sm:col-start-2">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold pointer-events-none">Min $</span>
              <input
                type="number"
                placeholder="0"
                value={customMinPrice}
                onChange={handleCustomMinChange}
                aria-label="custom-min-price"
                className="w-full rounded-xl border border-amber-200 bg-amber-50 py-2 pl-12 pr-3 text-xs text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold pointer-events-none">Max $</span>
              <input
                type="number"
                placeholder="Sin límite"
                value={customMaxPrice}
                onChange={handleCustomMaxChange}
                aria-label="custom-max-price"
                className="w-full rounded-xl border border-amber-200 bg-amber-50 py-2 pl-12 pr-3 text-xs text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Active filter indicator */}
      {hasActiveFilters ? (
        <div className="mx-3 mb-3 flex items-center justify-between text-[11px] bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
          <span className="text-amber-900 font-medium flex items-center gap-1.5">
            <Info className="h-3 w-3" />
            Mostrando {filteredCount} de {totalCount} propiedades
          </span>
          <button
            type='button'
            onClick={onClearFilters}
            className="text-amber-700 font-bold hover:underline ml-3 flex items-center gap-1 cursor-pointer"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        </div>
      ) : null}
    </div>
  );
}
