import React, { useRef, useEffect } from 'react';
import { Sparkles, Building2, Upload, X } from 'lucide-react';

export interface CompanySettings {
  logoUrl: string;
  name: string;
  subtitle: string;
  description: string;
  locations: string;
  instagramUrl: string;
  whatsappUrl: string;
  adminSecret: string;
}

interface IdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  focusField?: 'logoUrl' | 'name' | 'subtitle' | 'description' | 'locations' | 'adminSecret' | 'all';
  onShowToast: (msg: string) => void;
}

/**
 * Modal para editar la identidad visual y redes sociales de la empresa.
 * Extraído de App.tsx para reducir el tamaño del archivo principal.
 */
export default function IdentityModal({
  isOpen,
  onClose,
  companySettings,
  onSave,
  focusField = 'all',
  onShowToast,
}: IdentityModalProps) {
  const [draft, setDraft] = React.useState<CompanySettings>(companySettings);

  // Sync draft when modal opens with fresh settings
  useEffect(() => {
    if (isOpen) setDraft(companySettings);
  }, [isOpen, companySettings]);

  if (!isOpen) return null;

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
      locations: 'San Pedro • Lomas • Valle de Bravo',
      instagramUrl: 'https://instagram.com/innobilia.asesoresinversiones',
      whatsappUrl: 'https://wa.me/5218110000000',
      adminSecret: 'secreto123',
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-[90%] max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col mx-auto">
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
            onClick={onClose}
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
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase mb-1">
                Foto de Perfil (Subir Archivo)
              </label>
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
                    <Upload className="h-4 w-4 text-amber-500 group-hover:animate-bounce" />
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
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase">
                Nombre de la Empresa
              </label>
              <input
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
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase">
                Subtítulo / Rubro
              </label>
              <input
                type="text"
                autoFocus={focusField === 'subtitle'}
                placeholder="Asesores Inmobiliarios"
                value={draft.subtitle}
                onChange={(e) => setDraft(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Locations */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase">
                Ubicaciones / Cobertura
              </label>
              <input
                type="text"
                autoFocus={focusField === 'locations'}
                placeholder="San Pedro • Valle de Bravo • Lomas"
                value={draft.locations}
                onChange={(e) => setDraft(prev => ({ ...prev, locations: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase">
                Descripción Principal
              </label>
              <textarea
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
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase">
                URL Instagram
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={draft.instagramUrl}
                onChange={(e) => setDraft(prev => ({ ...prev, instagramUrl: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* WhatsApp URL */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-700 font-bold uppercase">
                URL WhatsApp (wa.me)
              </label>
              <input
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
    </div>
  );
}
