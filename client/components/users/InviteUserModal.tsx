"use client";
import React, { useState, useEffect } from "react";
import { X, UserPlus, Mail, Copy, UserCheck, ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
              <UserPlus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Add User</h2>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Avatar Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-dashed border-gray-200 dark:border-zinc-700 min-h-[56px]">
            {previewInitials ? (
              <>
                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shrink-0 ${previewColor.bg} ${previewColor.text}`}>
                  {previewInitials}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{email || "no email yet"}</p>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">Type a name to preview the avatar…</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="JaneSmith"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="jane@example.com"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>

          <div>
             <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-bold">
               Set Password <span className="text-red-400">*</span>
             </label>
             <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                   <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Set account password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Assign to Board (Optional)
                </label>
                <select
                  value={selectedBoardId}
                  onChange={(e) => setSelectedBoardId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                >
                  <option value="">No board</option>
                  {boards.map(b => (
                    <option key={b.id || (b as any)._id} value={b.id || (b as any)._id}>{b.title}</option>
                  ))}
                </select>
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Initial Role
                </label>
                <select
                  disabled={!selectedBoardId}
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
             </div>
          </div>

          {error && <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/20">{error}</p>}

          <div className="pt-2 flex flex-col gap-3">
             <button
                type="button"
                onClick={handleCreateDirect}
                disabled={creating || loading || !email.trim() || !name.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-violet-600/20"
              >
                {creating
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <UserCheck className="w-5 h-5" />}
                Create Account Immediately
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-zinc-900 px-2 text-gray-500">Or generate link</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleInvite}
                disabled={loading || creating || !email.trim() || !name.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
                  : <Mail className="w-5 h-5" />}
                Send Invitation Link
              </button>
          </div>

          {link && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Invitation link active!
              </p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 truncate">
                  {link}
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={resetAndClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
