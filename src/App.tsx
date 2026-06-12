import React, { useState, useEffect, useCallback, useRef, useTransition, lazy, Suspense } from 'react';
import { Property, Appointment, AnalyticsSummary } from './types';
import { INITIAL_PROPERTIES, INITIAL_APPOINTMENTS } from './initialData';

// Storage helper (js-cache-storage + advanced-init-once: migration runs at module load)
import { lsGet, lsSet } from './lib/storage';

// Supabase DB operations
import {
  fetchProperties,
  upsertProperty,
  deleteProperty,
  incrementPropertyClicks,
  incrementPropertyShares,
  fetchAppointments,
  insertAppointment,
  deleteAppointment,
  fetchAnalytics,
  upsertAnalytics,
  fetchCompanySettings,
  upsertCompanySettings,
  incrementWhatsAppLeads,
} from './lib/db';

// Eagerly-loaded small components
import PropertyDetailSidebar from './components/PropertyDetailSidebar';
import ConfirmModal from './components/ConfirmModal';
import IdentityModal, { CompanySettings } from './components/IdentityModal';
import AdminConsole from './components/AdminConsole';
import FiltersBar from './components/FiltersBar';
import PropertyCard from './components/PropertyCard';

// bundle-dynamic-imports: heavy modals loaded lazily (only when user triggers them)
const AddPropertyModal = lazy(() => import('./components/AddPropertyModal'));
const AppointmentFormModal = lazy(() => import('./components/AppointmentFormModal'));
const ShareModal = lazy(() => import('./components/ShareModal'));
const WhatsAppLeadModal = lazy(() => import('./components/WhatsAppLeadModal'));

// Hooks
import { useMediaQuery } from './hooks/useMediaQuery';

// Icons
import {
  Building2,
  Lock,
  Unlock,
  Check,
  Info,
  Edit,
  Instagram,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

// rendering-hoist-jsx: static JSX that never changes — defined outside component
// so React never re-creates these objects on re-renders
const HERO_GLOW_TOP = (
  <div
    className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
    style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.10) 0%, transparent 70%)' }}
  />
);
const HERO_GLOW_BOTTOM = (
  <div
    className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none"
    style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)' }}
  />
);
const GOLD_DIVIDER = (
  <div
    className="my-4 h-px w-16"
    style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}
  />
);
const WHATSAPP_SVG = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
// Stable query string constant (rerender-dependencies: avoids new string ref per render)
const MOBILE_QUERY = '(max-width: 1023px)' as const;

// ─── Types ───────────────────────────────────────────────────────────────────

type ConfirmState = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'warning';
  onConfirm: () => void;
};

const CONFIRM_CLOSED: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmar',
  variant: 'danger',
  onConfirm: () => { },
};

// ─── Default company settings ─────────────────────────────────────────────────

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  logoUrl: '',
  name: 'INNOBILIA',
  subtitle: 'Asesores',
  description:
    'Encuentra tu próximo hogar. Haz clic en cualquiera de nuestras propiedades disponibles para agendar visitas virtuales 3D o citas instantáneas.',
  facebookUrl: 'https://facebook.com/innobilia',
  instagramUrl: 'https://instagram.com/innobilia.asesoresinversiones',
  whatsappUrl: 'https://wa.me/5218110000000',
  // Blocker 2: use env var — never hardcode secrets in source code
  adminSecret: import.meta.env.VITE_ADMIN_SECRET ?? 'cambiar-en-produccion',
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // rerender-dependencies: stable constant ref avoids new string on every render
  const isMobile = useMediaQuery(MOBILE_QUERY);

  // rerender-use-ref-transient-values: timer ref for toast auto-dismiss
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // rerender-transitions: non-urgent filter updates
  const [, startFilterTransition] = useTransition();

  // 1. Core Persistent States — using lsGet (js-cache-storage)
  const [properties, setProperties] = useState<Property[]>(
    () => lsGet<Property[]>('innobilia_properties') ?? INITIAL_PROPERTIES
  );

  const [appointments, setAppointments] = useState<Appointment[]>(
    () => lsGet<Appointment[]>('innobilia_appointments') ?? INITIAL_APPOINTMENTS
  );

  const [analytics, setAnalytics] = useState<AnalyticsSummary>(() => {
    return lsGet<AnalyticsSummary>('innobilia_analytics') ?? {
      totalVisits: 742,
      totalShares: 227,
      propertyClicks: { 'prop-1': 142, 'prop-2': 98, 'prop-3': 215, 'prop-4': 310 },
      propertyShares: { 'prop-1': 48, 'prop-2': 21, 'prop-3': 64, 'prop-4': 94 },
    };
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const cached = lsGet<Partial<CompanySettings>>('innobilia_company_settings');
    return cached ? { ...DEFAULT_COMPANY_SETTINGS, ...cached } : DEFAULT_COMPANY_SETTINGS;
  });

  // 2. UI / Role state
  const [role, setRole] = useState<'client' | 'admin'>('client');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // 3. Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 4. Modal toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [propertyToShare, setPropertyToShare] = useState<Property | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  // WhatsApp lead modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [waModalProperty, setWaModalProperty] = useState<Property | null>(null);
  const [waModalPhone, setWaModalPhone] = useState<string>('');
  const [identityFocusField, setIdentityFocusField] = useState<
    'logoUrl' | 'name' | 'subtitle' | 'description' | 'facebookUrl' | 'adminSecret' | 'all'
  >('all');

  // Admin auth modal
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // 5. Confirm modal (replaces window.confirm)
  const [confirmState, setConfirmState] = useState<ConfirmState>(CONFIRM_CLOSED);

  // 6. Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Persistence effects ───────────────────────────────────────────────────

  // Load and sync data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch properties
        const dbProperties = await fetchProperties();
        if (dbProperties && dbProperties.length > 0) {
          // Supabase has data — use it
          setProperties(dbProperties);
        } else {
          // Supabase table is empty — use initial demo data and seed DB for the first time
          setProperties(INITIAL_PROPERTIES);
          for (const prop of INITIAL_PROPERTIES) {
            await upsertProperty(prop);
          }
        }

        // 2. Fetch appointments
        const dbAppointments = await fetchAppointments();
        if (dbAppointments && dbAppointments.length > 0) {
          setAppointments(dbAppointments);
        }

        // 3. Fetch company settings
        const dbSettings = await fetchCompanySettings();
        if (dbSettings && dbSettings.name) {
          // Supabase has settings — merge with defaults
          setCompanySettings(prev => ({ ...prev, ...dbSettings }));
        } else {
          // First time: seed default settings into Supabase
          await upsertCompanySettings(DEFAULT_COMPANY_SETTINGS);
        }

        // 4. Fetch analytics and increment visit counter
        const dbAnalytics = await fetchAnalytics();
        const currentAnalytics: AnalyticsSummary = dbAnalytics || {
          totalVisits: 0,
          totalShares: 0,
          propertyClicks: {},
          propertyShares: {},
        };

        const updatedAnalytics = {
          ...currentAnalytics,
          totalVisits: (currentAnalytics.totalVisits || 0) + 1,
        };
        setAnalytics(updatedAnalytics);
        lsSet('innobilia_analytics', updatedAnalytics);
        await upsertAnalytics(updatedAnalytics);
      } catch (err) {
        console.warn('[innobilia] Error syncing with Supabase:', err);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCompanySettings = useCallback((newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    upsertCompanySettings(newSettings);
  }, []);

  // Persist state changes — using lsSet (js-cache-storage)
  useEffect(() => { lsSet('innobilia_properties', properties); }, [properties]);
  useEffect(() => { lsSet('innobilia_appointments', appointments); }, [appointments]);
  useEffect(() => { lsSet('innobilia_company_settings', companySettings); }, [companySettings]);

  // rerender-split-combined-hooks: separate effects for independent concerns
  // Effect 1: scroll lock (depends on modal open states — boolean derivation)
  const anyModalOpen = Boolean(
    selectedProperty || showBookingModal || showAddModal || showShareModal || showIdentityModal || showWaModal
  );
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyModalOpen]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // rerender-use-ref-transient-values: cancel previous timer before setting new one
  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  const openConfirm = useCallback((opts: Omit<ConfirmState, 'isOpen'>) => {
    setConfirmState({ isOpen: true, ...opts });
  }, []);

  const closeConfirm = useCallback(() => setConfirmState(CONFIRM_CLOSED), []);

  // Issue 6: hash-based admin access (placed after showToast declaration to avoid hoisting error)
  useEffect(() => {
    const hash = window.location.hash;
    const prefix = '#access=';
    if (hash.startsWith(prefix)) {
      const access = hash.slice(prefix.length);
      const secret = companySettings.adminSecret;
      if (access && access === secret) {
        setRole('admin');
        showToast('¡Acceso Administrador concedido mediante enlace seguro!');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [companySettings.adminSecret, showToast]);

  // ─── Property handlers ─────────────────────────────────────────────────────

  const handleSaveProperty = (
    newPropertyData: Omit<Property, 'clicks' | 'shares' | 'createdAt'> & { id?: string }
  ) => {
    if (newPropertyData.id) {
      const existing = properties.find(p => p.id === newPropertyData.id);
      if (existing) {
        const updated = { ...existing, ...newPropertyData };
        setProperties(prev => prev.map(p => p.id === newPropertyData.id ? updated : p));
        if (selectedProperty?.id === existing.id) setSelectedProperty(updated);
        showToast('Propiedad actualizada con éxito.');
        // Async save to Supabase
        upsertProperty(updated);
      }
    } else {
      const freshProperty: Property = {
        ...newPropertyData,
        id: `prop-${Date.now()}`,
        clicks: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
      };
      setProperties(prev => [freshProperty, ...prev]);
      setSelectedProperty(freshProperty);
      showToast('Nueva propiedad publicada en el Linktree.');
      // Async save to Supabase
      upsertProperty(freshProperty);
    }
    setEditingProperty(null);
  };

  const handleDeleteProperty = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    openConfirm({
      title: 'Eliminar Propiedad',
      message: '¿Estás completamente seguro de eliminar esta propiedad de la plataforma? Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: () => {
        setProperties(prev => prev.filter(p => p.id !== id));
        if (selectedProperty?.id === id) {
          setSelectedProperty(properties.find(p => p.id !== id) || null);
        }
        showToast('Inmueble eliminado con éxito.');
        closeConfirm();
        // Delete from Supabase
        deleteProperty(id);
      },
    });
  };

  // ─── Analytics handlers ────────────────────────────────────────────────────

  // useCallback: rerender-functional-setstate + stable ref for PropertyCard memo
  const handleRegisterClick = useCallback((propertyId: string) => {
    let updated: AnalyticsSummary | null = null;
    setAnalytics(prev => {
      const propClicks = { ...prev.propertyClicks, [propertyId]: (prev.propertyClicks[propertyId] || 0) + 1 };
      updated = { ...prev, propertyClicks: propClicks };
      lsSet('innobilia_analytics', updated);
      return updated;
    });
    if (updated) {
      upsertAnalytics(updated);
    }
    incrementPropertyClicks(propertyId);
  }, []);

  const handleRegisterShare = useCallback((propertyId: string) => {
    let updated: AnalyticsSummary | null = null;
    setAnalytics(prev => {
      const propShares = { ...prev.propertyShares, [propertyId]: (prev.propertyShares[propertyId] || 0) + 1 };
      updated = { ...prev, totalShares: prev.totalShares + 1, propertyShares: propShares };
      lsSet('innobilia_analytics', updated);
      return updated;
    });
    if (updated) {
      upsertAnalytics(updated);
    }
    incrementPropertyShares(propertyId);
    showToast('Enlace de la propiedad marcado como compartido.');
  }, [showToast]);

  const handleResetAnalytics = useCallback(() => {
    openConfirm({
      title: 'Restablecer Analíticas',
      message: '¿Seguro que deseas reiniciar los contadores de analíticas a cero? No se puede deshacer.',
      confirmLabel: 'Sí, restablecer',
      variant: 'warning',
      onConfirm: () => {
        const reset: AnalyticsSummary = { totalVisits: 1, totalShares: 0, propertyClicks: {}, propertyShares: {} };
        setAnalytics(reset);
        lsSet('innobilia_analytics', reset);
        showToast('Contadores de analíticas restablecidos a cero.');
        closeConfirm();
        // Reset in Supabase
        upsertAnalytics(reset);
      },
    });
  }, [showToast]);

  // ─── Share handlers ────────────────────────────────────────────────────────

  const handleOpenShare = useCallback((property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    setPropertyToShare(property);
    setShowShareModal(true);
  }, []);

  // ─── Appointment handlers ──────────────────────────────────────────────────

  const handleAddAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `app-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAppointments(prev => [newAppointment, ...prev]);
    showToast('¡Cita solicitada! Revisar en el Panel de Administración.');
    // Insert into Supabase
    insertAppointment(newAppointment);
  };

  const handleDeleteAppointment = (id: string) => {
    openConfirm({
      title: 'Eliminar Cita',
      message: '¿Deseas dar por atendida o borrar la solicitud de esta cita?',
      confirmLabel: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: () => {
        setAppointments(prev => prev.filter(app => app.id !== id));
        showToast('Cita atendida/eliminada de la agenda.');
        closeConfirm();
        // Delete from Supabase
        deleteAppointment(id);
      },
    });
  };

  // ─── Client link copy ──────────────────────────────────────────────────────

  const handleCopyClientLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.origin);
    showToast('¡Enlace de Innobilia para Clientes copiado al portapapeles!');
  }, [showToast]);

  // ─── Property card click ───────────────────────────────────────────────────

  const handlePropertyCardClick = useCallback((p: Property) => {
    setSelectedProperty(p);
    handleRegisterClick(p.id);
  }, [handleRegisterClick]);

  // ─── Filtered properties ───────────────────────────────────────────────────

  // js-set-map-lookups: Set avoids creating intermediate array from Array.from(new Set(...))
  const uniqueLocations: string[] = [...new Set<string>(properties.map(p => p.location))];

  const filteredProperties = properties.filter(p => {
    const matchLocation = selectedLocation === 'all' || p.location === selectedLocation;

    let matchPrice = true;
    if (selectedPriceRange === 'custom') {
      const min = customMinPrice ? Number(customMinPrice) : 0;
      const max = customMaxPrice ? Number(customMaxPrice) : Infinity;
      matchPrice = p.price >= min && p.price <= max;
    } else if (selectedPriceRange === 'under-150k') {
      matchPrice = p.price < 150000;
    } else if (selectedPriceRange === '150k-300k') {
      matchPrice = p.price >= 150000 && p.price <= 300000;
    } else if (selectedPriceRange === 'above-300k') {
      matchPrice = p.price > 300000;
    }

    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchLocation && matchPrice && matchSearch;
  });

  // rerender-transitions: clear filters is non-urgent, wrap in startTransition
  const handleClearFilters = useCallback(() => {
    startFilterTransition(() => {
      setSelectedLocation('all');
      setSelectedPriceRange('all');
      setSearchQuery('');
      setCustomMinPrice('');
      setCustomMaxPrice('');
    });
  }, [startFilterTransition]);

  // ─── WhatsApp handler — abre el modal con plantilla ─────────────────────
  const handleWhatsApp = useCallback((p: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    handleRegisterClick(p.id);
    setWaModalProperty(p);
    setWaModalPhone(p.whatsappNumber);
    setShowWaModal(true);
  }, [handleRegisterClick]);

  const handleEdit = useCallback((p: Property) => {
    setEditingProperty(p);
    setShowAddModal(true);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ backgroundColor: '#fdfcf9ff' }}>

      {/* Toast notification */}
      {toastMessage !== null ? (
        <div className="toast-enter fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold border"
          style={{ background: '#1c1917', borderColor: '#44403c', color: '#faf7f2' }}>
          <Check className="h-4 w-4" style={{ color: '#c9a84c' }} />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Nav Header — luxury dark */}
      <header className="sticky top-0 z-40 backdrop-blur-md-custom border-b px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(249,246,241,0.88)', borderColor: '#e7e0d4' }}>
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm"
            style={{ background: '#1c1917', color: '#faf7f2' }}>
            <Building2 className="h-4 w-4" style={{ color: '#c9a84c' }} />
            <span className="font-display font-bold text-sm tracking-wide">Innobilia</span>
          </div>
          <span className=" py-1.5 hidden sm:inline-block text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full font-bold border"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#8a6d2f', borderColor: 'rgba(201,168,76,0.3)' }}>
            Real Estate
          </span>
        </div>

        {role === 'client' ? (
          <button
            onClick={() => {
              setAdminAuthInput('');
              setAdminAuthError(false);
              setShowAdminAuthModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all hover:scale-105 cursor-pointer shadow-sm"
            style={{ background: '#1c1917', color: '#faf7f2' }}
          >
            <Lock className="h-3.5 w-3.5" style={{ color: '#c9a84c' }} />
            <span>Acceso Asesores</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 p-1 rounded-xl border"
            style={{ background: '#f0ead8', borderColor: '#d6cfc4' }}>
            <button
              onClick={() => { setRole('client'); showToast('Has regresado a la vista de cliente.'); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              style={{ background: '#faf7f2', color: '#1c1917' }}
            >
              Cerrar sesión
            </button>
            <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold"
              style={{ background: '#1c1917', color: '#c9a84c' }}>
              ADMIN
            </span>
          </div>
        )}
      </header>

      {/* Admin mode banner */}
      {role === 'admin' ? (
        <div className="relative overflow-hidden banner-shine text-xs px-4 py-2 text-center font-bold tracking-wide flex items-center justify-center gap-1.5 select-none font-mono"
          style={{ background: '#fe9a00', color: '#1c1917' }}>
          <Unlock className="h-3.5 w-3.5 shrink-0 animate-pulse" />
          <span>Mesa de Control Activa — Modo Administrador</span>
        </div>
      ) : null}

      {/* Main content */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-5">

          {/* Identity Hero Card — luxury editorial style */}
          <div className="hero-glow relative overflow-hidden rounded-2xl border flex flex-col items-center text-center py-10 px-6 sm:px-10"
            style={{ background: 'linear-gradient(160deg, #faf7f2 0%, #f0ead8 100%)', borderColor: '#e7e0d4' }}>

            {/* rendering-hoist-jsx: static decorative elements hoisted to module scope */}
            {HERO_GLOW_TOP}
            {HERO_GLOW_BOTTOM}

            {/* Logo */}
            <div className="relative mb-5">
              {companySettings.logoUrl ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ boxShadow: '0 0 0 3px #c9a84c, 0 8px 32px rgba(201,168,76,0.2)', background: '#f0ead8' }}>
                  <img src={companySettings.logoUrl} alt="Logo Empresa" className="h-full w-full object-cover"
                    referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  {role === 'admin' ? (
                    <button onClick={() => { setIdentityFocusField('logoUrl'); setShowIdentityModal(true); }}
                      className="absolute bottom-0 right-0 p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                      style={{ background: '#1c1917', border: '1px solid #44403c' }} title="Editar foto">
                      <Edit className="h-3 w-3" style={{ color: '#c9a84c' }} />
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="relative p-5 rounded-2xl flex items-center justify-center"
                  style={{ background: '#1c1917', boxShadow: '0 0 0 3px rgba(201,168,76,0.4), 0 8px 24px rgba(28,25,23,0.2)' }}>
                  <Building2 className="h-9 w-9" style={{ color: '#c9a84c' }} />
                  {role === 'admin' ? (
                    <button onClick={() => { setIdentityFocusField('logoUrl'); setShowIdentityModal(true); }}
                      className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                      style={{ background: '#c9a84c', color: '#1c1917' }} title="Subir foto">
                      <Edit className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Brand title — Playfair Display */}
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight flex items-center justify-center gap-2.5"
              style={{ color: '#1c1917' }}>
              <span>{companySettings.name || 'INNOBILIA'}</span>
              <span className="font-display italic text-base sm:text-lg font-normal" style={{ color: '#c9a84c' }}>
                {companySettings.subtitle || 'Asesores'}
              </span>
              {role === 'admin' ? (
                <button onClick={() => { setIdentityFocusField('name'); setShowIdentityModal(true); }}
                  className="p-1 rounded-lg transition-colors cursor-pointer opacity-60 hover:opacity-100"
                  style={{ color: '#8a6d2f' }} title="Editar nombre">
                  <Edit className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </h1>

            {/* rendering-hoist-jsx: static gold divider hoisted to module scope */}
            {GOLD_DIVIDER}

            <div className="flex items-center justify-center gap-1.5 max-w-sm">
              <p className="text-sm leading-relaxed" style={{ color: '#78716c' }}>{companySettings.description}</p>
              {role === 'admin' ? (
                <button onClick={() => { setIdentityFocusField('description'); setShowIdentityModal(true); }}
                  className="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: '#8a6d2f' }}>
                  <Edit className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] px-3 py-1 rounded-full border font-medium flex items-center gap-1"
                style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.25)', color: '#8a6d2f' }}>
                📍 {companySettings.locations || 'San Pedro • Lomas • Valle de Bravo'}
              </span> 
              {role === 'admin' ? (
                <button onClick={() => { setIdentityFocusField('locations'); setShowIdentityModal(true); }}
                  className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: '#8a6d2f' }}>
                  <Edit className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div> */}
          </div>

          {/* Admin Console (only visible in admin mode) */}
          {role === 'admin' && (
            <AdminConsole
              companySettings={companySettings}
              onSaveSettings={handleSaveCompanySettings}
              properties={properties}
              appointments={appointments}
              analytics={analytics}
              onAddProperty={() => { setEditingProperty(null); setShowAddModal(true); }}
              onCopyClientLink={handleCopyClientLink}
              onDeleteAppointment={handleDeleteAppointment}
              onResetAnalytics={handleResetAnalytics}
              onOpenIdentityModal={(field) => { setIdentityFocusField(field); setShowIdentityModal(true); }}
              onShowToast={showToast}
            />
          )}

          {/* Filters */}
          <FiltersBar
            uniqueLocations={uniqueLocations}
            selectedLocation={selectedLocation}
            selectedPriceRange={selectedPriceRange}
            searchQuery={searchQuery}
            customMinPrice={customMinPrice}
            customMaxPrice={customMaxPrice}
            filteredCount={filteredProperties.length}
            totalCount={properties.length}
            onLocationChange={setSelectedLocation}
            onPriceRangeChange={setSelectedPriceRange}
            onSearchChange={setSearchQuery}
            onCustomMinChange={setCustomMinPrice}
            onCustomMaxChange={setCustomMaxPrice}
            onClearFilters={handleClearFilters}
          />

          {/* Property cards list */}
          {/* rendering-content-visibility: browser skips layout/paint for off-screen cards */}
          <div className="space-y-3" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>
            <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold px-1"
              style={{ color: '#a8a29e' }}>
              Cartera de Propiedades — {filteredProperties.length} disponible{filteredProperties.length !== 1 ? 's' : ''}
            </h3>

            {filteredProperties.length === 0 ? (
              <div className="text-center p-10 rounded-2xl border"
                style={{ background: 'rgba(250,247,242,0.8)', borderColor: '#e7e0d4', color: '#a8a29e' }}>
                <Info className="h-8 w-8 mx-auto mb-3" style={{ color: '#d6cfc4' }} />
                <p className="text-sm">No se encontraron propiedades con los parámetros buscados.</p>
              </div>
            ) : (
              <div className="space-y-3">
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


          {/* Social media contact — luxury style */}
          {role === 'client' ? (
            <nav aria-label="Canales Oficiales de Contacto" className="pt-6 border-t space-y-3"
              style={{ borderColor: '#e7e0d4' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest text-center" style={{ color: '#a8a29e' }}>
                Canales Oficiales
              </p>
              <div className="flex items-center justify-center gap-3">
                {companySettings.instagramUrl ? (
                  <a href={companySettings.instagramUrl} target="_blank" rel="noopener noreferrer"
                    aria-label="Síguenos en Instagram" title="Instagram"
                    className="flex items-center justify-center w-12 h-12 text-white rounded-2xl shadow-md transition-all hover:scale-110 hover:shadow-lg cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                    <Instagram className="h-5 w-5" />
                  </a>
                ) : null}
                {companySettings.whatsappUrl ? (
                  <button
                    onClick={() => {
                      setWaModalProperty(null);
                      setWaModalPhone(companySettings.whatsappUrl.replace('https://wa.me/', ''));
                      setShowWaModal(true);
                    }}
                    aria-label="Contáctanos por WhatsApp" title="WhatsApp"
                    className="flex items-center justify-center w-12 h-12 text-white rounded-2xl shadow-md transition-all hover:scale-110 hover:shadow-lg cursor-pointer"
                    style={{ background: '#25D366' }}>
                    {/* rendering-hoist-jsx: WhatsApp SVG hoisted to module scope */}
                    {WHATSAPP_SVG}
                  </button>
                ) : null}
                {companySettings.facebookUrl ? (
                  <a
                    href={companySettings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Síguenos en Facebook" title="Facebook"
                    className="flex items-center justify-center w-12 h-12 text-white rounded-2xl shadow-md transition-all hover:scale-110 hover:shadow-lg cursor-pointer"
                    style={{ background: '#1877F2' }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                ) : null}
              </div>
            </nav>
          ) : null}
        </div>
      </main>

      {/* Footer — dark luxury */}
      <footer className="border-t py-8 text-center text-xs mt-auto"
        style={{ background: '#1c1917', borderColor: '#292524' }}>
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          <p className="font-display text-base font-semibold" style={{ color: '#e2c37a' }}>
            Innobilia
          </p>
          <p className="text-[10px] font-mono tracking-wider" style={{ color: '#78716c' }}>
            Real Estate Hub © 2026 — Todos los derechos reservados
          </p>
          <div className="pt-3 border-t flex justify-center" style={{ borderColor: '#292524' }}>
            {role === 'client' ? (
              <button
                onClick={() => {
                  setAdminAuthInput('');
                  setAdminAuthError(false);
                  setShowAdminAuthModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold transition-colors cursor-pointer"
                style={{ background: 'rgba(201,168,76,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: '#78716c' }}
              >
                <Lock className="h-3 w-3" style={{ color: '#44403c' }} />
                Acceso Agentes
              </button>
            ) : (
              <button
                onClick={() => { setRole('client'); showToast('Cerraste sesión de administrador'); }}
                className="text-[10px] font-mono transition-colors cursor-pointer hover:opacity-80"
                style={{ color: '#78716c' }}
              >
                Cerrar sesión administrativa
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* ── Modals ─────────────────────────────────────────────────────────
           bundle-dynamic-imports: heavy modals wrapped in Suspense so their
           JS chunks are loaded on demand, not on initial page load.
           A null fallback keeps the UX clean (modal mounts instantly once loaded). */}
      <Suspense fallback={null}>

        {/* Property detail modal */}
        {selectedProperty && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={selectedProperty.title}
          >
            <div
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
              onClick={() => setSelectedProperty(null)}
            />
            <div className="relative z-10 w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-500 hover:text-slate-900 hover:bg-white shadow-md transition-all cursor-pointer"
                aria-label="Cerrar detalle de propiedad"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <PropertyDetailSidebar
                  property={selectedProperty}
                  onClose={() => setSelectedProperty(null)}
                  onOpenBooking={() => setShowBookingModal(true)}
                  onRegisterClick={handleRegisterClick}
                  onWhatsApp={(p) => {
                    setWaModalProperty(p);
                    setWaModalPhone(p.whatsappNumber);
                    setShowWaModal(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Appointment form modal */}
        {showBookingModal && selectedProperty && (
          <AppointmentFormModal
            property={selectedProperty}
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            onSubmit={handleAddAppointment}
          />
        )}

        {/* Add / Edit property modal */}
        {showAddModal && (
          <AddPropertyModal
            isOpen={showAddModal}
            onClose={() => { setShowAddModal(false); setEditingProperty(null); }}
            onSave={handleSaveProperty}
            editingProperty={editingProperty}
          />
        )}

        {/* Share modal */}
        {showShareModal && propertyToShare && (
          <ShareModal
            property={propertyToShare}
            isOpen={showShareModal}
            onClose={() => { setShowShareModal(false); setPropertyToShare(null); }}
            onConfirmShare={handleRegisterShare}
          />
        )}

        {/* Identity modal */}
        <IdentityModal
          isOpen={showIdentityModal}
          onClose={() => setShowIdentityModal(false)}
          companySettings={companySettings}
          onSave={handleSaveCompanySettings}
          focusField={identityFocusField}
          onShowToast={showToast}
        />

        {/* Confirm modal (replaces window.confirm) */}
        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          variant={confirmState.variant}
          onConfirm={confirmState.onConfirm}
          onCancel={closeConfirm}
        />

        {/* WhatsApp lead modal */}
        <WhatsAppLeadModal
          isOpen={showWaModal}
          onClose={() => setShowWaModal(false)}
          property={waModalProperty}
          targetPhone={waModalPhone}
          brokerName="Iraida"
          onSend={incrementWhatsAppLeads}
        />

        {/* Admin Authentication Modal */}
        {showAdminAuthModal ? (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-auth-modal-title"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
              onClick={() => setShowAdminAuthModal(false)}
            />
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border flex flex-col animate-in slide-in-from-bottom duration-300"
              style={{ background: '#1c1917', borderColor: '#44403c' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#292524' }}>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg" style={{ background: '#292524' }}>
                    <Lock className="h-4 w-4" style={{ color: '#c9a84c' }} />
                  </div>
                  <div>
                    <h3 id="admin-auth-modal-title" className="text-sm font-bold" style={{ color: '#faf7f2' }}>
                      Acceso Administrativo
                    </h3>
                    <p className="text-[10px] font-mono" style={{ color: '#78716c' }}>Solo para asesores autorizados</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminAuthModal(false)}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: '#78716c' }}
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold uppercase" style={{ color: '#a8a29e' }}>
                    Clave de Acceso
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      autoFocus
                      placeholder="Ingresa clave secrecta"
                      value={adminAuthInput}
                      onChange={(e) => { setAdminAuthInput(e.target.value); setAdminAuthError(false); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (adminAuthInput === companySettings.adminSecret) {
                            setRole('admin');
                            setShowAdminAuthModal(false);
                            showToast('¡Bienvenido! Modo Administrador activado.');
                          } else {
                            setAdminAuthError(true);
                          }
                        }
                      }}
                      className="w-full rounded-xl border px-4 py-2.5 pr-11 text-sm focus:outline-none font-mono"
                      style={{
                        background: '#292524',
                        borderColor: adminAuthError ? '#ef4444' : '#44403c',
                        color: '#faf7f2',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors cursor-pointer"
                      style={{ color: showAdminPassword ? '#c9a84c' : '#78716c' }}
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
                  onClick={() => {
                    if (adminAuthInput === companySettings.adminSecret) {
                      setRole('admin');
                      setShowAdminAuthModal(false);
                      showToast('¡Bienvenido! Modo Administrador activado.');
                    } else {
                      setAdminAuthError(true);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 cursor-pointer"
                  style={{ background: '#c9a84c', color: '#1c1917' }}
                >
                  Ingresar al Panel
                </button>
              </div>
            </div>
          </div>
        ) : null}

      </Suspense>
    </div>
  );
}
