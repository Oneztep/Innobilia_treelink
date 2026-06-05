import { Property, Appointment } from './types';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    title: 'Penthouse de Lujo con Vista Sky',
    description: 'Impresionante penthouse de diseño industrial y acabados de lujo, techos de doble altura y ventanales de piso a techo que ofrecen una vista panorámica inigualable de la ciudad. Cuenta con terraza privada de 35m², cocina italiana totalmente equipada, automatización de luces y sonido, y seguridad las 24 horas. Ubicado en la zona de mayor plusvalía, cerca de centros comerciales premium y restaurantes exclusivos.',
    address: 'Av. de los Encinos 104, San Pedro Garza García, NL',
    location: 'San Pedro',
    price: 380000,
    rooms: 3,
    bathrooms: 3.5,
    area: 210,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=75',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=75',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=75'
    ],
    virtualTourUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=75',
    whatsappNumber: '+528112345678',
    features: ['Terraza Privada', 'Seguridad 24/7', 'Gimnasio', 'Cocina Italiana', 'Cochera Techada (3 autos)', 'Pet Friendly'],
    clicks: 142,
    shares: 48,
    createdAt: '2026-05-10T10:00:00Z'
  },
  {
    id: 'prop-2',
    title: 'Casa Rustica Contemporánea "La Estancia"',
    description: 'Hermosa residencia que fusiona la calidez del estilo mexicano contemporáneo con toques rústicos e industriales de madera y piedra natural. Ubicada dentro de un fraccionamiento arbolado premium con club hípico. Ofrece jardín de 150m² con palapa y asador incorporados, amplias recámaras con baño propio, área de televisión, y un estudio independiente ideal para home office con luz natural.',
    address: 'Camino Real 45, Avándaro, Valle de Bravo',
    location: 'Valle de Bravo',
    price: 245000,
    rooms: 4,
    bathrooms: 4.5,
    area: 320,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=75',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=75',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=75'
    ],
    virtualTourUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=75',
    whatsappNumber: '+525512345678',
    features: ['Jardín Amplio', 'Área de Asador', 'Fraccionamiento Cerrado', 'Estudio Home Office', 'Chimenea', 'Alberca Común'],
    clicks: 98,
    shares: 21,
    createdAt: '2026-05-12T11:00:00Z'
  },
  {
    id: 'prop-3',
    title: 'Apartamento Minimalista Loft Nord',
    description: 'Increíble departamento loft ideal para solteros, parejas jóvenes o inversores de rentas temporales. Totalmente amueblado con diseño nórdico escandinavo que optimiza cada metro cuadrado con elegancia y funcionalidad. Ventanales térmicos orientados al sur, calefacción radiante, aire acondicionado centralizado y cocina integral minimalista. Se encuentra a pasos de la estación de metro y parques públicos.',
    address: 'Calle Río Danubio 78, Col. Cuauhtémoc, CDMX',
    location: 'Colonia Cuauhtémoc',
    price: 135000,
    rooms: 1,
    bathrooms: 1.5,
    area: 85,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=75',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=75',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=75'
    ],
    virtualTourUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=75',
    whatsappNumber: '+525543210987',
    features: ['Amueblado', 'Estilo Nórdico', 'Aire Acondicionado', 'Balcón', 'Piso Alto', 'Bodega Privada'],
    clicks: 215,
    shares: 64,
    createdAt: '2026-05-14T09:30:00Z'
  },
  {
    id: 'prop-4',
    title: 'Residencia Moderna Vista Hermosa',
    description: 'Lujosa casa inteligente con alta eficiencia energética, paneles solares de última generación y recolección de agua pluvial. 4 recámaras tipo suite con closets de madera fina a la medida. Espectacular zona de alberca infinity con vista a la cañada rocosa, sala de cine equipada, bodega de vinos climatizada y cocina profesional de chef con isla central de granito exótico.',
    address: 'Lomas de Chapultepec, Sección III, Miguel Hidalgo, CDMX',
    location: 'Lomas de Chapultepec',
    price: 790000,
    rooms: 5,
    bathrooms: 6,
    area: 550,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=75',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=75',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=75'
    ],
    virtualTourUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=75',
    whatsappNumber: '+525599998888',
    features: ['Alberca Infinity', 'Paneles Solares', 'Cine en Casa', 'Cava de Vinos', 'Cocina de Chef', 'Sistema Inteligente HomeKit'],
    clicks: 310,
    shares: 94,
    createdAt: '2026-05-15T15:00:00Z'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    propertyId: 'prop-1',
    propertyTitle: 'Penthouse de Lujo con Vista Sky',
    clientName: 'Alejandro',
    clientLastName: 'Martínez',
    clientEmail: 'alejandro.martinez@ejemplo.com',
    clientPhone: '+528114441234',
    budget: 400000,
    date: '2026-05-25',
    time: '11:00 AM',
    notes: 'Me interesa saber las condiciones de financiamiento bancario.',
    createdAt: '2026-05-18T10:15:00Z'
  },
  {
    id: 'app-2',
    propertyId: 'prop-3',
    propertyTitle: 'Apartamento Minimalista Loft Nord',
    clientName: 'Sofía',
    clientLastName: 'Rodríguez',
    clientEmail: 'sofia.rodriguez@ejemplo.com',
    clientPhone: '+525510987654',
    budget: 140000,
    date: '2026-05-28',
    time: '04:30 PM',
    notes: 'Quiero ver el departamento ya amueblado para decidir hoy mismo.',
    createdAt: '2026-05-19T14:45:00Z'
  }
];
