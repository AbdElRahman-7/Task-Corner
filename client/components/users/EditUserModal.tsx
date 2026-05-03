"use client";
import React from "react";
import { X, Check, User, Mail } from "lucide-react";
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
    <div className="backdrop" onClick={onClose}>
      <div 
        className="modal modal--small" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modalClose" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="flex items-center gap-3 mb-2">
            <Avatar name={user.username} />
            <div>
              <h2 className="modalTitle !mb-0">Edit Profile</h2>
              <p className="modalSubtitle">Update user account information.</p>
            </div>
          </div>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); onSave(); }}
          className="space-y-6"
        >
          <div className="formGroup !mb-0">
            <label className="formLabel">Username</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary opacity-50">
                <User size={18} />
              </div>
              <input
                type="text"
                value={form.username}
                onChange={(e) => onChange({ ...form, username: e.target.value })}
                className="formInput !pl-10"
                required
              />
            </div>
          </div>

          <div className="formGroup !mb-0">
            <label className="formLabel">Email Address</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary opacity-50">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                className="formInput !pl-10"
                required
              />
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
              disabled={isLoading}
              className="btnPrimary"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check size={18} />
                  <span>Save Changes</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
