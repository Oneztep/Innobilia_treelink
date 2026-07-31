import { Building2, Edit, ChevronDown } from 'lucide-react';
import { CompanySettings } from './IdentityModal';

interface HeroProps {
    companySettings: CompanySettings;
    role: 'client' | 'admin';
    setIdentityFocusField: (field: 'name' | 'subtitle' | 'description' | 'logoUrl') => void;
    setShowIdentityModal: (show: boolean) => void;
}

// Static gold divider element (inline declaration)
const GOLD_DIVIDER = <div className="w-32 h-0.5 my-3 rounded-full shadow-[0_0_12px_rgba(255,185,0,0.45)]" style={{ background: 'linear-gradient(90deg, transparent, #ffb900, transparent)' }} />;

// Hero glow top glow elements (inline declaration)
const HERO_GLOW_TOP = (
    <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 rounded-full blur-[140px] bg-[rgba(255,185,0,0.20)] pointer-events-none -mr-24 -mt-24"
        style={{ transform: 'translate3d(0,0,0)' }}></div>
);

// Hero glow bottom glow elements (inline declaration)
const HERO_GLOW_BOTTOM = (
    <div className="absolute bottom-0 left-0 w-72 h-72 md:w-96 md:h-96 rounded-full blur-[140px] bg-[rgba(255,185,0,0.12)] pointer-events-none -ml-24 -mb-24"
        style={{ transform: 'translate3d(0,0,0)' }}></div>
);

export function Hero({ companySettings, role, setIdentityFocusField, setShowIdentityModal }: HeroProps) {
    return (
        <div className="hero-glow relative overflow-hidden rounded-2xl border flex flex-col items-center text-center py-10 px-6 sm:px-10"
            style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)', borderColor: '#e2e8f0' }}>

            {/* rendering-hoist-jsx: static decorative elements hoisted to module scope */}
            {HERO_GLOW_TOP}
            {HERO_GLOW_BOTTOM}

            {/* Logo */}
            <div className="relative mb-5">
                {companySettings.logoUrl ? (
                    <div className="relative h-24 w-24 rounded-full overflow-hidden flex items-center justify-center"
                        style={{ boxShadow: '0 0 0 3px #ffb900, 0 8px 32px rgba(255,185,0,0.18)', background: '#f1f5f9' }}>
                        <img src={companySettings.logoUrl} alt="Logo Empresa" className="h-full w-full object-cover"
                            referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        {role === 'admin' ? (
                            <button
                                type='button'
                                onClick={() => { setIdentityFocusField('logoUrl'); setShowIdentityModal(true); }}
                                className="absolute bottom-0 right-0 p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                style={{ background: '#0f172b', border: '1px solid #1e293b' }} title="Editar foto">
                                <Edit className="h-3 w-3" style={{ color: '#ffb900' }} />
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="relative p-5 rounded-2xl flex items-center justify-center"
                        style={{ background: '#0f172b', boxShadow: '0 0 0 3px rgba(255,185,0,0.4), 0 8px 24px rgba(15,23,43,0.25)' }}>
                        <Building2 className="h-9 w-9" style={{ color: '#ffb900' }} />
                        {role === 'admin' ? (
                            <button
                                type='button'
                                onClick={() => { setIdentityFocusField('logoUrl'); setShowIdentityModal(true); }}
                                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                style={{ background: '#ffb900', color: '#0f172b' }} title="Subir foto">
                                <Edit className="h-3 w-3" />
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Brand title — Playfair Display */}
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight flex items-center justify-center gap-2.5"
                style={{ color: '#0f172b' }}>
                <span>{companySettings.name || 'INNOBILIA'}</span>
                <span className="font-display italic text-base sm:text-lg font-normal" style={{ color: '#ffb900' }}>
                    {companySettings.subtitle || 'Asesores'}
                </span>
                {role === 'admin' ? (
                    <button
                        type='button'
                        aria-label='Editar nombre'
                        onClick={() => { setIdentityFocusField('name'); setShowIdentityModal(true); }}
                        className="p-1 rounded-lg transition-colors cursor-pointer opacity-60 hover:opacity-100"
                        style={{ color: '#cc9a00' }} title="Editar nombre">
                        <Edit className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </h1>

            {/* rendering-hoist-jsx: static gold divider hoisted to module scope */}
            {GOLD_DIVIDER}

            <div className="flex items-center justify-center gap-1.5 max-w-sm">
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{companySettings.description}</p>
                {role === 'admin' ? (
                    <button
                        type='button'
                        aria-label='Editar descripción'
                        onClick={() => { setIdentityFocusField('description'); setShowIdentityModal(true); }}
                        className="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ color: '#cc9a00' }}>
                        <Edit className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>

            {role === 'client' && (
                <div className="mt-4 flex flex-col items-center gap-1">
                    <button
                        type='button'
                        aria-label='Contacto directo'
                        onClick={() => document.getElementById('contact-nav')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group flex flex-col items-center gap-1 text-[11px] uppercase tracking-widest font-mono cursor-pointer transition-colors"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = '#fe9a00';
                            const icon = e.currentTarget.querySelector('svg');
                            if (icon) icon.style.color = '#fe9a00';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                            const icon = e.currentTarget.querySelector('svg');
                            if (icon) icon.style.color = '#94a3b8';
                        }}
                    >
                        <span>enlaces de contacto</span>
                        <ChevronDown className="h-4 w-4 ease-expo-out mt-0.5  transition-all group-hover:translate-y-1" style={{ color: '#94a3b8' }} />
                    </button>
                </div>
            )}

        </div>
    )
}