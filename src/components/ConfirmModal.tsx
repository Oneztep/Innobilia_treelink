import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useModal } from '../hooks/useModal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  dialogRef: React.RefObject<HTMLDialogElement>;
}

/**
 * Modal de confirmación reutilizable.
 * Reemplaza todos los window.confirm() del proyecto.
 */
export default function ConfirmModal({
  dialogRef,
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { isVisible, animClass, close: handleCancel } = useModal(isOpen, onCancel);

  // Mantener los textos visibles durante la animación de salida aunque App.tsx los borre
  const prevProps = React.useRef<ConfirmModalProps>({
    isOpen, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel
  });

  React.useEffect(() => {
    if (isOpen) {
      prevProps.current = { isOpen, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel };
    }
  }, [isOpen, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel]);

  const displayTitle = isOpen ? title : prevProps.current.title;
  const displayMessage = isOpen ? message : prevProps.current.message;
  const displayConfirmLabel = isOpen ? confirmLabel : prevProps.current.confirmLabel;
  const displayCancelLabel = isOpen ? cancelLabel : prevProps.current.cancelLabel;
  const displayVariant = isOpen ? variant : prevProps.current.variant;

  if (!isVisible) return null;

  const isDanger = displayVariant === 'danger';

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm ${animClass.overlay}`}
        aria-label='Cancel-modal'
        onClick={handleCancel}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCancel(); }}
        role="button"
        tabIndex={0}
      />

      {/* Panel */}
      <div className={`relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden ${animClass.panel}`}>
        {/* Header */}
        <div className={`px-5 pt-5 pb-4 flex items-start gap-3`}>
          <div className={`shrink-0 p-2 rounded-xl ${isDanger ? 'bg-red-50' : 'bg-amber-50'}`}>
            {isDanger ? (
              <Trash2 className="h-5 w-5 text-red-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-modal-title"
              className="font-display font-bold text-slate-900 text-sm"
            >
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-500 mt- whitespace-pre-line leading-relaxed">{displayMessage}</p>
          </div>
          <button
            type='button'
            onClick={onCancel}
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            type='button'
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {displayCancelLabel}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-white ${isDanger
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
          >
            {displayConfirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
