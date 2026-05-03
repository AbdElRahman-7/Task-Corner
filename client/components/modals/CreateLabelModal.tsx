"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface CreateLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, color: string) => void;
}

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

const CreateLabelModal = ({ isOpen, onClose, onCreate }: CreateLabelModalProps) => {
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[9]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle("");
      setSelectedColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onCreate(trimmedTitle, selectedColor);
      onClose();
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div 
        className="modal modal--small createLabelModal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modalClose" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modalHeader">
          <h2 className="modalTitle">Create Label</h2>
          <p className="modalSubtitle">Give your tasks a clear visual category.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="formGroup">
            <label htmlFor="label-title" className="formLabel">
              Label Name
            </label>
            <input
              id="label-title"
              autoFocus
              type="text"
              placeholder="e.g. Critical, Feature, Design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="formInput"
              required
            />
          </div>

          <div className="formGroup">
            <label className="formLabel">Select Color</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`relative w-full aspect-square rounded-lg transition-all duration-200 hover:scale-110 active:scale-90 ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-80'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
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
              type="submit"
              disabled={!title.trim()}
              className="btnPrimary"
              style={{ 
                backgroundColor: selectedColor,
                boxShadow: `0 10px 15px -3px ${selectedColor}33`
              }}
            >
              Create Label
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLabelModal;
