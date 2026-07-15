
import { Lock, X, Eye, EyeOff } from 'lucide-react';

export function AdminAuthModal({
    dialogRef,
    authAnim,
    closeAuth,
    adminAuthInput,
    setAdminAuthInput,
    adminAuthError,
    setAdminAuthError,
    showAdminPassword,
    setShowAdminPassword,
    handleAdminLogin,
}: any) {
    return (
        <dialog
            ref={dialogRef}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            aria-modal="true"
            aria-labelledby="admin-auth-modal-title"
        >
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm ${authAnim.overlay}`}
                onClick={closeAuth}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') closeAuth();
                }}
                aria-label='Close-auth'
                role="button"
                tabIndex={0}
            />
            <div className={`relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border flex flex-col ${authAnim.panel}`}
                style={{ background: '#0f172b', borderColor: '#1e293b' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e293b' }}>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg" style={{ background: '#1e293b' }}>
                            <Lock className="h-4 w-4" style={{ color: '#ffb900' }} />
                        </div>
                        <div>
                            <h3 id="admin-auth-modal-title" className="text-sm font-bold" style={{ color: '#f8fafc' }}>
                                Acceso Administrativo
                            </h3>
                            <p className="text-[10px] font-mono" style={{ color: '#475569' }}>Solo para asesores autorizados</p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={closeAuth}
                        className="p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        style={{ color: '#64748b' }}
                        aria-label="Cerrar modal de acceso"
                    >                <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor='enter-password'
                            className="block text-[10px] font-mono font-bold uppercase"
                            style={{ color: '#64748b' }}>
                            Clave de Acceso
                        </label>
                        <div className="relative">
                            <input
                                id='enter-password'
                                type={showAdminPassword ? 'text' : 'password'}
                                autoFocus
                                placeholder="Ingresa clave secrecta"
                                value={adminAuthInput}
                                onChange={(e) => { setAdminAuthInput(e.target.value); setAdminAuthError(false); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAdminLogin();
                                    }
                                }}
                                className="w-full rounded-xl border px-4 py-2.5 pr-11 text-sm focus:outline-none font-mono"
                                style={{
                                    background: '#1e293b',
                                    borderColor: adminAuthError ? '#ef4444' : '#334155',
                                    color: '#f8fafc',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowAdminPassword(prev => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors cursor-pointer"
                                style={{ color: showAdminPassword ? '#ffb900' : '#475569' }}
                                aria-label={showAdminPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showAdminPassword
                                    ? <EyeOff className="h-4 w-4" />
                                    : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {adminAuthError ? (
                            <p className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>
                                Clave incorrecta. Inténtalo de nuevo.
                            </p>
                        ) : null}
                    </div>

                    <button
                        type='button'
                        onClick={handleAdminLogin}
                        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 cursor-pointer"
                        style={{ background: '#ffb900', color: '#0f172b' }}
                    >
                        Ingresar al Panel
                    </button>
                </div>
            </div>
        </dialog>
    )
}