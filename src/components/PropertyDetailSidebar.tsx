import React, { useState, useEffect, useRef } from 'react';
import { Property } from '../types';
import { Landmark, Compass, BedDouble, Bath, Square, MessageSquare, Phone, MapPin, Sparkles, Navigation, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PropertyDetailSidebarProps {
  property: Property | null;
  onClose: () => void;
  onOpenBooking: () => void;
  onRegisterClick: (id: string) => void;
  /** Callback para abrir el modal de plantilla WhatsApp */
  onWhatsApp?: (p: Property) => void;
}

export default function PropertyDetailSidebar({
  property,
  onClose,
  onOpenBooking,
  onRegisterClick,
  onWhatsApp,
}: PropertyDetailSidebarProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const prevPropertyId = useRef<string | null>(null);
  // Swipe gesture refs (rerender-use-ref-transient-values: transient touch coords)
  const touchStartX = useRef<number | null>(null);

  // Reset carousel when property changes
  useEffect(() => {
    if (property && property.id !== prevPropertyId.current) {
      setActiveImageIndex(0);
      setAnimKey(k => k + 1);
      prevPropertyId.current = property.id;
    }
  }, [property]);

  if (!property) {
    return (
      <div className="hidden lg:flex h-full flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[500px]">
        <div className="rounded-full bg-slate-50 p-6 text-slate-300 mb-4 animate-pulse">
          <Landmark className="h-10 w-10 text-amber-500/40" />
        </div>
        <h3 className="font-display text-base font-bold text-slate-800">Detalles de la Propiedad</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Haz clic en cualquier propiedad disponible para desplegar la información completa, fotos exclusivas y agendar una visita.
        </p>
      </div>
    );
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % property.images.length);
    setAnimKey(k => k + 1);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    setAnimKey(k => k + 1);
  };

  // Touch swipe handlers for mobile carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return; // ignore tiny taps
    if (delta < 0) {
      // swipe left → next image
      setActiveImageIndex(prev => (prev + 1) % property.images.length);
    } else {
      // swipe right → prev image
      setActiveImageIndex(prev => (prev - 1 + property.images.length) % property.images.length);
    }
    setAnimKey(k => k + 1);
  };

  // Construct a premium WhatsApp direct link
  const cleanPhone = property.whatsappNumber.replace(/[^0-9+]/g, '');
  const encodedText = encodeURIComponent(`Hola Innobilia, me interesa recibir más información sobre propiedad "${property.title}" (${property.address}). ¿Está disponible?`);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  const handleWhatsAppClick = () => {
    onRegisterClick(property.id);
    if (onWhatsApp) {
      onWhatsApp(property);
    } else {
      // fallback: open directly
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full shrink-0">


      {showVirtualTour ? (
        /* Immersive Virtual Tour simulator screen overlay */
        <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden group">
          <img
            ref={(el) => {
              if (el) {
                // Apply a slow automatic panning animation to simulate rotation
                el.style.transform = 'scale(1.25) translateX(0)';
              }
            }}
            src={property.virtualTourUrl || property.images[0]}
            alt="Virtual Tour Vista 360"
            className="w-full h-full object-cover transition-transform duration-1000 rotate-0"
          />
          {/* Virtual interface graphic styling */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white flex items-center gap-1 font-mono uppercase font-bold tracking-wider">
            <Compass className="h-3 w-3 text-amber-500 animate-spin" />
            <span>Recorrido 3D Interactivo Activo</span>
          </div>

          <button
            onClick={() => setShowVirtualTour(false)}
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-500 text-white font-semibold py-1 px-2.5 rounded text-[10px] cursor-pointer"
          >
            Salir de Visita 3D
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-200 bg-slate-950/90 py-1.5 px-4 rounded-full text-center max-w-xs shadow">
            Arrastra el visor en la aplicación o haz clic en las puertas para avanzar. No requiere plugin.
          </div>
        </div>
      ) : (
        /* Sliding Image Carousel */
        <div
          className="carousel-container relative aspect-[4/3] w-full bg-slate-900 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            key={animKey}
            src={property.images[activeImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover carousel-img-enter"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Shadow over top & bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />

          {/* Controls */}
          {property.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:bg-slate-950/80 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:bg-slate-950/80 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-slate-900/40 backdrop-blur-sm p-1 rounded-full">
            {property.images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(i);
                  setAnimKey(k => k + 1);
                }}
                className={`h-1.5 rounded-full transition-all ${activeImageIndex === i ? 'w-3.5 bg-amber-500' : 'w-1.5 bg-white/60 hover:bg-white'
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info Sections */}
      <div className="p-5.5 flex-1 overflow-y-auto space-y-4.5">

        {/* Title & Price header */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
              {property.title}
            </h3>
            <span className="text-lg font-bold text-slate-950 shrink-0 font-mono">
              ${property.price.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="line-clamp-1">{property.address || property.location}</span>
          </div>
        </div>

        {/* Home Specs Grid — premium card design */}
        <dl className="grid grid-cols-3 gap-2 rounded-xl" style={{ background: 'rgba(249,246,241,0.6)', border: '1px solid #e7e0d4' }}>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl text-center">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,185,0,0.12)' }}>
              <BedDouble className="h-4 w-4" style={{ color: '#ffb900' }} />
            </div>
            <dt className="text-[10px] uppercase font-mono tracking-wider font-semibold" style={{ color: '#94a3b8' }}>Habitaciones</dt>
            <dd className="text-lg font-black leading-none" style={{ color: '#0f172b' }}>{property.rooms}</dd>
          </div>

          <div className="flex flex-col items-center gap-1 p-3 text-center" style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,185,0,0.08)' }}>
              <Bath className="h-4 w-4" style={{ color: '#cc9a00' }} />
            </div>
            <dt className="text-[10px] uppercase font-mono tracking-wider font-semibold" style={{ color: '#94a3b8' }}>Baños</dt>
            <dd className="text-lg font-black leading-none" style={{ color: '#0f172b' }}>{property.bathrooms}</dd>
          </div>

          <div className="flex flex-col items-center gap-1 p-3 text-center">
            <div className="p-1.5 rounded-lg" style={{ background: '#f1f5f9' }}>
              <Square className="h-4 w-4" style={{ color: '#64748b' }} />
            </div>
            <dt className="text-[10px] uppercase font-mono tracking-wider font-semibold" style={{ color: '#94a3b8' }}>Metros m²</dt>
            <dd className="text-lg font-black leading-none" style={{ color: '#0f172b' }}>{property.area}<span className="text-xs font-medium" style={{ color: '#94a3b8' }}> m²</span></dd>
          </div>
        </dl>

        {/* Property Description */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold block" style={{ color: '#cc9a00' }}>Descripción Residencial</span>
          <p className="text-xs leading-relaxed font-sans text-justify" style={{ color: '#64748b' }}>
            {property.description}
          </p>
        </div>

        {/* Feature Tags list */}
        {property.features.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold flex items-center gap-1" style={{ color: '#cc9a00' }}>
              <Sparkles className="h-3 w-3" style={{ color: '#ffb900' }} />
              <span>Amenidades del Inmueble</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {property.features.map((opt, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}
                >
                  {opt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Call-to-actions row */}
        <div className="space-y-2 pt-2.5">

          {/* Virtual Tour button */}
          <button
            onClick={() => {
              onRegisterClick(property.id);
              setShowVirtualTour(true);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            style={{ background: '#f1f5f9', color: '#334155' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e2e8f0'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f1f5f9'}
          >
            <Compass className="h-4 w-4" style={{ color: '#64748b' }} />
            <span>Ver Visita Virtual 3D</span>
          </button>

          {/* Appointment Form request button */}
          <button
            onClick={() => {
              onRegisterClick(property.id);
              onOpenBooking();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            style={{ background: '#0f172b', color: '#f8fafc' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0f172b'}
          >
            <Navigation className="h-4 w-4" style={{ color: '#ffb900' }} />
            <span>Agendar Cita con Calendario</span>
          </button>

          {/* WhatsApp Direct */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            style={{ background: '#25D366', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1fba57'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#25D366'}
          >
            <MessageSquare className="h-4 w-4 hover:scale-110 smooth-transition" />
            <span>Contacto Directo WhatsApp Corredor</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              Operador: Innobilia Real Estate Group
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
