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
      facebookUrl: 'https://facebook.com/innobilia',
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
    <div className="rounded-2xl p-5 border shadow-xl space-y-4 animate-in slide-in-from-top duration-300"
      style={{ background: '#0f172b', border: '1px solid #1e293b', color: '#f8fafc' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#1e293b' }}>
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 rounded font-mono text-xs font-bold"
            style={{ background: '#fe9a00', color: '#0f172b' }}>
            ADMIN
          </div>
          <h3 className="font-display text-sm font-bold" style={{ color: '#f8fafc' }}>Consola de Publicación de Enlaces</h3>
        </div>
      </div>

      {/* Client Link */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid #334155' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#e2e8f0' }}>
              <LinkIcon className="h-3.5 w-3.5" style={{ color: '#ffb900' }} />
              <span>Enlace de la Aplicación para Clientes</span>
            </h4>
            <p className="text-[10px]" style={{ color: '#64748b' }}>
              Comparte este enlace corto en tu bio de Instagram, TikTok o chats de WhatsApp para que tus clientes interactúen.
            </p>
          </div>
          <button
            onClick={onCopyClientLink}
            className="shrink-0 px-3.5 py-1.5 text-white border text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ background: '#1e293b', borderColor: '#334155' }}
          >
            <Check className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
            <span>Copiar Linktree</span>
          </button>
        </div>
        <div className="px-3 py-1.5 rounded-lg font-mono text-[10px] overflow-x-auto truncate"
          style={{ background: '#0a0f1e', color: '#ffb900' }}>
          {window.location.origin}/
        </div>
      </div>

      {/* Admin Link Generator */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid #334155' }}>
        <div className="border-b pb-2" style={{ borderColor: '#334155' }}>
          <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#e2e8f0' }}>
            <Lock className="h-3.5 w-3.5" style={{ color: '#ffb900' }} />
            <span>Generador de Enlace Seguro de Administrador</span>
          </h4>
          <p className="text-[10px]" style={{ color: '#64748b' }}>
            Crea un enlace secreto personalizado para ingresar directamente como Administrador/Asesor en el celular u otras pestañas sin requerir botones manuales de rol.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#94a3b8' }}>Clave Secreta de Acceso</label>
              <input
                type="text"
                placeholder="ej. mi_clave.secreta@99#"
                value={companySettings.adminSecret || 'secreto123'}
                onChange={(e) =>
                  onSaveSettings({ ...companySettings, adminSecret: e.target.value.replace(/[^a-zA-Z0-9_.\-/@#]/g, '') })
                }
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                style={{ background: '#0a0f1e', borderColor: '#334155', color: '#f8fafc' }}
              />
            </div>
            <div className="shrink-0 flex items-end">
              <button
                onClick={handleCopyAdminLink}
                className="w-full sm:w-auto px-4 py-2 text-white border text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                style={{ background: '#1e293b', borderColor: '#334155' }}
              >
                <Check className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
                <span>Copiar Link Administrativo</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border flex items-center justify-between text-[10px] font-mono whitespace-nowrap overflow-x-auto"
            style={{ background: '#0a0f1e', borderColor: '#1e293b', color: '#ffb900' }}>
            <span className="select-all block truncate">
              {import.meta.env.VITE_APP_URL ?? window.location.origin}/#access={companySettings.adminSecret}
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded ml-2" style={{ color: '#475569', background: '#0f172b', border: '1px solid #1e293b' }}>
              Súper Enlace Seguro
            </span>
          </div>
        </div>
      </div>

      {/* Branding Setup */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid #334155' }}>
        <div className="border-b pb-2" style={{ borderColor: '#334155' }}>
          <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#e2e8f0' }}>
            <Sparkles className="h-3.5 w-3.5" style={{ color: '#ffb900' }} />
            <span>Ajustes de Identidad de Marca y Social Media</span>
          </h4>
          <p className="text-[10px]" style={{ color: '#64748b' }}>
            Modifica los datos generales, ubicaciones, foto y enlaces del corporativo. Presiona guardar para aplicar cambios al perfil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Name */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#94a3b8' }}>Nombre de la Empresa</label>
            <input type="text" placeholder="INNOBILIA" value={companySettings.name || ''}
              onChange={(e) => onSaveSettings({ ...companySettings, name: e.target.value })}
              className="w-full rounded-lg border px-2.5 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
              style={{ background: '#0a0f1e', borderColor: '#334155', color: '#f8fafc' }} />
          </div>

          {/* Subtitle */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#94a3b8' }}>Subtítulo / Tagline</label>
            <input type="text" placeholder="Asesores Inmobiliarios" value={companySettings.subtitle || ''}
              onChange={(e) => onSaveSettings({ ...companySettings, subtitle: e.target.value })}
              className="w-full rounded-lg border px-2.5 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
              style={{ background: '#0a0f1e', borderColor: '#334155', color: '#f8fafc' }} />
          </div>

          {/* Logo Upload */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#94a3b8' }}>Foto de Perfil (Subir Archivo)</label>
            <div className="flex items-center gap-2.5">
              {companySettings.logoUrl ? (
                <img src={companySettings.logoUrl} alt="Logo corporativo"
                  className="h-8 w-8 object-cover rounded-lg shadow shrink-0"
                  style={{ border: '1px solid #334155' }}
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="h-8 w-8 rounded-lg border flex items-center justify-center shrink-0"
                  style={{ background: '#0a0f1e', border: '1px solid #334155', color: '#ffb900' }}>
                  <Building2 className="h-4 w-4" />
                </div>
              )}
              <label
                htmlFor="admin-logo-file-input"
                className="flex-1 flex items-center justify-center py-1.5 px-3 border border-dashed rounded-lg cursor-pointer transition-colors text-[10px] font-semibold group"
                style={{ borderColor: '#334155', background: '#0a0f1e', color: '#94a3b8' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ffb900'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#334155'; }}
              >
                <Upload className="h-3 w-3 mr-1.5 group-hover:animate-bounce" style={{ color: '#ffb900' }} />
                <span>Elegir foto de perfil</span>
                <input id="admin-logo-file-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Facebook URL */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#94a3b8' }}>Enlace de Facebook</label>
            <input type="url" placeholder="https://facebook.com/tupagina" value={companySettings.facebookUrl || ''}
              onChange={(e) => onSaveSettings({ ...companySettings, facebookUrl: e.target.value })}
              className="w-full rounded-lg border px-2.5 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
              style={{ background: '#0a0f1e', borderColor: '#334155', color: '#f8fafc' }} />
          </div>

          {/* Instagram */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#94a3b8' }}>Enlace de Instagram</label>
            <input type="text" placeholder="https://instagram.com/nombre" value={companySettings.instagramUrl}
              onChange={(e) => onSaveSettings({ ...companySettings, instagramUrl: e.target.value })}
              className="w-full rounded-lg border px-2.5 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
              style={{ background: '#0a0f1e', borderColor: '#334155', color: '#f8fafc' }} />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#94a3b8' }}>Enlace de WhatsApp Corporativo</label>
            <input type="text" placeholder="https://wa.me/5218110000000" value={companySettings.whatsappUrl}
              onChange={(e) => onSaveSettings({ ...companySettings, whatsappUrl: e.target.value })}
              className="w-full rounded-lg border px-2.5 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
              style={{ background: '#0a0f1e', borderColor: '#334155', color: '#f8fafc' }} />
          </div>

          {/* Description */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#94a3b8' }}>Descripción Principal del Perfil</label>
            <textarea rows={2} placeholder="Encuentra tu próximo hogar..." value={companySettings.description || ''}
              onChange={(e) => onSaveSettings({ ...companySettings, description: e.target.value })}
              className="w-full rounded-lg border px-2.5 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans resize-none"
              style={{ background: '#0a0f1e', borderColor: '#334155', color: '#f8fafc' }} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleLoadDemo} className="px-2.5 py-1 text-[10px] transition-colors cursor-pointer"
            style={{ color: '#64748b' }}>
            Usar foto y enlaces demo de muestra ⚡
          </button>
          <button
            onClick={() => onShowToast('¡Configuración de identidad y redes guardada con éxito!')}
            className="ml-auto px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
            style={{ background: '#ffb900', color: '#0f172b' }}
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
