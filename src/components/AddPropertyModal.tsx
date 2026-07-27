import React, { useState, useEffect, useReducer } from 'react';
import { Property } from '../types';
import { X, Plus, HousePlus, ClipboardPen, ArrowUp, Trash2, Home, MapPin, DollarSign, BedDouble, Bath, Square, Sparkles, MessageSquare, Compass, Image as ImageIcon } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import { OFFLINE_MODE, supabase } from '../lib/supabase.ts';
import { uploadImageBatch, deleteImagesFromStorage } from '../lib/storage';

interface AddPropertyModalProps {
  PropertiesId: string
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Omit<Property, 'clicks' | 'shares' | 'createdAt'> & { id?: string }) => void;
  editingProperty?: Property | null;
  propertyId?: string;
  handleUnsavedChanges: () => void;
}

const DEFAULT_SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'
];

const POPULAR_FEATURES = [
  'Piscina', 'Terraza Privada', 'Seguridad 24/7', 'Gimnasio', 'Estudio Home Office',
  'Jardín', 'Amueblado', 'Cocina de Chef', 'Cochera Techada', 'Sistema Inteligente'
];

const cleanFolderName = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[áäâà]/g, 'a')
    .replace(/[éëêè]/g, 'e')
    .replace(/[íïîì]/g, 'i')
    .replace(/[óöôò]/g, 'o')
    .replace(/[úüûù]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
};

type FormState = {
  title: string;
  description: string;
  address: string;
  location: string;
  price: number;
  rooms: number;
  bathrooms: number;
  area: number;
  virtualTourUrl: string;
  whatsappNumber: string;
}

type FormAction =
  | { type: 'CHANGE_FIELD'; field: keyof FormState; value: string | number }
  | { type: 'SET_ALL'; payload: FormState }
  | { type: 'RESET' };

const initialFormState: FormState = {
  title: '',
  description: '',
  address: '',
  location: '',
  price: 0,
  rooms: 0,
  bathrooms: 0,
  area: 0,
  virtualTourUrl: '',
  whatsappNumber: '+584129700412',
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'CHANGE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ALL':
      return action.payload; // Útil para cuando abres el modal en modo "Editar"
    case 'RESET':
      return initialFormState;
    default:
      return state;
  }
}

export default function AddPropertyModal({ PropertiesId, isOpen, onClose, onSave, editingProperty, handleUnsavedChanges }: AddPropertyModalProps) {
  const { isVisible, animClass, close } = useModal(isOpen, onClose);

  const [formData, dispatch] = useReducer(formReducer, initialFormState);


  // Guardamos objetos que contienen el archivo original y un ObjectURL temporal para la vista previa local
  const [imagesList, setImagesList] = useState<{ file: File; preview: string; id: string; isDeleting?: boolean }[]>([]);

  const [savedUrls, setSavedUrls] = useState<string[]>([]); // Para guardar URLs de propiedades ya existentes al editar

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);


  const draggingItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingProperty) {
      dispatch({
        type: 'SET_ALL',
        payload: {
          title: editingProperty.title || '',
          description: editingProperty.description || '',
          address: editingProperty.address || '',
          location: editingProperty.location || '',
          price: editingProperty.price || 0,
          rooms: editingProperty.rooms || 0,
          bathrooms: editingProperty.bathrooms || 0,
          area: editingProperty.area || 0,
          virtualTourUrl: editingProperty.virtualTourUrl || '',
          whatsappNumber: editingProperty.whatsappNumber || '+584129700412',
        }
      });
      setFeatures(editingProperty.features || []);
      setSavedUrls(editingProperty.images || [])
    } else {
      dispatch({ type: 'RESET' });
      setFeatures([]);
      setSavedUrls([])
    }
  }, [editingProperty, isOpen]);

  // Manejador de archivos: acepta tanto un evento de <input> como un File[] directo (desde drag-drop)
  const handleFileChange = (e: any) => {
    // e?.target?.files → seguro si e es un array (llamada desde handleDrop)
    const rawFiles = e?.target?.files ? Array.from(e.target.files) : Array.isArray(e) ? e : [];

    if (!rawFiles || rawFiles.length === 0) return;

    const newItems = (rawFiles as File[]).reduce((acc, file) => {
      if (file.type.startsWith('image/')) {
        acc.push({
          file,
          preview: URL.createObjectURL(file),
          id: crypto.randomUUID() // <--- GENÉRALO AQUÍ DIRECTAMENTE
        });
      }
      return acc;
    }, [] as Array<{ file: File; preview: string; id: any }>);


    if (newItems.length === 0) return;
    setImagesList((prev) => [...prev, ...newItems]);
    if (e?.target) e.target.value = '';

    // limpiar el input si fue un evento real
  };



  const handleAddUrlImage = () => {
    if (imageUrlInput.trim()) {
      setSavedUrls((prev: string[]) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (indexToRemove: number, isSaved: boolean) => {
    if (isSaved) {
      setSavedUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    } else {
      // Obtenemos el ID único de la foto antes de hacer nada
      const targetId = imagesList[indexToRemove]?.id;
      if (!targetId) return;
      // 1. Marcar como eliminando usando el ID
      setImagesList((prev) =>
        prev.map((item) =>
          item.id === targetId ? { ...item, isDeleting: true } : item
        )
      );
      // 2. Esperar 300ms y borrar usando el ID (a prueba de fallos)
      setTimeout(() => {
        setImagesList((prev) => {
          const itemToKill = prev.find(i => i.id === targetId);
          if (itemToKill && itemToKill.preview) URL.revokeObjectURL(itemToKill.preview);
          return prev.filter((i) => i.id !== targetId);
        });
      }, 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location || !formData.price || !formData.whatsappNumber) {
      alert('Por favor complete los campos requeridos (*)');
      return;
    }

    try {
      setIsUploading(true);

      const uploadedUrls: string[] = [];

      // ── Eliminar del Storage las imágenes que se quitaron al editar ──────────────
      if (editingProperty?.images?.length) {
        // URLs que estaban antes pero ya no están en savedUrls
        const saveUrlsSet = new Set(savedUrls);

        const removedUrls = editingProperty.images.filter(
          url => !saveUrlsSet.has(url)
        );
        if (removedUrls.length > 0) {
          // fire-and-forget: no bloqueamos el guardado si el borrado falla
          deleteImagesFromStorage('property-images', removedUrls).catch(err =>
            console.warn('[modal] No se pudo eliminar imagen del storage:', err)
          );
        }
      }

      // ── Subir imágenes nuevas a Supabase Storage ───────────────────────
      if (imagesList.length > 0) {
        if (OFFLINE_MODE) {
          // Sin Supabase configurado: avisar y continuar sin URLs de red
          alert(
            '⚠️ Modo sin conexión a Supabase\n\n' +
            'Las imágenes se guardarán solo en tu navegador de forma temporal.\n' +
            'Para subir imágenes al Storage, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.local'
          );
        } else {
          const folderName = cleanFolderName(formData.title);
          const { uploaded, failed } = await uploadImageBatch(
            'property-images',
            folderName,
            imagesList,
          );

          uploaded.forEach(r => uploadedUrls.push(r.url));

          if (failed.length > 0) {
            alert(
              `⚠️ ${failed.length} imagen(es) no se pudieron subir:\n` +
              failed.map(f => `• ${f.fileName}: ${f.reason}`).join('\n') +
              '\n\nLas demás se guardaron correctamente.'
            );
          }
        }
      }

      // Consolidar URLs viejas (si estamos editando) + las nuevas del Storage
      const finalImages = [...savedUrls, ...uploadedUrls];
      const fallbackImages = finalImages.length > 0 ? finalImages : [...DEFAULT_SAMPLE_IMAGES];

      // Limpiamos los ObjectURLs locales de la memoria
      imagesList.forEach(item => URL.revokeObjectURL(item.preview));

      // Enviamos los datos limpios al manejador superior del componente
      onSave({
        id: editingProperty?.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        location: formData.location,
        price: Number(formData.price),
        rooms: Number(formData.rooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
        images: fallbackImages, // <--- Aquí van las URLs cortas finales
        virtualTourUrl: formData.virtualTourUrl.trim() || undefined,
        whatsappNumber: formData.whatsappNumber,
        features,
      });

      onClose();
    } catch (error) {
      console.error('Error al subir imágenes a Supabase Storage:', error);
      alert('Hubo un error al procesar y subir las imágenes al almacén.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Lógica del Drag and Drop de ordenamiento adaptada ---
  const handleSortStart = (index: number) => { draggingItem.current = index; };
  const handleSortEnter = (index: number) => { dragOverItem.current = index; };
  const handleSortEnd = () => {
    if (draggingItem.current === null || dragOverItem.current === null) return;
    const totalLength = savedUrls.length + imagesList.length;

    // Unificamos temporalmente las vistas para reorganizarlas
    const allItems = [
      ...savedUrls.map(url => ({ type: 'saved', data: url })),
      ...imagesList.map(item => ({ type: 'new', data: item }))
    ];

    const draggedItemContent = allItems.splice(draggingItem.current, 1)[0];
    allItems.splice(dragOverItem.current, 0, draggedItemContent);

    draggingItem.current = null;
    dragOverItem.current = null;

    // Separamos de nuevo las listas en sus respectivos estados
    setSavedUrls(
      allItems.reduce<string[]>((acc, i) => {
        if (i.type === 'saved') {
          acc.push(i.data as string);
        }
        return acc;
      }, [])
    );
    setImagesList(allItems.reduce((acc, i) => {
      if (i.type === 'new') {
        acc.push(i.data as { file: File; preview: string });
      }
      return acc;
    }, []));
  };

  const dropZoneRef = React.useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Solo resetear cuando el mouse sale REALMENTE del contenedor (no de un hijo)
  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (dropZoneRef.current && related && dropZoneRef.current.contains(related)) return;
    setIsDragging(false);
  };

  // Recolectar TODAS las entries de forma síncrona ANTES del primer await
  // (el objeto DataTransfer se vacía automáticamente cuando el handler síncrono termina)
  const extraerArchivosDeEntrada = async (entry: FileSystemEntry): Promise<File[]> => {
    const files: File[] = [];
    if (entry.isFile) {
      const file = await new Promise<File | null>((resolve) => {
        (entry as FileSystemFileEntry).file(resolve, () => resolve(null));
      });
      if (file && file.type.startsWith('image/')) files.push(file);
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      // readEntries puede necesitar llamarse varias veces hasta obtener un array vacío
      const readAllEntries = (): Promise<FileSystemEntry[]> =>
        new Promise((resolve) => {
          const all: FileSystemEntry[] = [];
          const readBatch = () => {
            dirReader.readEntries((batch) => {
              if (batch.length === 0) { resolve(all); return; }
              all.push(...batch);
              readBatch();
            }, () => resolve(all));
          };
          readBatch();
        });
      const subEntries = await readAllEntries();

      const subFilesArrays = await Promise.all(subEntries.map(subEntry => extraerArchivosDeEntrada(subEntry)));

      for (const subFiles of subFilesArrays) {
        files.push(...subFiles);
      }
    }
    return files;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    // CRÍTICO: capturar todas las FileSystemEntry de forma SÍNCRONA antes de cualquier await
    // porque DataTransfer.items se vacía en cuanto el handler retorna el control al browser
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const entry = items[i].webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }

    if (entries.length === 0) return;

    // Ahora sí podemos usar await con seguridad
    const allFiles: File[] = [];

    const allEntries = await Promise.all(entries.map(entry => extraerArchivosDeEntrada(entry)));
    for (const entry of allEntries) {
      allFiles.push(...entry);
    }

    if (allFiles.length > 0) handleFileChange(allFiles);
  };

  const handleToggleFeature = (feature: string) => {
    if (features.includes(feature)) {
      setFeatures(features.filter(f => f !== feature));
    } else { setFeatures([...features, feature]); }
  };

  const handleAddNewFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeatureText.trim() && !features.includes(newFeatureText.trim())) {
      setFeatures([...features, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  const totalImagesCount = savedUrls.length + imagesList.length;

  const hasUnsavedChanges = (): boolean => {
    return (
      totalImagesCount >= 1 || formData.title !== "" || formData.description !== "" || formData.price >= 1 || formData.location !== "" || formData.bathrooms >= 1 || formData.rooms >= 1 || formData.area >= 1
    )
  }

  const handleSafeClose = () => {
    if (hasUnsavedChanges() && !editingProperty) {
      handleUnsavedChanges();
    } else {
      close();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md ${animClass.overlay}`} aria-label='Close-overlay' onClick={handleSafeClose} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSafeClose; }} role="button" tabIndex={0} />
      <div className={`relative w-[90%] max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] mx-auto ${animClass.panel}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
              {editingProperty ? <span className="flex items-center gap-2">
                <ClipboardPen /> Editar Propiedad Disponible</span> : <span className="flex items-center gap-2">
                <HousePlus /> Agregar Nueva Propiedad</span>}
            </h3>
            <p className="text-xs text-slate-500">
              {editingProperty ? `ID: ${editingProperty.id}` : 'Completa los campos para listar el inmueble estilo Innobilia'}
            </p>
          </div>
          <button type="button" onClick={handleSafeClose} aria-label="Close modal" className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-600 leading-relaxed">
          <div>
            <label
              htmlFor='listing-property-title'
              className="block text-xs font-semibold text-slate-700 uppercase mb-1"
            >
              Título de la Propiedad *</label>
            <div className="relative">
              <Home aria-label='Home' className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                id='listing-property-title'
                required
                placeholder="Ej. Casa de Campo con Huerta Rústica"
                value={formData.title}
                onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'title', value: e.target.value })}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='listing-property-description'
              className="block text-xs font-semibold text-slate-700 uppercase mb-1"
            >
              Descripción Detallada *</label>
            <textarea
              id='listing-property-description'
              required
              rows={3}
              placeholder="Explica todos los atractivos de la propiedad..."
              value={formData.description}
              onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'description', value: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 h-24"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor='listing-property-location'
                className="block text-xs font-semibold text-slate-700 uppercase mb-1"
              >
                Ciudad o Zona *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id='listing-property-location'
                  type="text"
                  required
                  placeholder="Ej. San Pedro"
                  value={formData.location}
                  onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'location', value: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='listing-property-address'
                className="block text-xs font-semibold text-slate-700 uppercase mb-1"
              >
                Dirección Completa</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id='listing-property-address'
                  type="text"
                  placeholder="Ej. Av. de los Sabinos #190"
                  value={formData.address}
                  onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'address', value: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Características numéricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label
                htmlFor='listing-property-price'
                className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1"
              >
                <DollarSign className="h-3 w-3 text-amber-500" />
                <span>Precio ($ USD) *</span>
              </label>
              <input
                id='listing-property-price'
                type="number"
                required
                min={1}
                value={formData.price}
                onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'price', value: e.target.value.replace(/^0+(?=\d)/, '') })}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 bg-white text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label
                htmlFor='listing-property-rooms'
                className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1"
              >
                <BedDouble className="h-3 w-3 text-amber-500" />
                <span>Habitaciones</span>
              </label>
              <input
                id='listing-property-rooms'
                type="number"
                min={0}
                required
                value={formData.rooms}
                onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'rooms', value: e.target.value.replace(/^0+(?=\d)/, '') })}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 bg-white text-slate-800"
              />
            </div>

            <div>
              <label
                htmlFor='listing-property-bathrooms'
                className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1"
              >
                <Bath className="h-3 w-3 text-amber-500" />
                <span>Baños</span>
              </label>
              <input
                id='listing-property-bathrooms'
                type="number"
                step="1"
                min={0}
                required
                value={formData.bathrooms}
                onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'bathrooms', value: e.target.value.replace(/^0+(?=\d)/, '') })}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 bg-white text-slate-800"
              />
            </div>

            <div>
              <label
                htmlFor='listing-property-area'
                className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1"
              >
                <Square className="h-3 w-3 text-amber-500" />
                <span>Área (m²)</span>
              </label>
              <input
                id='listing-property-area'
                type="number"
                min={0}
                required
                value={formData.area}
                onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'area', value: e.target.value.replace(/^0+(?=\d)/, '') })}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Zona de Imágenes */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex justify-between font-sans tracking-wide" htmlFor="listing-property-images" >
                <span>Imágenes de la Propiedad ({totalImagesCount}) *</span>
              </label>

              {/* Drop zone — div puro, sin label/htmlFor para no interferir con drag events */}
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="region"
                aria-label="Drop zone"
                className={`flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 gap-1 text-center select-none ${isDragging
                  ? 'border-amber-400 bg-amber-50/60 scale-[1.01] shadow-amber-100 shadow-md'
                  : 'border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-slate-100/50'
                  }`}
              >
                <ImageIcon className="h-5 w-5 text-slate-400 pointer-events-none" />
                <span className="text-xs font-bold text-slate-700 pointer-events-none">Subir fotos desde tus archivos</span>
                <span className="text-[10px] text-slate-400 pointer-events-none">Haz clic o arrastra imágenes / carpetas aquí</span>
                <input
                  ref={fileInputRef}
                  id='listing-property-images'
                  arial-label='Imagenes de la propiedad'
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="flex justify-center mt-2">
                <span className="text-[10px] text-amber-600 font-bold font-sans tracking-wide">Se subirá directamente a carpetas ordenadas en Storage</span>
              </div>

              {/* ── Galería unificada: URLs de BD + archivos locales nuevos ── */}
              {totalImagesCount > 0 ? (
                <>
                  {/* Contador total */}
                  <div className="mt-2 flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      {totalImagesCount} imagen{totalImagesCount !== 1 ? 'es' : ''} · arrastra para reordenar
                    </span>
                  </div>

                  <div className="mt-1.5 grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl  overflow-y-auto max-h-[200px]">
                    {/* URLs guardadas en Supabase / Base de Datos */}
                    {savedUrls.map((img, idx) => (
                      <div
                        key={`${img}-${idx}`}
                        draggable
                        onDragStart={() => handleSortStart(idx)}
                        onDragEnter={() => handleSortEnter(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={handleSortEnd}
                        className="relative aspect-square rounded-lg overflow-hidden bg-white group cursor-grab active:cursor-grabbing transition-transform duration-500 ease-out animate-fade-in"
                        style={{ opacity: draggingItem.current === idx ? 0.35 : 1, transition: 'opacity 0.15s' }}
                      >
                        <img src={img} alt={`Foto guardada ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />

                        {/* Enumerador — lado izquierdo */}
                        <div className="absolute top-1 left-1 min-w-[18px] h-[18px] flex items-center justify-center bg-slate-900/70 text-white text-[9px] font-bold rounded-full px-1 pointer-events-none">
                          {idx + 1}
                        </div>

                        {/* Botón borrar — lado derecho con hover animation */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx, true)}
                          className="absolute top-1 right-1 bg-slate-900/70 hover:bg-red-600 text-white p-1 rounded-full shadow-md cursor-pointer transition-all duration-150 hover:scale-110"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        {/* Barra inferior — indica portada o nube */}
                        <div className={`absolute bottom-0 inset-x-0 text-white text-[9px] py-0.5 text-center font-semibold pointer-events-none ${idx === 0 ? 'bg-emerald-600/90' : 'bg-slate-700/70'
                          }`}>
                          {idx === 0 ? '📌 Portada' : `Nube ${idx + 1}`}
                        </div>
                      </div>
                    ))}

                    {/* Imágenes locales nuevas (aún no subidas) */}
                    {imagesList.map((item, idx) => {
                      const globalIdx = savedUrls.length + idx;
                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={() => handleSortStart(globalIdx)}
                          onDragEnter={() => handleSortEnter(globalIdx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnd={handleSortEnd}
                          className={`relative aspect-square rounded-lg overflow-hidden bg-white group cursor-grab active:cursor-grabbing transition-all duration-300 ease-out ${item.isDeleting ? 'opacity-0 scale-90' : 'animate-fade-in'}`}
                          style={{ opacity: draggingItem.current === globalIdx ? 0.35 : 1 }}
                        >
                          <img src={item.preview} alt={`Foto local ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />

                          {/* Enumerador — lado izquierdo */}
                          <div className="absolute top-1 left-1 min-w-[18px] h-[18px] flex items-center justify-center bg-amber-600/80 text-white text-[9px] font-bold rounded-full px-1 pointer-events-none">
                            {globalIdx + 1}
                          </div>

                          {/* Botón borrar — lado derecho con hover animation */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx, false)}
                            className="absolute top-1 right-1 bg-slate-900/70 hover:bg-red-600 text-white p-1 rounded-full shadow-md cursor-pointer transition-all duration-150 hover:scale-110"
                            title="Eliminar imagen"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>

                          {/* Barra inferior — indica portada o "por subir" */}
                          <div className={`absolute bottom-0 inset-x-0 text-white text-[9px] py-0.5 text-center font-semibold pointer-events-none ${globalIdx === 0 ? 'bg-emerald-600/90' : 'bg-amber-600/85'
                            }`}>
                            {globalIdx === 0 ? '📌 Portada' : <span className="flex items-center justify-center gap-1">
                              <ArrowUp className="h-3 w-3" /> Por subir</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="mt-2 p-3 bg-amber-50/50 rounded-lg border border-amber-200/30 text-center text-[11px] text-amber-800 font-medium">
                  📱 Ninguna foto seleccionada aún.
                </div>
              )}

              {/* Agregar Link Alternativo */}
              <div className="mt-2.5 flex gap-2" >
                <input
                  arial-label="alternative-link"
                  type="text"
                  placeholder="O pega el URL de una foto web aquí..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  Agregar Link
                </button>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1" htmlFor="listing-property-virtual-tour-url">Tour Virtual (URL)</label>
                <div className="relative">
                  <Compass className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="listing-property-virtual-tour-url"
                    type="text"
                    placeholder="https://my.matterport.com/show/?m=..."
                    value={formData.virtualTourUrl}
                    onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'virtualTourUrl', value: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1" htmlFor="listing-property-whatsapp-number">WhatsApp *</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="listing-property-whatsapp-number"
                    type="text"
                    required
                    placeholder="Ej. +525512345678"
                    value={formData.whatsappNumber}
                    onChange={(e) => dispatch({ type: 'CHANGE_FIELD', field: 'whatsappNumber', value: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Características Adicionales */}
          <div>
            <label htmlFor="custom-feature-input" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center gap-1 cursor-pointer">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Características ({features.length})</span>
            </label>

            {/* Quick list pill buttons */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {POPULAR_FEATURES.map((feat) => {
                const isSelected = features.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => handleToggleFeature(feat)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${isSelected
                      ? 'bg-amber-100 text-amber-950 font-medium border border-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                  >
                    {feat}
                  </button>
                );
              })}
            </div>

            {/* Manual custom feature input */}

            <div className="flex gap-2">
              <input
                id="custom-feature-input"
                type="text"
                placeholder="Ingresar característica personalizada..."
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                aria-label="Ingresar característica personalizada"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddNewFeature}
                className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Agregar
              </button>
            </div>

            {features.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {features.map((item, idx) => (
                  <span key={item} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                    <span>{item}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      onClick={() => handleToggleFeature(item)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

          </div>

          {/* Botones de acción */}
          <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isUploading ? 'Subiendo Fotos a Storage...' : editingProperty ? 'Guardar Cambios' : 'Agregar propiedad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
