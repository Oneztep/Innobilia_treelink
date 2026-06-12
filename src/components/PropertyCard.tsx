import React, { memo } from 'react';
import { Property } from '../types';
import {
  MapPin,
  BedDouble,
  Bath,
  Square,
  Share2,
  MessageSquare,
  Compass,
  ChevronRight,
  Edit,
  Trash2,
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  isSelected: boolean;
  role: 'client' | 'admin';
  animationIndex: number;
  onClick: (p: Property) => void;
  onShare: (p: Property, e: React.MouseEvent) => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onWhatsApp: (p: Property, e: React.MouseEvent) => void;
  onRegisterClick: (id: string) => void;
}

// Static fallback rendered inline to avoid extra DOM manipulation
const ImageFallback = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-stone-300">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
    <span className="text-[9px] font-mono uppercase tracking-wider">Sin imagen</span>
  </div>
);

/**
 * Memoized property card component.
 *
 * Implements `rerender-memo`: extracted into its own memoized component
 * to prevent re-rendering ALL cards when only one card's selection state changes.
 * Without memo, selecting any property re-renders the entire list.
 */
const PropertyCard = memo(function PropertyCard({
  property: p,
  isSelected,
  role,
  animationIndex,
  onClick,
  onShare,
  onEdit,
  onDelete,
  onWhatsApp,
  onRegisterClick,
}: PropertyCardProps) {
  // Cap stagger at 6 classes
  const staggerClass = `fade-up fade-up-${Math.min(animationIndex + 1, 6)}`;

  return (
    <article
      onClick={() => onClick(p)}
      className={`
        ${staggerClass}
        group relative overflow-hidden flex flex-col sm:flex-row
        bg-white/80 backdrop-blur-sm rounded-2xl border
        transition-all duration-300
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5
        cursor-pointer
        ${isSelected
          ? 'border-transparent shadow-md property-card-selected'
          : 'border-stone-200/70 hover:border-stone-300'
        }
      `}
    >
      {/* Image thumbnail */}
      <div className="relative w-full sm:w-40 h-28 sm:h-auto overflow-hidden shrink-0 bg-stone-100 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
        <img
          src={p.images[0]}
          alt={p.title}
          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = 'none';
            const wrapper = document.createElement('div');
            wrapper.className = 'w-full h-full flex flex-col items-center justify-center gap-1 text-stone-300';
            wrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span style="font-size:9px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em">Sin imagen</span>`;
            el.parentElement?.appendChild(wrapper);
          }}
        />
        {/* Price badge */}
        <div className="price-badge absolute top-2.5 left-2.5 px-2.5 py-1 bg-stone-900/92 backdrop-blur-sm text-[#c9a84c] font-mono text-[10px] font-bold rounded-lg shadow-lg border border-stone-700/50">
          ${p.price.toLocaleString()}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display font-semibold text-stone-900 text-[15px] leading-snug line-clamp-1 group-hover:text-[#8a6d2f] transition-colors">
              {p.title}
            </h4>
            <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-1">
            <MapPin className="h-3 w-3 text-[#c9a84c] shrink-0" />
            <span className="line-clamp-1">{p.address}</span>
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-[10px] text-stone-400 font-mono">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" />
            {p.rooms} Rec.
          </span>
          <span className="flex items-center gap-1 border-l border-stone-200 pl-3">
            <Bath className="h-3 w-3" />
            {p.bathrooms} Baños
          </span>
          <span className="flex items-center gap-1 border-l border-stone-200 pl-3">
            <Square className="h-3 w-3" />
            {p.area} m²
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => onWhatsApp(p, e)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-lg border border-emerald-100/80 transition-colors flex items-center gap-1 cursor-pointer"
              title="Contactar vía WhatsApp"
            >
              <MessageSquare className="h-3 w-3 text-emerald-500" />
              WhatsApp
            </button>

            {p.virtualTourUrl !== undefined && p.virtualTourUrl !== null && p.virtualTourUrl !== '' ? (
              <button
                onClick={(e) => { e.stopPropagation(); onClick(p); }}
                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-semibold rounded-lg border border-sky-100/80 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Compass className="h-3 w-3 text-sky-500" />
                Tour 3D
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => onShare(p, e)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Compartir propiedad"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            {role === 'admin' ? (
              <div className="flex items-center border-l border-stone-200 pl-1.5 ml-0.5 gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: '#cc9a00' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,185,0,0.1)';
                    (e.currentTarget as HTMLElement).style.color = '#ffb900';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#cc9a00';
                  }}
                  title="Editar"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => onDelete(p.id, e)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
});

export default PropertyCard;
