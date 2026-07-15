import { Lock } from "lucide-react";

export function Footer({ role, setRole, companySettings, setAdminAuthInput, setAdminAuthError, setShowAdminAuthModal, setWaModalProperty, setWaModalPhone, setWaModalMode, setShowWaModal, showToast }: any) {
    return (
        <footer className="border-t py-8 text-center text-xs mt-auto" style={{ background: '#0f172b', borderColor: '#1e293b' }}>
            <div className="max-w-3xl mx-auto px-4 space-y-2">
                <p className="font-display text-base font-semibold" style={{ color: '#ffb900' }}>
                    Innobilia
                </p>
                {role === "client" ? (<div className="pt-3 border-t w-auto" style={{ borderColor: '#1e293b' }}>
                    <p className=" text tracking-wider" style={{ color: '#475569' }}>Links:</p>
                    <ul className=" flex-start">
                        <li><button className="text-[#758397] hover:text-amber-500 cursor-pointer transition-colors"
                            type='button'
                            onClick={() => {
                                setWaModalProperty(null);
                                setWaModalPhone(companySettings.whatsappUrl.replace('https://wa.me/', ''));
                                setWaModalMode('owner/broker');
                                setShowWaModal(true);
                            }}
                        >Soy corredor y tengo una propiedad</button></li>
                    </ul>
                </div>
                ) : null}
                <p className="text-[10px] font-mono tracking-wider" style={{ color: '#475569' }}>
                    Real Estate Hub © 2026 — Todos los derechos reservados
                </p>
                <div className="pt-3 border-t flex justify-center" style={{ borderColor: '#1e293b' }}>
                    {role === 'client' ? (
                        <button
                            type='button'
                            onClick={() => {
                                setAdminAuthInput('');
                                setAdminAuthError(false);
                                setShowAdminAuthModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            style={{ background: 'rgba(255,185,0,0.06)', borderColor: 'rgba(255,185,0,0.2)', color: '#64748b' }}
                        >
                            <Lock className="h-3 w-3" style={{ color: '#334155' }} />
                            Acceso Agentes
                        </button>
                    ) : (
                        <button
                            type='button'
                            onClick={() => { setRole('client'); showToast('Cerraste sesión de administrador'); }}
                            className="text-[10px] font-mono transition-colors cursor-pointer hover:opacity-80"
                            style={{ color: '#475569' }}
                        >
                            Cerrar sesión administrativa
                        </button>
                    )}
                </div>
            </div>
        </footer>
    )
}
