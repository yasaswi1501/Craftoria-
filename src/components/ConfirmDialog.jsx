import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useEscapeKey } from '../utils/useEscapeKey';
import { useScrollLock } from '../utils/scrollLock';

// Generic Craftoria-styled confirmation dialog: used anywhere a destructive
// action (delete address, clear cart, etc.) needs an explicit Cancel/Confirm
// step instead of a browser alert().
const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  errorMessage = '',
  onConfirm,
  onCancel,
}) => {
  const confirmButtonRef = useRef(null);

  useScrollLock(isOpen);
  useEscapeKey(isOpen, () => {
    if (!isLoading) onCancel();
  });

  useEffect(() => {
    if (isOpen) confirmButtonRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isLoading && onCancel()}
          className="fixed inset-0 bg-brand-plum/55 backdrop-blur-sm cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-sm bg-[#FCF8FC] border border-brand-purple/20 rounded-[26px] shadow-[0_20px_60px_rgba(75,46,93,0.28)] p-5 sm:p-6 text-left z-10"
        >
          <button
            onClick={() => !isLoading && onCancel()}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-brand-purple/10 hover:bg-brand-purple/20 flex items-center justify-center text-brand-plum cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-3.5">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>

          <h3 id="confirm-dialog-title" className="font-serif text-base sm:text-lg font-bold text-brand-dark mb-1.5 pr-6">
            {title}
          </h3>
          {message && (
            <p className="text-xs sm:text-[13px] text-brand-dark/70 leading-relaxed mb-5">
              {message}
            </p>
          )}

          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-full border border-brand-purple/25 text-brand-dark/75 font-bold text-xs uppercase tracking-wider hover:bg-brand-purple/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmDialog;
