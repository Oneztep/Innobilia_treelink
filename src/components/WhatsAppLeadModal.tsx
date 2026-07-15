import React, { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, MessageSquare, CheckCircle2, Clock, DollarSign, Text } from 'lucide-react';
import { Property } from '../types';
import { useModal } from '../hooks/useModal';

interface WhatsAppLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
  targetPhone?: string;
  brokerName?: string;
  mode?: 'lead' | 'owner/broker';
  onSend?: (data: { name: string; phone: string; date: string; time: string; budget: string; notes: string; }) => void;
  dialogRef?: React.RefObject<HTMLDialogElement>;
}
const TIME_SLOTS = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM'];

const INITIAL_FORM_STATE = {
  clientName: '',
  clientPhone: '',
  clientBudget: '',
  clientNeeds: '',
  appointmentDate: '',
  appointmentTime: '10:00 AM',
  propertyType: 'Casa',
  propertyLocation: '',
  propertyPrice: '',
  sent: false,
  errors: {}
};

export default function WhatsAppLeadModal({
  dialogRef,
  isOpen,
  onClose,
  property = null,
  targetPhone,
  brokerName = 'Iraida',
  mode = 'lead',
  onSend,
}: WhatsAppLeadModalProps) {
  const { isVisible, animClass, close } = useModal(isOpen, onClose);

  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);


  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM_STATE);
      setErrors({})
      setSent(false)
    }
  }, [isOpen])

  if (!isOpen) return null;

  // Next 7 available days
  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('es-ES', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('es-ES', { month: 'short' }),
    };
  });



  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.clientName.trim()) e.clientName = 'El nombre es obligatorio';
    if (!form.clientPhone.trim()) e.clientPhone = 'El teléfono es obligatorio';
    if (!form.appointmentDate) e.appointmentDate = 'Selecciona una fecha';
    if (mode === 'owner/broker') {
      if (!form.appointmentDate) e.appointmentDate = 'Selecciona una fecha';
      if (!form.propertyLocation.trim()) e.propertyLocation = 'La ubicación es obligatoria';
    }
    return e;
  };

  const handleSend = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const lines: string[] = [];
    const dateFormatted = new Date(form.appointmentDate + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    if (mode === 'lead') {
      lines.push(`Hola, soy *${form.clientName}* 👋`);
      lines.push(`Me comunico a través del portal *Innobilia Real Estate*.`);
      lines.push('');
      lines.push(`📋 *Información del Cliente*`);
      lines.push(`• Nombre: ${form.clientName}`);
      lines.push(`• Teléfono: ${form.clientPhone}`);
      if (form.clientBudget) lines.push(`• Presupuesto aprox.: ${form.clientBudget}`);
      if (form.clientNeeds) {
        lines.push(`• Interés / Requerimientos:`);
        lines.push(`  "${form.clientNeeds}"`);
      }
      lines.push('');
      if (property) {
        lines.push(`🏠 *Propiedad de Interés*`);
        lines.push(`• ${property.title}`);
        lines.push(`• Ubicación: ${property.address}`);
        lines.push(`• Precio: $${property.price.toLocaleString()} USD`);
        lines.push('');
      }
      lines.push(`📅 *Cita Solicitada*`);
      lines.push(`• Fecha: ${dateFormatted}`);
      lines.push(`• Horario: ${form.appointmentTime}`);
      lines.push(`• Corredor/a: ${brokerName}`);
    } else {
      lines.push(`Hola, soy *${form.clientName}* 👋`);
      lines.push(`Soy propietario/corredor y me gustaría ofrecer una propiedad en *Innobilia Real Estate*.`);
      lines.push('');
      lines.push(`📋 *Información del Contacto*`);
      lines.push(`• Nombre: ${form.clientName}`);
      lines.push(`• Teléfono: ${form.clientPhone}`);
      lines.push('');
      lines.push(`🏠 *Detalles de la Propiedad*`);
      lines.push(`• Tipo: ${form.propertyType}`);
      lines.push(`• Ubicación: ${form.propertyLocation}`);
      if (form.propertyPrice) lines.push(`• Valor sugerido: ${form.propertyPrice}`);
      if (form.clientNeeds) {
        lines.push(`• Notas/Detalles:`);
        lines.push(`  "${form.clientNeeds}"`);
      }

    }
    lines.push('');
    lines.push(`Quedo en espera de su confirmación. ¡Gracias! 🙏`);

    const message = lines.join('\n');

    // Resolve destination phone
    const destPhone = (
      targetPhone
      || property?.whatsappNumber
      || ''
    ).replace(/[^0-9+]/g, '');

    const waUrl = `https://wa.me/${destPhone}?text=${encodeURIComponent(message)}`;

    setSent(true);
    onSend?.({
      name: form.clientName,
      phone: form.clientPhone,
      date: dateFormatted,
      time: form.appointmentTime,
      budget: form.clientBudget,
      notes: `Lead vía WhatsApp.${form.clientNeeds ? ' Requerimientos: ' + form.clientNeeds : ''}`
    });
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 700);
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/65 backdrop-blur-sm ${animClass.overlay}`}
        aria-label='Close-overlay'
        onClick={close}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') close(); }}
        role="button"
        tabIndex={0}
        ref={dialogRef}
      />

      <div className={`relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden ${animClass.panel}`}>

        {/* ── SUCCESS STATE ── */}
        {sent ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
            <div className="rounded-full bg-emerald-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-800">¡Mensaje listo!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Abriendo WhatsApp con la plantilla preparada…
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-2 animate-pulse">
                Redirigiendo en instantes ✓
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500 rounded-xl shadow-sm shadow-emerald-200">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider font-mono">
                    Enviar por WhatsApp
                  </p>
                  <h3 className="font-display text-sm font-bold text-slate-900 line-clamp-1">
                    {mode === 'owner/broker' ? 'Ofrecer Propiedad (Propietarios/Corredores)' : (property ? property.title : 'Consulta General · Innobilia')}
                  </h3>
                </div>
              </div>
              <button
                type='button'
                aria-label="Cerrar"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── FORM BODY ── */}
            <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">

              {/* Info pill */}
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-xs text-emerald-800">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  {mode === 'owner/broker'
                    ? 'Registra tus datos y los detalles de tu propiedad para ponernos en contacto contigo a la brevedad.'
                    : `Se generará una plantilla con tus datos, la propiedad, teléfono y fecha de cita. La corredora ${brokerName} recibirá el mensaje.`}
                </span>
              </div>

              {/* Client name */}
              {mode === "owner/broker" ? (
                <>
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre completo</span>
                    <input
                      type="text"
                      aria-label='Nombre completo'
                      placeholder="Tu nombre completo"
                      value={form.clientName}
                      onChange={e => { setForm({ ...form, clientName: e.target.value }); setErrors(prev => ({ ...prev, clientName: '' })); }}
                      className={`w-full rounded-xl border py-2 px-3 text-sm text-slate-700 outline-none ${errors.clientName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                        }`}
                    />
                    {errors.clientName && <p className="text-[11px] text-red-500 mt-1">{errors.clientName}</p>}
                  </div>

                  {/* Client phone */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Teléfono (con código de país) <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      aria-label='Teléfono'
                      placeholder="Ej. +584141234567"
                      value={form.clientPhone}
                      onChange={e => { setForm({ ...form, clientPhone: e.target.value }); setErrors(prev => ({ ...prev, clientPhone: '' })); }}
                      className={`w-full rounded-xl border py-2 px-3 text-sm text-slate-700 outline-none ${errors.clientPhone ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                        }`}
                    />
                    {errors.clientPhone && <p className="text-[11px] text-red-500 mt-1">{errors.clientPhone}</p>}
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de propiedad</span>
                    <select
                      value={form.propertyType}
                      aria-label='Tipo de propiedad'
                      onChange={e => setForm({ ...form, propertyType: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 outline-none focus:border-emerald-400"
                    >
                      <option>Anexo</option>
                      <option>Casa</option>
                      <option>Apartamento</option>
                      <option>Town-House</option>
                      <option>Loft</option>
                      <option>Local Comercial</option>
                      <option>Terreno</option>
                      <option>Oficina</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  {/* Ubicación */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Ubicación / Dirección <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      aria-label='Ubicación'
                      placeholder="Ej. Urbanización Las Mercedes, Calle París"
                      value={form.propertyLocation}
                      onChange={e => { setForm({ ...form, propertyLocation: e.target.value }); setErrors(prev => ({ ...prev, propertyLocation: '' })); }}
                      className={`w-full rounded-xl border py-2 px-3 text-sm text-slate-700 outline-none ${errors.propertyLocation ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                        }`}
                    />
                    {errors.propertyLocation && <p className="text-[11px] text-red-500 mt-1">{errors.propertyLocation}</p>}
                  </div>
                  {/* Valor sugerido */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 mb-1.5">Precio / Valor esperado (Opcional)</span>
                    <input
                      type="text"
                      aria-label='Precio'
                      placeholder="Ej. $120,000 o Canon mensual"
                      value={form.propertyPrice}
                      onChange={e => setForm({ ...form, propertyPrice: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 outline-none"
                    />
                  </div>
                  {/* Detalles / Notas */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 mb-1.5">Detalles de la propiedad (Opcional)</span>
                    <textarea
                      placeholder="Ej. 3 habitaciones, 2 baños, estacionamiento..."
                      aria-label='Detalles'
                      value={form.clientNeeds}
                      onChange={e => setForm({ ...form, clientNeeds: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 outline-none resize-none"
                    />
                  </div>
                </>
              )
                : (
                  // modo "lead"
                  <>
                    <div>
                      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Tu nombre completo <span className="text-red-400">*</span>
                      </span>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Ej. María González"
                          value={form.clientName}
                          onChange={e => { setForm({ ...form, clientName: e.target.value }); setErrors(prev => ({ ...prev, clientName: '' })); }}
                          aria-label="client-name"
                          className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all
                          ${errors.clientName
                              ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
                              : 'border-slate-200 bg-slate-50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 hover:bg-white'
                            }`}
                        />
                      </div>
                      {errors.clientName && <p className="text-[11px] text-red-500 mt-1">{errors.clientName}</p>}
                    </div>

                    {/* Client phone */}
                    <div>
                      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Tu teléfono (WhatsApp) <span className="text-red-400">*</span>
                      </span>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="Ej. +58 412 0000000"
                          aria-label='Teléfono'
                          value={form.clientPhone}
                          onChange={e => { setForm({ ...form, clientPhone: e.target.value }); setErrors(prev => ({ ...prev, clientPhone: '' })); }}
                          className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all
                          ${errors.clientPhone
                              ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
                              : 'border-slate-200 bg-slate-50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 hover:bg-white'
                            }`}
                        />
                      </div>
                      {errors.clientPhone && <p className="text-[11px] text-red-500 mt-1">{errors.clientPhone}</p>}
                    </div>

                    {/* Client Budget */}
                    <div>
                      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Presupuesto aproximado <span className="text-slate-400 font-normal">(Opcional)</span>
                      </span>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Ej. $150,000"
                          value={form.clientBudget}
                          onChange={e => setForm({ ...form, clientBudget: e.target.value })}
                          aria-label="client-budget"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 hover:bg-white"
                        />
                      </div>
                    </div>

                    {/* Client Needs */}
                    <div>
                      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                        ¿Qué buscas en tu nuevo hogar? <span className="text-slate-400 font-normal">(Opcional)</span>
                      </span>
                      <div className="relative">
                        <Text className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <textarea
                          placeholder="Ej. 3 habitaciones, zona tranquila..."
                          value={form.clientNeeds}
                          onChange={e => setForm({ ...form, clientNeeds: e.target.value })}
                          aria-label="client-needs"
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 hover:bg-white resize-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              {/* Date picker */}
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                  Fecha de cita sugerida <span className="text-red-400">*</span>
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {availableDates.map(d => (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => { setForm({ ...form, appointmentDate: d.iso }); setErrors(prev => ({ ...prev, appointmentDate: '' })); }}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer
                            ${form.appointmentDate === d.iso
                          ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400/20 text-emerald-900'
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-200'
                        }`}
                    >
                      <span className="text-[9px] uppercase font-mono text-slate-400 block">{d.day}</span>
                      <span className="text-sm font-bold block mt-0.5">{d.num}</span>
                      <span className="text-[9px] uppercase font-mono text-slate-400 mt-0.5">{d.month}</span>
                    </button>
                  )
                  )}
                </div>
                {errors.appointmentDate && <p className="text-[11px] text-red-500 mt-1">{errors.appointmentDate}</p>}
              </div>
              {/* Time slots */}
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  Horario preferido
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setForm({ ...form, appointmentTime: slot })}
                      className={`py-1.5 px-2 rounded-lg border text-xs text-center transition-all cursor-pointer
                            ${form.appointmentTime === slot
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview chip */}
              {property && (
                <div className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5 text-xs text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-700">Propiedad incluida en la plantilla:</p>
                  <p className="text-slate-500">{property.title} · ${property.price.toLocaleString()} USD</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleSend}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Enviar plantilla por WhatsApp</span>
              </button>

              <p className="text-center text-[10px] text-slate-400 font-mono">
                Corredor: <strong className="text-slate-500">{brokerName}</strong> · Innobilia Real Estate
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
