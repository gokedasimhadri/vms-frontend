import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Modern Custom Confirmation Modal
 * Replaces native window.confirm() dialogs with a sleek, themed UI modal.
 */
const ConfirmModal = ({
  isOpen,
  title = 'Confirm Removal',
  message = 'Are you sure you want to remove this record? This action cannot be undone.',
  itemName = '',
  confirmText = 'Yes, Remove',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';

  return (
    <div
      className="confirm-modal-backdrop"
      onClick={!loading ? onCancel : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="confirm-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close icon button */}
        <button
          type="button"
          className="confirm-modal-close-icon"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="confirm-modal-body">
          {/* Icon Badge */}
          <div className={`confirm-modal-icon-badge ${confirmVariant}`}>
            {isDanger ? (
              <Trash2 size={26} strokeWidth={2.2} />
            ) : (
              <AlertTriangle size={26} strokeWidth={2.2} />
            )}
          </div>

          {/* Title & Message */}
          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h3>
          <p className="confirm-modal-message">
            {message}
          </p>

          {itemName ? (
            <div className="confirm-modal-item-preview">
              <span className="confirm-modal-item-label">Target:</span>
              <strong className="confirm-modal-item-value">{itemName}</strong>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="confirm-modal-footer">
          <button
            type="button"
            className="confirm-modal-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn-confirm ${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="confirm-modal-spinner-wrapper">
                <span className="btn-spinner" />
                <span>Removing...</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
