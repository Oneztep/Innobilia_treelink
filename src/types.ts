/**
 * Types for Innobilia Real Estate Linktree application
 */

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  location: string;
  price: number;
  rooms: number;
  bathrooms: number;
  area: number; // in m²
  images: string[];
  virtualTourUrl?: string;
  whatsappNumber: string;
  features: string[];
  clicks: number;
  shares: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  budget: number;
  date: string; // YYYY-MM-DD
  time?: string;
  notes?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalVisits: number;
  totalShares: number;
  propertyClicks: Record<string, number>;
  propertyShares: Record<string, number>;
  /** ISO date string (YYYY-MM-DD) → propertyId → click count */
  dailyClicks: Record<string, Record<string, number>>;
}
