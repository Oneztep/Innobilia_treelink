import React, { useState, useRef } from 'react';
import { Property, Appointment, AnalyticsSummary } from '../types';
import { Eye, Share2, Calendar, Sparkles, Phone, Mail, Clock, DollarSign, CalendarDays, RefreshCw, Trash2, Home, Activity, X, BarChart2 } from 'lucide-react';
import { useModal } from '../hooks/useModal';

// ─── Palette for properties (up to 10 distinct colors within brand palette) ───
const PROPERTY_COLORS = [
  '#0f172b',   // dark navy — brand primary
  '#ffb900',   // gold — brand accent
  '#fe9a00',   // orange — brand signal
  '#1e3a5f',   // deep blue
  '#b45309',   // amber-700
  '#334155',   // slate-700
  '#92400e',   // amber-800
  '#1e293b',   // slate-800
  '#78350f',   // amber-900
  '#0f3460',   // dark royal blue
];

interface TooltipInfo {
  propTitle: string;
  propClicks: number;
  propColor: string;
  dayLabel: string;
  dayTotal: number;
  allSegments: { propId: string; propTitle: string; clicks: number; color: string }[];
  /** viewport pixel coords for fixed positioning */
  vx: number;
  vy: number;
}

interface AdminPanelProps {
  properties: Property[];
  appointments: Appointment[];
  analytics: AnalyticsSummary;
  onDeleteAppointment: (id: string) => void;
  onResetAnalytics: () => void;
}

export default function AdminPanel({
  properties,
  appointments,
  analytics,
  onDeleteAppointment,
  onResetAnalytics
}: AdminPanelProps) {
  const [showChartModal, setShowChartModal] = useState(false);
  const { isVisible: isChartVisible, animClass: chartAnim, close: closeChart } = useModal(showChartModal, () => setShowChartModal(false));
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [activeMobileBar, setActiveMobileBar] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // js-combine-iterations + js-min-max-loop
  let topClickedProperty: Property | undefined;
  let topSharedProperty: Property | undefined;
  let maxClicks = 1;
  let maxShares = 1;
  let maxClicksVal = -1;
  let maxSharesVal = -1;

  for (const p of properties) {
    const clicks = analytics.propertyClicks[p.id] || 0;
    const shares = analytics.propertyShares[p.id] || 0;
    if (clicks > maxClicksVal) { maxClicksVal = clicks; topClickedProperty = p; }
    if (shares > maxSharesVal) { maxSharesVal = shares; topSharedProperty = p; }
    if (clicks > maxClicks) maxClicks = clicks;
    if (shares > maxShares) maxShares = shares;
  }

  // ─── Build last-7-days data from real dailyClicks ───────────────────────────
  const last7Days: { iso: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    last7Days.push({ iso, label });
  }

  // For each day, build stacked segments (one per property that has clicks that day)
  const chartDays = last7Days.map(day => {
    const dayData = analytics.dailyClicks?.[day.iso] || {};
    const total = Object.values(dayData).reduce((s, v) => s + v, 0);
    const segments = properties
      .map((p, idx) => ({
        propId: p.id,
        propTitle: p.title,
        clicks: dayData[p.id] || 0,
        color: PROPERTY_COLORS[idx % PROPERTY_COLORS.length],
      }))
      .filter(s => s.clicks > 0);
    return { iso: day.iso, label: day.label, total, segments };
  });

  const maxDayTotal = Math.max(...chartDays.map(d => d.total), 1);

  // Y-axis grid lines (5 steps) — deduplicated to avoid repeated labels
  const gridLines = [...new Set([0, 1, 2, 3, 4].map(i => Math.round((maxDayTotal / 4) * i)))];

  return (
    <div className="space-y-6">
      {/* Overview Head */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-lg bg-amber-500 text-white font-mono text-xs">A</span>
            <span>Panel de Control de Innobilia</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supervisa el rendimiento del Linktree inmobiliario, visitas, clics en tiempo real y gestiona leads de citas.
          </p>
        </div>
        <button
          onClick={onResetAnalytics}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Restablecer Analíticas</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Visitas al Link</span>
            <Eye className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold font-mono" style={{ color: '#0f172b' }}>{analytics.totalVisits}</h3>
            <p className="text-[10px] mt-1 font-medium flex items-center gap-0.5" style={{ color: '#94a3b8' }}>
              <Activity className="h-3 w-3" style={{ color: '#ffb900' }} />
              <span>Visitas acumuladas desde el inicio</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Compartidos</span>
            <Share2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">{analytics.totalShares}</h3>
            <p className="text-[10px] text-amber-600 mt-1 font-medium">Canal: WhatsApp, FB y Portapapeles</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Citas Solicitadas</span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">{appointments.length}</h3>
            <p className="text-[10px] text-amber-600 mt-1 font-medium">Esperando respuesta del corredor</p>
          </div>
        </div>

        {/* Mayor Interés → opens stacked bar chart modal */}
        <button
          onClick={() => setShowChartModal(true)}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between text-left group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 w-full">
            <span className="text-xs font-medium group-hover:text-amber-600 transition-colors">Mayor Interés (clics)</span>
            <BarChart2 className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 w-full">
            <h3 className="text-sm font-bold text-slate-800 truncate" title={topClickedProperty?.title || 'N/A'}>
              {topClickedProperty ? topClickedProperty.title : 'N/A'}
            </h3>
            <p className="text-[10px] mt-0.5 group-hover:text-amber-500 transition-colors" style={{ color: '#94a3b8' }}>
              {topClickedProperty ? `${analytics.propertyClicks[topClickedProperty.id] || 0} clics registrados` : 'Sin registros'}
            </p>
            <p className="text-[9px] mt-1 font-mono" style={{ color: '#cbd5e1' }}>Ver distribución 7 días →</p>
          </div>
        </button>
      </div>

      {/* Analytics Interactive Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Properties clicks custom bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-mono text-amber-600 uppercase font-bold tracking-wider">Reporte de Interés</span>
            <h3 className="font-display text-sm font-bold text-slate-800">Clics por Propiedad</h3>
            <p className="text-xs text-slate-400">Muestra qué propiedades del Linktree han recibido más visitas detalladas.</p>
          </div>

          <div className="space-y-3 pt-2">
            {properties.map(p => {
              const clicks = analytics.propertyClicks[p.id] || 0;
              const percentage = Math.max((clicks / maxClicks) * 100, 4);
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[75%]" title={p.title}>{p.title}</span>
                    <span className="font-mono font-bold text-slate-900">{clicks} <span className="text-[10px] text-slate-400 font-normal">clics</span></span>
                  </div>
                  <div className="w-full h-3.5 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #fe9a00, #ffb900)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shares custom bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold tracking-wider">Reporte de Difusión</span>
            <h3 className="font-display text-sm font-bold text-slate-800">Propiedades Compartidas</h3>
            <p className="text-xs text-slate-400">Registra con qué frecuencia los clientes han copiado o enviado el enlace.</p>
          </div>

          <div className="space-y-3 pt-2">
            {properties.map(p => {
              const shares = analytics.propertyShares[p.id] || 0;
              const percentage = Math.max((shares / maxShares) * 100, 4);
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[75%]" title={p.title}>{p.title}</span>
                    <span className="font-mono font-bold text-slate-950">{shares} <span className="text-[10px] text-slate-400 font-normal font-sans">veces</span></span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Appointment leads display list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">Agenda de Citas Solicitadas</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control de prospectos, presupuestos e información de contacto.</p>
          </div>
          <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full font-mono font-bold shrink-0">
            {appointments.length} Cita(s)
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p>Aún no se han registrado solicitudes de cita de clientes.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-y-auto scrollbar-hover" style={{ maxHeight: '520px' }}>
            {appointments.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {item.clientName} {item.clientLastName}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md flex items-center gap-1 font-mono"
                      style={{ background: 'rgba(255,185,0,0.1)', color: '#0f172b', border: '1px solid rgba(255,185,0,0.3)' }}>
                      <Home className="h-2.5 w-2.5" />
                      <span>{item.propertyTitle}</span>
                    </span>
                  </div>

                  {/* Contact details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <a href={`tel:${item.clientPhone}`} className="flex items-center gap-1 hover:underline text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.clientPhone}</span>
                    </a>
                    <a href={`mailto:${item.clientEmail}`} className="flex items-center gap-1 hover:underline text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.clientEmail}</span>
                    </a>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                      <span>Presupuesto: <strong>${item.budget.toLocaleString()}</strong></span>
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg italic max-w-xl mt-1.5 border-l-2 border-slate-300">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Appointment date indicator and action */}
                <div className="flex sm:items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="flex items-center md:justify-end gap-1 text-slate-800 text-xs font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center md:justify-end gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{item.time || '10:00 AM'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('¿Deseas dar por atendida o borrar la solicitud de esta cita?')) {
                        onDeleteAppointment(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar Lead Cita"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STACKED VERTICAL BAR CHART MODAL */}
      {isChartVisible && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm ${chartAnim.overlay}`}
            onClick={() => { closeChart(); setTooltip(null); setActiveMobileBar(null); }}
          />

          <div
            className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col ${chartAnim.panel}`}
            style={{ maxHeight: '92vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg" style={{ background: '#0f172b' }}>
                  <BarChart2 className="h-4 w-4" style={{ color: '#ffb900' }} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">Distribución de Clics — Últimos 7 Días</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Variables Cuantitativas Discretas · por propiedad</p>
                </div>
              </div>
              <button
                onClick={() => { closeChart(); setTooltip(null); setActiveMobileBar(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chart Body */}
            <div className="p-5 overflow-y-auto scrollbar-hover flex-1">

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
                {properties.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ background: PROPERTY_COLORS[idx % PROPERTY_COLORS.length] }}
                    />
                    <span className="text-[10px] text-slate-600 truncate max-w-[130px]" title={p.title}>{p.title}</span>
                  </div>
                ))}
              </div>

              {/* Chart wrapper — position:relative so tooltip stays inside */}
              <div className="relative flex gap-2" ref={chartRef}>

                {/* Y axis labels */}
                <div className="flex flex-col justify-between items-end pb-9 shrink-0 w-8">
                  {[...gridLines].reverse().map(v => (
                    <span key={v} className="text-[9px] font-mono text-slate-400 leading-none">{v}</span>
                  ))}
                </div>

                {/* Bars + X axis column */}
                <div className="flex-1 relative">

                  {/* Horizontal grid lines (inside the bars area) */}
                  <div className="absolute left-0 right-0 top-0 bottom-9 flex flex-col justify-between pointer-events-none">
                    {gridLines.map(v => (
                      <div key={v} className="w-full border-t" style={{ borderColor: '#e2e8f0' }} />
                    ))}
                  </div>

                  {/* Bars row */}
                  <div className="flex items-end gap-1.5 sm:gap-2 pb-9 h-56 sm:h-72">
                    {chartDays.map(day => {
                      const barHeightPct = maxDayTotal > 0 ? (day.total / maxDayTotal) * 100 : 0;
                      const isMobileActive = activeMobileBar === day.iso;

                      return (
                        <div
                          key={day.iso}
                          className="flex-1 flex flex-col items-center justify-end h-full relative"
                        >
                          {/* Stacked bar — segments stacked from bottom */}
                          <div
                            className="w-full rounded-t-sm overflow-visible relative"
                            style={{
                              height: `${barHeightPct}%`,
                              minHeight: day.total > 0 ? '6px' : '2px',
                              display: 'flex',
                              flexDirection: 'column-reverse',
                              cursor: day.total > 0 ? 'pointer' : 'default',
                            }}
                            /* Mobile: tap on the whole bar to toggle detail */
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              if (day.total === 0) return;
                              setActiveMobileBar(isMobileActive ? null : day.iso);
                              setTooltip(null);
                            }}
                          >
                            {day.total === 0 ? (
                              <div className="w-full rounded" style={{ height: 2, background: '#e2e8f0' }} />
                            ) : (
                              day.segments.map(seg => {
                                const segPct = (seg.clicks / day.total) * 100;
                                return (
                                  <div
                                    key={seg.propId}
                                    style={{
                                      height: `${segPct}%`,
                                      minHeight: '4px',
                                      background: seg.color,
                                      width: '100%',
                                      borderTop: '1.5px solid rgba(255,255,255,0.2)',
                                      transition: 'filter 0.15s',
                                      position: 'relative',
                                    }}
                                    /* Desktop: hover per segment */
                                    onMouseEnter={(e) => {
                                      const segEl = e.currentTarget as HTMLElement;
                                      segEl.style.filter = 'brightness(1.25)';
                                      const segRect = segEl.getBoundingClientRect();
                                      setTooltip({
                                        propTitle: seg.propTitle,
                                        propClicks: seg.clicks,
                                        propColor: seg.color,
                                        dayLabel: day.label,
                                        dayTotal: day.total,
                                        allSegments: day.segments,
                                        // viewport coords — tooltip uses position:fixed, never shifts layout
                                        vx: segRect.left + segRect.width / 2,
                                        vy: segRect.top,
                                      });
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLElement).style.filter = '';
                                      setTooltip(null);
                                    }}
                                  />
                                );
                              })
                            )}
                          </div>

                          {/* X axis label */}
                          <div
                            className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
                            style={{ height: '2.25rem' }}
                          >
                            <div className="w-px h-1.5" style={{ background: '#cbd5e1' }} />
                            <span
                              className="text-[9px] text-slate-500 font-mono mt-0.5 text-center leading-tight px-0.5"
                              style={{ wordBreak: 'break-all' }}
                            >
                              {day.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop tooltip — fixed position so it NEVER affects layout */}
                  {tooltip && (
                    <div
                      className="hidden sm:block fixed z-[100] pointer-events-none"
                      style={{
                        left: tooltip.vx,
                        top: tooltip.vy,
                        transform: 'translate(-50%, calc(-100% - 10px))',
                      }}
                    >
                      <div
                        className="rounded-xl shadow-2xl px-3 py-2.5 text-white"
                        style={{ background: '#0f172b', minWidth: 160, maxWidth: 200 }}
                      >
                        {/* Hovered segment headline */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: tooltip.propColor }} />
                          <span className="text-[10px] font-bold truncate flex-1" style={{ color: '#ffb900' }}>{tooltip.propTitle}</span>
                          <span className="text-[10px] font-bold ml-1 shrink-0" style={{ color: '#ffb900' }}>{tooltip.propClicks}</span>
                        </div>
                        {/* Divider */}
                        <div className="border-t mb-1.5" style={{ borderColor: '#1e293b' }} />
                        {/* All segments for this day */}
                        <p className="text-[9px] font-mono mb-1" style={{ color: '#64748b' }}>{tooltip.dayLabel} · {tooltip.dayTotal} total</p>
                        <div className="space-y-0.5">
                          {tooltip.allSegments.map(s => (
                            <div key={s.propId} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                              <span className="text-[9px] truncate flex-1" style={{ maxWidth: 100 }}>{s.propTitle}</span>
                              <span className="text-[9px] font-bold shrink-0" style={{ color: '#94a3b8' }}>{s.clicks}</span>
                            </div>
                          ))}
                        </div>
                        {/* Arrow pointing down */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2"
                          style={{
                            bottom: -6,
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #0f172b',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile tap detail panel */}
              {activeMobileBar && (() => {
                const day = chartDays.find(d => d.iso === activeMobileBar);
                if (!day || day.total === 0) return null;
                return (
                  <div className="sm:hidden mt-4 rounded-xl p-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold" style={{ color: '#0f172b' }}>
                        {day.label} <span className="font-normal text-slate-400">· {day.total} clics totales</span>
                      </p>
                      <button
                        className="text-slate-400 p-0.5"
                        onTouchEnd={(e) => { e.preventDefault(); setActiveMobileBar(null); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {day.segments.map(seg => (
                        <div key={seg.propId} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: seg.color }} />
                          <span className="text-[10px] flex-1 truncate text-slate-700">{seg.propTitle}</span>
                          <span className="text-[10px] font-bold font-mono" style={{ color: '#0f172b' }}>{seg.clicks}</span>
                          {/* Mini proportion bar */}
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(seg.clicks / day.total) * 100}%`, background: seg.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* No data hint */}
              {chartDays.every(d => d.total === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Sparkles className="h-7 w-7 text-slate-200 mx-auto mb-2" />
                  <p>Aún no hay clics registrados en los últimos 7 días.</p>
                  <p className="mt-1" style={{ color: '#cbd5e1' }}>Los datos aparecerán en tiempo real conforme los clientes interactúen.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
