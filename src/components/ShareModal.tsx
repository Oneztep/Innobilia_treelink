import React, { useState } from 'react';
import { Property } from '../types';
import { Share2, Check, Copy, MessageSquare, Facebook, Mail, X, Instagram } from 'lucide-react';

interface ShareModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmShare: (id: string) => void;
}

export default function ShareModal({ property, isOpen, onClose, onConfirmShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !property) return null;

  const shareUrl = `${window.location.origin}/?property=${property.id}`;
  const shareText = `¡Mira esta espectacular propiedad de Innobilia! ${property.title} por $${property.price.toLocaleString()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onConfirmShare(property.id);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSharedWhatsApp = () => {
    onConfirmShare(property.id);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' - ' + shareUrl)}`, '_blank');
  };

  const handleSharedInstagram = () => {
    onConfirmShare(property.id);
    // Instagram doesn't have a direct share URL; copy link and open Instagram
    navigator.clipboard.writeText(shareUrl);
    window.open('https://www.instagram.com/', '_blank');
  };

  const handleSharedFacebook = () => {
    onConfirmShare(property.id);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleSharedEmail = () => {
    onConfirmShare(property.id);
    const mailto = `mailto:?subject=${encodeURIComponent('Propiedad recomendada de Innobilia')}&body=${encodeURIComponent(shareText + '\n\nEnlace: ' + shareUrl)}`;
    window.location.href = mailto;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Compartir propiedad">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md-custom" onClick={onClose} />

      <div className="relative w-[90%] max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-amber-500" />
            <h3 className="font-display font-bold text-slate-950 text-base">Compartir Enlace</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Property info */}
        <div>
          <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{property.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{property.address || property.location}</p>
        </div>

        {/* Share buttons — 5 options in a grid */}
        <div className="grid grid-cols-5 gap-2 py-2">
          {/* WhatsApp */}
          <button
            onClick={handleSharedWhatsApp}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            title="Compartir por WhatsApp"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full group-hover:bg-emerald-100 transition-colors">
              {/* WhatsApp SVG icon */}
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-emerald-600" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">WhatsApp</span>
          </button>

          {/* Instagram */}
          <button
            onClick={handleSharedInstagram}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            title="Copiar enlace para Instagram"
          >
            <div className="p-2.5 bg-pink-50 text-pink-600 rounded-full group-hover:bg-pink-100 transition-colors">
              <Instagram className="h-5 w-5" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Instagram</span>
          </button>

          {/* Facebook */}
          <button
            onClick={handleSharedFacebook}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            title="Compartir en Facebook"
          >
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-100 transition-colors">
              <Facebook className="h-5 w-5" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Facebook</span>
          </button>

          {/* Email */}
          <button
            onClick={handleSharedEmail}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            title="Compartir por correo"
          >
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-100 transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium font-sans">Correo</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            title="Copiar enlace"
          >
            <div className={`p-2.5 rounded-full transition-colors ${copied ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {/* URL preview row */}
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1">
          <span className="text-[11px] text-slate-500 truncate select-all pr-12 w-full font-mono">
            {shareUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="absolute right-1 text-slate-400 hover:text-amber-600 py-1 px-2.5 rounded text-xs font-semibold cursor-pointer transition-colors"
          >
            {copied ? 'Listo ✓' : 'Copiar'}
          </button>
        </div>

        <p className="text-[9px] text-slate-400 text-center font-mono">
          Tu recomendación incrementará el nivel de visibilidad de este anuncio.
        </p>
      </div>
    </div>
  );
}
