<div align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Supabase-database-3ecf8e?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Vercel-deployed-000000?style=for-the-badge&logo=vercel" />
</div>

<br />

<div align="center">
  <h1>🏠 Innobilia — Asesores Inmobiliarios</h1>
  <p><strong>Linktree de propiedades inmobiliarias con panel de administración, analíticas en tiempo real y base de datos en la nube.</strong></p>
</div>

---

## ✨ Características

- 🏡 **Catálogo de propiedades** con imágenes, características, precio y ubicación
- 📅 **Formulario de citas** para que clientes agenden visitas directamente
- 📊 **Analíticas en tiempo real** — visitas, clicks y shares por propiedad
- 🔐 **Panel de administración** protegido por clave secreta
- 📱 **Carrusel táctil** con swipe en móvil
- 💬 **Integración WhatsApp y Facebook** con un clic
- 🌐 **Tour virtual 3D** por propiedad
- ☁️ **Persistencia con Supabase** — datos sincronizados en todos los dispositivos
- 🚀 **Desplegado en Vercel** con CDN global

---

## 🚀 Instalación y uso local

**Requisitos previos:** Node.js 18+

```bash
# 1. Clonar el repositorio
git clone https://github.com/Oneztep/Innobilia_treelink.git
cd Innobilia_treelink

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# 4. Ejecutar en modo desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`

---

## ⚙️ Variables de entorno

Crea un archivo `.env.local` con los siguientes valores:

```env
VITE_ADMIN_SECRET="tu-clave-secreta"
VITE_APP_URL="http://localhost:3000"
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-public-key"
```

---

## 🗄️ Base de datos (Supabase)

El proyecto usa 4 tablas en Supabase:

| Tabla | Descripción |
|-------|-------------|
| `properties` | Propiedades con características, imágenes y contadores |
| `appointments` | Citas y contactos de clientes interesados |
| `analytics` | Visitas globales, clicks y shares acumulados |
| `company_settings` | Logo, nombre, descripción y redes sociales |

> El SQL para crear las tablas está incluido en la documentación del proyecto.

---

## 📁 Estructura del proyecto

```
src/
├── App.tsx                      ← Componente principal
├── lib/
│   ├── supabase.ts              ← Cliente Supabase
│   ├── db.ts                    ← Funciones CRUD
│   └── storage.ts               ← Caché localStorage
├── components/
│   ├── PropertyCard.tsx          ← Tarjeta de propiedad
│   ├── PropertyDetailSidebar.tsx ← Modal detalle
│   ├── AddPropertyModal.tsx      ← Publicar/editar propiedad
│   ├── AppointmentFormModal.tsx  ← Formulario de cita
│   ├── AdminConsole.tsx          ← Panel de administración
│   ├── AdminPanel.tsx            ← Analíticas del admin
│   ├── IdentityModal.tsx         ← Editar identidad de empresa
│   ├── ShareModal.tsx            ← Compartir propiedad
│   ├── WhatsAppLeadModal.tsx     ← Contacto WhatsApp
│   ├── FiltersBar.tsx            ← Filtros de búsqueda
│   └── ConfirmModal.tsx          ← Confirmaciones
└── hooks/
    └── useMediaQuery.ts          ← Detección de breakpoints
```

---

## 🛠️ Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo (puerto 3000)
npm run build    # Build de producción
npm run lint     # Verificación TypeScript
npm run preview  # Preview del build
```

---

<div align="center">
  <p>Hecho con ❤️ por <strong>Innobilia Asesores</strong> © 2026</p>
</div>
