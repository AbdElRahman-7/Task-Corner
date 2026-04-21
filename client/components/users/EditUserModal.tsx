import React from "react";
import { X, Check } from "lucide-react";
import { EditForm, UserRow } from "@appTypes/index";
import Avatar from "./Avatar";

interface EditUserModalProps {
  user: UserRow | null;
  form: EditForm;
  onChange: (form: EditForm) => void;
  onSave: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function EditUserModal({
  user,
  form,
  onChange,
  onSave,
  onClose,
  isLoading,
}: EditUserModalProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Avatar name={user.username} />
            <h2 className="font-semibold text-gray-900 dark:text-white">Edit User</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => onChange({ ...form, username: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
