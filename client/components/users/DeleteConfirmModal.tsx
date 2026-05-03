import React from "react";
import { Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="backdrop" onClick={onClose}>
      <div 
        className="modal modal--small" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modalClose" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500">
              <Trash2 size={24} />
            </div>
            <h2 className="modalTitle !mb-0">{title}</h2>
          </div>
          <p className="modalSubtitle">{message}</p>
        </div>

        <div className="modalActions">
          <button
            type="button"
            onClick={onClose}
            className="btnSecondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btnPrimary !bg-red-500 !shadow-red-500/20"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
