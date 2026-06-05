import React, { useState } from 'react';
import { Appointment, Property } from '../types';
import { Calendar, Clock, DollarSign, User, Mail, Phone, X, Award, CheckCircle2 } from 'lucide-react';

interface AppointmentFormProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
}

export default function AppointmentFormModal({ property, isOpen, onClose, onSubmit }: AppointmentFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState(property.price);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !date) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Build WhatsApp message with all appointment details
    const cleanPhone = property.whatsappNumber.replace(/[^0-9+]/g, '');
    const waText = encodeURIComponent(
      `Hola, soy ${firstName} ${lastName}.\n` +
      `Me comunico a través del portal Innobilia para confirmar mi cita.\n\n` +
      `📋 *Detalles del Cliente*\n` +
      `• Nombre: ${firstName} ${lastName}\n` +
      `• Teléfono: ${phone}\n` +
      `• Email: ${email}\n\n` +
      `🏠 *Propiedad de Interés*\n` +
      `• Propiedad: ${property.title}\n` +
      `• Precio: $${property.price.toLocaleString()} USD\n` +
      `• Presupuesto disponible: $${Number(budget).toLocaleString()} USD\n\n` +
      `📅 *Cita Solicitada*\n` +
      `• Fecha: ${date}\n` +
      `• Horario: ${time}\n` +
      `${notes ? '• Notas: ' + notes : ''}\n\n` +
      `Quedo en espera de confirmación. ¡Gracias!`
    );
    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

    onSubmit({
      propertyId: property.id,
      propertyTitle: property.title,
      clientName: firstName,
      clientLastName: lastName,
      clientEmail: email,
      clientPhone: phone,
      budget: Number(budget),
      date,
      time,
      notes,
    });

    setSuccess(true);
    setTimeout(() => {
      // Open WhatsApp automatically after short delay
      window.open(waUrl, '_blank');
    }, 800);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setNotes('');
    }, 3500);
  };

  // Generate some available dates (next 7 days) for the custom simple calendar helper
  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      isoString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('es-ES', { month: 'short' })
    };
  });

  const timeSlots = [
    '09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred mobile background */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md-custom transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-[90%] max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-100 mx-auto">
        
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="mb-4 rounded-full bg-emerald-100 p-4 text-emerald-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-800">¡Cita Solicitada!</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm">
              Registramos tu solicitud para <strong>{property.title}</strong> el <strong>{date}</strong> a las <strong>{time}</strong>.
            </p>
            <p className="mt-1 text-xs text-emerald-600 font-semibold animate-pulse">
              Abriendo WhatsApp con el corredor…
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <span className="text-xs font-semibold text-amber-600 tracking-wider uppercase font-mono">Agendar Visita</span>
                <h3 className="font-display text-lg font-bold text-slate-900 line-clamp-1">{property.title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] space-y-4">
              
              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      placeholder="Ej. Juan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Apellido *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      placeholder="Ej. Pérez"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Correo Electrónico *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="email"
                      required
                      placeholder="juan@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono (WhatsApp) *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="tel"
                      required
                      placeholder="Ej. +34 600000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex justify-between">
                  <span>Presupuesto Estimado ($)</span>
                  <span className="font-mono text-amber-600 font-semibold">${Number(budget).toLocaleString()}</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700"
                  />
                </div>
              </div>

              {/* Beautiful Calendar integrated selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <span>Seleccione Fecha Disponibles *</span>
                </label>
                
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDates.map((item) => {
                    const isSelected = date === item.isoString;
                    return (
                      <button
                        key={item.isoString}
                        type="button"
                        onClick={() => setDate(item.isoString)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20 font-semibold'
                            : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] uppercase text-slate-400 block font-mono">
                          {item.dayName}
                        </span>
                        <span className="text-sm font-bold block mt-0.5">
                          {item.dayNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">
                          {item.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Fallback traditional input for manual date option if needed */}
                <div className="mt-2 flex gap-2 items-center">
                  <span className="text-xs text-slate-400">O ingresa otra fecha:</span>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Horario Sugerido</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => {
                    const isSelected = time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`py-1.5 px-3 rounded-lg border text-xs text-center transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-950 font-semibold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advisory notes */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notas o comentarios extra</label>
                <textarea 
                  placeholder="Ej. Me gustaría que tenga balcón, consultar si acepta crédito hipotecario..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700 h-16 resize-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-slate-900/10 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                <span>Confirmar Solicitud de Cita</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
