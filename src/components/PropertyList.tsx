import PropertyCard from "./PropertyCard"
import { Property } from '../types'
import { Info } from "lucide-react";

interface PropertyListProps {
    filteredProperties: Property[];
    role?: 'client' | 'admin';
    isDbSyncing: boolean;
    selectedProperty: Property | null;
    handlePropertyCardClick: (property: Property) => void;
    handleOpenShare: (property: Property) => void;
    handleEdit: (property: Property) => void;
    handleDeleteProperty: (id: string) => void;
    handleWhatsApp: (property: Property) => void;
    handleRegisterClick: (id: string) => void;
}

export function PropertyList({ filteredProperties, role, isDbSyncing, selectedProperty, handlePropertyCardClick, handleOpenShare, handleEdit, handleDeleteProperty, handleWhatsApp, handleRegisterClick }: PropertyListProps) {
    return (
        <div className="space-y-3 overflow-visible" >
            <div className="flex items-center justify-between px-1">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold"
                    style={{ color: '#a8a29e' }}>
                    Cartera de Propiedades — {filteredProperties.length} disponible{filteredProperties.length !== 1 ? 's' : ''}
                </h3>
                {/* Subtle DB sync indicator */}
                {isDbSyncing && (
                    <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,185,0,0.08)', color: '#cc9a00', border: '1px solid rgba(255,185,0,0.2)' }}>
                        <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#ffb900' }} />
                        Actualizando
                    </span>
                )}
            </div>

            {/* Skeleton cards shown while syncing and no cached properties */}
            {isDbSyncing ? (
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="skeleton-card w-full group relative overflow-hidden flex flex-col md:flex-row bg-white/80 rounded-2xl border border-slate-200/70"
                            style={{ animationDelay: `${i * 0.08}s` }}
                        >
                            {/* Skeleton de la Imagen */}
                            <div className="skeleton-shimmer w-full h-52 md:w-[200px] md:h-[200px] shrink-0 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none" />

                            {/* Skeleton de Detalles */}
                            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">

                                {/* Título y Ubicación */}
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="skeleton-shimmer h-4 sm:h-4.5 w-3/4 rounded-lg" />
                                        <div className="skeleton-shimmer h-4 w-4 rounded shrink-0 hidden md:block" />
                                    </div>
                                    <div className="skeleton-shimmer h-3 w-1/2 rounded-lg mt-1.5 sm:mt-2" />
                                </div>

                                {/* Especificaciones */}
                                <div className="flex items-center gap-2.5 sm:gap-3 pt-0.5">
                                    <div className="skeleton-shimmer h-3 w-12 rounded" />
                                    <div className="skeleton-shimmer h-3 w-12 rounded" />
                                    <div className="skeleton-shimmer h-3 w-12 rounded" />
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="skeleton-shimmer h-6 sm:h-7 w-20 sm:w-22 rounded-lg" />
                                        <div className="skeleton-shimmer h-6 sm:h-7 w-18 sm:w-20 rounded-lg" />
                                    </div>
                                    <div className="skeleton-shimmer h-7 sm:h-8 w-7 sm:w-8 rounded-lg shrink-0" />
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="text-center p-10 rounded-2xl border"
                    style={{ background: 'rgba(248,250,252,0.9)', borderColor: '#e2e8f0', color: '#94a3b8' }}>
                    <Info className="h-8 w-8 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                    <p className="text-sm">No se encontraron propiedades con los parámetros buscados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-1 gap-4 p-4 -m-4 scrollbar-hover h-auto" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 1300px' }}>
                    {filteredProperties.map((p, idx) => (
                        <PropertyCard
                            key={p.id}
                            property={p}
                            isSelected={selectedProperty?.id === p.id}
                            role={role}
                            animationIndex={idx}
                            onClick={handlePropertyCardClick}
                            onShare={handleOpenShare}
                            onEdit={handleEdit}
                            onDelete={handleDeleteProperty}
                            onWhatsApp={handleWhatsApp}
                            onRegisterClick={handleRegisterClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}