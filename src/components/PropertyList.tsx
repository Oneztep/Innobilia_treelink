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
                <div className="space-y-3 ">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-card flex gap-0 overflow-hidden rounded-2xl border border-slate-100"
                            style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="skeleton-shimmer w-40 h-28 shrink-0 rounded-l-2xl" />
                            <div className="flex-1 p-4 space-y-2.5">
                                <div className="skeleton-shimmer h-3.5 w-3/4 rounded-lg" />
                                <div className="skeleton-shimmer h-2.5 w-1/2 rounded-lg" />
                                <div className="flex gap-2 pt-1">
                                    <div className="skeleton-shimmer h-2 w-12 rounded" />
                                    <div className="skeleton-shimmer h-2 w-12 rounded" />
                                    <div className="skeleton-shimmer h-2 w-12 rounded" />
                                </div>
                                <div className="skeleton-shimmer h-6 w-24 rounded-lg mt-auto" />
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
                <div className="space-y-3 p-4 -m-4 scrollbar-hover h-auto" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 1300px' }}>
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