"use client";
import React, { useState, useEffect } from "react";
import { X, UserPlus, Mail, Copy, UserCheck, ShieldCheck, Eye, EyeOff, Lock, Globe, Plus } from "lucide-react";
import { AVATAR_COLORS, getInitials } from "./userUtils";
import { API, authHeaders } from "./userConfig";
import { Board } from "@appTypes/index";
import { toast } from "react-hot-toast";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchBoards();
    }
  }, [isOpen]);

  const fetchBoards = async () => {
    try {
      const res = await fetch(`${API}/boards?status=active`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setBoards(data);
    } catch (e) {
      console.error("Failed to fetch boards", e);
    }
  };

  if (!isOpen) return null;

  const handleInvite = async () => {
    if (!email.trim() || !name.trim()) {
      setError("Both name and email are required.");
      return;
    }
    setLoading(true);
    setError("");
    setLink("");
    try {
      const res = await fetch(`${API}/admin/invite`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setLink(data.link);
      toast.success("Invite link generated!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirect = async () => {
     if (!email.trim() || !name.trim()) {
      setError("Both name and email are required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ 
          username: name.trim(), 
          email: email.trim(),
          boardId: selectedBoardId || undefined,
          role: role,
          password: password.trim()
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast.success("User account created successfully!");
      if (onSuccess) onSuccess();
      resetAndClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAndClose = () => {
    setName("");
    setEmail("");
    setLink("");
    setError("");
    setCopied(false);
    setSelectedBoardId("");
    setPassword("");
    setShowPassword(false);
    onClose();
  };

  const previewInitials = name.trim() ? getInitials(name) : null;
  const previewColor = AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  return (
    <div className="backdrop" onClick={resetAndClose}>
      <div 
        className="modal modal--medium" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modalClose" onClick={resetAndClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-violet-600/10 p-2.5 rounded-xl text-violet-600">
              <UserPlus size={24} />
            </div>
            <h2 className="modalTitle !mb-0">Add New User</h2>
          </div>
          <p className="modalSubtitle">Create an account or generate an invitation link.</p>
        </div>

        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar" style={{ maxH: '60vh' }}>
          {/* Avatar Preview */}
          {previewInitials && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-violet-600/5 border border-violet-600/10 animate-fadeIn">
              <span className={`flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold shadow-lg ${previewColor.bg} ${previewColor.text}`}>
                {previewInitials}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{email || "Enter an email address"}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="formGroup !mb-0">
              <label className="formLabel">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="e.g. John Doe"
                className="formInput"
              />
            </div>
            <div className="formGroup !mb-0">
              <label className="formLabel">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="john@example.com"
                className="formInput"
              />
            </div>
          </div>

          <div className="formGroup !mb-0">
            <label className="formLabel">Account Password</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary opacity-50">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Minimum 6 characters"
                className="formInput !pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="formGroup !mb-0">
              <label className="formLabel">Assign to Board</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary opacity-50">
                  <Globe size={18} />
                </div>
                <select
                  value={selectedBoardId}
                  onChange={(e) => setSelectedBoardId(e.target.value)}
                  className="formSelect !mt-0 !pl-10"
                >
                  <option value="">No board (Independent)</option>
                  {boards.map(b => (
                    <option key={b.id || (b as any)._id} value={b.id || (b as any)._id}>{b.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="formGroup !mb-0">
              <label className="formLabel">Permission Level</label>
              <select
                disabled={!selectedBoardId}
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="formSelect !mt-0"
              >
                <option value="viewer">VIEWER</option>
                <option value="editor">EDITOR</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          {link && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fadeIn">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <ShieldCheck size={16} />
                Invitation Link Ready
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={link}
                  className="formInput !text-xs !py-2 bg-white/50 dark:bg-black/20"
                />
                <button
                  onClick={handleCopyLink}
                  className="btnPrimary !py-2 !px-4 !min-w-0 !rounded-xl !bg-emerald-600 shadow-emerald-600/20"
                >
                  {copied ? "Copied" : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modalActions">
          <button
            onClick={handleInvite}
            disabled={loading || creating || !email.trim() || !name.trim()}
            className="btnSecondary"
          >
            {loading ? "Generating..." : "Generate Link"}
          </button>
          <button
            onClick={handleCreateDirect}
            disabled={creating || loading || !email.trim() || !name.trim()}
            className="btnPrimary"
          >
            {creating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <span>Create Account</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
