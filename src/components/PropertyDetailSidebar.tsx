import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Property } from '../types';
import {
  Landmark, Compass, BedDouble, Bath, Square, MessageSquare,
  MapPin, Sparkles, Navigation, ChevronLeft, ChevronRight, X, Expand,
  ZoomIn, ZoomOut,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PropertyDetailSidebarProps {
  property: Property | null;
  onClose: () => void;
  onOpenBooking: () => void;
  onRegisterClick: (id: string) => void;
  onWhatsApp?: (p: Property) => void;
  dialogRef: React.RefObject<HTMLDialogElement>;
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────
// Uses ReactDOM.createPortal to render directly into <body>, completely escaping
// any parent overflow:hidden or CSS transform that would contain position:fixed.

interface LightboxProps {
  images: string[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}

function Lightbox({ images, initialIndex, title, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [closing, setClosing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mouseDown, setMouseDown] = useState(false);

  // Refs for reading latest state inside imperative handlers (no stale closures)
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => {
    zoomRef.current = zoom;
    panRef.current = pan;
  }, [zoom, pan]);

  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const closingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesLengthRef = useRef(images.length);

  if (imagesLengthRef.current === null) {
    imagesLengthRef.current = images.length; // Se actualiza silenciosamente si cambian las fotos
  }

  // ── Close with animation ────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  // ── Navigate images ─────────────────────────────────────────────────────────
  const navigateLogic = (dir: 'prev' | 'next') => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    zoomRef.current = 1;
    setIndex(prev =>
      dir === 'next'
        ? (prev + 1) % images.length
        : (prev - 1 + images.length) % images.length
    );
  };
  const navigateRef = useRef(navigateLogic);
  navigateRef.current = navigateLogic;
  const navigate = useCallback((dir: 'prev' | 'next') => navigateRef.current(dir), []);

  const onKeyboardNavigateLogic = (direction: 'next' | 'prev') => navigate(direction);
  const onKeyboardNavigateRef = useRef(onKeyboardNavigateLogic);
  onKeyboardNavigateRef.current = onKeyboardNavigateLogic;
  const onKeyboardNavigate = useCallback((direction: 'next' | 'prev') => onKeyboardNavigateRef.current(direction), []);

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') onKeyboardNavigate('next');
      if (e.key === 'ArrowLeft') onKeyboardNavigate('prev');
      if (e.key === '+' || e.key === '=') setZoom((z: number) => Math.min(5, +(z + 0.3).toFixed(2)));
      if (e.key === '-') {

        // 1. Actualizamos el zoom de forma limpia
        setZoom((z: number) => {
          // 2. Calculamos el nuevo valor de zoom usando el valor actual 'zoom'
          const nextZoom = Math.max(1, +(z - 0.3).toFixed(2));

          // 3. Si el zoom llegó al mínimo, reseteamos el paneo de forma segura aquí afuera
          if (nextZoom <= 1) {
            setPan({ x: 0, y: 0 });
          }
          return nextZoom

        });

      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleClose]);

  // ── Body scroll lock ────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Mouse wheel zoom (imperative, non-passive) ─────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;

      // 2. Actualizamos el zoom directamente con el valor limpio
      setZoom((z: number) => {
        const nextZoom = Math.max(1, Math.min(5, +(z + delta).toFixed(2)));

        // 3. Ejecutamos el efecto secundario de forma segura aquí afuera
        if (nextZoom <= 1) {
          setPan({ x: 0, y: 0 });
        }
        return nextZoom
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ── Touch: swipe, pinch-to-zoom, pan (ALL imperative, non-passive) ─────────
  // React's synthetic touch events are passive by default since React 17,
  // which prevents calling e.preventDefault() required to stop native gestures.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ctrl = new AbortController();
    const sig = ctrl.signal;

    function onStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
        swipeStartX.current = null;
        isDragging.current = false;
      } else {
        swipeStartX.current = e.touches[0].clientX;
        if (zoomRef.current > 1) {
          isDragging.current = true;
          dragStart.current = {
            mx: e.touches[0].clientX, my: e.touches[0].clientY,
            px: panRef.current.x, py: panRef.current.y,
          };
        }
      }
    }

    function onMove(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault(); // stop native browser zoom — only works when non-passive
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastPinchDist.current) {
          const ratio = dist / lastPinchDist.current;

          // 2. Pasamos el valor limpio directamente a setZoom
          setZoom((z: number) => {
            const nextZoom = Math.max(1, Math.min(5, +(z * ratio).toFixed(3)));
            // 3. Ejecutamos el efecto secundario de forma segura aquí afuera
            if (nextZoom <= 1) {
              setPan({ x: 0, y: 0 });
            }
            return nextZoom;
          });


        }
        lastPinchDist.current = dist;
      } else if (isDragging.current && zoomRef.current > 1) {
        e.preventDefault();
        setPan({
          x: dragStart.current.px + e.touches[0].clientX - dragStart.current.mx,
          y: dragStart.current.py + e.touches[0].clientY - dragStart.current.my,
        });
      }
    }

    function onEnd(e: TouchEvent) {
      if (e.touches.length < 2) lastPinchDist.current = null;
      if (isDragging.current) { isDragging.current = false; return; }
      // Swipe to navigate (only when not zoomed)
      if (swipeStartX.current !== null && zoomRef.current <= 1) {
        const dx = e.changedTouches[0].clientX - swipeStartX.current;
        if (Math.abs(dx) >= 40) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
          if (dx < 0) setIndex((prev: number) => (prev + 1) % imagesLengthRef.current);
          else setIndex((prev: number) => (prev - 1 + imagesLengthRef.current) % imagesLengthRef.current);
        }
      }
      swipeStartX.current = null;
    }

    el.addEventListener('touchstart', onStart, { signal: sig, passive: true });
    el.addEventListener('touchmove', onMove, { signal: sig, passive: false }); // NON-PASSIVE
    el.addEventListener('touchend', onEnd, { signal: sig, passive: true });

    return () => ctrl.abort();
  }, []);

  // ── Mouse drag to pan when zoomed ──────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    setMouseDown(true);
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPan({
        x: dragStart.current.px + e.clientX - dragStart.current.mx,
        y: dragStart.current.py + e.clientY - dragStart.current.my,
      });
    };
    const up = () => { if (!isDragging.current) return; isDragging.current = false; setMouseDown(false); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  // ── Go to index from dots/thumbnails ───────────────────────────────────────
  const goTo = (i: number) => {
    if (i === index) return;
    setZoom(1); setPan({ x: 0, y: 0 });
    setIndex(i);
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  // Use explicit top/left/right/bottom instead of inset for broadest compatibility.
  // Use Number.MAX_SAFE_INTEGER-capped z-index to guarantee being on top of everything.
  const content = (
    <dialog
      open
      className='fixed inset-0 z-[2147483647] flex flex-col overflow-hidden'
      style={{
        animation: closing ? 'lightboxOut 0.2s ease forwards' : 'lightboxIn 0.22s ease forwards',
      }}
      aria-modal="true"
      aria-label={`Galería: ${title}`}
    >
      {/* Dark blurred backdrop — covers entire viewport */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-[#060912]/96 blur-[8px] transform-gpu scale-110 [backdrop-filter:blur(8px)_saturate(1.8)]"
          aria-label='close'
          onClick={zoom <= 1 ? handleClose : undefined}
          role="button"
          tabIndex={0}
        />
      </div>

      {/* Main interaction layer */}
      <div
        ref={containerRef}
        className="relative z-1 flex flex-col w-full h-full"
        style={{
          touchAction: zoom > 1 ? 'none' : 'pan-y',
        }}
      >
        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/72 to-transparent">
          <div>
            <p className="text-white font-semibold text-[14px] m-0 font-[var(--font-display)] leading-[1.3] max-w-[60vw] overflow-hidden text-ellipsis whitespace-nowrap">
              {title}
            </p>
            <p className="text-white/45 text-[11px] font-[var(--font-mono)] mt-[2px] mr-0 mb-0 ml-0">
              {index + 1} / {images.length}{zoom > 1 ? `  ·  ${Math.round(zoom * 100)}%` : ''}
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <button
              type='button'
              onClick={() => {
                const nextZoom = Math.max(1, +(zoom - 0.5).toFixed(1));
                setZoom(nextZoom);
                if (nextZoom <= 1) setPan({ x: 0, y: 0 });
              }}
              disabled={zoom <= 1}
              aria-label="Reducir zoom"
              className="bg-white/13 border-none rounded-full w-[36px] h-[36px] text-white flex items-center justify-center shrink-0"
              style={{ cursor: zoom <= 1 ? 'default' : 'pointer', color: '#fff', opacity: zoom <= 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ZoomOut style={{ width: 16, height: 16 }} />
            </button>
            <button
              type='button'
              onClick={() => {
                const nextZoom = Math.min(5, +(zoom + 0.5).toFixed(1));
                setZoom(nextZoom);
                if (nextZoom >= 5) setPan({ x: 0, y: 0 });
              }}
              disabled={zoom >= 5}
              aria-label="Aumentar zoom"
              className="bg-white/13 border-none rounded-full w-[36px] h-[36px] text-white flex items-center justify-center shrink-0"
              style={{ cursor: zoom >= 5 ? 'default' : 'pointer', color: '#fff', opacity: zoom >= 5 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ZoomIn style={{ width: 16, height: 16 }} />
            </button>
            <button
              type='button'
              onClick={handleClose}
              aria-label="Cerrar galería"
              className="bg-white/13 border-none rounded-full w-[36px] h-[36px] text-white flex items-center justify-center shrink-0"
              style={{ cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)'}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* ── Image ──────────────────────────────────────────────────────── */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden min-h-0 select-none"
          style={{
            cursor: zoom > 1 ? (mouseDown ? 'grabbing' : 'grab') : 'default',
          }}
          onMouseDown={handleMouseDown}
        >
          <img
            key={index}
            src={images[index]}
            alt={`${title} — foto ${index + 1}`}
            draggable={false}
            referrerPolicy="no-referrer"
            className="block max-w-full max-h-full w-auto h-auto object-contain pointer-events-none will-change-transform"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: mouseDown ? 'none' : 'transform 0.12s ease',

            }}
          />
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        <div
          className="shrink-0 flex flex-col items-center gap-2 px-4 pt-2 pb-4 bg-gradient-to-t from-black/72 to-transparent">
          {/* Dots */}
          <div className="flex gap-[6px] items-center">
            {images.map((_, i) => (
              <button
                type='button'
                key={`dot-${i}`}
                onClick={() => goTo(i)}
                aria-label={`Ver foto ${i + 1}`}
                className="border-none p-0 cursor-pointer h-[8px] transition-all duration-200 ease-out shrink-0"
                style={{
                  borderRadius: 9999,
                  width: i === index ? 22 : 8,
                  background: i === index ? '#ffb900' : 'rgba(255,255,255,0.3)',
                }} />
            ))}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-[6px] overflow-x-auto max-w-full pb-[2px]">
              {images.map((src, i) => (
                <button
                  type='button'
                  key={src}
                  onClick={() => goTo(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className="shrink-0 w-[56px] h-[40px] p-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-150 ease-out"
                  style={{
                    borderColor: i === index ? '#ffb900' : 'transparent',
                    opacity: i === index ? 1 : 0.48,
                  }}>
                  <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer"
                    className="w-full h-full object-cover block" />
                </button>
              ))}
            </div>
          )}

          {/* Zoom hint */}
          {zoom <= 1 && images.length > 0 && (
            <p
              className="text-white/35 text-[10px] font-[var(--font-mono)] m-0 tracking-[0.04em] pointer-events-none">
              Rueda del ratón o pellizca para zoom · Desliza para navegar
            </p>
          )}
        </div>

        {/* ── Prev / Next arrows ─────────────────────────────────────────── */}
        {images.length > 1 && (
          <>
            <button
              type='button'
              onClick={() => navigate('prev')}
              aria-label="Imagen anterior"
              className="absolute left-[10px] top-1/2 -translate-y-1/2 bg-white/13 border-none rounded-full w-[44px] h-[44px] cursor-pointer text-white flex items-center justify-center backdrop-blur-[8px] transition-[background] duration-150 shrink-0"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)'}
            >
              <ChevronLeft className="w-[22px] h-[22px]" />
            </button>
            <button
              type='button'
              onClick={() => navigate('next')}
              aria-label="Imagen siguiente"
              className="absolute right-[10px] top-1/2 -translate-y-1/2 bg-white/13 border-none rounded-full w-[44px] h-[44px] cursor-pointer text-white flex items-center justify-center backdrop-blur-[8px] transition-[background] duration-150 shrink-0"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)'}
            >
              <ChevronRight className="w-[22px] h-[22px]" />
            </button>
          </>
        )}
      </div>
    </dialog>
  );

  // Portal renders directly into <body> — completely outside any parent
  // overflow:hidden or CSS transform containment
  return createPortal(content, document.body);
}

// ─── PropertyDetailSidebar ────────────────────────────────────────────────────

export default function PropertyDetailSidebar({
  dialogRef,
  property,
  onClose,
  onOpenBooking,
  onRegisterClick,
  onWhatsApp,
}: PropertyDetailSidebarProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const prevPropertyId = useRef<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (property && property.id !== prevPropertyId.current) {
      setActiveImageIndex(0);
      setAnimKey(k => k + 1);
      setLightboxOpen(false);
      prevPropertyId.current = property.id;
    }
  }, [property]);

  if (!property) {
    return (
      <div className="hidden lg:flex h-full flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[500px]">
        <div className="rounded-full bg-slate-50 p-6 mb-4 animate-pulse">
          <Landmark className="h-10 w-10" style={{ color: 'rgba(255,185,0,0.4)' }} />
        </div>
        <h3 className="font-display text-base font-bold" style={{ color: '#0f172b' }}>Detalles de la Propiedad</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Haz clic en cualquier propiedad disponible para desplegar la información completa, fotos exclusivas y agendar una visita.
        </p>
      </div>
    );
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(p => (p + 1) % property.images.length);
    setAnimKey(k => k + 1);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(p => (p - 1 + property.images.length) % property.images.length);
    setAnimKey(k => k + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) setActiveImageIndex(p => (p + 1) % property.images.length);
    else setActiveImageIndex(p => (p - 1 + property.images.length) % property.images.length);
    setAnimKey(k => k + 1);
  };

  const cleanPhone = property.whatsappNumber.replace(/[^0-9+]/g, '');
  const encodedText = encodeURIComponent(`Hola Innobilia, me interesa recibir más información sobre propiedad "${property.title}" (${property.address}). ¿Está disponible?`);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  const handleWhatsAppClick = () => {
    onRegisterClick(property.id);
    if (onWhatsApp) onWhatsApp(property);
    else window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {lightboxOpen && (
        <Lightbox
          images={property.images}
          initialIndex={activeImageIndex}
          title={property.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full shrink-0">

        {showVirtualTour ? (
          <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden">
            <img
              ref={el => { if (el) el.style.transform = 'scale(1.25) translateX(0)'; }}
              src={property.virtualTourUrl || property.images[0]}
              alt="Virtual Tour"
              className="w-full h-full object-cover transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white flex items-center gap-1 font-mono uppercase font-bold tracking-wider">
              <Compass className="h-3 w-3 animate-spin" style={{ color: '#ffb900' }} />
              <span>Recorrido 3D Interactivo</span>
            </div>
            <button
              type='button'
              aria-label='Salir de visita 3D'
              onClick={() => setShowVirtualTour(false)}
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-500 text-white font-semibold py-1 px-2.5 rounded text-[10px] cursor-pointer">
              Salir de Visita 3D
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-200 bg-slate-950/90 py-1.5 px-4 rounded-full max-w-xs shadow text-center">
              Arrastra el visor o haz clic en las puertas para avanzar.
            </div>
          </div>
        ) : (
          /* Carousel */
          <div
            className="carousel-container relative aspect-[4/3] w-full bg-slate-900 overflow-hidden group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Clickable zone opens lightbox */}
            <button
              type='button'
              className="absolute inset-0 w-full h-full focus:outline-none"
              style={{ cursor: 'zoom-in', border: 'none', padding: 0, background: 'none' }}
              onClick={() => setLightboxOpen(true)}
              aria-label="Ver imagen en pantalla completa"
            >
              <img
                key={animKey}
                src={property.images[activeImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover carousel-img-enter"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Expand hint */}
            <div
              className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(15,23,43,0.78)', color: '#fff' }}
            >
              <Expand className="h-3 w-3" style={{ color: '#ffb900' }} />
              <span>Ampliar</span>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />

            {property.images.length > 1 && (
              <>
                <button
                  type='button'
                  onClick={handlePrevImage}
                  aria-label="Imagen anterior"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:bg-slate-950/80 transition-all cursor-pointer z-10">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type='button'
                  onClick={handleNextImage}
                  aria-label="Imagen siguiente"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:bg-slate-950/80 transition-all cursor-pointer z-10">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-slate-900/40 backdrop-blur-sm p-1 rounded-full z-10">
              {property.images.map((image, i) => (
                <button
                  type='button'
                  key={image}
                  aria-label={`Ver foto ${i + 1}`}
                  onClick={e => { e.stopPropagation(); setActiveImageIndex(i); setAnimKey(k => k + 1); }}
                  className={`h-1.5 rounded-full transition-all ${activeImageIndex === i ? 'w-3.5' : 'w-1.5 bg-white/60 hover:bg-white'}`}
                  style={activeImageIndex === i ? { background: '#ffb900' } : {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-5.5 flex-1 overflow-y-auto space-y-4.5 scrollbar-hover">

          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base font-bold leading-snug first-letter:uppercase lowercase" style={{ color: '#0f172b' }}>
                {property.title}
              </h3>
              <span className="text-lg font-bold shrink-0 font-mono" style={{ color: '#0f172b' }}>
                ${property.price.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 ">
              <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: '#ffb900' }} />
              <span className="line-clamp-1 capitalize">{property.address || property.location}</span>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 rounded-xl" style={{ background: 'rgba(249,246,241,0.6)' }}>
            {[
              { Icon: BedDouble, label: 'Habitaciones', value: property.rooms },
              { Icon: Bath, label: 'Baños', value: property.bathrooms },
              { Icon: Square, label: 'Metros m²', value: `${property.area} m²` },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 text-center">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,185,0,0.1)' }}>
                  <Icon className="h-4 w-4" style={{ color: '#ffb900' }} />
                </div>
                <dt className="text-[10px] uppercase font-mono tracking-wider font-semibold" style={{ color: '#94a3b8' }}>{label}</dt>
                <dd className="text-lg font-black leading-none" style={{ color: '#0f172b' }}>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold block" style={{ color: '#ffb900' }}>Descripción Residencial</span>
            <p className="text-xs leading-relaxed whitespace-pre-line font-sans text-justify" style={{ color: '#64748b' }}>{property.description}</p>
          </div>

          {property.features.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold flex items-center gap-1" style={{ color: '#ffb900' }}>
                <Sparkles className="h-3 w-3" /><span>Amenidades</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {property.features.map((f, i) => (
                  <span key={f} className="px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2.5">
            <button
              type='button'
              aria-label='Visita virtual 3D'
              onClick={() => { onRegisterClick(property.id); setShowVirtualTour(true); }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              style={{ background: '#f1f5f9', color: '#334155' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e2e8f0'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f1f5f9'}>
              <Compass className="h-4 w-4" style={{ color: '#64748b' }} />
              <span>Ver Visita Virtual 3D</span>
            </button>

            <button
              type='button'
              aria-label='Agendar cita'
              onClick={() => { onRegisterClick(property.id); onOpenBooking(); }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              style={{ background: '#0f172b', color: '#f8fafc' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e293b'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0f172b'}>
              <Navigation className="h-4 w-4" style={{ color: '#ffb900' }} />
              <span>Agendar Cita con Calendario</span>
            </button>

            <button
              type='button'
              aria-label='Contacto directo WhatsApp Corredor'
              onClick={handleWhatsAppClick}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              style={{ background: '#25D366', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1fba57'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#25D366'}>
              <MessageSquare className="h-4 w-4" />
              <span>Contacto Directo WhatsApp Corredor</span>
            </button>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-mono">Operador: Innobilia Real Estate Group</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
