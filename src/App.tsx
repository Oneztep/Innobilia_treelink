import React, { useState, useEffect, useCallback, useRef, useTransition, lazy, Suspense } from 'react';
import { Property, Appointment, AnalyticsSummary } from './types';
import { INITIAL_PROPERTIES, INITIAL_APPOINTMENTS } from './initialData';
import { supabase } from './lib/supabase.ts';
import { PRICE_RANGES } from './config/filters';

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
import { useModal, useSheetModal } from './hooks/useModal';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { MobileFloatingButtons } from './components/MobileFloatingButtons';
import { SocialContactNav } from './components/SocialContactNav';
import { PropertyList } from './components/PropertyList';
import { AdminAuthModal } from './components/AdminAuthModal';

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
  X,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';

// rendering-hoist-jsx: static JSX that never changes — defined outside component
// so React never re-creates these objects on re-renders

// Stable query string constant (rerender-dependencies: avoids new string ref per render)
const MOBILE_QUERY = '(max-width: 767px)' as const;

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

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  logoUrl: '',
  name: 'INNOBILIA',
  subtitle: 'Asesores',
  description:
    'Encuentra tu próximo hogar. Haz clic en cualquiera de nuestras propiedades disponibles para agendar visitas virtuales 3D o citas instantáneas.',
  facebookUrl: 'https://facebook.com/innobilia',
  instagramUrl: 'https://instagram.com/innobilia.asesoresinversiones',
  whatsappUrl: 'https://wa.me/5218110000000',
  adminSecret: '[PASSWORD]',
};

// ─── Main App ─────────────────────────────────────────────────────────────────

/** 
 * Wrapper para PropertyDetailSidebar que permite aplicar useModal a un estado de objeto (Property | null)
 * de forma que mantenga el objeto vivo durante la animación de salida.
 */
function PropertyDetailModal({
  property,
  onClose,
  onOpenBooking,
  onRegisterClick,
  onWhatsApp,
  dialogRef
}: {
  property: Property | null;
  onClose: () => void;
  onOpenBooking: () => void;
  onRegisterClick: (id: string) => void;
  onWhatsApp: (p: Property) => void;
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}) {
  const { isVisible, animClass, close } = useModal(!!property, onClose);
  const prevProperty = useRef<Property | null>(null);

  useEffect(() => {
    if (property) prevProperty.current = property;
  }, [property]);

  const displayProp = property || prevProperty.current;

  if (!isVisible || !displayProp) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      aria-label={displayProp.title}
    >
      <div
        className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm ${animClass.overlay}`}
        onClick={close}
        aria-label='Close-overlay'
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') close();
        }}
      />
      <div className={`relative z-10 w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col ${animClass.panel}`}>
        <button
          onClick={close}
          type='button'
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-500 hover:text-slate-900 hover:bg-white shadow-md transition-all cursor-pointer"
          aria-label="Cerrar detalle de propiedad"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <PropertyDetailSidebar
            dialogRef={dialogRef}
            property={displayProp}
            onClose={close}
            onOpenBooking={onOpenBooking}
            onRegisterClick={onRegisterClick}
            onWhatsApp={onWhatsApp}
          />
        </div>
      </div>
    </dialog>
  );
}



export default function App() {
  // Global dialog ref for modals
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      dailyClicks: {},
    };
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const cached = lsGet<Partial<CompanySettings>>('innobilia_company_settings');
    return cached ? { ...DEFAULT_COMPANY_SETTINGS, ...cached } : DEFAULT_COMPANY_SETTINGS;
  });

  // 2. UI / Role state
  const [role, setRole] = useState<'client' | 'admin'>('client');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  // Loading state: true while DB sync is in flight (structure renders from localStorage immediately)
  const [isDbSyncing, setIsDbSyncing] = useState(true);

  // 3. Filters
  const [selectedPropertyType, setSelectedPropertyType] = useState('all');
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
  const [waModalMode, setWaModalMode] = useState<'lead' | 'owner/broker'>('lead');
  const [identityFocusField, setIdentityFocusField] = useState<
    'logoUrl' | 'name' | 'subtitle' | 'description' | 'facebookUrl' | 'adminSecret' | 'all'
  >('all');


  // Admin auth modal
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const { isVisible: isAuthVisible, animClass: authAnim, close: closeAuth } = useModal(showAdminAuthModal, () => setShowAdminAuthModal(false));
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // 5. Confirm modal (replaces window.confirm)
  const [confirmState, setConfirmState] = useState<ConfirmState>(CONFIRM_CLOSED);

  // 6. Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAdminLogin = async () => {
    if (adminAuthInput === companySettings.adminSecret) {
      try {

        const { data, error } = await supabase.auth.signInWithPassword({
          email: "innobilia.asesoresinversiones@gmail.com",
          password: adminAuthInput
        });

        if (error || !data.session) {
          setAdminAuthError(true);
          return;
        }
        setRole('admin');
        closeAuth();
        showToast('¡Bienvenido! Modo Administrador activado.');
      } catch (err) {
        console.error('Fallo de red con Supabase:', err);
        setAdminAuthError(true);
      }
    } else {
      setAdminAuthError(true);
    }
  };

  // ─── Persistence effects ───────────────────────────────────────────────────

  // Load and sync data from Supabase on mount.
  // Strategy: defer the DB fetch to after the first paint so the page
  // shell (from localStorage) renders instantly, then data fills in.



  useEffect(() => {
    async function loadData() {
      try {
        // Disparamos las 4 consultas principales EN PARALELO
        const [dbProperties, dbAppointments, dbSettings, dbAnalytics] = await Promise.all([
          fetchProperties(),
          fetchAppointments(),
          fetchCompanySettings(),
          fetchAnalytics()
        ]);

        // 1. Procesar Properties
        if (dbProperties && dbProperties.length > 0) {
          setProperties(dbProperties);
          lsSet('innobilia_properties', dbProperties);
        } else if (dbProperties !== null && dbProperties.length === 0) {
          setProperties(INITIAL_PROPERTIES);
          // NOTA: Si INITIAL_PROPERTIES es muy grande, este bucle puede ralentizar.
          // Lo ideal sería una función "upsertAllProperties" en el backend,
          // pero por ahora lo dejamos correr en segundo plano sin bloquear el resto.
          (async () => {
            const promiseUpsert = INITIAL_PROPERTIES.map(prop => upsertProperty(prop))
            await Promise.all(promiseUpsert);
          })();
        }

        // 2. Procesar Appointments
        if (dbAppointments && dbAppointments.length > 0) {
          setAppointments(dbAppointments);
        }

        // 3. Procesar Company Settings
        if (dbSettings && dbSettings.name) {
          setCompanySettings(prev => ({ ...prev, ...dbSettings }));
        } else {
          await upsertCompanySettings(DEFAULT_COMPANY_SETTINGS);
        }

        // 4. Procesar Analytics
        const currentAnalytics: AnalyticsSummary = dbAnalytics || {
          totalVisits: 0,
          totalShares: 0,
          propertyClicks: {},
          propertyShares: {},
          dailyClicks: {},
        };
        const updatedAnalytics = {
          ...currentAnalytics,
          totalVisits: (currentAnalytics.totalVisits || 0) + 1,
        };
        setAnalytics(updatedAnalytics);
        lsSet('innobilia_analytics', updatedAnalytics);

        // El guardado de analíticas no debe retrasar la UI, lo disparamos en segundo plano
        upsertAnalytics(updatedAnalytics).catch(err => console.error("Error saving analytics:", err));

      } catch (err) {
        console.warn('[innobilia] Error syncing with Supabase:', err);
      } finally {
        setIsDbSyncing(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCompanySettings = useCallback((newSettings: CompanySettings) => {
    setCompanySettings(newSettings);

  }, []);

  useEffect(() => {
    if (companySettings) {
      upsertCompanySettings(companySettings);
    }
  }, [companySettings])

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

  useEffect(() => {
    if (properties.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get('property');
    if (propertyId) {
      const foundProperty = properties.find(p => p.id === propertyId);

      if (foundProperty) {
        setSelectedProperty(foundProperty);

        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [properties]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // rerender-use-ref-transient-values: cancel previous timer before setting new one
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastTimerRef) return;

    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const openConfirm = useCallback((opts: Omit<ConfirmState, 'isOpen'>) => {
    setConfirmState({ isOpen: true, ...opts });
  }, []);

  const closeConfirm = useCallback(() => setConfirmState(CONFIRM_CLOSED), []);

  // Issue 6: hash-based admin access (placed after showToast declaration to avoid hoisting error)
  useEffect(() => {
    const hash = window.location.hash;
    const prefix = '#access=';

    if (!hash.startsWith(prefix)) return;
    const accessToken = hash.slice(prefix.length);
    if (!accessToken) return;

    // 1. Creamos una función asíncrona interna para no bloquear el render
    const verifyAccess = async () => {
      try {
        // 2. Le pedimos a Supabase que verifique el secreto en el Servidor
        // (Jamás descargamos el 'adminSecret' al frontend)
        const { data: isValid, error } = await supabase.rpc('verify_admin_hash', {
          input_hash: accessToken
        });

        if (isValid && !error) {
          setRole('admin');
          showToast('¡Acceso Administrador concedido mediante enlace seguro!');

          // Limpiamos la URL para que no quede rastro del token
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
          console.warn("Intento de acceso administrador inválido.");
        }
      } catch (err) {
        console.error("Error en la autenticación:", err);
      }
    };

    verifyAccess();
  }, [showToast]);

  // ─── Property handlers ─────────────────────────────────────────────────────

  const handleSaveProperty = async (
    newPropertyData: Omit<Property, 'clicks' | 'shares' | 'createdAt'> & { id?: string }
  ) => {
    if (newPropertyData.id) {
      const existing = properties.find(p => p.id === newPropertyData.id);
      if (existing) {
        const updated = { ...existing, ...newPropertyData };
        setProperties(prev => prev.map(p => p.id === newPropertyData.id ? updated : p));
        if (selectedProperty?.id === existing.id) setSelectedProperty(updated);
        // Save to Supabase and verify
        const ok = await upsertProperty(updated);
        if (ok) {
          showToast('Propiedad actualizada con éxito.');
        } else {
          showToast('Propiedad guardada localmente (sin conexión con Supabase).');
          console.warn('[innobilia] upsertProperty failed for id:', updated.id);
        }
      }
    } else {
      const freshProperty: Property = {
        ...newPropertyData,
        id: crypto.randomUUID(),
        clicks: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
      };
      setProperties(prev => [freshProperty, ...prev]);
      setSelectedProperty(freshProperty);
      // Save to Supabase and verify
      const ok = await upsertProperty(freshProperty);
      if (ok) {
        showToast('Nueva propiedad publicada en el Linktree.');
      } else {
        showToast('Propiedad guardada localmente (sin conexión con Supabase).');
        console.warn('[innobilia] upsertProperty failed for new property:', freshProperty.id);
      }
    }
    setEditingProperty(null);
  };

  const handleDeleteProperty = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    openConfirm({
      title: 'Eliminar Propiedad',
      message: '¿Estás completamente seguro de eliminar esta propiedad de la plataforma? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
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

  const handleUnsavedChanges = () => {
    openConfirm({
      title: 'Tienes cambios sin guardar',
      message: '¿Estás completamente seguro?\n Perderás los cambios no guardados.',
      confirmLabel: 'Cerrar',
      variant: 'danger',
      onConfirm: () => {
        closeConfirm();
      },
    });
  }

  // ─── Analytics handlers ────────────────────────────────────────────────────

  // useCallback: rerender-functional-setstate + stable ref for PropertyCard memo
  const handleRegisterClick = useCallback((propertyId: string) => {
    let updated: AnalyticsSummary | null = null;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    setAnalytics(prev => {
      const propClicks = {
        ...prev.propertyClicks,
        [propertyId]: (prev.propertyClicks[propertyId] || 0) + 1
      };

      const dayEntry = {
        ...(prev.dailyClicks[today] || {}),
        [propertyId]: (prev.dailyClicks[today]?.[propertyId] || 0) + 1
      };

      const dailyClicks = {
        ...prev.dailyClicks,
        [today]: dayEntry
      };

      // Solo calculamos y retornamos el nuevo estado, sin efectos secundarios
      return {
        ...prev,
        propertyClicks: propClicks,
        dailyClicks
      };
    });
    if (updated) {
      upsertAnalytics(updated);
    }
    incrementPropertyClicks(propertyId);
  }, []);

  useEffect(() => {
    if (analytics) {
      lsSet('innobilia_analytics', analytics);
    }
  }, [analytics]);

  const handleRegisterShare = useCallback((propertyId: string) => {
    let updated: AnalyticsSummary | null = null;
    setAnalytics(prev => {
      const propShares = {
        ...prev.propertyShares,
        [propertyId]: (prev.propertyShares[propertyId] || 0) + 1
      };
      // Retornamos únicamente el nuevo estado calculado
      return {
        ...prev,
        totalShares: prev.totalShares + 1,
        propertyShares: propShares
      };
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
      onConfirm: async () => {
        const reset: AnalyticsSummary = { totalVisits: 1, totalShares: 0, propertyClicks: {}, propertyShares: {}, dailyClicks: {} };
        setAnalytics(reset);
        closeConfirm();
        showToast('Contadores de analíticas restablecidos a cero.');

        try {
          lsSet('innobilia_analytics', reset);

          // Reset in Supabase
          await upsertAnalytics(reset);
        } catch (err) {
          console.error("Error al sincronizar el reset en Supabase:", err);
        }
      },
    });
  }, [showToast, openConfirm, closeConfirm]);

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

  const handleWhatsAppLeadSubmit = (data: { name: string; phone: string; date: string; time: string; budget: string; notes: string; }) => {
    incrementWhatsAppLeads();

    // Create new appointment for the admin dashboard
    const newApt: Appointment = {
      id: `app-wa-${Date.now()}`,
      propertyId: waModalProperty?.id || '',
      propertyTitle: waModalProperty?.title || 'Consulta General',
      clientName: data.name,
      clientLastName: '',
      clientEmail: 'WhatsApp',
      clientPhone: data.phone,
      budget: Number(data.budget.replace(/[^0-9]/g, '')) || 0,
      date: data.date,
      time: data.time,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    setAppointments(prev => [newApt, ...prev]);
    showToast('Tu consulta fue preparada exitosamente.');
    insertAppointment(newApt);
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
    const matchesPropertyType = selectedPropertyType === 'all' || p.title.toLowerCase().includes(selectedPropertyType.toLowerCase());

    let matchPrice = true;
    if (selectedPriceRange === 'custom') {
      const min = customMinPrice ? Number(customMinPrice) : 0;
      const max = customMaxPrice ? Number(customMaxPrice) : Infinity;
      matchPrice = p.price >= min && p.price <= max;
    } else if (selectedPriceRange !== 'all') {
      // Buscamos dinámicamente el rango en nuestra configuración
      const rangeConfig = PRICE_RANGES.find(r => r.id === selectedPriceRange);

      if (rangeConfig) {
        matchPrice = p.price >= rangeConfig.min && p.price <= rangeConfig.max;
      }
    }

    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPropertyType && matchPrice && matchSearch;
  });

  // rerender-transitions: clear filters is non-urgent, wrap in startTransition
  const handleClearFilters = useCallback(() => {
    startFilterTransition(() => {
      setSelectedPropertyType('all');
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
    setWaModalMode('lead')
    setShowWaModal(true);
  }, [handleRegisterClick]);

  const handleEdit = useCallback((p: Property) => {
    setEditingProperty(p);
    setShowAddModal(true);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ backgroundColor: '#f8fafc' }}>

      {/* Toast notification */}
      {toastMessage !== null ? (
        <div className="toast-enter fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold border"
          style={{ background: '#0f172b', borderColor: '#1e293b', color: '#f8fafc' }}>
          <Check className="h-4 w-4" style={{ color: '#ffb900' }} />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Nav Header — luxury dark */}
      <header className="sticky top-0 z-40 backdrop-blur-md-custom border-b px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(248,250,252,0.92)', borderColor: '#e2e8f0' }}>
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm"
            style={{ background: '#0f172b', color: '#f8fafc' }}>
            <Building2 className="h-4 w-4" style={{ color: '#ffb900' }} />
            <span className="font-display font-bold text-sm tracking-wide">Innobilia</span>
          </div>
          <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full font-bold border"
            style={{ background: 'rgba(255,185,0,0.1)', color: '#cc9a00', borderColor: 'rgba(255,185,0,0.3)' }}>
            Real Estate
          </span>
        </div>

        {role === 'client' ? (
          <button
            type='button'
            onClick={() => {
              setAdminAuthInput('');
              setAdminAuthError(false);
              setShowAdminAuthModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all hover:opacity-90 cursor-pointer shadow-sm"
            style={{ background: '#0f172b', color: '#f8fafc' }}
          >
            <Lock className="h-3.5 w-3.5" style={{ color: '#ffb900' }} />
            <span>Acceso Asesores</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 p-1 rounded-xl border"
            style={{ background: '#f1f5f9', borderColor: '#e2e8f0' }}>
            <button
              type='button'
              onClick={() => { setRole('client'); showToast('Has regresado a la vista de cliente.'); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              style={{ background: '#fff', color: '#0f172b' }}
            >
              Cerrar sesión
            </button>
            <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold"
              style={{ background: '#0f172b', color: '#ffb900' }}>
              ADMIN
            </span>
          </div>
        )}
      </header>

      {/* Admin mode banner */}
      {role === 'admin' ? (
        <div className="relative overflow-hidden banner-shine text-xs px-4 py-2 text-center font-bold tracking-wide flex items-center justify-center gap-1.5 select-none font-mono"
          style={{ background: '#fe9a00', color: '#0f172b' }}>
          <Unlock className="h-3.5 w-3.5 shrink-0 animate-pulse" />
          <span>Mesa de Control Activa — Modo Administrador</span>
        </div>
      ) : null}

      {/* Main content */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-5">

          {/* Identity Hero Card */}
          <Hero
            companySettings={companySettings}
            role={role}
            setIdentityFocusField={setIdentityFocusField}
            setShowIdentityModal={setShowIdentityModal} />

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
            selectedPropertyType={selectedPropertyType}
            selectedPriceRange={selectedPriceRange}
            searchQuery={searchQuery}
            customMinPrice={customMinPrice}
            customMaxPrice={customMaxPrice}
            filteredCount={filteredProperties.length}
            totalCount={properties.length}
            onPropertyTypeChange={setSelectedPropertyType}
            onPriceRangeChange={setSelectedPriceRange}
            onSearchChange={setSearchQuery}
            onCustomMinChange={setCustomMinPrice}
            onCustomMaxChange={setCustomMaxPrice}
            onClearFilters={handleClearFilters}
            role={role}
            onAddProperty={() => setShowAddModal(true)}
          />

          {/* Property cards list */}
          {/* rendering-content-visibility: browser skips layout/paint for off-screen cards */}
          <PropertyList
            filteredProperties={filteredProperties}
            role={role}
            isDbSyncing={isDbSyncing}
            selectedProperty={selectedProperty}
            handlePropertyCardClick={handlePropertyCardClick}
            handleOpenShare={handleOpenShare}
            handleEdit={handleEdit}
            handleDeleteProperty={handleDeleteProperty}
            handleWhatsApp={handleWhatsApp}
            handleRegisterClick={handleRegisterClick}
          />


          {/* Social media contact — luxury style */}
          {role === 'client' ? (
            <SocialContactNav
              setWaModalProperty={setWaModalProperty}
              setWaModalPhone={setWaModalPhone}
              setWaModalMode={setWaModalMode}
              setShowWaModal={setShowWaModal}
              companySettings={companySettings}
            />
          ) : null}
        </div>
      </main>

      {/* Footer — dark luxury */}
      <Footer
        role={role}
        setRole={setRole}
        showToast={showToast}
        companySettings={companySettings}
        setAdminAuthInput={setAdminAuthInput}
        setAdminAuthError={setAdminAuthError}
        setShowAdminAuthModal={setShowAdminAuthModal}
        setWaModalProperty={setWaModalProperty}
        setWaModalPhone={setWaModalPhone}
        setWaModalMode={setWaModalMode}
        setShowWaModal={setShowWaModal}
      />

      {isMobile && role === 'client' ? (
        <MobileFloatingButtons
          setWaModalPhone={setWaModalPhone}
          setWaModalMode={setWaModalMode}
          setShowWaModal={setShowWaModal}
        />
      ) : null}

      {/* ── Modals ─────────────────────────────────────────────────────────
           bundle-dynamic-imports: heavy modals wrapped in Suspense so their
           JS chunks are loaded on demand, not on initial page load.
           A null fallback keeps the UX clean (modal mounts instantly once loaded). */}
      <Suspense fallback={null}>

        {/* Property detail modal - now uses wrapper component for animation */}
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onOpenBooking={() => setShowBookingModal(true)}
          onRegisterClick={handleRegisterClick}
          onWhatsApp={(p) => {
            setWaModalProperty(p);
            setWaModalPhone(p.whatsappNumber);
            setWaModalMode('lead');
            setShowWaModal(true);
          }}
          dialogRef={dialogRef}
        />

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
            PropertiesId={properties.id}
            isOpen={showAddModal}
            onClose={() => { setShowAddModal(false); setEditingProperty(null); }}
            onSave={handleSaveProperty}
            editingProperty={editingProperty}
            handleUnsavedChanges={handleUnsavedChanges}
          />
        )}

        {/* Share modal */}
        {showShareModal && propertyToShare && (
          <ShareModal
            dialogRef={dialogRef}
            property={propertyToShare}
            isOpen={showShareModal}
            onClose={() => { setShowShareModal(false); setPropertyToShare(null); }}
            onConfirmShare={handleRegisterShare}
          />
        )}

        {/* Identity modal */}
        <IdentityModal
          dialogRef={dialogRef}
          key={showIdentityModal ? "abierto" : "cerrado"}
          isOpen={showIdentityModal}
          onClose={() => setShowIdentityModal(false)}
          companySettings={companySettings}
          onSave={handleSaveCompanySettings}
          focusField={identityFocusField}
          onShowToast={showToast}
        />

        {/* Confirm modal (replaces window.confirm) */}
        <ConfirmModal
          dialogRef={dialogRef}
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
          dialogRef={dialogRef}
          isOpen={showWaModal}
          onClose={() => setShowWaModal(false)}
          property={waModalProperty}
          targetPhone={waModalPhone}
          brokerName="Iraida"
          mode={waModalMode}
          onSend={handleWhatsAppLeadSubmit}
        />

        {/* Admin Authentication Modal */}
        {isAuthVisible ? (
          <AdminAuthModal
            dialogRef={dialogRef}
            authAnim={authAnim}
            closeAuth={closeAuth}
            adminAuthInput={adminAuthInput}
            setAdminAuthInput={setAdminAuthInput}
            adminAuthError={adminAuthError}
            setAdminAuthError={setAdminAuthError}
            showAdminPassword={showAdminPassword}
            setShowAdminPassword={setShowAdminPassword}
            handleAdminLogin={handleAdminLogin}
          />
        ) : null}

      </Suspense>
    </div>
  );
}
