/**
 * db.ts — All Supabase CRUD operations for Innobilia.
 *
 * Each function follows the hybrid pattern:
 *   - Returns data immediately from the call
 *   - Fails gracefully: if Supabase is unavailable, logs a warning and returns null/[]
 *
 * Naming convention (Supabase columns use snake_case, TS uses camelCase):
 *   DB row → camelCase Property/Appointment via toProperty() / toAppointment()
 *   camelCase → DB row via toPropertyRow() / toAppointmentRow()
 */

import { supabase, OFFLINE_MODE } from './supabase';
import type { Property, Appointment, AnalyticsSummary } from '../types';
import type { CompanySettings } from '../components/IdentityModal';

// ─── Mappers: DB row ↔ TypeScript types ───────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProperty(row: any): Property {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    address: row.address ?? '',
    location: row.location ?? '',
    price: Number(row.price ?? 0),
    rooms: Number(row.rooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    area: Number(row.area ?? 0),
    images: row.images ?? [],
    virtualTourUrl: row.virtual_tour_url ?? undefined,
    whatsappNumber: row.whatsapp_number ?? '',
    features: row.features ?? [],
    clicks: Number(row.clicks ?? 0),
    shares: Number(row.shares ?? 0),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toPropertyRow(p: Property) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    address: p.address,
    location: p.location,
    price: p.price,
    rooms: p.rooms,
    bathrooms: p.bathrooms,
    area: p.area,
    images: p.images,
    virtual_tour_url: p.virtualTourUrl ?? null,
    whatsapp_number: p.whatsappNumber,
    features: p.features,
    clicks: p.clicks,
    shares: p.shares,
    created_at: p.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAppointment(row: any): Appointment {
  return {
    id: row.id,
    propertyId: row.property_id ?? '',
    propertyTitle: row.property_title ?? '',
    clientName: row.client_name ?? '',
    clientLastName: row.client_last_name ?? '',
    clientEmail: row.client_email ?? '',
    clientPhone: row.client_phone ?? '',
    budget: Number(row.budget ?? 0),
    date: row.date ?? '',
    time: row.time ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toAppointmentRow(a: Appointment) {
  return {
    id: a.id,
    property_id: a.propertyId || null,
    property_title: a.propertyTitle,
    client_name: a.clientName,
    client_last_name: a.clientLastName,
    client_email: a.clientEmail,
    client_phone: a.clientPhone,
    budget: a.budget,
    date: a.date,
    time: a.time ?? null,
    notes: a.notes ?? null,
    created_at: a.createdAt,
  };
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function fetchProperties(): Promise<Property[] | null> {
  if (OFFLINE_MODE) return null;
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, description, address, location, price, rooms, bathrooms,area, images, virtual_tour_url,whatsapp_number,features,clicks,shares,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[db] fetchProperties error:', error.code, error.message, error.hint, error.details);
    return null;
  }
  return data.map(toProperty);
}

export async function upsertProperty(property: Property): Promise<boolean> {
  if (OFFLINE_MODE) return false;
  const { error } = await supabase
    .from('properties')
    .upsert(toPropertyRow(property), { onConflict: 'id' });

  if (error) {
    console.error('[db] upsertProperty error:', error.code, error.message, error.hint, error.details);
    return false;
  }
  return true;
}

export async function deleteProperty(id: string): Promise<boolean> {
  if (OFFLINE_MODE) return false;
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    console.warn('[db] deleteProperty error:', error.message);
    return false;
  }
  return true;
}

/** Increment clicks counter for a property (fire-and-forget) */
export async function incrementPropertyClicks(propertyId: string): Promise<void> {
  if (OFFLINE_MODE) return;
  // Use rpc for atomic increment to avoid race conditions
  const { error } = await supabase.rpc('increment_property_clicks', {
    prop_id: propertyId,
  });
  if (error) {
    // Fallback: manual increment if RPC not available
    const { data } = await supabase
      .from('properties')
      .select('clicks')
      .eq('id', propertyId)
      .single();
    if (data) {
      await supabase
        .from('properties')
        .update({ clicks: (data.clicks || 0) + 1 })
        .eq('id', propertyId);
    }
  }
}

/** Increment shares counter for a property (fire-and-forget) */
export async function incrementPropertyShares(propertyId: string): Promise<void> {
  if (OFFLINE_MODE) return;
  const { data } = await supabase
    .from('properties')
    .select('shares')
    .eq('id', propertyId)
    .single();
  if (data) {
    await supabase
      .from('properties')
      .update({ shares: (data.shares || 0) + 1 })
      .eq('id', propertyId);
  }
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function fetchAppointments(): Promise<Appointment[] | null> {
  if (OFFLINE_MODE) return null;
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[db] fetchAppointments error:', error.message);
    return null;
  }
  return data.map(toAppointment);
}

export async function insertAppointment(appointment: Appointment): Promise<boolean> {
  if (OFFLINE_MODE) return false;
  const { error } = await supabase
    .from('appointments')
    .insert(toAppointmentRow(appointment));

  if (error) {
    console.warn('[db] insertAppointment error:', error.message);
    return false;
  }
  return true;
}

export async function deleteAppointment(id: string): Promise<boolean> {
  if (OFFLINE_MODE) return false;
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) {
    console.warn('[db] deleteAppointment error:', error.message);
    return false;
  }
  return true;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function fetchAnalytics(): Promise<AnalyticsSummary | null> {
  if (OFFLINE_MODE) return null;
  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    // PGRST116 = no rows found (expected on first run — table is empty)
    if (error.code !== 'PGRST116') console.warn('[db] fetchAnalytics error:', error.message);
    return null;
  }
  return {
    totalVisits: data.total_visits ?? 0,
    totalShares: data.total_shares ?? 0,
    propertyClicks: (data.property_clicks as Record<string, number>) ?? {},
    propertyShares: (data.property_shares as Record<string, number>) ?? {},
    dailyClicks: (data.daily_clicks as Record<string, Record<string, number>>) ?? {},
  };
}

export async function upsertAnalytics(analytics: AnalyticsSummary): Promise<boolean> {
  if (OFFLINE_MODE) return false;
  const { error } = await supabase
    .from('analytics')
    .upsert({
      id: 'global',
      total_visits: analytics.totalVisits,
      total_shares: analytics.totalShares,
      property_clicks: analytics.propertyClicks,
      property_shares: analytics.propertyShares,
      daily_clicks: analytics.dailyClicks,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.warn('[db] upsertAnalytics error:', error.message);
    return false;
  }
  return true;
}

/** Increment WhatsApp lead counter in analytics (fire-and-forget) */
export async function incrementWhatsAppLeads(): Promise<void> {
  if (OFFLINE_MODE) return;
  const { data } = await supabase
    .from('analytics')
    .select('whatsapp_leads')
    .eq('id', 'global')
    .single();

  await supabase
    .from('analytics')
    .upsert({
      id: 'global',
      whatsapp_leads: (data?.whatsapp_leads ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
}

// ─── Company Settings ─────────────────────────────────────────────────────────

export async function fetchCompanySettings(): Promise<CompanySettings | null> {
  if (OFFLINE_MODE) return null;
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', 'main')
    .single();

  if (error) {
    // PGRST116 = no rows found (expected on first run — table is empty)
    if (error.code !== 'PGRST116') console.warn('[db] fetchCompanySettings error:', error.message);
    return null;
  }
  return {
    logoUrl: data.logo_url ?? '',
    name: data.name ?? '',
    subtitle: data.subtitle ?? '',
    description: data.description ?? '',
    facebookUrl: data.facebook_url ?? '',
    instagramUrl: data.instagram_url ?? '',
    whatsappUrl: data.whatsapp_url ?? '',
    adminSecret: data.admin_secret ?? '',
  };
}

export async function upsertCompanySettings(settings: CompanySettings): Promise<boolean> {
  if (OFFLINE_MODE) return false;
  const { error } = await supabase
    .from('company_settings')
    .upsert({
      id: 'main',
      logo_url: settings.logoUrl,
      name: settings.name,
      subtitle: settings.subtitle,
      description: settings.description,
      facebook_url: settings.facebookUrl,
      instagram_url: settings.instagramUrl,
      whatsapp_url: settings.whatsappUrl,
      admin_secret: settings.adminSecret,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.warn('[db] upsertCompanySettings error:', error.message);
    return false;
  }
  return true;
}
