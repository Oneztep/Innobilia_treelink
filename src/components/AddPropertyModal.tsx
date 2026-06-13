import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { X, Plus, Trash2, Home, MapPin, DollarSign, BedDouble, Bath, Square, Sparkles, MessageSquare, Compass, Image as ImageIcon } from 'lucide-react';
import { useModal } from '../hooks/useModal';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Omit<Property, 'clicks' | 'shares' | 'createdAt'> & { id?: string }) => void;
  editingProperty?: Property | null;
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

export default function AddPropertyModal({ isOpen, onClose, onSave, editingProperty }: AddPropertyModalProps) {
  const { isVisible, animClass, close } = useModal(isOpen, onClose);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState<number>(150000);
  const [rooms, setRooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [area, setArea] = useState<number>(120);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [virtualTourUrl, setVirtualTourUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+525512345678');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Sync state with editing target when opened
  useEffect(() => {
    if (editingProperty) {
      setTitle(editingProperty.title);
      setDescription(editingProperty.description);
      setAddress(editingProperty.address);
      setLocation(editingProperty.location);
      setPrice(editingProperty.price);
      setRooms(editingProperty.rooms);
      setBathrooms(editingProperty.bathrooms);
      setArea(editingProperty.area);
      setImagesList(editingProperty.images || []);
      setVirtualTourUrl(editingProperty.virtualTourUrl || '');
      setWhatsappNumber(editingProperty.whatsappNumber);
      setFeatures(editingProperty.features);
    } else {
      // Set pristine state for fresh creation
      setTitle('');
      setDescription('');
      setAddress('');
      setLocation('');
      setPrice(180000);
      setRooms(3);
      setBathrooms(2);
      setArea(140);
      setImagesList([]);
      setVirtualTourUrl('');
      setWhatsappNumber('+525512345678');
      setFeatures(['Seguridad 24/7', 'Terraza Privada']);
    }
  }, [editingProperty, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImagesList((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input value so same files can be re-uploaded if deleted
    e.target.value = '';
  };

  const handleAddUrlImage = () => {
    if (imageUrlInput.trim()) {
      setImagesList((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  if (!isVisible) return null;

  const handleToggleFeature = (feature: string) => {
    if (features.includes(feature)) {
      setFeatures(features.filter(f => f !== feature));
    } else {
      setFeatures([...features, feature]);
    }
  };

  const handleAddNewFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeatureText.trim()) {
      if (!features.includes(newFeatureText.trim())) {
        setFeatures([...features, newFeatureText.trim()]);
      }
      setNewFeatureText('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location || !price || !whatsappNumber) {
      alert('Por favor complete los campos requeridos (*)');
      return;
    }

    // Process images
    const finalImages = imagesList.length > 0 ? imagesList : [...DEFAULT_SAMPLE_IMAGES];

    onSave({
      id: editingProperty?.id, // Keep ID if updating
      title,
      description,
      address,
      location,
      price: Number(price),
      rooms: Number(rooms),
      bathrooms: Number(bathrooms),
      area: Number(area),
      images: finalImages,
      virtualTourUrl: virtualTourUrl.trim() || undefined,
      whatsappNumber,
      features,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md-custom ${animClass.overlay}`} onClick={close} />

      <div className={`relative w-[90%] max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] mx-auto ${animClass.panel}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              {editingProperty ? '📝 Editar Propiedad Disponible' : '✨ Agregar Nueva Propiedad'}
            </h3>
            <p className="text-xs text-slate-500">
              {editingProperty ? `ID: ${editingProperty.id}` : 'Completa los campos para listar el inmueble estilo Innobilia'}
            </p>
          </div>
          <button onClick={close} className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content scrolling form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-600 leading-relaxed">
          {/* Main info row */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Título de la Propiedad *</label>
            <div className="relative">
              <Home className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ej. Casa de Campo con Huerta Rústica"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Descripción Detallada *</label>
            <textarea
              required
              rows={3}
              placeholder="Explica todos los atractivos de la propiedad como plusvalía, luminosidad, entorno, servicios públicos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 h-24"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ciudad o Zona (Ej. Envío Filtro) *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej. San Pedro"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dirección Completa</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej. Av. de los Sabinos #190, Col. Arboledas"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Price, Rooms, Baths, Area */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-amber-500" />
                <span>Precio ($ USD) *</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 bg-white focus:outline-none text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <BedDouble className="h-3 w-3 text-amber-500" />
                <span>Habitaciones</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 bg-white focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Bath className="h-3 w-3 text-amber-500" />
                <span>Baños</span>
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                required
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 bg-white focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Square className="h-3 w-3 text-amber-500" />
                <span>Área (m²)</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 bg-white focus:outline-none text-slate-800"
              />
            </div>
          </div>

          {/* Images list and Tour URL */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex justify-between font-display tracking-wide">
                <span>Imágenes de la Propiedad ({imagesList.length}) *</span>
                <span className="text-[10px] text-amber-600 font-bold italic">Formatos: JPG, PNG, WEBP, HEIC</span>
              </label>

              {/* Upload device images selector styled zone */}
              <div className="flex gap-2.5">
                <label 
                  htmlFor="prop-images-file-input"
                  className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-slate-100/50 rounded-xl cursor-pointer transition-all duration-200 gap-1 text-center font-sans"
                >
                  <ImageIcon className="h-5.5 w-5.5 text-slate-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">Subir fotos desde tus archivos</span>
                  <span className="text-[10px] text-slate-400">Selecciona una o varias imágenes de tu celular o PC</span>
                  <input
                    id="prop-images-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or manual URL helper */}
              <div className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  placeholder="O pega el URL de una foto web aquí..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrlImage();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 font-semibold cursor-pointer shrink-0 transition-colors"
                >
                  Agregar Link
                </button>
              </div>

              {/* Previews Grid */}
              {imagesList.length > 0 ? (
                <div className="mt-3.5 grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 overflow-y-auto max-h-[160px] animate-fade-in">
                  {imagesList.map((img, idx) => (
                    <div key={idx} className="relative aspect-square group rounded-lg overflow-hidden border border-slate-200/60 bg-white">
                      <img 
                        src={img} 
                        alt={`Preview de foto ${idx + 1}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-slate-900/80 hover:bg-red-650 text-white p-1 rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                        title="Eliminar foto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[9px] py-0.5 text-center truncate font-mono">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 p-3 bg-amber-50/50 rounded-lg border border-amber-200/30 text-center text-[11px] text-amber-800 font-medium">
                  📱 Ninguna foto seleccionada aún. Se mostrarán fotos demostrativas premium si guardas así.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tour Virtual de Propiedad (URL)</label>
                <div className="relative">
                  <Compass className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="https://my.matterport.com/show/?m=..."
                    value={virtualTourUrl}
                    onChange={(e) => setVirtualTourUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">WhatsApp de Contacto *</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. +525512345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features / Tags select list */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Características del Inmueble ({features.length} seleccionadas)</span>
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
                    className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                      isSelected
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
                type="text"
                placeholder="Ingresar característica personalizada..."
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewFeature(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewFeature}
                className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs hover:bg-slate-200 text-slate-700 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Agregar</span>
              </button>
            </div>

            {features.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {features.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                    <span>{item}</span>
                    <button
                      type="button"
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

          {/* Action Row */}
          <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold hover:shadow-lg hover:shadow-slate-900/10 transition-all cursor-pointer"
            >
              {editingProperty ? 'Guardar Cambios' : 'Dar de Alta Inmueble'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
