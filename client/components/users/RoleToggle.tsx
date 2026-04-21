import React from "react";
import { Eye, Pencil } from "lucide-react";

interface RoleToggleProps {
  role: "viewer" | "editor";
  onChange: (r: "viewer" | "editor") => void;
  disabled?: boolean;
}

export default function RoleToggle({ role, onChange, disabled }: RoleToggleProps) {
  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("viewer")}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
          role === "viewer"
            ? "bg-sky-500 text-white"
            : "bg-white dark:bg-zinc-800 text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
        }`}
      >
        <Eye className="w-3 h-3" />
        View
      </button>
      <div className="w-px self-stretch bg-gray-200 dark:bg-zinc-700" />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("editor")}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
          role === "editor"
            ? "bg-violet-600 text-white"
            : "bg-white dark:bg-zinc-800 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
        }`}
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
    </div>
  );
}
