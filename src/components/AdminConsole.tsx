import React from 'react';
import { Property, Appointment, AnalyticsSummary } from '../types';
import { CompanySettings } from './IdentityModal';
import AdminPanel from './AdminPanel';
import {
  Plus,
  Lock,
  Link as LinkIcon,
  Check,
  Sparkles,
  Upload,
  Building2,
} from 'lucide-react';

interface AdminConsoleProps {
  companySettings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  properties: Property[];
  appointments: Appointment[];
  analytics: AnalyticsSummary;
  onAddProperty: () => void;
  onCopyClientLink: () => void;
  onDeleteAppointment: (id: string) => void;
  onResetAnalytics: () => void;
  onOpenIdentityModal: (field: 'logoUrl' | 'name' | 'subtitle' | 'description' | 'locations' | 'adminSecret' | 'all') => void;
  onShowToast: (msg: string) => void;
}

/**
 * Consola de administración completa.
 * Extraída de App.tsx para reducir el tamaño del archivo principal.
 */
export default function AdminConsole({
  companySettings,
  onSaveSettings,
  properties,
  appointments,
  analytics,
  onAddProperty,
  onCopyClientLink,
  onDeleteAppointment,
  onResetAnalytics,
  onOpenIdentityModal,
  onShowToast,
}: AdminConsoleProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onSaveSettings({ ...companySettings, logoUrl: reader.result as string });
          onShowToast('¡Nueva foto cargada con éxito!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadDemo = () => {
    onSaveSettings({
      logoUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=200&q=80',
      name: 'INNOBILIA',
      subtitle: 'Asesores',
      description: 'Encuentra tu próximo hogar. Haz clic en cualquiera de nuestras propiedades disponibles para agendar visitas virtuales 3D o citas instantáneas.',
      locations: 'San Pedro • Lomas • Valle de Bravo',
      instagramUrl: 'https://instagram.com/innobilia.asesoresinversiones',
      whatsappUrl: 'https://wa.me/5218110000000',
      // Blocker 2: use env var default, not hardcoded string
      adminSecret: import.meta.env.VITE_ADMIN_SECRET ?? 'cambiar-en-produccion',
    });
    onShowToast('Valores demostrativos premium cargados.');
  };

  const handleCopyAdminLink = () => {
    // Issue 6: hash (#) never reaches the server — safe from access logs
    const base = import.meta.env.VITE_APP_URL ?? window.location.origin;
    const generatedLink = `${base}/#access=${companySettings.adminSecret}`;
    navigator.clipboard.writeText(generatedLink);
    onShowToast('¡Enlace Secreto de Administrador copiado al portapapeles!');
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 animate-in slide-in-from-top duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 rounded bg-amber-500 text-slate-950 font-mono text-xs font-bold">
            ADMIN
          </div>
          <h3 className="font-display text-sm font-bold text-white">Consola de Publicación de Enlaces</h3>
        </div>
        <button
          onClick={onAddProperty}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition-all hover:scale-105 cursor-pointer shadow"
        >
          <Plus className="h-4 w-4" />
          <span>Publicar Propiedad</span>
        </button>
      </div>

      {/* Client Link */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-amber-400" />
              <span>Enlace de la Aplicación para Clientes</span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Comparte este enlace corto en tu bio de Instagram, TikTok o chats de WhatsApp para que tus clientes interactúen.
            </p>
          </div>
          <button
            onClick={onCopyClientLink}
            className="shrink-0 px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Copiar Linktree</span>
          </button>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg font-mono text-[10px] text-amber-500 overflow-x-auto truncate">
          {window.location.origin}/
        </div>
      </div>

      {/* Admin Link Generator */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-3">
        <div className="border-b border-slate-700/50 pb-2">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Generador de Enlace Seguro de Administrador</span>
          </h4>
          <p className="text-[10px] text-slate-400">
            Crea un enlace secreto personalizado para ingresar directamente como Administrador/Asesor en el celular u otras pestañas sin requerir botones manuales de rol.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label className="block text-[10px] font-mono text-slate-300 font-bold uppercase">Clave Secreta de Acceso</label>
              <input
                type="text"
                placeholder="ej. mi_clave_secreta_99"
                value={companySettings.adminSecret || 'secreto123'}
                onChange={(e) =>
                  onSaveSettings({ ...companySettings, adminSecret: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })
                }
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <div className="shrink-0 flex items-end">
              <button
                onClick={handleCopyAdminLink}
                className="w-full sm:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copiar Link Administrativo</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-[10px] font-mono whitespace-nowrap overflow-x-auto text-amber-500">
            <span className="select-all block truncate">
              {import.meta.env.VITE_APP_URL ?? window.location.origin}/#access={companySettings.adminSecret}
            </span>
            <span className="text-slate-500 text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 ml-2">
              Súper Enlace Seguro
            </span>
          </div>
        </div>
      </div>

      {/* Branding Setup */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-3">
        <div className="border-b border-slate-700/50 pb-2">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Ajustes de Identidad de Marca y Social Media</span>
          </h4>
          <p className="text-[10px] text-slate-400">
            Modifica los datos generales, ubicaciones, foto y enlaces del corporativo. Presiona guardar para aplicar cambios al perfil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Name */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-300 font-bold uppercase">Nombre de la Empresa</label>
            <input
              type="text"
              placeholder="INNOBILIA"
              value={companySettings.name || ''}
              onChange={(e) => onSaveSettings({ ...companySettings, name: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-300 font-bold uppercase">Subtítulo / Tagline</label>
            <input
              type="text"
              placeholder="Asesores Inmobiliarios"
              value={companySettings.subtitle || ''}
              onChange={(e) => onSaveSettings({ ...companySettings, subtitle: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-300 font-bold uppercase">Foto de Perfil (Subir Archivo)</label>
            <div className="flex items-center gap-2.5">
              {companySettings.logoUrl ? (
                <img
                  src={companySettings.logoUrl}
                  alt="Logo corporativo"
                  className="h-8 w-8 object-cover rounded-lg border border-slate-700 shadow shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="h-8 w-8 bg-slate-950 text-amber-400 rounded-lg border border-slate-700 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
              )}
              <label
                htmlFor="admin-logo-file-input"
                className="flex-1 flex items-center justify-center py-1.5 px-3 border border-dashed border-slate-700 hover:border-amber-400 bg-slate-950 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors text-[10px] text-slate-300 gap-1.5 font-semibold group"
              >
                <Upload className="h-3 w-3 text-amber-400 group-hover:animate-bounce" />
                <span>Elegir foto de perfil</span>
                <input
                  id="admin-logo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-300 font-bold uppercase">Ubicaciones / Cobertura</label>
            <input
              type="text"
              placeholder="San Pedro • Lomas • Valle de Bravo"
              value={companySettings.locations || ''}
              onChange={(e) => onSaveSettings({ ...companySettings, locations: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-300 font-bold uppercase">Enlace de Instagram</label>
            <input
              type="text"
              placeholder="https://instagram.com/nombre"
              value={companySettings.instagramUrl}
              onChange={(e) => onSaveSettings({ ...companySettings, instagramUrl: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-slate-300 font-bold uppercase">Enlace de WhatsApp Corporativo</label>
            <input
              type="text"
              placeholder="https://wa.me/5218110000000"
              value={companySettings.whatsappUrl}
              onChange={(e) => onSaveSettings({ ...companySettings, whatsappUrl: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Description */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-[10px] font-mono text-slate-300 font-bold uppercase">Descripción Principal del Perfil</label>
            <textarea
              rows={2}
              placeholder="Encuentra tu próximo hogar..."
              value={companySettings.description || ''}
              onChange={(e) => onSaveSettings({ ...companySettings, description: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleLoadDemo}
            className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Usar foto y enlaces demo de muestra ⚡
          </button>
          <button
            onClick={() => onShowToast('¡Configuración de identidad y redes guardada con éxito!')}
            className="ml-auto px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Guardar Identidad
          </button>
        </div>
      </div>

      {/* Admin Panel (Analytics + Appointments) */}
      <div className="border-t border-slate-800 pt-3">
        <AdminPanel
          properties={properties}
          appointments={appointments}
          analytics={analytics}
          onDeleteAppointment={onDeleteAppointment}
          onResetAnalytics={onResetAnalytics}
        />
      </div>
    </div>
  );
}
