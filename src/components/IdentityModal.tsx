import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Building2, Upload, X } from 'lucide-react';
import { useModal } from '../hooks/useModal';

export interface CompanySettings {
  logoUrl: string;
  name: string;
  subtitle: string;
  description: string;
  facebookUrl: string;
  instagramUrl: string;
  whatsappUrl: string;
}

interface IdentityModalProps {
  key: string | number;
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  focusField?: 'logoUrl' | 'name' | 'subtitle' | 'description' | 'facebookUrl' | 'all';
  onShowToast: (msg: string) => void;
  dialogRef: React.RefObject<HTMLDialogElement>;
}

/**
 * Modal para editar la identidad visual y redes sociales de la empresa.
 * Extraído de App.tsx para reducir el tamaño del archivo principal.
 */
export default function IdentityModal({
  dialogRef,
  isOpen,
  onClose,
  companySettings,
  onSave,
  focusField = 'all',
  onShowToast,
}: IdentityModalProps) {
  const { isVisible, animClass, close } = useModal(isOpen, onClose);
  const [draft, setDraft] = useState<CompanySettings>(companySettings);

  if (!isVisible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setDraft(prev => ({ ...prev, logoUrl: reader.result as string }));
          onShowToast('¡Nueva foto cargada con éxito!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestoreDemo = () => {
    const demo: CompanySettings = {
      logoUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=200&q=80',
      name: 'INNOBILIA',
      subtitle: 'Asesores',
      description: 'Encuentra tu próximo hogar. Haz clic en cualquiera de nuestras propiedades disponibles para agendar visitas virtuales 3D o citas instantáneas.',
      facebookUrl: 'https://facebook.com/innobilia',
      instagramUrl: 'https://instagram.com/innobilia.asesoresinversiones',
      whatsappUrl: 'https://wa.me/5218110000000',
    };
    setDraft(demo);
    onShowToast('Demostración premium restaurada.');
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
    onShowToast('¡Identidad guardada con éxito!');
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      aria-labelledby="identity-modal-title"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm ${animClass.overlay}`}
        onClick={close}
        aria-label='Close-overlay'
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') close(); }}
        role="button"
        tabIndex={0}
      />

      <div className={`relative w-[90%] max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col mx-auto ${animClass.panel}`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-1.5 text-slate-900">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3
              id="identity-modal-title"
              className="font-display font-bold text-sm text-slate-900"
            >
              Editar Identidad de la Empresa
            </h3>
          </div>
          <button
            type='button'
            onClick={close}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
          <p className="text-xs text-slate-500">
            Modifica los datos que se muestran públicamente en el perfil principal de tu portafolio Linktree.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Logo Upload */}
            <div className="space-y-1 sm:col-span-2">
              <span className="block text-[10px] font-mono text-slate-700 font-bold uppercase mb-1">
                Foto de Perfil (Subir Archivo)
              </span>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {draft.logoUrl ? (
                  <img
                    src={draft.logoUrl}
                    alt="Logo corporativo preview"
                    className="h-12 w-12 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="h-12 w-12 bg-slate-200 text-amber-600 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1">
                  <label
                    htmlFor="popup-logo-file-input"
                    className="flex items-center justify-center py-2 px-3 border border-dashed border-slate-300 hover:border-amber-500 bg-white hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-xs text-slate-700 gap-1.5 font-bold shadow-sm group"
                  >
                    <Upload className="h-4 w-4 text-amber-500 group-hover:ease-expo-out" />
                    <span>Seleccionar Foto del Dispositivo</span>
                    <input
                      id="popup-logo-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[9px] text-slate-400 mt-1 text-center">Formatos sugeridos: JPG, PNG, WEBP</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase" htmlFor="identityModal-name">
                Nombre de la Empresa
              </label>
              <input
                id="identityModal-name"
                type="text"
                autoFocus={focusField === 'name'}
                placeholder="INNOBILIA"
                value={draft.name}
                onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase" htmlFor="identityModal-subtitle">
                Subtítulo / Rubro
              </label>
              <input
                id="identityModal-subtitle"
                type="text"
                autoFocus={focusField === 'subtitle'}
                placeholder="Asesores Inmobiliarios"
                value={draft.subtitle}
                onChange={(e) => setDraft(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Facebook URL */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase" htmlFor="identityModal-facebookUrl">
                URL Facebook
              </label>
              <input
                id="identityModal-facebookUrl"
                type="url"
                autoFocus={focusField === 'facebookUrl'}
                placeholder="https://facebook.com/tupagina"
                value={draft.facebookUrl ?? ''}
                onChange={(e) => setDraft(prev => ({ ...prev, facebookUrl: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase" htmlFor="identityModal-description">
                Descripción Principal
              </label>
              <textarea
                id="identityModal-description"
                rows={3}
                autoFocus={focusField === 'description'}
                placeholder="Encuentra tu próximo hogar..."
                value={draft.description}
                onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400 resize-none font-sans"
              />
            </div>

            {/* Instagram URL */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase" htmlFor="identityModal-instagramUrl">
                URL Instagram
              </label>
              <input
                id="identityModal-instagramUrl"
                type="url"
                placeholder="https://instagram.com/..."
                value={draft.instagramUrl}
                onChange={(e) => setDraft(prev => ({ ...prev, instagramUrl: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* WhatsApp URL */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase" htmlFor="identityModal-whatsappUrl">
                URL WhatsApp (wa.me)
              </label>
              <input
                id="identityModal-whatsappUrl"
                type="url"
                placeholder="https://wa.me/..."
                value={draft.whatsappUrl}
                onChange={(e) => setDraft(prev => ({ ...prev, whatsappUrl: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400 font-sans"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleRestoreDemo}
              className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer mr-auto"
            >
              Restaurar Demo 🔄
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
