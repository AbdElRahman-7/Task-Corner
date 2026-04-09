"use client";

import React, { useState, useEffect } from "react";

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
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-amber-950/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-amber-50 dark:bg-slate-900 shadow-2xl p-8 border border-amber-200 dark:border-slate-800 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: selectedColor }}
        ></div>

        <div className="relative">
          <h2 className="text-xl font-bold text-amber-900 dark:text-yellow-100 mb-2">
            Create Label
          </h2>
          <p className="text-amber-800/60 dark:text-yellow-100/60 text-xs mb-6 font-medium">
            Give your tasks a clear visual category.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="label-title" 
                className="block text-[10px] font-bold uppercase tracking-widest text-amber-900 dark:text-yellow-100 mb-2 opacity-50"
              >
                Label Name
              </label>
              <input
                id="label-title"
                autoFocus
                type="text"
                placeholder="e.g. Critical, Feature, Design"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-2 border-amber-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-amber-950 dark:text-white placeholder-amber-900/30 dark:placeholder-white/20 focus:outline-none focus:border-yellow-500 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-amber-900 dark:text-yellow-100 mb-3 opacity-50">
                Select Color
              </label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`group relative w-full aspect-square rounded-lg transition-all duration-200 hover:scale-110 active:scale-90 ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-yellow-400 dark:ring-yellow-100 dark:ring-offset-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
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

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-100 dark:bg-slate-800 text-amber-900 dark:text-yellow-100 font-bold text-xs hover:bg-amber-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex-[2] px-4 py-3 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{ 
                  backgroundColor: selectedColor,
                  color: "#fff",
                  boxShadow: `0 10px 15px -3px ${selectedColor}33`
                }}
              >
                Create Label
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelModal;
