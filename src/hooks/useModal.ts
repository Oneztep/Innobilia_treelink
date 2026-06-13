/**
 * useModal — manages open/close animation state for modals.
 *
 * Usage:
 *   const { isVisible, animClass, close } = useModal(isOpen, onClose);
 *
 *   Apply `animClass.overlay` to the backdrop div.
 *   Apply `animClass.panel`   to the modal panel div.
 *   Render the modal only when `isVisible` is true.
 *   Call `close()` instead of calling onClose directly (handles the exit animation).
 */

import { useState, useEffect, useCallback } from 'react';

const CLOSE_DURATION_MS = 180; // must match CSS animation duration

interface ModalAnimClasses {
  overlay: string;
  panel: string;
}

interface UseModalReturn {
  /** Whether the modal DOM should be mounted */
  isVisible: boolean;
  animClass: ModalAnimClasses;
  /** Call this instead of onClose — plays exit animation then unmounts */
  close: () => void;
}

export function useModal(isOpen: boolean, onClose: () => void): UseModalReturn {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  // When isOpen flips true → show immediately
  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setIsVisible(true);
    }
  }, [isOpen]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setClosing(false);
      onClose();
    }, CLOSE_DURATION_MS);
  }, [onClose]);

  const animClass: ModalAnimClasses = {
    overlay: closing ? 'modal-overlay-close' : 'modal-overlay-open',
    panel:   closing ? 'modal-panel-close'   : 'modal-panel-open',
  };

  return { isVisible, animClass, close };
}

/**
 * useSheetModal — same as useModal but uses the bottom-sheet animation
 * (slides up from bottom), designed for the mobile-friendly sheet style.
 */
export function useSheetModal(isOpen: boolean, onClose: () => void): UseModalReturn {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setIsVisible(true);
    }
  }, [isOpen]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setClosing(false);
      onClose();
    }, CLOSE_DURATION_MS);
  }, [onClose]);

  const animClass: ModalAnimClasses = {
    overlay: closing ? 'modal-overlay-close' : 'modal-overlay-open',
    panel:   closing ? 'modal-sheet-close'   : 'modal-sheet-open',
  };

  return { isVisible, animClass, close };
}
